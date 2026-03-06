const Ride = require('../models/Ride');
const User = require('../models/User');
const Driver = require('../models/Driver');
const Payment = require('../models/Payment');
const { predictFare } = require('../services/farePredictionService');
const { checkRide } = require('../services/fraudDetectionService');
const { sendRideBookedEmail, sendDriverAssignedEmail, sendRideCompletedEmail, sendPaymentReceiptEmail, sendRideCancelledEmail } = require('../services/notificationService');

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
            status: 'pending'
        });

        // Set active ride on user
        await User.findByIdAndUpdate(req.user._id, { activeRideId: ride._id });

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
            io.to('driver').emit('newRideRequest', ride);
        }

        // 📧 Email: Ride Booked (non-blocking)
        sendRideBookedEmail(
            { name: req.user.name, email: req.user.email },
            { pickupAddress: pickupLocation?.address, dropAddress: dropLocation?.address, proposedFare }
        );

        res.status(201).json(ride);
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

        // 📧 Email: Driver Assigned (non-blocking)
        try {
            const rider = await User.findById(ride.riderId);
            const driverDoc = await Driver.findOne({ userId: driverId }).populate('userId', 'name phone');
            if (rider && driverDoc) {
                sendDriverAssignedEmail(
                    { name: rider.name, email: rider.email },
                    { name: driverDoc.userId?.name, vehicleNumber: driverDoc.vehicleNumber, vehicleType: driverDoc.vehicleType, phone: driverDoc.userId?.phone },
                    { agreedFare: finalFare }
                );
            }
        } catch (emailErr) { console.error('[EMAIL] confirmRide notification error:', emailErr.message); }

        res.json(updated);
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

        // Quick Pay Logic
        const rider = await User.findById(ride.riderId);
        const fare = ride.negotiatedFare || ride.fare.final || ride.fare.proposed;

        if (rider.quickPayEnabled && rider.walletBalance >= fare && ride.paymentStatus !== 'Paid') {
            const commissionPercentage = 0.15;
            const platformCommission = Math.round(fare * commissionPercentage);
            const driverAmount = fare - platformCommission;
            const cashback = Math.round(fare * 0.02);

            // Process payment
            rider.walletBalance -= (fare - cashback); // Net deduction
            await rider.save();

            ride.paymentStatus = 'Paid';
            ride.paymentMethod = 'wallet';
            ride.platformCommission = platformCommission;
            ride.driverAmount = driverAmount;
            ride.paidAt = new Date();

            // Notify driver payout
            await Driver.findOneAndUpdate(
                { userId: ride.driverId },
                { $inc: { payoutBalance: driverAmount } }
            );

            // Create Payment record
            await Payment.create({
                rideId: ride._id,
                riderId: ride.riderId,
                driverId: ride.driverId,
                amount: fare,
                method: 'wallet',
                status: 'completed',
                cashback
            });


            const io = req.app.get('io');
            if (io) {
                io.to(`ride_${ride._id}`).emit('paymentSuccess', {
                    rideId: ride._id,
                    method: 'wallet',
                    quickPay: true,
                    cashback
                });
            }
        }

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

        // 📧 Email: Ride Completed + Payment Receipt (non-blocking)
        const riderUser = await User.findById(ride.riderId);
        if (riderUser) {
            sendRideCompletedEmail(
                { name: riderUser.name, email: riderUser.email },
                { pickupAddress: ride.pickupLocation?.address, dropAddress: ride.dropLocation?.address, distance: ride.distance, duration: ride.duration, agreedFare: ride.negotiatedFare || ride.fare?.final || ride.fare?.proposed }
            );
            if (ride.paymentStatus === 'Paid') {
                sendPaymentReceiptEmail(
                    { name: riderUser.name, email: riderUser.email },
                    { _id: ride._id, paymentMethod: ride.paymentMethod || 'wallet', agreedFare: ride.negotiatedFare || ride.fare?.final, platformFee: ride.platformCommission, totalPaid: ride.negotiatedFare || ride.fare?.final }
                );
            }
        }

        res.json(ride);
    } catch (error) {
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

        res.json(ride);
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

        res.json(ride);
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
            query = {
                $or: [
                    { driverId: req.user._id },
                    { negotiatingDriverId: req.user._id }
                ],
                status: { $nin: ['completed', 'cancelled'] }
            };
        } else {
            // Rider: check for their active ride
            query = {
                riderId: req.user._id,
                status: { $nin: ['completed', 'cancelled'] }
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

module.exports = {
    requestRide,
    getAvailableRides,
    getRide,
    confirmRide,
    startRide,
    completeRide,
    cancelRide,
    failNegotiation,
    getRideHistory,
    getAIFare,
    getActiveRide
};
