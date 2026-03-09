require('dotenv').config({ path: './server/.env' });
const { sendWhatsAppMessage } = require('./server/src/services/whatsappService');

async function test() {
    console.log("Testing WhatsApp...");
    const res = await sendWhatsAppMessage('919876543210', 'Test message');
    console.log("Result:", res);
}
test();
