const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
    riderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    pickupLocation: {
        address: { type: String, required: true },
        coordinates: {
            lat: { type: Number, required: true },
            lng: { type: Number, required: true }
        }
    },
    dropLocation: {
        address: { type: String, required: true },
        coordinates: {
            lat: { type: Number, required: true },
            lng: { type: Number, required: true }
        }
    },
    fare: {
        proposed: { type: Number, required: true },
        final: { type: Number }
    },
    status: {
        type: String,
        enum: ['pending', 'negotiating', 'confirmed', 'ongoing', 'completed', 'cancelled'],
        default: 'pending'
    },
    distance: { type: String }, // e.g., "5.2 km"
    duration: { type: String }, // e.g., "15 mins"
    distanceKm: { type: Number, default: 0 }, // Parsed numeric distance
    estimatedDuration: { type: Number, default: 0 }, // Duration in minutes
    otp: { type: String }, // For starting the ride
    // AI Fare Prediction
    aiPrediction: {
        minFare: { type: Number },
        suggestedFare: { type: Number },
        maxFare: { type: Number },
        reasoning: { type: String },
        source: { type: String, enum: ['ai', 'algorithm'], default: 'algorithm' }
    },
    // Fraud Detection
    fraudFlag: {
        flagged: { type: Boolean, default: false },
        riskScore: { type: Number, default: 0 },
        reasons: [{ type: String }]
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Ride', rideSchema);
