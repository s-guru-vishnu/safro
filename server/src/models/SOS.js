const mongoose = require('mongoose');

const sosSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rideId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ride'
    },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    alertsSent: [{
        recipient: String,     // phone number or 'admin'
        status: String,        // 'sent' | 'failed'
        sentAt: { type: Date, default: Date.now }
    }],
    resolved: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SOS', sosSchema);
