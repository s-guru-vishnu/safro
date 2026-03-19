const Ride = require('../models/Ride');
const User = require('../models/User');
const Driver = require('../models/Driver');
const Negotiation = require('../models/Negotiation');
const Payment = require('../models/Payment');
const WalletTransaction = require('../models/WalletTransaction');
const { predictFare } = require('../services/farePredictionService');
const { calculateEstimatedFare } = require('../services/fareService');
const { checkRide } = require('../services/fraudDetectionService');
const { identifyTaluk } = require('../utils/geoUtils');
const { sendRideBookedEmail, sendDriverAssignedEmail, sendRideCompletedEmail, sendPaymentReceiptEmail, sendRideCancelledEmail, sendRideBookedWhatsApp, sendDriverAssignedWhatsApp, sendRideStartedWhatsApp, sendRideCompletedWhatsApp, sendPaymentReceiptWhatsApp } = require('../services/notificationService');

// Helper: random number in range
const random = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

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

// ─── SCORE HELPERS ──────────────────────────────────────────────
const applyScorePenalty = async (userId, role, points) => {
    if (role === 'driver') {
        await Driver.findOneAndUpdate(
            { userId },
            { $inc: { negotiationScore: -points } }
        );
        // Clamp to 0
        await Driver.findOneAndUpdate(
            { userId, negotiationScore: { $lt: 0 } },
            { $set: { negotiationScore: 0 } }
        );
    } else {
        await User.findByIdAndUpdate(userId, {
            $inc: { negotiationScore: -points }
        });
        await User.findByIdAndUpdate(
            { _id: userId, negotiationScore: { $lt: 0 } },
            { $set: { negotiationScore: 0 } }
        );
    }
};

// ─── STATE MACHINE: valid ride status transitions ──────────────
const VALID_TRANSITIONS = {
    pending: ['negotiating', 'cancelled'],
    negotiating: ['pending', 'confirmed', 'cancelled'],
    confirmed: ['ongoing', 'cancelled'],
    ongoing: ['completed'],
    completed: [],
    cancelled: []
};

const isValidTransition = (from, to) => {
    return VALID_TRANSITIONS[from]?.includes(to) ?? false;
};

// @desc    Get Fare Estimate via OSRM & Multipliers
// @route   POST /api/rides/estimate
const getFareEstimate = async (req, res, next) => {
    try {
        const { pickup, drop } = req.body;

        if (!pickup || !drop || !pickup.lat || !pickup.lng || !drop.lat || !drop.lng) {
            return res.status(400).json({ message: 'Valid pickup and drop coordinates are required' });
        }

        const estimate = await calculateEstimatedFare(pickup, drop);
        res.json(estimate);
    } catch (error) {
        next(error);
    }
};

// @desc    Request a ride
// @route   POST /api/rides/request
const requestRide = async (req, res, next) => {
    try {
        const { pickupLocation, dropLocation, proposedFare, distance, duration } = req.body;

        // ── GUARD: One active ride per rider ──
        const existingRide = await Ride.findOne({
            riderId: req.user._id,
            status: { $nin: ['completed', 'cancelled'] }
        });
        if (existingRide) {
            return res.status(400).json({ message: 'You already have an active ride.' });
        }

        // ── GUARD: Score check ──
        if (req.user.negotiationScore !== undefined && req.user.negotiationScore < 40) {
            return res.status(403).json({
                message: 'Your negotiation score is too low. You are temporarily blocked from booking rides.'
            });
        }

        const distanceKm = parseDistanceKm(distance);
        const estimatedDuration = parseDurationMins(duration);

        // Build GeoJSON from coordinates
        const lat = pickupLocation?.coordinates?.lat || 0;
        const lng = pickupLocation?.coordinates?.lng || 0;

        const ride = await Ride.create({
            riderId: req.user._id,
            pickupLocation,
            dropLocation,
            pickupGeo: {
                type: 'Point',
                coordinates: [lng, lat] // GeoJSON: [lng, lat]
            },
            fare: { proposed: proposedFare },
            distance,
            duration,
            distanceKm,
            estimatedDuration,
            status: 'pending',
            taluk: identifyTaluk(pickupLocation?.address) || ''
        });

        // Set active ride on user
        await User.findByIdAndUpdate(req.user._id, { activeRideId: ride._id });

        // Create initial negotiation entry (Rider's first offer)
        await Negotiation.create({
            rideId: ride._id,
            sender: req.user._id,
            role: 'rider',
            amount: proposedFare,
            type: 'offer',
            status: 'active'
        });

        // AI Fare Prediction (non-blocking)
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

        // Emit socket event to nearby drivers
        const io = req.app.get('io');
        if (io) {
            if (ride.taluk) {
                io.to(`driver_taluk_${ride.taluk}`).emit('newRideRequest', ride);
            } else {
                io.to('driver').emit('newRideRequest', ride);
            }
        }

        // 📧 Email + 📱 WhatsApp: Ride Booked (non-blocking)
        sendRideBookedEmail(
            { name: req.user.name, email: req.user.email },
            { pickupAddress: pickupLocation?.address, dropAddress: dropLocation?.address, proposedFare }
        );
        sendRideBookedWhatsApp(
            { phone: req.user.phone },
            { pickupAddress: pickupLocation?.address }
        );

        res.status(201).json({ ride });
    } catch (error) {
        next(error);
    }
};

// @desc    Get available rides for drivers (10km geo-filtered)
// @route   GET /api/rides/available
const getAvailableRides = async (req, res, next) => {
    try {
        const { lat, lng } = req.query;

        let query = { status: 'pending' };

        // If driver provides location, apply 10km geo filter
        if (lat && lng) {
            query.pickupGeo = {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: 10000 // 10km in meters
                }
            };
        }

        // Apply taluk filter for drivers
        if (req.user && req.user.role === 'driver') {
            const driver = await User.findById(req.user._id);
            if (driver && driver.taluk) {
                query.taluk = driver.taluk;
            }
        }

        const rides = await Ride.find(query)
            .populate('riderId', 'name phone negotiationScore')
            .sort({ createdAt: -1 })
            .limit(50);

        res.json(rides);
    } catch (error) {
        // If geo index hasn't been created yet, fallback to non-geo query
        if (error.code === 17007 || error.codeName === 'BadValue') {
            const rides = await Ride.find({ status: 'pending' })
                .populate('riderId', 'name phone negotiationScore')
                .sort({ createdAt: -1 })
                .limit(50);
            return res.json(rides);
        }
        next(error);
    }
};

// @desc    Get ride details
// @route   GET /api/rides/:id
const getRide = async (req, res, next) => {
    try {
        const ride = await Ride.findById(req.params.id)
            .populate('riderId', 'name phone')
            .populate('driverId', 'name phone')
            .populate('negotiatingDriverId', 'name phone');

        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        res.json(ride);
    } catch (error) {
        next(error);
    }
};

// @desc    Confirm ride (After negotiation succeeds)
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

        // ── Double-acceptance prevention: atomic update ──
        const updated = await Ride.findOneAndUpdate(
            { _id: ride._id, status: { $in: ['negotiating', 'pending'] } },
            {
                driverId: driverId,
                'fare.final': finalFare,
                negotiatedFare: finalFare,
                status: 'confirmed',
                otp: Math.floor(1000 + Math.random() * 9000).toString(),
                negotiatingDriverId: null
            },
            { new: true }
        );

        if (!updated) {
            return res.status(400).json({ message: 'Ride was already confirmed by another driver' });
        }

        // Block driver from other negotiations
        await Driver.findOneAndUpdate(
            { userId: driverId },
            { isAvailable: false }
        );

        // Notify ride room
        const io = req.app.get('io');
        if (io) {
            io.to(`ride_${ride._id}`).emit('rideConfirmed', updated);
            // Remove from available pool for all drivers
            io.to('driver').emit('rideRemovedFromPool', { rideId: ride._id.toString() });
        }

        // 📧 Email + 📱 WhatsApp: Driver Assigned (non-blocking)
        try {
            const rider = await User.findById(ride.riderId);
            const driverDoc = await Driver.findOne({ userId: driverId }).populate('userId', 'name phone');
            if (rider && driverDoc) {
                sendDriverAssignedEmail(
                    { name: rider.name, email: rider.email },
                    { name: driverDoc.userId?.name, vehicleNumber: driverDoc.vehicleNumber, vehicleType: driverDoc.vehicleType, phone: driverDoc.userId?.phone },
                    { agreedFare: finalFare }
                );
                sendDriverAssignedWhatsApp(
                    { phone: rider.phone },
                    { name: driverDoc.userId?.name, vehicleNumber: driverDoc.vehicleNumber }
                );
            }
        } catch (notifErr) { console.error('[NOTIFY] confirmRide notification error:', notifErr.message); }

        res.json({ ride: updated });
    } catch (error) {
        next(error);
    }
};

// @desc    Get ride history (ONLY completed & cancelled)
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
            ],
            status: { $in: ['completed', 'cancelled'] }
        };

        const rides = await Ride.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('riderId', 'name')
            .populate('driverId', 'name');

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

        if (!isValidTransition(ride.status, 'ongoing')) {
            return res.status(400).json({ message: `Cannot start ride from ${ride.status} state` });
        }

        if (ride.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        ride.status = 'ongoing';
        await ride.save();

        // Notify ride room
        const io = req.app.get('io');
        if (io) {
            io.to(`ride_${ride._id}`).emit('rideStatusChanged', {
                rideId: ride._id,
                status: 'ongoing'
            });
        }

        // 📱 WhatsApp: Ride Started (non-blocking)
        try {
            const rider = await User.findById(ride.riderId);
            const driverUser = await User.findById(ride.driverId);
            if (rider) {
                sendRideStartedWhatsApp(
                    { phone: rider.phone },
                    { name: driverUser?.name || 'Your driver' }
                );
            }
        } catch (smsErr) { console.error('[WhatsApp] startRide notification error:', smsErr.message); }

        res.json({ ride });
    } catch (error) {
        next(error);
    }
};

// @desc    Complete ride
// @route   PUT /api/rides/:id/complete
const completeRide = async (req, res, next) => {
    try {
        const ride = await Ride.findById(req.params.id);

        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        if (ride.driverId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (!isValidTransition(ride.status, 'completed')) {
            return res.status(400).json({ message: `Cannot complete ride from ${ride.status} state` });
        }

        ride.status = 'completed';



        await ride.save();

        // Free rider — clear activeRideId
        await User.findByIdAndUpdate(ride.riderId, { activeRideId: null });

        // Update driver stats and free driver
        await Driver.findOneAndUpdate(
            { userId: ride.driverId },
            {
                isAvailable: true,
                $inc: {
                    totalRides: 1,
                    totalEarnings: ride.fare.final || ride.fare.proposed || 0
                }
            }
        );

        // Notify ride room
        const io = req.app.get('io');
        if (io) {
            io.to(`ride_${ride._id}`).emit('rideStatusChanged', {
                rideId: ride._id,
                status: 'completed'
            });
        }

        // 📧 Email + 📱 WhatsApp: Ride Completed + Payment Receipt (non-blocking)
        const riderUser = await User.findById(ride.riderId);
        if (riderUser) {
            const agreedFare = ride.negotiatedFare || ride.fare?.final || ride.fare?.proposed;
            sendRideCompletedEmail(
                { name: riderUser.name, email: riderUser.email },
                { pickupAddress: ride.pickupLocation?.address, dropAddress: ride.dropLocation?.address, distance: ride.distance, duration: ride.duration, agreedFare }
            );
            sendRideCompletedWhatsApp(
                { phone: riderUser.phone },
                { agreedFare }
            );
            if (ride.paymentStatus === 'Paid') {
                sendPaymentReceiptEmail(
                    { name: riderUser.name, email: riderUser.email },
                    { _id: ride._id, paymentMethod: ride.paymentMethod || 'wallet', agreedFare, platformFee: ride.platformCommission, totalPaid: agreedFare }
                );
                sendPaymentReceiptWhatsApp(
                    { phone: riderUser.phone },
                    { agreedFare, paymentMethod: ride.paymentMethod || 'wallet' }
                );
            }
        }

        res.json({ ride });
    } catch (error) {
        console.error('Error in completeRide:', error);
        next(error);
    }
};

// @desc    Cancel a ride
// @route   PUT /api/rides/:id/cancel
const cancelRide = async (req, res, next) => {
    try {
        const { reason } = req.body;
        const ride = await Ride.findById(req.params.id);

        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        if (!isValidTransition(ride.status, 'cancelled')) {
            return res.status(400).json({ message: `Ride in ${ride.status} state cannot be cancelled` });
        }

        // Determine who is cancelling
        const isRider = ride.riderId.toString() === req.user._id.toString();
        const isDriver = ride.driverId && ride.driverId.toString() === req.user._id.toString();
        const isNegotiatingDriver = ride.negotiatingDriverId &&
            ride.negotiatingDriverId.toString() === req.user._id.toString();

        if (!isRider && !isDriver && !isNegotiatingDriver) {
            return res.status(403).json({ message: 'Not authorized to cancel this ride' });
        }

        const cancelledBy = isRider ? 'rider' : 'driver';

        ride.status = 'cancelled';
        ride.cancelledBy = cancelledBy;
        ride.cancelReason = reason || '';
        await ride.save();

        // Apply score penalty (-2 to canceller)
        await applyScorePenalty(req.user._id, cancelledBy, 2);

        // Free rider
        await User.findByIdAndUpdate(ride.riderId, { activeRideId: null });

        // Free driver if assigned
        const driverUserId = ride.driverId || ride.negotiatingDriverId;
        if (driverUserId) {
            await Driver.findOneAndUpdate(
                { userId: driverUserId },
                { isAvailable: true }
            );
        }

        // Notify
        const io = req.app.get('io');
        if (io) {
            io.to(`ride_${ride._id}`).emit('rideStatusChanged', {
                rideId: ride._id,
                status: 'cancelled',
                cancelledBy
            });
        }

        // 📧 Email: Ride Cancelled (non-blocking)
        try {
            const rider = await User.findById(ride.riderId);
            if (rider) {
                sendRideCancelledEmail(
                    { name: rider.name, email: rider.email },
                    { pickupAddress: ride.pickupLocation?.address, dropAddress: ride.dropLocation?.address },
                    cancelledBy
                );
            }
            // Also notify driver if they were assigned and rider cancelled
            if (cancelledBy === 'rider' && driverUserId) {
                const driverUser = await User.findById(driverUserId);
                if (driverUser) {
                    sendRideCancelledEmail(
                        { name: driverUser.name, email: driverUser.email },
                        { pickupAddress: ride.pickupLocation?.address, dropAddress: ride.dropLocation?.address },
                        cancelledBy
                    );
                }
            }
        } catch (e) { /* non-blocking */ }

        res.json({ ride });
    } catch (error) {
        next(error);
    }
};

// @desc    Fail negotiation (ride returns to pool)
// @route   PUT /api/rides/:id/fail-negotiation
const failNegotiation = async (req, res, next) => {
    try {
        const ride = await Ride.findById(req.params.id);

        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        if (ride.status !== 'negotiating') {
            return res.status(400).json({ message: 'Ride is not in negotiation' });
        }

        // Determine who failed the negotiation
        const isRider = ride.riderId.toString() === req.user._id.toString();
        const isNegotiatingDriver = ride.negotiatingDriverId &&
            ride.negotiatingDriverId.toString() === req.user._id.toString();

        if (!isRider && !isNegotiatingDriver) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const failedBy = isRider ? 'rider' : 'driver';
        const freedDriverId = ride.negotiatingDriverId;

        // Return ride to pool
        ride.status = 'pending';
        ride.negotiatingDriverId = null;
        ride.failureCount += 1;
        await ride.save();

        // Apply score penalty (-2 to the one who failed)
        await applyScorePenalty(req.user._id, failedBy, 2);

        // Free driver
        if (freedDriverId) {
            await Driver.findOneAndUpdate(
                { userId: freedDriverId },
                { isAvailable: true }
            );
        }

        // Notify
        const io = req.app.get('io');
        if (io) {
            io.to(`ride_${ride._id}`).emit('negotiationFailed', {
                rideId: ride._id,
                failedBy,
                status: 'pending'
            });
            // Re-broadcast to drivers as available
            io.to('driver').emit('rideBackInPool', ride);
        }

        res.json({ ride });
    } catch (error) {
        next(error);
    }
};

// @desc    Get active ride for current user
// @route   GET /api/rides/active
const getActiveRide = async (req, res, next) => {
    try {
        let query;

        if (req.user.role === 'driver') {
            // Driver: check for rides where they are driver or negotiating driver
            // Include completed rides that hasn't been confirmed by driver yet
            query = {
                $or: [
                    { driverId: req.user._id },
                    { negotiatingDriverId: req.user._id }
                ],
                $or: [
                    { status: { $nin: ['completed', 'cancelled'] } },
                    { status: 'completed', driverConfirmed: false }
                ]
            };
        } else {
            // Rider: check for their active ride
            // Include completed rides that are unpaid or unrated
            query = {
                riderId: req.user._id,
                $or: [
                    { status: { $nin: ['completed', 'cancelled'] } },
                    { 
                        status: 'completed', 
                        $or: [
                            { paymentStatus: { $ne: 'Paid' } },
                            { rating: { $exists: false } }
                        ]
                    }
                ]
            };
        }

        const ride = await Ride.findOne(query)
            .populate('riderId', 'name phone')
            .populate('driverId', 'name phone')
            .populate('negotiatingDriverId', 'name phone');

        res.json({ ride: ride || null });
    } catch (error) {
        next(error);
    }
};

// @desc    Rate a completed ride
// @route   POST /api/rides/:id/rate
const rateRide = async (req, res, next) => {
    try {
        const { rating, review } = req.body;
        const rideId = req.params.id;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Valid rating between 1 and 5 is required' });
        }

        const ride = await Ride.findById(rideId);
        if (!ride || ride.riderId.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        if (ride.status !== 'completed' || ride.paymentStatus !== 'Paid') {
            return res.status(400).json({ message: 'Can only rate paid completed rides' });
        }

        if (ride.rating) {
            return res.status(400).json({ message: 'Ride already rated' });
        }

        ride.rating = rating;
        ride.review = review;
        await ride.save();

        // Create Review entry for stats consistency
        if (ride.driverId) {
            const Review = require('../models/Review');
            try {
                await Review.create({
                    riderId: ride.riderId,
                    driverId: ride.driverId,
                    rideId: ride._id,
                    rating,
                    comment: review
                });
            } catch (err) {
                console.error('Failed to create review record (non-blocking):', err.message);
            }

            const driver = await Driver.findOne({ userId: ride.driverId });
            if (driver) {
                const totalRatings = driver.totalRatings || 0;
                const currentRating = driver.rating || 0;

                const newTotal = totalRatings + 1;
                const newRating = ((currentRating * totalRatings) + rating) / newTotal;

                driver.totalRatings = newTotal;
                driver.rating = parseFloat(newRating.toFixed(1));
                await driver.save();
            }
        }

        res.json({ status: 'success', message: 'Ride rated successfully', ride });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getFareEstimate,
    requestRide,
    getAvailableRides,
    getRide,
    confirmRide,
    getRideHistory,
    getAIFare,
    startRide,
    completeRide,
    cancelRide,
    failNegotiation,
    getActiveRide,
    rateRide
};
