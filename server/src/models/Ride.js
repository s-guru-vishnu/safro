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
    negotiatingDriverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    pickupLocation: {
        address: { type: String, required: true },
        coordinates: {
            lat: { type: Number, required: true },
            lng: { type: Number, required: true }
        }
    },
    pickupGeo: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] }
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
    negotiatedFare: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['pending', 'negotiating', 'confirmed', 'ongoing', 'completed', 'cancelled'],
        default: 'pending'
    },
    distance: { type: String },
    duration: { type: String },
    distanceKm: { type: Number, default: 0 },
    estimatedDuration: { type: Number, default: 0 },
    otp: { type: String },
    failureCount: { type: Number, default: 0 },
    cancelledBy: {
        type: String,
        enum: ['rider', 'driver', 'system', null],
        default: null
    },
    aiPrediction: {
        minFare: { type: Number },
        suggestedFare: { type: Number },
        maxFare: { type: Number },
        reasoning: { type: String },
        source: { type: String, enum: ['ai', 'algorithm'], default: 'algorithm' }
    },
    fraudFlag: {
        flagged: { type: Boolean, default: false },
        riskScore: { type: Number, default: 0 },
        reasons: [{ type: String }]
    },
    paymentMethod: {
        type: String,
        enum: ['razorpay', 'cash', 'wallet']
    },
    platformCommission: {
        type: Number,
        default: 0
    },
    driverAmount: {
        type: Number,
        default: 0
    },
    paidAt: {
        type: Date
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Driver Confirmation', 'Paid', 'Failed'],
        default: 'Pending'
    },
    driverConfirmed: {
        type: Boolean,
        default: false
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    review: {
        type: String
    },
    razorpayOrderId: {
        type: String,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

rideSchema.index({ pickupGeo: '2dsphere' });
rideSchema.index({ riderId: 1, status: 1 });
rideSchema.index({ driverId: 1, status: 1 });
rideSchema.index({ negotiatingDriverId: 1, status: 1 });

module.exports = mongoose.model('Ride', rideSchema);
