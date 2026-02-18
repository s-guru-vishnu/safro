const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const clearDatabase = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/safro';
        console.log(`Connecting to: ${mongoUri}`);

        await mongoose.connect(mongoUri);
        console.log('MongoDB Connected...');

        const collections = Object.keys(mongoose.connection.collections);
        console.log(`Found collections: ${collections.join(', ')}`);

        for (const collectionName of collections) {
            await mongoose.connection.collections[collectionName].deleteMany({});
            console.log(`Cleared collection: ${collectionName}`);
        }

        console.log('\nDatabase cleared successfully! ✅');
        process.exit(0);
    } catch (err) {
        console.error('Error clearing database:', err);
        process.exit(1);
    }
};

clearDatabase();
