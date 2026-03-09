const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const OTP_EXPIRY = parseInt(process.env.OTP_EXPIRY_MINUTES) || 5;

const otpSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    otp: {
        type: String,
        required: true
    },
    attempts: {
        type: Number,
        default: 0
    },
    verified: {
        type: Boolean,
        default: false
    },
    expiresAt: {
        type: Date,
        required: true,
        default: () => Date.now() + OTP_EXPIRY * 60 * 1000
    }
}, {
    timestamps: true
});

// TTL Index: automatically delete document after expiry
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to verify OTP
otpSchema.methods.verifyOTP = async function (candidateOTP) {
    return await bcrypt.compare(candidateOTP, this.otp);
};

module.exports = mongoose.model('OTP', otpSchema);
