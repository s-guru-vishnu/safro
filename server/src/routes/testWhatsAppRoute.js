const express = require('express');
const router = express.Router();
const { sendWhatsAppMessage } = require('../services/whatsappService');

/**
 * @route   GET /api/test/whatsapp
 * @desc    Test WhatsApp delivery via Meta Graph API
 * @access  Public (for testing only)
 */
router.get('/', async (req, res) => {
    try {
        const { phone } = req.query;

        if (!phone) {
            return res.status(400).json({ error: 'Please provide a valid phone number via ?phone= query parameter (e.g. ?phone=919876543210)' });
        }

        const msg = `Safro 🚗\n\nWhatsApp messaging system working successfully!`;
        const result = await sendWhatsAppMessage(phone, msg);

        if (result) {
            res.json({ success: true, message: `WhatsApp message sent to ${phone}`, result });
        } else {
            res.status(500).json({ success: false, error: 'Failed to send WhatsApp message. Check server logs.' });
        }

    } catch (error) {
        console.error('Test WhatsApp Error:', error);
        res.status(500).json({ error: 'WhatsApp test failed' });
    }
});

module.exports = router;
