const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    rideId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ride',
        required: true
    },
    riderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    method: {
        type: String,
        enum: ['cash', 'wallet', 'razorpay'],
        default: 'cash'
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'refunded'],
        default: 'pending'
    },
    cashback: {
        type: Number,
        default: 0
    },
    transactionId: {
        type: String,
        default: function () {
            return 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
    },
    splitFareId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SplitFare',
        default: null
    }
}, {
    timestamps: true
});

paymentSchema.index({ rideId: 1 });
paymentSchema.index({ riderId: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
