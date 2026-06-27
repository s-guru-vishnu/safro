const Razorpay = require('razorpay');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Ride = require('../models/Ride');
const User = require('../models/User');
const Driver = require('../models/Driver');
const WalletTransaction = require('../models/WalletTransaction');
const { calculateCommission } = require('../services/commissionService');
const { sendPaymentReceiptEmail, sendWalletTopupEmail, sendPaymentReceiptWhatsApp } = require('../services/notificationService');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_your_key',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_secret'
});

/**
 * Helper to check if an error is related to missing replica set / transactions
 */
const isTransactionError = (error) => {
    const msg = error.message || '';
    return msg.includes('replica set') || 
           msg.includes('Transaction') || 
           msg.includes('session') ||
           error.code === 20 || 
           error.code === 251 ||
           error.name === 'MongoServerError';
};

/**
 * Helper to calculate cashback based on fare
 * if ride >= 500: ₹1 to ₹2
 * else: 10 to 99 paise
 */
const calculateCashback = (fare) => {
    if (fare >= 500) {
        // Random between 1.00 and 2.00
        return parseFloat((Math.random() * (2.0 - 1.0) + 1.0).toFixed(2));
    } else {
        // Random between 0.10 and 0.99
        return parseFloat((Math.random() * (0.99 - 0.10) + 0.10).toFixed(2));
    }
};

/**
 * 1️⃣ Create Razorpay Order
 */
const createRazorpayOrder = async (req, res, next) => {
    try {
        const { rideId, amount } = req.body;
        let finalAmount;

        if (rideId) {
            const ride = await Ride.findById(rideId);
            if (!ride) return res.status(404).json({ message: 'Ride not found' });
            if (ride.status !== 'completed') return res.status(400).json({ message: 'Ride is not yet completed' });
            if (ride.paymentStatus === 'Paid') return res.status(400).json({ message: 'Ride already paid' });
            finalAmount = ride.negotiatedFare || ride.fare.final || ride.fare.proposed;
        } else {
            finalAmount = amount;
        }

        if (!finalAmount || finalAmount <= 0) return res.status(400).json({ message: 'Invalid amount' });

        const options = {
            amount: Math.round(finalAmount * 100),
            currency: 'INR',
            receipt: `receipt_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);
        if (rideId) await Ride.findByIdAndUpdate(rideId, { razorpayOrderId: order.id });

        res.status(201).json({ id: order.id, amount: order.amount, currency: order.currency });
    } catch (error) {
        next(error);
    }
};

/**
 * 2️⃣ Verify Razorpay Payment
 */
const verifyRazorpayPayment = async (req, res, next) => {
    let session;
    try {
        session = await mongoose.startSession();
        session.startTransaction();

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, rideId, isWalletTopup } = req.body;

        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

        if (generatedSignature !== razorpay_signature) {
            if (session.inTransaction()) await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ status: "failure", message: "Invalid payment signature" });
        }

        if (isWalletTopup) {
            const orderDetails = await razorpay.orders.fetch(razorpay_order_id);
            const topupAmount = orderDetails.amount / 100;
            const user = await User.findById(req.user._id).session(session);
            if (!user) {
                await session.abortTransaction(); session.endSession();
                return res.status(404).json({ message: 'User not found' });
            }
            user.walletBalance += topupAmount;
            await user.save({ session });
            await WalletTransaction.create([{
                userId: req.user._id, amount: topupAmount, type: 'credit', source: 'razorpay',
                status: 'completed', referenceId: razorpay_payment_id, description: `Wallet Payment - ${razorpay_payment_id.slice(-6)}`
            }], { session });

            await session.commitTransaction();
            session.endSession();
            sendWalletTopupEmail({ name: user.name || 'User', email: user.email }, topupAmount, user.walletBalance);
            return res.json({ status: "success", balance: user.walletBalance });
        }

        const ride = await Ride.findById(rideId).session(session);
        if (!ride) {
            await session.abortTransaction(); session.endSession();
            return res.status(404).json({ message: 'Ride not found' });
        }
        if (ride.paymentStatus === 'Paid') {
            await session.commitTransaction(); session.endSession();
            return res.json({ status: "success", message: "Already processed" });
        }

        const fare = ride.negotiatedFare || ride.fare.final || ride.fare.proposed;
        const { platformCommission, driverAmount } = calculateCommission(fare);
        ride.paymentMethod = 'razorpay'; ride.paymentStatus = 'Paid';
        ride.platformCommission = platformCommission; ride.driverAmount = driverAmount; ride.paidAt = new Date();
        await ride.save({ session });

        if (ride.driverId) {
            await Driver.findOneAndUpdate({ userId: ride.driverId }, { $inc: { payoutBalance: driverAmount } }, { session });
        }

        const cashback = calculateCashback(fare);
        if (cashback > 0) {
            const user = await User.findById(req.user._id).session(session);
            user.walletBalance += cashback; await user.save({ session });
            await WalletTransaction.create([{
                userId: req.user._id, amount: cashback, type: 'credit', source: 'ride',
                status: 'completed', referenceId: ride._id.toString(), description: 'Cashback'
            }], { session });
        }

        await Payment.create([{
            rideId: ride._id, riderId: ride.riderId, driverId: ride.driverId,
            amount: fare, method: 'razorpay', status: 'completed', cashback
        }], { session });

        await session.commitTransaction();
        session.endSession();

        const io = req.app.get('io');
        if (io) io.to(`ride_${ride._id}`).emit('paymentSuccess', { rideId: ride._id, method: 'razorpay' });

        res.json({ status: "success", ride, cashback });
    } catch (error) {
        if (session && session.inTransaction()) await session.abortTransaction();
        if (session) session.endSession();

        if (isTransactionError(error)) {
            console.warn('⚠️ [Verify] Fallback (No Replica Set)');
            try {
                const { razorpay_order_id, razorpay_payment_id, rideId, isWalletTopup } = req.body;
                if (isWalletTopup) {
                    const orderDetails = await razorpay.orders.fetch(razorpay_order_id);
                    const topupAmount = orderDetails.amount / 100;
                    const user = await User.findById(req.user._id);
                    if (!user) return res.status(404).json({ message: 'User not found' });
                    user.walletBalance += topupAmount; await user.save();
                    await WalletTransaction.create({
                        userId: req.user._id, amount: topupAmount, type: 'credit', source: 'razorpay',
                        status: 'completed', referenceId: razorpay_payment_id,
                        description: `Wallet Added - ${razorpay_payment_id.slice(-6)}`
                    });
                    sendWalletTopupEmail({ name: user.name || 'User', email: user.email }, topupAmount, user.walletBalance);
                    return res.json({ status: "success", balance: user.walletBalance });
                }
                const ride = await Ride.findById(rideId);
                if (ride.paymentStatus === 'Paid') return res.json({ status: "success" });
                const fare = ride.negotiatedFare || ride.fare.final || ride.fare.proposed;
                const { platformCommission, driverAmount } = calculateCommission(fare);
                ride.paymentMethod = 'razorpay'; ride.paymentStatus = 'Paid';
                ride.platformCommission = platformCommission; ride.driverAmount = driverAmount; ride.paidAt = new Date();
                await ride.save();
                if (ride.driverId) await Driver.findOneAndUpdate({ userId: ride.driverId }, { $inc: { payoutBalance: driverAmount } });
                const cashback = calculateCashback(fare);
                if (cashback > 0) {
                    const user = await User.findById(req.user._id);
                    if (user) {
                        user.walletBalance += cashback;
                        await user.save();
                        await WalletTransaction.create({
                            userId: req.user._id, amount: cashback, type: 'credit', source: 'ride',
                            status: 'completed', referenceId: ride._id.toString(), description: 'Cashback'
                        });
                    }
                }
                await Payment.create({ rideId: ride._id, riderId: ride.riderId, driverId: ride.driverId, amount: fare, method: 'razorpay', status: 'completed', cashback });
                const io = req.app.get('io');
                if (io) io.to(`ride_${ride._id}`).emit('paymentSuccess', { rideId: ride._id, method: 'razorpay' });
                return res.json({ status: "success", ride, cashback });
            } catch (e) { return next(e); }
        }
        next(error);
    }
};

/**
 * 3️⃣ Webhook Handler
 */
const handleRazorpayWebhook = async (req, res) => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const signature = req.headers['x-razorpay-signature'];
        const expectedSignature = crypto.createHmac('sha256', secret).update(req.body).digest('hex');
        if (signature !== expectedSignature) return res.status(400).json({ message: 'Invalid signature' });

        const data = JSON.parse(req.body.toString());
        if (data.event === 'payment.captured') {
            const { order_id } = data.payload.payment.entity;
            const ride = await Ride.findOne({ razorpayOrderId: order_id });
            if (ride && ride.paymentStatus !== 'Paid') {
                const fare = ride.negotiatedFare || ride.fare.final || ride.fare.proposed;
                const { platformCommission, driverAmount } = calculateCommission(fare);
                ride.paymentStatus = 'Paid'; ride.paymentMethod = 'razorpay';
                ride.platformCommission = platformCommission; ride.driverAmount = driverAmount;
                await ride.save();
                if (ride.driverId) await Driver.findOneAndUpdate({ userId: ride.driverId }, { $inc: { payoutBalance: driverAmount } });
                await Payment.create({ rideId: ride._id, riderId: ride.riderId, driverId: ride.driverId, amount: fare, method: 'razorpay', status: 'completed' });
                const io = req.app.get('io');
                if (io) io.to(`ride_${ride._id}`).emit('paymentSuccess', { rideId: ride._id, method: 'razorpay' });
            }
        }
        res.json({ status: 'ok' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * 4️⃣ Pay with Wallet
 */
const payWithWallet = async (req, res, next) => {
    let session;
    try {
        session = await mongoose.startSession();
        session.startTransaction();
        const { rideId } = req.body;
        const ride = await Ride.findById(rideId).session(session);
        if (!ride || ride.paymentStatus === 'Paid') {
            await session.abortTransaction(); session.endSession();
            return res.status(400).json({ message: 'Ride invalid' });
        }
        const fare = ride.negotiatedFare || ride.fare.final || ride.fare.proposed;
        const user = await User.findById(req.user._id).session(session);
        if (!user) {
            await session.abortTransaction(); session.endSession();
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.walletBalance < fare) {
            await session.abortTransaction(); session.endSession();
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        const { platformCommission, driverAmount } = calculateCommission(fare);
        user.walletBalance -= fare;
        await WalletTransaction.create([{
            userId: user._id, amount: fare, type: 'debit', source: 'ride',
            status: 'completed', referenceId: ride._id.toString(), description: `Ride Payment - ${ride._id.toString().slice(-6)}`
        }], { session });

        const cashback = calculateCashback(fare);
        if (cashback > 0) {
            user.walletBalance += cashback;
            await WalletTransaction.create([{
                userId: user._id, amount: cashback, type: 'credit', source: 'ride',
                status: 'completed', referenceId: ride._id.toString(), description: 'Cashback'
            }], { session });
        }
        await user.save({ session });

        ride.paymentMethod = 'wallet'; ride.paymentStatus = 'Paid';
        ride.platformCommission = platformCommission; ride.driverAmount = driverAmount; ride.paidAt = new Date();
        await ride.save({ session });

        if (ride.driverId) await Driver.findOneAndUpdate({ userId: ride.driverId }, { $inc: { payoutBalance: driverAmount } }, { session });
        await Payment.create([{ rideId: ride._id, riderId: ride.riderId, driverId: ride.driverId, amount: fare, method: 'wallet', status: 'completed', cashback }], { session });

        await session.commitTransaction();
        session.endSession();
        const io = req.app.get('io');
        if (io) io.to(`ride_${ride._id}`).emit('paymentSuccess', { rideId: ride._id, method: 'wallet' });
        res.json({ status: "success", ride, newBalance: user.walletBalance, cashback });
    } catch (error) {
        if (session && session.inTransaction()) await session.abortTransaction();
        if (session) session.endSession();
        if (isTransactionError(error)) {
            try {
                const { rideId } = req.body;
                const ride = await Ride.findById(rideId);
                const fare = ride.negotiatedFare || ride.fare.final || ride.fare.proposed;
                const user = await User.findById(req.user._id);
                if (!user) return res.status(404).json({ message: 'User not found' });
                if (user.walletBalance < fare) return res.status(400).json({ message: 'Insufficient balance' });
                const { platformCommission, driverAmount } = calculateCommission(fare);
                user.walletBalance -= fare;
                await WalletTransaction.create({
                    userId: user._id, amount: fare, type: 'debit', source: 'ride',
                    status: 'completed', referenceId: ride._id.toString(), description: `Ride Payment - ${ride._id.toString().slice(-6)}`
                });

                const cashback = calculateCashback(fare);
                if (cashback > 0) {
                    user.walletBalance += cashback;
                    await WalletTransaction.create({
                        userId: user._id, amount: cashback, type: 'credit', source: 'ride',
                        status: 'completed', referenceId: ride._id.toString(), description: 'Cashback'
                    });
                }
                await user.save();
                ride.paymentMethod = 'wallet'; ride.paymentStatus = 'Paid';
                ride.platformCommission = platformCommission; ride.driverAmount = driverAmount;
                await ride.save();
                if (ride.driverId) await Driver.findOneAndUpdate({ userId: ride.driverId }, { $inc: { payoutBalance: driverAmount } });
                await Payment.create({ rideId: ride._id, riderId: ride.riderId, driverId: ride.driverId, amount: fare, method: 'wallet', status: 'completed' });
                const io = req.app.get('io');
                if (io) io.to(`ride_${ride._id}`).emit('paymentSuccess', { rideId: ride._id, method: 'wallet' });
                return res.json({ status: "success", ride, newBalance: user.walletBalance });
            } catch (e) { return next(e); }
        }
        next(error);
    }
};

/**
 * 5️⃣ Initiate Cash Payment (Rider)
 */
const initiateCashPayment = async (req, res, next) => {
    let session;
    try {
        session = await mongoose.startSession();
        session.startTransaction();
        const { rideId } = req.body;
        const ride = await Ride.findById(rideId).session(session);
        if (!ride || ride.paymentStatus === 'Paid') {
            await session.abortTransaction(); session.endSession();
            return res.status(400).json({ message: 'Invalid request' });
        }
        ride.paymentMethod = 'cash'; ride.paymentStatus = 'Driver Confirmation';
        await ride.save({ session });
        await session.commitTransaction();
        session.endSession();
        const io = req.app.get('io');
        if (io) io.to(`ride_${ride._id}`).emit('paymentInitiated', { rideId: ride._id, method: 'cash' });
        res.json({ status: "success", message: "Waiting for driver confirmation", ride });
    } catch (error) {
        if (session && session.inTransaction()) await session.abortTransaction();
        if (session) session.endSession();
        if (isTransactionError(error)) {
            console.warn('⚠️ [Cash Initiate] Fallback');
            try {
                const { rideId } = req.body;
                const ride = await Ride.findById(rideId);
                ride.paymentMethod = 'cash'; ride.paymentStatus = 'Driver Confirmation';
                await ride.save();
                const io = req.app.get('io');
                if (io) io.to(`ride_${ride._id}`).emit('paymentInitiated', { rideId: ride._id, method: 'cash' });
                return res.json({ status: "success", message: "Waiting for driver confirmation", ride });
            } catch (e) { return next(e); }
        }
        next(error);
    }
};

/**
 * 6️⃣ Confirm Cash Payment (Driver)
 */
const confirmCashPayment = async (req, res, next) => {
    let session;
    try {
        session = await mongoose.startSession();
        session.startTransaction();
        const { rideId } = req.body;
        const ride = await Ride.findById(rideId).session(session);
        if (!ride || ride.paymentStatus === 'Paid') {
            await session.abortTransaction(); session.endSession();
            return res.status(400).json({ message: 'Invalid request' });
        }
        const fare = ride.negotiatedFare || ride.fare.final || ride.fare.proposed;
        const { platformCommission, driverAmount } = calculateCommission(fare);
        ride.paymentMethod = 'cash'; ride.paymentStatus = 'Paid'; ride.driverConfirmed = true;
        ride.platformCommission = platformCommission; ride.driverAmount = driverAmount; ride.paidAt = new Date();
        await ride.save({ session });
        const driver = await Driver.findOneAndUpdate({ userId: req.user._id }, { $inc: { payoutBalance: -platformCommission } }, { session });
        if (!driver) {
            await session.abortTransaction(); session.endSession();
            return res.status(404).json({ message: 'Driver profile not found' });
        }
        await Payment.create([{ rideId: ride._id, riderId: ride.riderId, driverId: ride.driverId, amount: fare, method: 'cash', status: 'completed' }], { session });
        await session.commitTransaction();
        session.endSession();
        const io = req.app.get('io');
        if (io) io.to(`ride_${ride._id}`).emit('paymentSuccess', { rideId: ride._id, method: 'cash' });
        res.json({ status: "success", ride });
    } catch (error) {
        if (session && session.inTransaction()) await session.abortTransaction();
        if (session) session.endSession();
        if (isTransactionError(error)) {
            try {
                const { rideId } = req.body;
                const ride = await Ride.findById(rideId);
                const fare = ride.negotiatedFare || ride.fare.final || ride.fare.proposed;
                const { platformCommission, driverAmount } = calculateCommission(fare);
                ride.paymentMethod = 'cash'; ride.paymentStatus = 'Paid'; ride.driverConfirmed = true;
                ride.platformCommission = platformCommission; ride.driverAmount = driverAmount;
                await ride.save();
                await Driver.findOneAndUpdate({ userId: req.user._id }, { $inc: { payoutBalance: -platformCommission } });
                await Payment.create({ rideId: ride._id, riderId: ride.riderId, driverId: ride.driverId, amount: fare, method: 'cash', status: 'completed' });
                const io = req.app.get('io');
                if (io) io.to(`ride_${ride._id}`).emit('paymentSuccess', { rideId: ride._id, method: 'cash' });
                return res.json({ status: "success", ride });
            } catch (e) { return next(e); }
        }
        next(error);
    }
};

/**
 * 7️⃣ Generic Payment Confirmation (Driver - for Wallet/Online)
 */
const confirmPayment = async (req, res, next) => {
    try {
        const { rideId } = req.body;
        const ride = await Ride.findById(rideId);
        
        if (!ride || ride.driverId.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        if (ride.paymentStatus !== 'Paid') {
            return res.status(400).json({ message: 'Payment must be completed before confirmation' });
        }

        ride.driverConfirmed = true;
        await ride.save();

        res.json({ status: 'success', message: 'Payment acknowledged', ride });
    } catch (error) {
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

const getWalletTransactions = async (req, res, next) => {
    try {
        const transactions = await WalletTransaction.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json({ transactions });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createRazorpayOrder,
    verifyRazorpayPayment,
    payWithWallet,
    initiateCashPayment,
    confirmCashPayment,
    confirmPayment,
    getPaymentHistory,
    getWalletTransactions,
    handleRazorpayWebhook
};
