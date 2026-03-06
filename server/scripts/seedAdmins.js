const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../src/models/User');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const admins = [
    {
        name: 'Admin Perur',
        email: 'admin.perur2026@gmail.com',
        password: 'Perur@2026',
        role: 'admin',
        phone: '1234567890'
    },
    {
        name: 'Admin Annur',
        email: 'admin.annur2026@gmail.com',
        password: 'Annur@2026',
        role: 'admin',
        phone: '1234567901'
    },
    {
        name: 'Admin Anaimalai',
        email: 'admin.anaimalai2026@gmail.com',
        password: 'Anaimalai@2026',
        role: 'admin',
        phone: '1234567902'
    },
    {
        name: 'Admin Coimbatore North',
        email: 'admin.coimbatorenorth2026@gmail.com',
        password: 'CoimbatoreNorth@2026',
        role: 'admin',
        phone: '1234567903'
    },
    {
        name: 'Admin Coimbatore South',
        email: 'admin.coimbatoresouth2026@gmail.com',
        password: 'CoimbatoreSouth@2026',
        role: 'admin',
        phone: '1234567904'
    },
    {
        name: 'Admin Kinathukadavu',
        email: 'admin.kinathukadavu2026@gmail.com',
        password: 'Kinathukadavu@2026',
        role: 'admin',
        phone: '1234567905'
    },
    {
        name: 'Admin Madukkarai',
        email: 'admin.madukkarai2026@gmail.com',
        password: 'Madukkarai@2026',
        role: 'admin',
        phone: '1234567906'
    },
    {
        name: 'Admin Mettupalayam',
        email: 'admin.mettupalayam2026@gmail.com',
        password: 'Mettupalayam@2026',
        role: 'admin',
        phone: '1234567907'
    },
    {
        name: 'Admin Pollachi',
        email: 'admin.pollachi2026@gmail.com',
        password: 'Pollachi@2026',
        role: 'admin',
        phone: '1234567908'
    },
    {
        name: 'Admin Sulur',
        email: 'admin.sulur2026@gmail.com',
        password: 'Sulur@2026',
        role: 'admin',
        phone: '1234567909'
    },
    {
        name: 'Admin Valparai',
        email: 'admin.valparai2026@gmail.com',
        password: 'Valparai@2026',
        role: 'admin',
        phone: '1234567910'
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
                console.log(`✅ Admin created: ${adminData.email}`);
            } else {
                console.log(`⚠️  Admin already exists: ${adminData.email}`);
            }
        }

        console.log('\n========================================');
        console.log('  Admin Credentials');
        console.log('========================================');
        for (const admin of admins) {
            console.log(`  ${admin.name}`);
            console.log(`    Email:    ${admin.email}`);
            console.log(`    Password: ${admin.password}`);
            console.log('');
        }
        console.log('========================================');
        console.log('Admin seeding completed! 🚀');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding admins:', err);
        process.exit(1);
    }
};

seedAdmins();
