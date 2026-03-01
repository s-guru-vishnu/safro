const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    vehicleType: {
        type: String,
        enum: ['bike', 'auto', 'sedan', 'suv'],
        required: [true, 'Vehicle type is required']
    },
    vehicleModel: {
        type: String,
        trim: true,
        default: ''
    },
    vehicleNumber: {
        type: String,
        required: [true, 'Vehicle number is required'],
        trim: true
    },
    vehicleColor: {
        type: String,
        trim: true,
        default: ''
    },
    licenseNumber: {
        type: String,
        required: [true, 'License number is required'],
        trim: true
    },
    isAvailable: {
        type: Boolean,
        default: false
    },
    currentLocation: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            default: [0, 0]
        }
    },
    rating: {
        type: Number,
        default: 5.0,
        min: 1,
        max: 5
    },
    totalRides: {
        type: Number,
        default: 0
    },
    totalEarnings: {
        type: Number,
        default: 0
    },
    negotiationScore: {
        type: Number,
        default: 100,
        min: 0,
        max: 100
    },
    // Payment & Payouts
    upiId: {
        type: String,
        trim: true
    },
    bankAccount: {
        accountNo: String,
        ifsc: String,
        name: String
    },
    payoutBalance: {
        type: Number,
        default: 0
    },
    taluk: {
        type: String,
        trim: true,
        default: ''
    }
}, {
    timestamps: true
});

// Index for geospatial queries
driverSchema.index({ currentLocation: '2dsphere' });

module.exports = mongoose.model('Driver', driverSchema);
