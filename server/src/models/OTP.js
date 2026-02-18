const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const otpSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: true,
        trim: true
    },
    otp: {
        type: String,
        required: true
    },
    attempts: {
        type: Number,
        default: 0
    },
    expiresAt: {
        type: Date,
        required: true,
        default: () => Date.now() + 5 * 60 * 1000 // 5 minutes
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
