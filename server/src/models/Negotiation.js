const mongoose = require('mongoose');

const negotiationSchema = new mongoose.Schema({
    rideId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ride',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        enum: ['rider', 'driver'],
        required: true
    },
    amount: {
        type: Number,
        default: 0
    },
    type: {
        type: String,
        enum: ['offer', 'message'],
        default: 'offer'
    },
    text: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['active', 'accepted', 'rejected'],
        default: 'active'
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Negotiation', negotiationSchema);
