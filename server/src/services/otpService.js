/**
 * OTP Service — Business Logic Layer
 * 
 * Handles OTP generation, storage (hashed), SMS delivery, and verification.
 * Separated from the controller for reusability and testability.
 */

const bcrypt = require('bcryptjs');
const OTP = require('../models/OTP');
const generateOTP = require('../utils/generateOTP');
const { sendWhatsAppMessage } = require('./whatsappService');

const OTP_EXPIRY = parseInt(process.env.OTP_EXPIRY_MINUTES) || 5;

/**
 * Generate, store (hashed), and send OTP via SMS
 * @param {string} phoneNumber - E.164 format phone number
 * @returns {{ success: boolean, message: string }}
 */
const sendOTPToPhone = async (phoneNumber) => {
    // Rate limit: max 3 OTPs per 10 minutes per phone
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentCount = await OTP.countDocuments({
        phone: phoneNumber,
        createdAt: { $gt: tenMinutesAgo }
    });

    if (recentCount >= 3) {
        return { success: false, message: 'Too many OTP requests. Please try again after 10 minutes.', statusCode: 429 };
    }

    // Cooldown: 60s between requests
    const recentOTP = await OTP.findOne({
        phone: phoneNumber,
        createdAt: { $gt: new Date(Date.now() - 60 * 1000) }
    });
    if (recentOTP) {
        return { success: false, message: 'Please wait 60 seconds before requesting again.', statusCode: 429 };
    }

    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);

    // Delete any existing OTPs for this phone
    await OTP.deleteMany({ phone: phoneNumber });

    // Save new hashed OTP
    await OTP.create({
        phone: phoneNumber,
        otp: hashedOTP,
        expiresAt: new Date(Date.now() + OTP_EXPIRY * 60 * 1000)
    });

    // Send WhatsApp (non-blocking)
    const whatsappMessage = `🔐 Safro OTP Verification\n\nYour OTP is: ${otp}\n\nValid for ${OTP_EXPIRY} minutes.\nDo not share this code with anyone.`;
    await sendWhatsAppMessage(phoneNumber, whatsappMessage);

    return { success: true, message: 'OTP sent successfully', otp }; // otp returned for email fallback
};

/**
 * Verify an OTP for a phone number
 * @param {string} phoneNumber
 * @param {string} otp - Plain text OTP to verify
 * @returns {{ success: boolean, message: string }}
 */
const verifyOTPForPhone = async (phoneNumber, otp) => {
    const otpRecord = await OTP.findOne({ phone: phoneNumber });

    if (!otpRecord) {
        return { success: false, message: 'OTP expired or not found' };
    }

    // Max 5 attempts
    if (otpRecord.attempts >= 5) {
        await OTP.deleteOne({ _id: otpRecord._id });
        return { success: false, message: 'Too many failed attempts. Please request a new OTP.' };
    }

    const isMatch = await bcrypt.compare(otp, otpRecord.otp);

    if (!isMatch) {
        otpRecord.attempts += 1;
        await otpRecord.save();
        return { success: false, message: 'Invalid OTP' };
    }

    // OTP verified — mark and delete
    await OTP.deleteOne({ _id: otpRecord._id });

    return { success: true, message: 'OTP verified successfully' };
};

module.exports = { sendOTPToPhone, verifyOTPForPhone };
