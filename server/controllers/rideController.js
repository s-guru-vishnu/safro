const Ride = require('../models/Ride');
const Driver = require('../models/Driver');
const Payment = require('../models/Payment');
const { calculateFare, calculateDistance } = require('../services/fareCalculator');
const { generateOTP } = require('../services/otpService');

// @desc Book a new ride
// @route POST /api/rides/book
const bookRide = async (req, res) => {
    try {
        const { pickupLocation, dropLocation, vehicleType, paymentMethod } = req.body;

        // Calculate distance
        const distance = calculateDistance(
            pickupLocation.coordinates.coordinates[1],
            pickupLocation.coordinates.coordinates[0],
            dropLocation.coordinates.coordinates[1],
            dropLocation.coordinates.coordinates[0]
        );

        // Calculate fare
        const fare = calculateFare(distance, vehicleType);

        // Generate OTP
        const otp = generateOTP();

        const ride = await Ride.create({
            riderId: req.user._id,
            pickupLocation,
            dropLocation,
            distance,
            fare,
            vehicleType: vehicleType || 'sedan',
            otp,
            status: 'requested'
        });

        // Notify available drivers via socket
        const io = req.app.get('io');
        if (io) {
            io.emit('newRideRequest', {
                rideId: ride._id,
                pickupLocation,
                dropLocation,
                distance,
                fare,
                vehicleType
            });
        }

        res.status(201).json({
            ride: {
                _id: ride._id,
                pickupLocation: ride.pickupLocation,
                dropLocation: ride.dropLocation,
                distance: ride.distance,
                fare: ride.fare,
                status: ride.status,
                vehicleType: ride.vehicleType,
                otp,
                createdAt: ride.createdAt
            }
        });
    } catch (error) {
        console.error('Book ride error:', error);
        res.status(500).json({ message: 'Error booking ride' });
    }
};

// @desc Accept a ride
// @route PUT /api/rides/accept/:id
const acceptRide = async (req, res) => {
    try {
        const ride = await Ride.findById(req.params.id);
        if (!ride) return res.status(404).json({ message: 'Ride not found' });

        if (ride.status !== 'requested') {
            return res.status(400).json({ message: 'Ride is no longer available' });
        }

        ride.driverId = req.user._id;
        ride.status = 'accepted';
        await ride.save();

        // Update driver availability
        await Driver.findOneAndUpdate(
            { userId: req.user._id },
            { isAvailable: false }
        );

        const io = req.app.get('io');
        if (io) {
            io.emit('rideAccepted', {
                rideId: ride._id,
                driverId: req.user._id,
                status: 'accepted'
            });
        }

        const populatedRide = await Ride.findById(ride._id)
            .populate('riderId', 'name phone')
            .populate('driverId', 'name phone');

        res.json({ ride: populatedRide });
    } catch (error) {
        console.error('Accept ride error:', error);
        res.status(500).json({ message: 'Error accepting ride' });
    }
};

// @desc Start a ride (OTP verification)
// @route PUT /api/rides/start/:id
const startRide = async (req, res) => {
    try {
        const { otp } = req.body;
        const ride = await Ride.findById(req.params.id).select('+otp');

        if (!ride) return res.status(404).json({ message: 'Ride not found' });

        if (ride.status !== 'accepted' && ride.status !== 'driver_arrived') {
            return res.status(400).json({ message: 'Ride cannot be started' });
        }

        if (ride.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        ride.status = 'on_trip';
        ride.startTime = new Date();
        await ride.save();

        const io = req.app.get('io');
        if (io) {
            io.emit('rideStarted', {
                rideId: ride._id,
                status: 'on_trip'
            });
        }

        res.json({ ride });
    } catch (error) {
        console.error('Start ride error:', error);
        res.status(500).json({ message: 'Error starting ride' });
    }
};

// @desc Complete a ride
// @route PUT /api/rides/complete/:id
const completeRide = async (req, res) => {
    try {
        const { rating, paymentMethod } = req.body;
        const ride = await Ride.findById(req.params.id);

        if (!ride) return res.status(404).json({ message: 'Ride not found' });

        if (ride.status !== 'on_trip') {
            return res.status(400).json({ message: 'Ride is not in progress' });
        }

        ride.status = 'completed';
        ride.endTime = new Date();
        if (rating) ride.rating = rating;
        await ride.save();

        // Create payment record
        const payment = await Payment.create({
            rideId: ride._id,
            riderId: ride.riderId,
            driverId: ride.driverId,
            amount: ride.fare,
            method: paymentMethod || 'cash',
            status: 'completed'
        });

        // Update driver stats
        await Driver.findOneAndUpdate(
            { userId: ride.driverId },
            {
                isAvailable: true,
                $inc: {
                    totalRides: 1,
                    totalEarnings: ride.fare
                }
            }
        );

        // Update driver rating if provided
        if (rating) {
            const driver = await Driver.findOne({ userId: ride.driverId });
            if (driver) {
                driver.rating = ((driver.rating * (driver.totalRides - 1)) + rating) / driver.totalRides;
                await driver.save();
            }
        }

        const io = req.app.get('io');
        if (io) {
            io.emit('rideCompleted', {
                rideId: ride._id,
                status: 'completed',
                payment: {
                    amount: payment.amount,
                    method: payment.method,
                    transactionId: payment.transactionId
                }
            });
        }

        res.json({ ride, payment });
    } catch (error) {
        console.error('Complete ride error:', error);
        res.status(500).json({ message: 'Error completing ride' });
    }
};

// @desc Cancel a ride
// @route PUT /api/rides/cancel/:id
const cancelRide = async (req, res) => {
    try {
        const { reason } = req.body;
        const ride = await Ride.findById(req.params.id);

        if (!ride) return res.status(404).json({ message: 'Ride not found' });

        if (['completed', 'cancelled'].includes(ride.status)) {
            return res.status(400).json({ message: 'Ride cannot be cancelled' });
        }

        ride.status = 'cancelled';
        ride.cancelReason = reason || '';
        await ride.save();

        // Free up driver
        if (ride.driverId) {
            await Driver.findOneAndUpdate(
                { userId: ride.driverId },
                { isAvailable: true }
            );
        }

        const io = req.app.get('io');
        if (io) {
            io.emit('rideCancelled', {
                rideId: ride._id,
                status: 'cancelled'
            });
        }

        res.json({ ride });
    } catch (error) {
        console.error('Cancel ride error:', error);
        res.status(500).json({ message: 'Error cancelling ride' });
    }
};

// @desc Get ride history
// @route GET /api/rides/history
const getRideHistory = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = req.user.role === 'driver'
            ? { driverId: req.user._id }
            : { riderId: req.user._id };

        const [rides, total] = await Promise.all([
            Ride.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('riderId', 'name phone')
                .populate('driverId', 'name phone'),
            Ride.countDocuments(query)
        ]);

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
        res.status(500).json({ message: 'Error fetching ride history' });
    }
};

// @desc Get active ride
// @route GET /api/rides/active
const getActiveRide = async (req, res) => {
    try {
        const query = req.user.role === 'driver'
            ? { driverId: req.user._id, status: { $in: ['accepted', 'driver_arrived', 'otp_verified', 'on_trip'] } }
            : { riderId: req.user._id, status: { $in: ['requested', 'accepted', 'driver_arrived', 'otp_verified', 'on_trip'] } };

        const ride = await Ride.findOne(query)
            .populate('riderId', 'name phone')
            .populate('driverId', 'name phone');

        res.json({ ride });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching active ride' });
    }
};

module.exports = {
    bookRide,
    acceptRide,
    startRide,
    completeRide,
    cancelRide,
    getRideHistory,
    getActiveRide
};
