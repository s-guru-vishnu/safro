const mongoose = require('mongoose');

const driverApplicationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // ── Step 1: Personal Details ──────────────────────────────
    profilePhoto: {
        type: String,
        default: ''
    },

    // ── Step 2: License Details ───────────────────────────────
    licenseNumber: {
        type: String,
        required: [true, 'License number is required'],
        trim: true
    },
    dateOfBirth: {
        type: Date,
        required: [true, 'Date of birth is required']
    },
    licenseExpiry: {
        type: Date,
        required: [true, 'License expiry date is required']
    },
    licenseImage: {
        type: String,
        default: ''
    },

    // ── Step 3: Aadhaar ──────────────────────────────────────
    aadhaarNumber: {
        type: String,
        trim: true,
        default: ''
    },
    aadhaarImage: {
        type: String,
        default: ''
    },

    // ── Step 4: Vehicle Details ──────────────────────────────
    vehicleType: {
        type: String,
        enum: ['car', 'bike', 'auto'],
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
    manufacturingYear: {
        type: Number,
        default: null
    },

    // ── Step 5: Insurance & RC ───────────────────────────────
    insurancePolicyNumber: {
        type: String,
        trim: true,
        default: ''
    },
    insuranceExpiry: {
        type: Date,
        default: null
    },
    insuranceDocument: {
        type: String,
        default: ''
    },
    rcNumber: {
        type: String,
        trim: true,
        default: ''
    },
    rcDocument: {
        type: String,
        default: ''
    },

    // ── Application Info ─────────────────────────────────────
    city: {
        type: String,
        trim: true,
        default: ''
    },
    address: {
        type: String,
        trim: true,
        default: ''
    },
    status: {
        type: String,
        enum: ['pending', 'under_review', 'meeting_scheduled', 'approved', 'rejected'],
        default: 'pending'
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    meeting: {
        scheduledDate: { type: Date, default: null },
        location: { type: String, default: '' },
        notes: { type: String, default: '' },
        completed: { type: Boolean, default: false }
    },
    adminNotes: {
        type: String,
        default: ''
    },
    rejectionReason: {
        type: String,
        default: ''
    },
    // Geo-based admin assignment
    homeLocation: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] } // [lng, lat]
    },
    assignedAdminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, {
    timestamps: true
});

driverApplicationSchema.index({ userId: 1 });
driverApplicationSchema.index({ status: 1 });
driverApplicationSchema.index({ city: 1 });

module.exports = mongoose.model('DriverApplication', driverApplicationSchema);
