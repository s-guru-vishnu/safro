/**
 * AI Routes
 * Standalone endpoints for AI features — all protected + rate limited
 */
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { protect } = require('../middleware/authMiddleware');
const { predictFare } = require('../services/farePredictionService');
const { suggestCompromise } = require('../services/negotiationAIService');
const { analyzeBehavior } = require('../services/fraudDetectionService');
const { callGroq } = require('../services/groqService');
const Ride = require('../models/Ride');
const Driver = require('../models/Driver');

// AI-specific rate limiter: 10 requests per minute
const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { message: 'AI rate limit exceeded. Please wait before making another AI request.' }
});

router.use(protect, aiLimiter);

// POST /api/ai/predict-fare
router.post('/predict-fare', async (req, res, next) => {
    try {
        const { distanceKm, durationMins, timeOfDay, vehicleType } = req.body;

        if (!distanceKm) {
            return res.status(400).json({ message: 'distanceKm is required' });
        }

        const prediction = await predictFare({
            distanceKm: parseFloat(distanceKm),
            durationMins: parseFloat(durationMins) || 0,
            timeOfDay: timeOfDay || `${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}`,
            vehicleType
        });

        res.json(prediction);
    } catch (error) {
        next(error);
    }
});

// POST /api/ai/suggest-negotiation
router.post('/suggest-negotiation', async (req, res, next) => {
    try {
        const { currentOffer, counterOffer, distanceKm, fareRange, roundNumber } = req.body;

        if (!currentOffer || !counterOffer) {
            return res.status(400).json({ message: 'currentOffer and counterOffer are required' });
        }

        const suggestion = await suggestCompromise({
            currentOffer: parseFloat(currentOffer),
            counterOffer: parseFloat(counterOffer),
            distanceKm: parseFloat(distanceKm) || 0,
            fareRange,
            roundNumber: parseInt(roundNumber) || 1
        });

        res.json(suggestion);
    } catch (error) {
        next(error);
    }
});

// POST /api/ai/check-fraud
router.post('/check-fraud', async (req, res, next) => {
    try {
        const { userId } = req.body;
        const targetUserId = userId || req.user._id;

        const result = await analyzeBehavior(targetUserId);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// GET /api/ai/driver-recommendation/:rideId
router.get('/driver-recommendation/:rideId', async (req, res, next) => {
    try {
        const ride = await Ride.findById(req.params.rideId);
        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        const pickupCoords = ride.pickupLocation?.coordinates;
        if (!pickupCoords?.lat || !pickupCoords?.lng) {
            return res.status(400).json({ message: 'Ride has no valid pickup coordinates' });
        }

        // Find nearby drivers
        const nearbyDrivers = await Driver.find({
            isAvailable: true,
            currentLocation: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [pickupCoords.lng, pickupCoords.lat]
                    },
                    $maxDistance: 10000
                }
            }
        }).populate('userId', 'name rating').limit(5);

        if (nearbyDrivers.length === 0) {
            return res.json({ recommendation: null, message: 'No available drivers nearby' });
        }

        // Build summary for AI
        const driverSummary = nearbyDrivers.map((d, i) => {
            const dist = d.currentLocation?.coordinates
                ? Math.sqrt(
                    Math.pow((d.currentLocation.coordinates[0] - pickupCoords.lng) * 111, 2) +
                    Math.pow((d.currentLocation.coordinates[1] - pickupCoords.lat) * 111, 2)
                ).toFixed(1)
                : 'unknown';
            return `Driver ${i + 1} (ID: ${d._id}): Rating ${d.rating}, ${d.totalRides} rides, ${dist} km away, Vehicle: ${d.vehicleType}`;
        }).join('\n');

        const recommendation = await callGroq(
            `You are Safro's driver matching AI. Choose the best driver for fairness and efficiency. Return JSON with keys: recommendedDriverIndex (0-based), reasoning (max 80 chars).`,
            `Ride: ${ride.distanceKm || 0} km, Fare: ₹${ride.fare?.proposed || 0}\n\nAvailable drivers:\n${driverSummary}\n\nChoose best driver based on fairness and distance.`
        );

        const driverIndex = recommendation?.recommendedDriverIndex || 0;
        const recommended = nearbyDrivers[driverIndex] || nearbyDrivers[0];

        res.json({
            recommendation: {
                driverId: recommended._id,
                userId: recommended.userId,
                vehicleType: recommended.vehicleType,
                rating: recommended.rating,
                totalRides: recommended.totalRides
            },
            reasoning: recommendation?.reasoning || 'Nearest available driver selected',
            allDrivers: nearbyDrivers.map(d => ({
                driverId: d._id,
                rating: d.rating,
                vehicleType: d.vehicleType,
                totalRides: d.totalRides
            }))
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
