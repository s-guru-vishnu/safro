const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: 50
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        // Password is required only if googleId is not present
        required: function () { return !this.googleId; },
        minlength: 6,
        select: false
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    phone: {
        type: String,
        required: false,
        trim: true
    },
    role: {
        type: String,
        enum: ['rider', 'driver', 'admin'],
        default: 'rider'
    },
    guardianPhone: {
        type: String,
        trim: true
    },
    guardianEmail: {
        type: String,
        trim: true
    },
    profileImage: {
        type: String,
        default: ''
    },
    isSuspended: {
        type: Boolean,
        default: false
    },
    negotiationScore: {
        type: Number,
        default: 100,
        min: 0,
        max: 100
    },
    activeRideId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ride',
        default: null
    },
    // Admin region for geo-based driver verification assignment
    adminRegion: {
        center: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], default: [0, 0] } // [lng, lat]
        },
        radiusKm: { type: Number, default: 50 }
    },
    walletBalance: {
        type: Number,
        default: 0
    },
    quickPayEnabled: {
        type: Boolean,
        default: false
    },
    defaultPaymentMethod: {
        type: String,
        enum: ['wallet', 'razorpay', 'cash'],
        default: 'cash'
    },
    taluk: {
        type: String,
        trim: true,
        default: ''
    }
}, {
    timestamps: true
});

// Geo index for admin region lookups
userSchema.index({ 'adminRegion.center': '2dsphere' });

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
