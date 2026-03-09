/**
 * OTP Controller
 * 
 * Handles OTP send/verify/resend endpoints.
 * Delegates business logic to otpService.
 */

const User = require('../models/User');
const { sendOTPToPhone, verifyOTPForPhone } = require('../services/otpService');
const { sendOTPEmail } = require('../services/notificationService');
const jwt = require('jsonwebtoken');

// @desc    Send OTP to phone
// @route   POST /api/auth/send-otp
const sendOTP = async (req, res, next) => {
    try {
        const { phone, phoneNumber } = req.body;
        const number = phone || phoneNumber;

        if (!number) {
            return res.status(400).json({ success: false, message: 'Phone number is required' });
        }

        const result = await sendOTPToPhone(number);

        if (!result.success) {
            return res.status(result.statusCode || 400).json({ success: false, message: result.message });
        }



        res.json({ success: true, message: 'OTP sent successfully', phone: number, otp: result.otp });
    } catch (error) {
        next(error);
    }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
const verifyOTP = async (req, res, next) => {
    try {
        const { phone, phoneNumber, otp } = req.body;
        const number = phone || phoneNumber;

        if (!number || !otp) {
            return res.status(400).json({ success: false, message: 'Phone number and OTP are required' });
        }

        const result = await verifyOTPForPhone(number, otp);

        if (!result.success) {
            return res.status(400).json({ success: false, message: result.message });
        }

        // Check if user exists with this phone
        let user = await User.findOne({ phone: number });
        let isNewUser = false;
        let token = null;

        if (user) {
            token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        } else {
            isNewUser = true;
        }

        res.json({
            success: true,
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
    return sendOTP(req, res, next);
};

module.exports = { sendOTP, verifyOTP, resendOTP };
