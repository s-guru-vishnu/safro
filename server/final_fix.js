const mongoose = require('mongoose');
require('dotenv').config();

async function finalFix() {
    await mongoose.connect(process.env.MONGODB_URI);
    const User = require('./src/models/User');
    const WalletTransaction = require('./src/models/WalletTransaction');
    const Payment = require('./src/models/Payment');

    const user = await User.findOne({ name: 'Customer' });
    if (!user) return;

    // We found 2 payments of 550 each. 
    // One razorpay (11 cashback missing)
    // One wallet (550 debit and 11 cashback both missing)
    
    const payments = await Payment.find({ riderId: user._id }).sort({ createdAt: 1 });
    
    for (const p of payments) {
        // Check if transactions exist for these payments
        const existingDebit = await WalletTransaction.findOne({ referenceId: p.rideId.toString(), type: 'debit' });
        const existingCredit = await WalletTransaction.findOne({ referenceId: p.rideId.toString(), type: 'credit', description: 'Cashback' });

        if (p.method === 'wallet' && !existingDebit) {
            console.log(`Adding missing debit for ride ${p.rideId}`);
            await WalletTransaction.create({
                userId: user._id, amount: p.amount, type: 'debit', source: 'ride',
                status: 'completed', referenceId: p.rideId.toString(), description: `Ride Payment - ${p.rideId.toString().slice(-6)}`
            });
        }

        if (p.cashback > 0 && !existingCredit) {
            console.log(`Adding missing cashback for ride ${p.rideId}`);
            await WalletTransaction.create({
                userId: user._id, amount: p.cashback, type: 'credit', source: 'ride',
                status: 'completed', referenceId: p.rideId.toString(), description: 'Cashback'
            });
        }
    }

    console.log('Cleanup complete!');
    await mongoose.disconnect();
}

finalFix();
