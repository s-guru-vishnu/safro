const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const OTP = require('../models/OTP');
const User = require('../models/User');
const { sendSMS } = require('../services/smsService');
const { sendOTPEmail } = require('../services/notificationService');
const jwt = require('jsonwebtoken');

// Generate 4-digit OTP
const generateOTP = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};

// @desc    Send OTP to phone
// @route   POST /api/auth/send-otp
const sendOTP = async (req, res, next) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({ message: 'Phone number is required' });
        }

        // Rate limiting: Check if an OTP was sent recently (within 60s)
        const recentOTP = await OTP.findOne({
            phone,
            createdAt: { $gt: new Date(Date.now() - 60 * 1000) }
        });

        if (recentOTP) {
            return res.status(429).json({ message: 'Please wait 60 seconds before resending OTP' });
        }

        const otp = generateOTP();
        const hashedOTP = await bcrypt.hash(otp, 10);

        // Delete any existing OTPs for this phone to prevent duplicates
        await OTP.deleteMany({ phone });

        // Save new OTP
        await OTP.create({
            phone,
            otp: hashedOTP,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 mins
        });

        // Send SMS (Standard)
        const message = `Your Safro verification OTP is ${otp}. Valid for 5 minutes.`;
        await sendSMS(phone, message);

        // Also send Email if user exists and has email
        const user = await User.findOne({ phone });
        if (user && user.email) {
            sendOTPEmail(user, otp, 'Verification');
        }

        res.json({ message: 'OTP sent successfully', phone });
    } catch (error) {
        next(error);
    }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
const verifyOTP = async (req, res, next) => {
    try {
        const { phone, otp } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({ message: 'Phone and OTP are required' });
        }

        const otpRecord = await OTP.findOne({ phone });

        if (!otpRecord) {
            return res.status(400).json({ message: 'OTP expired or not found' });
        }

        if (otpRecord.attempts >= 5) {
            await OTP.deleteOne({ _id: otpRecord._id });
            return res.status(400).json({ message: 'Too many failed attempts. Please request a new OTP.' });
        }

        const isMatch = await bcrypt.compare(otp, otpRecord.otp);

        if (!isMatch) {
            otpRecord.attempts += 1;
            await otpRecord.save();
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // OTP Valid - Delete record
        await OTP.deleteOne({ _id: otpRecord._id });

        // Check if user exists with this phone
        let user = await User.findOne({ phone });
        let isNewUser = false;

        // Optionally create a user here or just return verification status
        // For now, we'll return a token if user exists, otherwise indicate they need to register

        let token = null;
        if (user) {
            token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        } else {
            isNewUser = true;
        }

        res.json({
            message: 'OTP verified successfully',
            verified: true,
            isNewUser,
            token,
            user: user ? {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            } : null
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
const resendOTP = async (req, res, next) => {
    // Reuse sendOTP logic as it already handles cooldown and regeneration
    return sendOTP(req, res, next);
};

module.exports = { sendOTP, verifyOTP, resendOTP };
