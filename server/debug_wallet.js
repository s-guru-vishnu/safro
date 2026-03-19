const mongoose = require('mongoose');
const User = require('./src/models/User');
const WalletTransaction = require('./src/models/WalletTransaction');
require('dotenv').config();

async function debug() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const users = await User.find({ walletBalance: { $gt: 0 } });
    for (const user of users) {
        console.log(`User: ${user.name} (${user.email}), Balance: ${user.walletBalance}`);
        const trans = await WalletTransaction.find({ userId: user._id });
        console.log(`Transactions (${trans.length}):`);
        trans.forEach(t => console.log(`  - ${t.type}: ${t.amount} (${t.description}) - ${t.createdAt}`));
        
        const creditSum = trans.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
        const debitSum = trans.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);
        console.log(`  Calc Balance: ${creditSum - debitSum}`);
        console.log(`  Mismatch: ${user.walletBalance - (creditSum - debitSum)}`);
    }

    await mongoose.disconnect();
}

debug();
