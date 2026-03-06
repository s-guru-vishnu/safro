/**
 * Test Email Route
 * GET /api/test/email — Sends a test email to verify configuration
 */

const express = require('express');
const router = express.Router();
const { sendEmail } = require('../services/emailService');

router.get('/email', async (req, res) => {
    try {
        const testRecipient = process.env.EMAIL_USER; // Send to self for testing

        if (!testRecipient) {
            return res.status(400).json({
                success: false,
                message: 'EMAIL_USER not configured in .env'
            });
        }

        const result = await sendEmail(
            testRecipient,
            '🧪 Safro Test Email — Configuration Verified',
            `
            <!DOCTYPE html>
            <html>
            <body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
            <tr><td align="center">
            <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
                <tr><td style="background:linear-gradient(135deg,#0f172a,#1e293b);padding:32px;text-align:center;">
                    <h1 style="margin:0;color:#fff;font-size:22px;">✅ Email Works!</h1>
                </td></tr>
                <tr><td style="padding:32px;text-align:center;">
                    <p style="color:#334155;font-size:15px;margin:0 0 8px;">Safro email notifications are configured correctly.</p>
                    <p style="color:#94a3b8;font-size:12px;margin:0;">Sent at: ${new Date().toLocaleString('en-IN')}</p>
                </td></tr>
                <tr><td style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
                    <p style="margin:0;color:#94a3b8;font-size:11px;">Safro — Where the Price is Yours to Decide</p>
                </td></tr>
            </table>
            </td></tr>
            </table>
            </body>
            </html>`
        );

        if (result.success) {
            res.json({ success: true, message: `Test email sent to ${testRecipient}`, messageId: result.messageId });
        } else {
            res.status(500).json({ success: false, message: 'Email failed', error: result.error });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
