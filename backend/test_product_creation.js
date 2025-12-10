const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

const testDB = async () => {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pos_system');
        console.log('Connected.');

        const newProduct = new Product({
            name: 'Test Product ' + Date.now(),
            description: 'Test Description',
            price: 100,
            quantity: 10,
            category: 'Test',
            supplier: 'Test Supplier',
            costPrice: 50
        });

        console.log('Saving product...');
        await newProduct.save();
        console.log('Product saved successfully:', newProduct);
        process.exit(0);
    } catch (error) {
        console.error('CRASH TEST FAILED:', error);
        process.exit(1);
    }
};

testDB();
