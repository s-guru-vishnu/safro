const mongoose = require('mongoose');
require('dotenv').config();

async function checkPayments() {
    await mongoose.connect(process.env.MONGODB_URI);
    const Payment = require('./src/models/Payment');
    const User = require('./src/models/User');

    const user = await User.findOne({ name: 'Customer' });
    if (user) {
        const payments = await Payment.find({ riderId: user._id });
        console.log(`Found ${payments.length} payments for user:`);
        payments.forEach(p => {
            console.log(`- Amount: ${p.amount}, Method: ${p.method}, Cashback: ${p.cashback}, Date: ${p.createdAt}`);
        });
    }

    await mongoose.disconnect();
}

checkPayments();
