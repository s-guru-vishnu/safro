const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../src/models/User');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const admins = [
    {
        name: 'Admin Perur',
        email: 'admin@perur.com',
        password: 'Perur@2026',
        role: 'admin',
        phone: '1234567890'
    },
    {
        name: 'Admin Sulur',
        email: 'admin@sulur.com',
        password: 'Sulur@2026',
        role: 'admin',
        phone: '1234567891'
    }
];

const seedAdmins = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/safro';
        await mongoose.connect(mongoUri);
        console.log('MongoDB Connected...');

        for (const adminData of admins) {
            const existingUser = await User.findOne({ email: adminData.email });
            if (!existingUser) {
                await User.create(adminData);
                console.log(`Admin created: ${adminData.email}`);
            } else {
                console.log(`Admin already exists: ${adminData.email}`);
            }
        }

        console.log('\nAdmin seeding completed! 🚀');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding admins:', err);
        process.exit(1);
    }
};

seedAdmins();
