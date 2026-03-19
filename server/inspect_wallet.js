const mongoose = require('mongoose');
require('dotenv').config();

async function inspect() {
    await mongoose.connect(process.env.MONGODB_URI);
    const User = require('./src/models/User');
    const WalletTransaction = require('./src/models/WalletTransaction');

    const user = await User.findOne({ name: 'Customer' });
    console.log(`User: ${user.name}, Balance: ${user.walletBalance}`);
    
    const trans = await WalletTransaction.find({ userId: user._id });
    console.log(`Found ${trans.length} transactions:`);
    trans.forEach(t => {
        console.log(`- Type: ${t.type}, Amount: ${t.amount}, Source: ${t.source}, Status: ${t.status}, Desc: ${t.description}`);
    });

    await mongoose.disconnect();
}

inspect();
