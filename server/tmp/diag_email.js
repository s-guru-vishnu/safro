const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');
const OTP = require('../src/models/OTP');
const { sendEmail } = require('../src/services/emailService');

async function diagnostic() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check if EMAIL_USER is set
        console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not Set');
        console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'Not Set');

        // Check recent OTPs
        const recentOTPs = await OTP.find().sort({ createdAt: -1 }).limit(5);
        console.log('Recent OTPs count:', recentOTPs.length);
        recentOTPs.forEach(otp => {
            console.log(`- ID: ${otp.phone}, Created: ${otp.createdAt}`);
        });

        // Test sendEmail if EMAIL_USER is set
        if (process.env.EMAIL_USER) {
            console.log('Attempting to send a test email to', process.env.EMAIL_USER);
            const res = await sendEmail(process.env.EMAIL_USER, 'Safro Diagnostics', 'This is a test email.');
            console.log('SendEmail Result:', res);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Diagnostic error:', err);
    }
}

diagnostic();
