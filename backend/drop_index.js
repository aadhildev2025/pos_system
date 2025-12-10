const mongoose = require('mongoose');
require('dotenv').config();

const dropIndex = async () => {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pos_system');
        console.log('Connected.');

        const collection = mongoose.connection.collection('products');

        console.log('Listing indexes...');
        const indexes = await collection.indexes();
        console.log('Current indexes:', indexes);

        try {
            console.log('Attempting to drop sku_1 index...');
            await collection.dropIndex('sku_1');
            console.log('SUCCESS: Dropped sku_1 index.');
        } catch (err) {
            console.log('Index sku_1 might not exist or verify name:', err.message);
        }

        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

dropIndex();
