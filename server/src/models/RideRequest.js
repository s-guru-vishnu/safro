const mongoose = require('mongoose');

const rideRequestSchema = new mongoose.Schema({
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
    distanceKm: { type: Number, required: true },
    durationMin: { type: Number, required: true },
    estimatedFare: { type: Number, required: true },
    riderOffer: { type: Number },
    driverCounter: { type: Number },
    finalFare: { type: Number },
    status: {
        type: String,
        enum: ['searching', 'negotiating', 'confirmed', 'completed', 'cancelled'],
        default: 'searching'
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600 // Auto-delete abandoned requests after 1 hour (optional cleanup)
    }
});

module.exports = mongoose.model('RideRequest', rideRequestSchema);
