const mongoose = require('mongoose');
require('dotenv').config();

async function backfill() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const User = require('./src/models/User');
        const WalletTransaction = require('./src/models/WalletTransaction');
        const Payment = require('./src/models/Payment');
        const Ride = require('./src/models/Ride');

        const payments = await Payment.find();
        console.log(`Analyzing ${payments.length} payment records...`);

        let createdCount = 0;

        for (const p of payments) {
            // 1. Check for missing debit if payment was via wallet
            if (p.method === 'wallet') {
                const existingDebit = await WalletTransaction.findOne({ 
                    userId: p.riderId, 
                    referenceId: p.rideId.toString(), 
                    type: 'debit' 
                });
                
                if (!existingDebit) {
                    await WalletTransaction.create({
                        userId: p.riderId,
                        amount: p.amount,
                        type: 'debit',
                        source: 'ride',
                        status: 'completed',
                        referenceId: p.rideId.toString(),
                        description: `Ride Payment - ${p.rideId.toString().slice(-6)}`
                    });
                    createdCount++;
                }
            }

            // 2. Check for missing cashback credit
            if (p.cashback > 0) {
                const existingCredit = await WalletTransaction.findOne({ 
                    userId: p.riderId, 
                    referenceId: p.rideId.toString(), 
                    type: 'credit',
                    description: 'Cashback'
                });

                if (!existingCredit) {
                    await WalletTransaction.create({
                        userId: p.riderId,
                        amount: p.cashback,
                        type: 'credit',
                        source: 'ride',
                        status: 'completed',
                        referenceId: p.rideId.toString(),
                        description: 'Cashback'
                    });
                    createdCount++;
                }
            }
        }

        console.log(`Backfill complete. Created ${createdCount} transaction records.`);

        // Final sync: Log any remaining balance mismatches for the developer
        const users = await User.find();
        for (const user of users) {
            const trans = await WalletTransaction.find({ userId: user._id });
            const creditSum = trans.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
            const debitSum = trans.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);
            const diff = user.walletBalance - (creditSum - debitSum);
            
            if (Math.abs(diff) > 0.1) {
                console.warn(`[Sync Warning] User ${user.name} (${user.email}): Balance ${user.walletBalance} vs History ${creditSum - debitSum}. Diff: ${diff}`);
            }
        }

    } catch (err) {
        console.error('Backfill Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

backfill();
