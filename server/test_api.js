const axios = require('axios');
require('dotenv').config();

async function testApi() {
    try {
        // We need a token. I'll get it from the user's environment or just use the DB directly to simulate the API response.
        const mongoose = require('mongoose');
        await mongoose.connect(process.env.MONGODB_URI);
        const User = require('./src/models/User');
        const WalletTransaction = require('./src/models/WalletTransaction');

        const user = await User.findOne({ name: 'Customer' });
        const transactions = await WalletTransaction.find({ userId: user._id }).sort({ createdAt: -1 });
        
        console.log('API Response Simulation:');
        console.log(JSON.stringify({ transactions }, null, 2));

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

testApi();
