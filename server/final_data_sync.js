const mongoose = require('mongoose');
require('dotenv').config();

async function sync() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const User = require('./src/models/User');
        const WalletTransaction = require('./src/models/WalletTransaction');
        const Payment = require('./src/models/Payment');

        console.log('--- Starting Final Data Sync ---');

        const payments = await Payment.find({ status: 'completed' });
        let fixes = 0;

        for (const p of payments) {
            // 1. Credit Cashback if missing
            if (p.cashback > 0) {
                const existing = await WalletTransaction.findOne({
                    userId: p.riderId,
                    referenceId: p.rideId.toString(),
                    type: 'credit',
                    description: 'Cashback'
                });

                if (!existing) {
                    await WalletTransaction.create({
                        userId: p.riderId,
                        amount: p.cashback,
                        type: 'credit',
                        source: 'ride',
                        status: 'completed',
                        referenceId: p.rideId.toString(),
                        description: 'Cashback'
                    });
                    fixes++;
                    console.log(`- Added missing ${p.cashback} cashback for Ride: ${p.rideId}`);
                }
            }

            // 2. Debit Ride if method was wallet and missing
            if (p.method === 'wallet') {
                const existing = await WalletTransaction.findOne({
                    userId: p.riderId,
                    referenceId: p.rideId.toString(),
                    type: 'debit'
                });

                if (!existing) {
                    await WalletTransaction.create({
                        userId: p.riderId,
                        amount: p.amount,
                        type: 'debit',
                        source: 'ride',
                        status: 'completed',
                        referenceId: p.rideId.toString(),
                        description: `Ride Payment - ${p.rideId.toString().slice(-6)}`
                    });
                    fixes++;
                    console.log(`- Added missing ${p.amount} debit for Ride: ${p.rideId}`);
                }
            }
        }

        console.log(`Sync complete. Applied ${fixes} fixes.`);

    } catch (err) {
        console.error('Sync Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

sync();
