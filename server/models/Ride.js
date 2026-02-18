const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
    riderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    pickupLocation: {
        address: { type: String, required: true },
        coordinates: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], required: true }
        }
    },
    dropLocation: {
        address: { type: String, required: true },
        coordinates: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], required: true }
        }
    },
    distance: {
        type: Number,
        default: 0
    },
    fare: {
        type: Number,
        default: 0
    },
    proposedFare: {
        type: Number,
        default: 0
    },
    negotiatedFare: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['requested', 'negotiating', 'accepted', 'driver_arrived', 'otp_verified', 'on_trip', 'completed', 'cancelled'],
        default: 'requested'
    },
    otp: {
        type: String,
        select: false
    },
    vehicleType: {
        type: String,
        enum: ['bike', 'auto', 'sedan', 'suv'],
        default: 'sedan'
    },
    startTime: {
        type: Date,
        default: null
    },
    endTime: {
        type: Date,
        default: null
    },
    routeCoordinates: [{
        lat: Number,
        lng: Number,
        timestamp: { type: Date, default: Date.now }
    }],
    rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null
    },
    cancelReason: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

rideSchema.index({ riderId: 1, createdAt: -1 });
rideSchema.index({ driverId: 1, createdAt: -1 });
rideSchema.index({ status: 1 });

module.exports = mongoose.model('Ride', rideSchema);
