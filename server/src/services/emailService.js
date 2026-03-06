/**
 * Email Service — Nodemailer Gmail SMTP
 * 
 * Centralized email transport using connection pooling.
 * All email operations are non-blocking and never crash the server.
 */

const nodemailer = require('nodemailer');

// Create reusable transporter with connection pooling
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true for 465, false for other ports
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    auth: {
        user: (process.env.EMAIL_USER || '').trim(),
        pass: (process.env.EMAIL_PASS || '').trim()
    }
});

// Verify transport on startup (non-blocking)
transporter.verify()
    .then(() => console.log('📧 Email transport ready (Gmail SMTP)'))
    .catch(err => {
        console.warn('⚠️ Email transport verification failed:');
        console.warn('   Error Code:', err.code);
        console.warn('   Message:', err.message);
        if (err.message.includes('BadCredentials')) {
            console.warn('   👉 TIP: Check your Gmail App Password in .env. Spaces are allowed but trailing spaces will break it.');
        }
    });

/**
 * Send an email. Never throws — logs errors and returns success/failure.
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} htmlContent - HTML body
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
const sendEmail = async (to, subject, htmlContent) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn('[EMAIL] Skipped — EMAIL_USER or EMAIL_PASS not configured');
            return { success: false, error: 'Email not configured' };
        }

        const fromName = process.env.EMAIL_FROM_NAME || 'Safro Ride';

        const info = await transporter.sendMail({
            from: `"${fromName}" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html: htmlContent
        });

        console.log(`[EMAIL] ✅ Sent to ${to} — Subject: "${subject}" — MessageID: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (err) {
        console.error(`[EMAIL] ❌ Failed to send to ${to} — ${err.message}`);
        return { success: false, error: err.message };
    }
};

module.exports = { sendEmail };
