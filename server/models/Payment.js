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
        enum: ['cash', 'online'],
        default: 'cash'
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'refunded'],
        default: 'pending'
    },
    transactionId: {
        type: String,
        default: function () {
            return 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);
