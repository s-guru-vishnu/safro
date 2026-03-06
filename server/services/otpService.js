const nodemailer = require('nodemailer');
const twilio = require('twilio');

const generateOTP = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};

const sendOTPViaEmail = async (email, otp) => {
    // Placeholder for actual email sending logic
    // Requires SMTP_USER and SMTP_PASS in .env
    console.log(`Sending OTP ${otp} to email ${email}`);

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('SMTP credentials missing. Email not sent.');
        return false;
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        await transporter.sendMail({
            from: `"Safro Support" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Your Safro Verification Code",
            text: `Your OTP for password reset is: ${otp}. It expires in 10 minutes.`,
            html: `<b>Your OTP for password reset is: ${otp}</b><p>It expires in 10 minutes.</p>`
        });
        return true;
    } catch (error) {
        console.error('Email send error:', error);
        return false;
    }
};

const sendOTPViaSMS = async (phone, otp) => {
    // Placeholder for actual SMS sending logic
    // Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
    console.log(`Sending OTP ${otp} to phone ${phone}`);

    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
        console.warn('Twilio credentials missing. SMS not sent.');
        return false;
    }

    try {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await client.messages.create({
            body: `Your Safro verification code is: ${otp}`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phone
        });
        return true;
    } catch (error) {
        console.error('SMS send error:', error);
        return false;
    }
};

module.exports = { generateOTP, sendOTPViaEmail, sendOTPViaSMS };
