const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

async function diagnose() {
    let output = '';
    const log = (msg) => {
        console.log(msg);
        output += msg + '\n';
    };

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const User = require('./src/models/User');
        const WalletTransaction = require('./src/models/WalletTransaction');
        const Payment = require('./src/models/Payment');

        const user = await User.findOne({ name: 'Customer' });
        if (!user) {
            log('User not found');
            return;
        }

        log(`--- Diagnosing User: ${user.name} (${user._id}) ---`);
        log(`Balance: ${user.walletBalance}`);

        const payments = await Payment.find({ riderId: user._id });
        log(`Payments found: ${payments.length}`);
        payments.forEach(p => {
            log(`- Payment: ID=${p._id}, RideID=${p.rideId}, Amount=${p.amount}, Method=${p.method}, Cashback=${p.cashback}`);
        });

        const transactions = await WalletTransaction.find({ userId: user._id });
        log(`Transactions found: ${transactions.length}`);
        transactions.forEach(t => {
            log(`- Trans: Type=${t.type}, Amount=${t.amount}, Source=${t.source}, Status=${t.status}, Ref=${t.referenceId}, Desc=${t.description}`);
        });

        const creditSum = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
        const debitSum = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
        log(`Summary: Credits=${creditSum}, Debits=${debitSum}, Calculated Balance=${creditSum - debitSum}`);
        log(`Mismatch: ${user.walletBalance - (creditSum - debitSum)}`);

    } catch (err) {
        log('Error: ' + err.toString());
    } finally {
        await mongoose.disconnect();
        fs.writeFileSync('diagnose_log.txt', output);
    }
}

diagnose();
