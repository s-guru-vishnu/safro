const axios = require('axios');

/**
 * Send a WhatsApp message using Meta Graph API.
 * This function NEVER throws an error, ensuring non-blocking execution
 * across all ride and payment controllers.
 * 
 * @param {string} phone - Recipient phone number with country code (e.g., "919876543210")
 * @param {string} message - The text content to send
 * @returns {Promise<Object|null>} The API response data, or null on failure
 */
async function sendWhatsAppMessage(phone, message) {
    if (!process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN.includes('xxxx')) {
        console.warn(`[SIMULATED WHATSAPP] To: ${phone} | Message: ${message.substring(0, 30)}...`);
        return { message_id: 'mock-whatsapp-id', status: 'simulated' };
    }

    const url = `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION || 'v19.0'}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

    // Ensure phone is just numbers for Meta API (remove '+' if present)
    let formattedPhone = phone.toString().replace('+', '').trim();

    // Auto-prepend India country code if 10 digits are provided
    if (formattedPhone.length === 10) {
        formattedPhone = '91' + formattedPhone;
    }

    try {
        const response = await axios.post(
            url,
            {
                messaging_product: "whatsapp",
                to: formattedPhone,
                type: "text",
                text: {
                    body: message
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log(`✅ [WhatsApp] Message sent successfully to ${formattedPhone}`);
        return response.data;
    } catch (error) {
        console.error("❌ [WhatsApp FAILED] Error:", error.response?.data || error.message);
        console.log(`[FALLBACK OTP LOG] To: ${formattedPhone} | Message: ${message}`);
        // We explicitly return null and NEVER throw to prevent transaction rollbacks/app crashes
        return null;
    }
}

module.exports = {
    sendWhatsAppMessage
};
