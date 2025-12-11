const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const adminEmail = 'admin@gmail.com';
        const adminPassword = 'admin123';

        let admin = await User.findOne({ email: adminEmail });

        if (admin) {
            console.log('Admin user already exists. Updating password...');
            admin.password = adminPassword; // Pre-save hook will hash this
            await admin.save();
            console.log('Admin password updated to default.');
        } else {
            admin = new User({
                name: 'Admin',
                email: adminEmail,
                password: adminPassword,
                role: 'admin'
            });
            await admin.save();
            console.log('Admin user created successfully');
        }

        mongoose.disconnect();
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
