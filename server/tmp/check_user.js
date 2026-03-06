const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({ email: /guruv0707/i });
        console.log('Matching Users:', users.length);
        users.forEach(u => {
            console.log(`- Name: ${u.name}, Email: "${u.email}", Phone: "${u.phone}"`);
        });
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkUser();
