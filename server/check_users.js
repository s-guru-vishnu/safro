const mongoose = require('mongoose');
require('dotenv').config();

async function checkUsers() {
    await mongoose.connect(process.env.MONGODB_URI);
    const User = require('./src/models/User');
    const users = await User.find({ name: 'Customer' });
    console.log(`Found ${users.length} users with name 'Customer':`);
    users.forEach(u => {
        console.log(`- ID: ${u._id}, Email: ${u.email}, Balance: ${u.walletBalance}`);
    });
    await mongoose.disconnect();
}

checkUsers();
