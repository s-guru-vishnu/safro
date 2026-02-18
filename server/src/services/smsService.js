const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

const sendSMS = async (phone, message) => {
    if (!client) {
        console.warn('⚠️ Twilio not configured - SMS simulation only');
        console.log(`[SMS to ${phone}]: ${message}`);
        return { sid: 'mock-sid', status: 'sent' };
    }

    try {
        const response = await client.messages.create({
            body: message,
            from: twilioPhone,
            to: phone
        });
        return response;
    } catch (error) {
        console.error('Twilio SMS Error:', error);
        throw new Error('Failed to send SMS');
    }
};

module.exports = { sendSMS };
