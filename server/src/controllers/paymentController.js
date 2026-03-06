const Razorpay = require('razorpay');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Ride = require('../models/Ride');
const User = require('../models/User');
const Driver = require('../models/Driver');
const WalletTransaction = require('../models/WalletTransaction');
const { calculateCommission } = require('../services/commissionService');
const { sendPaymentReceiptEmail, sendWalletTopupEmail } = require('../services/notificationService');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_your_key',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_secret'
});

/**
 * 1️⃣ Create Razorpay Order
 * Validate ride, status, and paymentStatus before creation.
 */
const createRazorpayOrder = async (req, res, next) => {
    try {
        const { rideId, amount } = req.body;
        console.log(`💳 [Order] Initiating: rideId=${rideId}, amount=${amount}`);

        let finalAmount;

        if (rideId) {
            const ride = await Ride.findById(rideId);
            if (!ride) {
                console.warn(`⚠️ [Order] Ride not found: ${rideId}`);
                return res.status(404).json({ message: 'Ride not found' });
            }

            // PRODUCTION SECURE: Strictly allow only completed rides to be paid
            if (ride.status !== 'completed') {
                console.warn(`⚠️ [Order] Attempted payment for incomplete ride ${rideId} (Status: ${ride.status})`);
                return res.status(400).json({ message: 'Ride is not yet completed' });
            }

            // IDEMPOTENCY: Prevent multiple orders for already paid rides
            if (ride.paymentStatus === 'Paid') {
                console.warn(`⚠️ [Order] Attempted payment for already paid ride ${rideId}`);
                return res.status(400).json({ message: 'Ride already paid' });
            }

            finalAmount = ride.negotiatedFare || ride.fare.final || ride.fare.proposed;
        } else {
            // Wallet Top-up flow
            finalAmount = amount;
        }

        if (!finalAmount || finalAmount <= 0) {
            return res.status(400).json({ message: 'Invalid amount' });
        }

        const options = {
            amount: Math.round(finalAmount * 100), // convert to paise
            currency: 'INR',
            receipt: `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
        };

        const order = await razorpay.orders.create(options);
        console.log(`✅ [Order] Created for ride ${rideId || 'Wallet'}: ${order.id}`);

        if (rideId) {
            await Ride.findByIdAndUpdate(rideId, { razorpayOrderId: order.id });
        }

        res.status(201).json({
            id: order.id,
            amount: order.amount,
            currency: order.currency
        });
    } catch (error) {
        console.error('🔥 [Order Error Detail]:', error);
        res.status(500).json({
            message: error.message || 'Internal server error during order creation',
            error: error.message,
            code: error.code,
            metadata: error.metadata
        });
    }
};

/**
 * 2️⃣ Verify Razorpay Payment (Direct from Frontend)
 * Secure signature verification using Key Secret.
 */
const verifyRazorpayPayment = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            rideId,
            isWalletTopup
        } = req.body;

        // PRODUCTION SECURE: Strict Signature Verification
        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

        if (generatedSignature !== razorpay_signature) {
            console.error('❌ [Verify] Signature Mismatch');
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ status: "failure", message: "Invalid payment signature" });
        }

        console.log(`✅ [Verify] Signature Verified for Order ${razorpay_order_id}`);

        if (isWalletTopup) {
            const orderDetails = await razorpay.orders.fetch(razorpay_order_id);
            const topupAmount = orderDetails.amount / 100;

            const user = await User.findById(req.user._id).session(session);
            user.walletBalance += topupAmount;
            await user.save({ session });

            await WalletTransaction.create([{
                userId: req.user._id,
                amount: topupAmount,
                type: 'credit',
                source: 'razorpay',
                status: 'completed',
                referenceId: razorpay_payment_id,
                description: 'Wallet Top-up via Razorpay'
            }], { session });

            await session.commitTransaction();
            session.endSession();
            console.log(`💰 [Verify] Wallet Top-up Successful: ₹${topupAmount}`);

            // 📧 Email: Wallet Top-up (non-blocking)
            sendWalletTopupEmail({ name: user.name, email: user.email }, topupAmount, user.walletBalance);

            return res.json({ status: "success", message: "Wallet topped up", balance: user.walletBalance });
        }

        const ride = await Ride.findById(rideId).session(session);
        if (!ride) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Ride not found' });
        }

        // IDEMPOTENCY: Already processed?
        if (ride.paymentStatus === 'Paid') {
            console.log(`✅ [Verify] Duplicate skipped - Ride ${rideId} already Paid`);
            await session.commitTransaction();
            session.endSession();
            return res.json({ status: "success", message: "Already processed" });
        }

        const fare = ride.negotiatedFare || ride.fare.final || ride.fare.proposed;
        const { platformCommission, driverAmount } = calculateCommission(fare);

        ride.paymentMethod = 'razorpay';
        ride.paymentStatus = 'Paid';
        ride.platformCommission = platformCommission;
        ride.driverAmount = driverAmount;
        ride.paidAt = new Date();
        await ride.save({ session });

        if (ride.driverId) {
            await Driver.findOneAndUpdate(
                { userId: ride.driverId },
                { $inc: { payoutBalance: driverAmount } },
                { session }
            );
        }

        // 2% Cashback for digital flow
        const cashback = Math.round(fare * 0.02);
        if (cashback > 0) {
            const user = await User.findById(req.user._id).session(session);
            user.walletBalance += cashback;
            await user.save({ session });
            await WalletTransaction.create([{
                userId: req.user._id,
                amount: cashback,
                type: 'credit',
                source: 'ride',
                status: 'completed',
                referenceId: ride._id.toString(),
                description: `2% Cashback for ride ${ride._id}`
            }], { session });
        }

        await Payment.create([{
            rideId: ride._id,
            riderId: ride.riderId,
            driverId: ride.driverId,
            amount: fare,
            method: 'razorpay',
            status: 'completed',
            cashback
        }], { session });

        await session.commitTransaction();
        session.endSession();

        const io = req.app.get('io');
        if (io) {
            io.to(`ride_${ride._id}`).emit('paymentSuccess', {
                rideId: ride._id,
                method: 'razorpay',
                cashback,
                driverAmount
            });
        }

        console.log(`💰 [Verify] Payment SUCCESS for Ride ${rideId}`);

        // 📧 Email: Payment Receipt (non-blocking)
        try {
            const riderUser = await User.findById(ride.riderId);
            if (riderUser) {
                sendPaymentReceiptEmail(
                    { name: riderUser.name, email: riderUser.email },
                    { _id: ride._id, paymentMethod: 'razorpay', agreedFare: fare, platformFee: platformCommission, totalPaid: fare }
                );
            }
        } catch (e) { /* non-blocking */ }

        res.json({ status: "success", ride, cashback });
    } catch (error) {
        if (session.inTransaction()) await session.abortTransaction();
        session.endSession();
        console.error('🔥 [Verify Error]:', error);
        res.status(500).json({ message: 'Internal verification error', error: error.message });
    }
};

/**
 * 3️⃣ Razorpay Webhook Handler
 * PRODUCTION SECURE: Raw body verification + Idempotency
 */
const handleRazorpayWebhook = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const signature = req.headers['x-razorpay-signature'];

        // RAW BODY VERIFICATION
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(req.body)
            .digest('hex');

        if (signature !== expectedSignature) {
            console.error('❌ [Webhook] Signature Verification Failed');
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Invalid signature' });
        }

        const data = JSON.parse(req.body.toString());
        const { event, payload } = data;

        console.log(`📡 [Webhook] Processing: ${event}`);

        if (event === 'payment.captured') {
            const { order_id, amount } = payload.payment.entity;

            // Find ride by razorpayOrderId
            const ride = await Ride.findOne({ razorpayOrderId: order_id }).session(session);

            if (!ride) {
                console.log(`ℹ️ [Webhook] Ride not found for Order ID ${order_id}`);
                await session.abortTransaction();
                session.endSession();
                return res.json({ status: 'ok', message: 'Ride not tracked' });
            }

            // IDEMPOTENCY: Already processed?
            if (ride.paymentStatus === 'Paid') {
                console.log(`✅ [Webhook] Duplicate skipped - Ride ${ride._id} already Paid`);
                await session.abortTransaction();
                session.endSession();
                return res.json({ status: 'ok', message: 'Already processed' });
            }

            const fare = ride.negotiatedFare || ride.fare.final || ride.fare.proposed;
            const { platformCommission, driverAmount } = calculateCommission(fare);

            ride.paymentStatus = 'Paid';
            ride.paymentMethod = 'razorpay';
            ride.platformCommission = platformCommission;
            ride.driverAmount = driverAmount;
            ride.paidAt = new Date();
            await ride.save({ session });

            if (ride.driverId) {
                await Driver.findOneAndUpdate(
                    { userId: ride.driverId },
                    { $inc: { payoutBalance: driverAmount } },
                    { session }
                );
            }

            const cashback = Math.round(fare * 0.02);
            if (cashback > 0) {
                await User.findByIdAndUpdate(ride.riderId, { $inc: { walletBalance: cashback } }, { session });
            }

            await Payment.create([{
                rideId: ride._id,
                riderId: ride.riderId,
                driverId: ride.driverId,
                amount: fare,
                method: 'razorpay',
                status: 'completed',
                cashback
            }], { session });

            await session.commitTransaction();
            session.endSession();
            console.log(`💰 [Webhook] Payment SUCCESS for Ride ${ride._id}`);

            const io = req.app.get('io');
            if (io) io.to(`ride_${ride._id}`).emit('paymentSuccess', { rideId: ride._id, method: 'razorpay', via: 'webhook' });
        } else if (event === 'payment.failed') {
            const { order_id } = payload.payment.entity;
            const ride = await Ride.findOne({ razorpayOrderId: order_id }).session(session);
            if (ride) {
                ride.paymentStatus = 'Failed';
                await ride.save({ session });
                const io = req.app.get('io');
                if (io) io.to(`ride_${ride._id}`).emit('paymentFailed', { rideId: ride._id });
            }
            await session.commitTransaction();
            session.endSession();
            console.log(`❌ [Webhook] Payment FAILED for Ride ${ride?._id}`);
        } else {
            await session.commitTransaction();
            session.endSession();
        }

        res.json({ status: 'ok' });
    } catch (error) {
        console.error('🔥 [Webhook Error]:', error);
        if (session.inTransaction()) await session.abortTransaction();
        session.endSession();
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Wallet Flow
const payWithWallet = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { rideId } = req.body;
        const ride = await Ride.findById(rideId).session(session);
        if (!ride || ride.paymentStatus === 'Paid') {
            await session.abortTransaction(); session.endSession();
            return res.status(400).json({ message: 'Ride invalid or already paid' });
        }

        const fare = ride.negotiatedFare || ride.fare.final || ride.fare.proposed;
        const user = await User.findById(req.user._id).session(session);

        if (user.walletBalance < fare) {
            await session.abortTransaction(); session.endSession();
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        const { platformCommission, driverAmount } = calculateCommission(fare);
        user.walletBalance -= fare;
        await user.save({ session });

        const cashback = Math.round(fare * 0.02);
        user.walletBalance += cashback;
        await user.save({ session });

        ride.paymentMethod = 'wallet';
        ride.paymentStatus = 'Paid';
        ride.platformCommission = platformCommission;
        ride.driverAmount = driverAmount;
        ride.paidAt = new Date();
        await ride.save({ session });

        if (ride.driverId) {
            await Driver.findOneAndUpdate({ userId: ride.driverId }, { $inc: { payoutBalance: driverAmount } }, { session });
        }

        await Payment.create([{
            rideId: ride._id,
            riderId: ride.riderId,
            driverId: ride.driverId,
            amount: fare,
            method: 'wallet',
            status: 'completed',
            cashback
        }], { session });

        await session.commitTransaction();
        session.endSession();
        const io = req.app.get('io');
        if (io) io.to(`ride_${ride._id}`).emit('paymentSuccess', { rideId: ride._id, method: 'wallet', cashback });

        // 📧 Email: Payment Receipt (non-blocking)
        sendPaymentReceiptEmail(
            { name: user.name, email: user.email },
            { _id: ride._id, paymentMethod: 'wallet', agreedFare: fare, platformFee: platformCommission, totalPaid: fare }
        );

        res.json({ status: "success", ride, newBalance: user.walletBalance, cashback });
    } catch (error) {
        if (session.inTransaction()) await session.abortTransaction();
        session.endSession();
        next(error);
    }
};

// Confirm Cash Payment (Driver)
const confirmCashPayment = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { rideId } = req.body;
        const ride = await Ride.findById(rideId).session(session);
        if (!ride || ride.paymentStatus === 'Paid' || ride.driverId.toString() !== req.user._id.toString()) {
            await session.abortTransaction(); session.endSession();
            return res.status(400).json({ message: 'Invalid request' });
        }

        const fare = ride.negotiatedFare || ride.fare.final || ride.fare.proposed;
        const { platformCommission, driverAmount } = calculateCommission(fare);

        ride.paymentMethod = 'cash';
        ride.paymentStatus = 'Paid';
        ride.platformCommission = platformCommission;
        ride.driverAmount = driverAmount;
        ride.paidAt = new Date();
        await ride.save({ session });

        await Driver.findOneAndUpdate(
            { userId: req.user._id },
            { $inc: { payoutBalance: -platformCommission } },
            { session }
        );

        await Payment.create([{
            rideId: ride._id,
            riderId: ride.riderId,
            driverId: ride.driverId,
            amount: fare,
            method: 'cash',
            status: 'completed'
        }], { session });

        await session.commitTransaction();
        session.endSession();
        const io = req.app.get('io');
        if (io) io.to(`ride_${ride._id}`).emit('paymentSuccess', { rideId: ride._id, method: 'cash' });

        // 📧 Email: Payment Receipt (non-blocking)
        try {
            const riderUser = await User.findById(ride.riderId);
            if (riderUser) {
                sendPaymentReceiptEmail(
                    { name: riderUser.name, email: riderUser.email },
                    { _id: ride._id, paymentMethod: 'cash', agreedFare: fare, platformFee: platformCommission, totalPaid: fare }
                );
            }
        } catch (e) { /* non-blocking */ }

        res.json({ status: "success", ride });
    } catch (error) {
        if (session.inTransaction()) await session.abortTransaction();
        session.endSession();
        next(error);
    }
};

const getPaymentHistory = async (req, res, next) => {
    try {
        const query = req.user.role === 'driver' ? { driverId: req.user._id } : { riderId: req.user._id };
        const payments = await Payment.find(query).sort({ createdAt: -1 }).populate('rideId');
        res.json({ payments });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createRazorpayOrder,
    verifyRazorpayPayment,
    payWithWallet,
    confirmCashPayment,
    getPaymentHistory,
    handleRazorpayWebhook
};
