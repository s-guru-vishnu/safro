const Ride = require('../models/Ride');
const User = require('../models/User');
const { predictFare } = require('../services/farePredictionService');
const { checkRide } = require('../services/fraudDetectionService');

// Helper: parse distance string to km number
const parseDistanceKm = (distStr) => {
    if (!distStr) return 0;
    if (typeof distStr === 'number') return distStr;
    const match = String(distStr).match(/([\d.]+)/);
    return match ? parseFloat(match[1]) : 0;
};

// Helper: parse duration string to minutes number
const parseDurationMins = (durStr) => {
    if (!durStr) return 0;
    if (typeof durStr === 'number') return durStr;
    const match = String(durStr).match(/([\d.]+)/);
    return match ? parseFloat(match[1]) : 0;
};

// @desc    Request a ride
// @route   POST /api/rides/request
const requestRide = async (req, res, next) => {
    try {
        const { pickupLocation, dropLocation, proposedFare, distance, duration } = req.body;

        const distanceKm = parseDistanceKm(distance);
        const estimatedDuration = parseDurationMins(duration);

        const ride = await Ride.create({
            riderId: req.user._id,
            pickupLocation,
            dropLocation,
            fare: { proposed: proposedFare },
            distance,
            duration,
            distanceKm,
            estimatedDuration,
            status: 'pending'
        });

        // AI Fare Prediction (non-blocking — don't fail ride creation)
        try {
            const now = new Date();
            const timeOfDay = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
            const prediction = await predictFare({
                distanceKm,
                durationMins: estimatedDuration,
                timeOfDay,
                vehicleType: null,
                pickupCoords: pickupLocation?.coordinates
            });

            if (prediction) {
                ride.aiPrediction = prediction;
                await ride.save();
            }
        } catch (aiErr) {
            console.error('AI fare prediction failed (non-blocking):', aiErr.message);
        }

        // Fraud quick check
        try {
            const fraudResult = await checkRide(ride);
            if (fraudResult.flagged) {
                ride.fraudFlag = fraudResult;
                await ride.save();
            }
        } catch (fraudErr) {
            // Non-blocking
        }

        // Emit socket event to all drivers
        const io = req.app.get('io');
        if (io) {
            io.emit('newRideRequest', ride);
        }

        res.status(201).json(ride);
    } catch (error) {
        next(error);
    }
};

// @desc    Get available rides for drivers
// @route   GET /api/rides/available
const getAvailableRides = async (req, res, next) => {
    try {
        const rides = await Ride.find({ status: { $in: ['pending', 'negotiating'] } })
            .populate('riderId', 'name phone rating')
            .sort({ createdAt: -1 });

        res.json(rides);
    } catch (error) {
        next(error);
    }
};

// @desc    Get ride details
// @route   GET /api/rides/:id
const getRide = async (req, res, next) => {
    try {
        const ride = await Ride.findById(req.params.id)
            .populate('riderId', 'name phone')
            .populate('driverId', 'name phone vehicle');

        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        res.json(ride);
    } catch (error) {
        next(error);
    }
};

// @desc    Confirm ride (After negotiation)
// @route   PUT /api/rides/:id/confirm
const confirmRide = async (req, res, next) => {
    try {
        const { driverId, finalFare } = req.body;

        const ride = await Ride.findById(req.params.id);
        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        if (ride.status !== 'negotiating' && ride.status !== 'pending') {
            return res.status(400).json({ message: 'Ride cannot be confirmed' });
        }

        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        ride.driverId = driverId;
        ride.fare.final = finalFare;
        ride.status = 'confirmed';
        ride.otp = otp;
        await ride.save();

        // Notify Rider
        const io = req.app.get('io');
        if (io) {
            io.to(`ride_${ride._id}`).emit('rideConfirmed', ride);
        }

        res.json(ride);
    } catch (error) {
        next(error);
    }
};

// @desc    Get ride history for current user (rider or driver)
// @route   GET /api/rides/history
const getRideHistory = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = {
            $or: [
                { riderId: req.user._id },
                { driverId: req.user._id }
            ]
        };

        const rides = await Ride.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('riderId', 'name')
            .populate('driverId', 'name vehicle');

        const total = await Ride.countDocuments(query);

        res.json({
            rides,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get AI fare prediction for a ride
// @route   GET /api/rides/:id/ai-fare
const getAIFare = async (req, res, next) => {
    try {
        const ride = await Ride.findById(req.params.id);
        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        // Return cached prediction if exists
        if (ride.aiPrediction && ride.aiPrediction.suggestedFare) {
            return res.json(ride.aiPrediction);
        }

        // Generate new prediction
        const now = new Date();
        const timeOfDay = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
        const prediction = await predictFare({
            distanceKm: ride.distanceKm || parseDistanceKm(ride.distance),
            durationMins: ride.estimatedDuration || parseDurationMins(ride.duration),
            timeOfDay,
            vehicleType: null,
            pickupCoords: ride.pickupLocation?.coordinates
        });

        if (prediction) {
            ride.aiPrediction = prediction;
            await ride.save();
        }

        res.json(prediction || { message: 'AI prediction unavailable' });
    } catch (error) {
        next(error);
    }
};

// @desc    Start ride (Confirm OTP)
// @route   PUT /api/rides/:id/start
const startRide = async (req, res, next) => {
    try {
        const { otp } = req.body;
        const ride = await Ride.findById(req.params.id);

        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        if (ride.driverId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (ride.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        ride.status = 'ongoing';
        await ride.save();

        // Notify Rider
        const io = req.app.get('io');
        if (io) {
            io.to(`ride_${ride._id}`).emit('rideStatusChanged', { status: 'ongoing' });
        }

        res.json(ride);
    } catch (error) {
        next(error);
    }
};

// @desc    Complete ride
// @route   PUT /api/rides/:id/complete
const completeRide = async (req, res, next) => {
    try {
        const ride = await Ride.findById(req.params.id);
        const Driver = require('../models/Driver');

        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        if (ride.driverId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (ride.status !== 'ongoing') {
            return res.status(400).json({ message: 'Ride must be ongoing to complete' });
        }

        ride.status = 'completed';
        await ride.save();

        // Update driver stats
        await Driver.findOneAndUpdate(
            { userId: ride.driverId },
            {
                $inc: {
                    totalRides: 1,
                    totalEarnings: ride.fare.final || ride.fare.proposed || 0
                }
            }
        );

        // Notify Rider
        const io = req.app.get('io');
        if (io) {
            io.to(`ride_${ride._id}`).emit('rideStatusChanged', { status: 'completed' });
        }

        res.json(ride);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    requestRide,
    getAvailableRides,
    getRide,
    confirmRide,
    startRide,
    completeRide,
    getRideHistory,
    getAIFare
};
