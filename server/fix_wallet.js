const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

async function fix() {
    let output = '';
    const log = (msg) => {
        console.log(msg);
        output += msg + '\n';
    };

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        log('Connected to DB');

        const User = require('./src/models/User');
        const WalletTransaction = require('./src/models/WalletTransaction');
        const Ride = require('./src/models/Ride');

        const user = await User.findOne({ 
            $or: [{ name: 'Customer' }, { email: /kit28/ }] 
        });
        
        if (!user) {
            log('User not found');
            return;
        }

        log(`Found User: ${user.name}, Balance: ${user.walletBalance}`);

        const trans = await WalletTransaction.find({ userId: user._id });
        const creditSum = trans.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
        const debitSum = trans.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);
        const mismatch = user.walletBalance - (creditSum - debitSum);

        log(`Current transactions count: ${trans.length}`);
        log(`Current transactions sum: ${creditSum - debitSum}`);
        log(`Mismatch: ${mismatch}`);

        if (Math.abs(mismatch - 11) < 0.1) {
            log('Fixing 11 rupee mismatch...');
            const ride = await Ride.findOne({ riderId: user._id, status: 'completed' }).sort({ createdAt: -1 });
            const referenceId = ride ? ride._id.toString() : 'historical_fix';
            
            await WalletTransaction.create({
                userId: user._id,
                amount: 11,
                type: 'credit',
                source: 'ride',
                status: 'completed',
                referenceId,
                description: 'Cashback (System Recovery)'
            });
            log('Transaction created successfully!');
        } else if (mismatch === 0) {
            log('No mismatch found. Already fixed?');
        } else {
            log('Unexpected mismatch amount. Skipping fix.');
        }

    } catch (err) {
        log('ERROR: ' + err.toString());
    } finally {
        await mongoose.disconnect();
        log('Disconnected');
        fs.writeFileSync('wallet_fix_log.txt', output);
    }
}

fix();
