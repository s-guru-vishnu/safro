const Payment = require('../models/Payment');
const Ride = require('../models/Ride');

// @desc    Process payment for a ride
// @route   POST /api/payments/pay
const processPayment = async (req, res, next) => {
    try {
        const { rideId, method } = req.body;

        if (!rideId) {
            return res.status(400).json({ message: 'Ride ID is required' });
        }

        // Find the ride
        const ride = await Ride.findById(rideId);
        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        // Check if payment already exists
        const existingPayment = await Payment.findOne({ rideId, status: 'completed' });
        if (existingPayment) {
            return res.status(400).json({
                message: 'Payment already processed for this ride',
                payment: existingPayment
            });
        }

        // Create payment
        const payment = await Payment.create({
            rideId: ride._id,
            riderId: ride.riderId,
            driverId: ride.driverId,
            amount: ride.fare,
            method: method || 'cash',
            status: 'completed'
        });

        // Update ride status if not already completed
        if (ride.status === 'on_trip') {
            ride.status = 'completed';
            ride.endTime = new Date();
            await ride.save();
        }

        // Emit payment event
        const io = req.app.get('io');
        if (io) {
            io.emit('paymentCompleted', {
                rideId: ride._id,
                payment: {
                    amount: payment.amount,
                    method: payment.method,
                    transactionId: payment.transactionId,
                    status: payment.status
                }
            });
        }

        res.status(201).json({
            message: 'Payment processed successfully',
            payment
        });
    } catch (error) {
        console.error('Payment error:', error);
        next(error);
    }
};

// @desc    Get payment history
// @route   GET /api/payments/history
const getPaymentHistory = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Build query based on user role
        const query = req.user.role === 'driver'
            ? { driverId: req.user._id }
            : { riderId: req.user._id };

        const [payments, total] = await Promise.all([
            Payment.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate({
                    path: 'rideId',
                    select: 'pickupLocation dropLocation distance fare status'
                }),
            Payment.countDocuments(query)
        ]);

        res.json({
            payments,
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

module.exports = {
    processPayment,
    getPaymentHistory
};
