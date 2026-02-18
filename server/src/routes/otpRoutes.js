const express = require('express');
const router = express.Router();
const { sendOTP, verifyOTP, resendOTP } = require('../controllers/otpController');

// POST /api/auth/send-otp
router.post('/send-otp', sendOTP);

// POST /api/auth/verify-otp
router.post('/verify-otp', verifyOTP);

// POST /api/auth/resend-otp
router.post('/resend-otp', resendOTP);

module.exports = router;
