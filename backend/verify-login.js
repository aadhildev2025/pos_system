const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const verifyLogin = async () => {
    try {
        // Connect to the EXACT same DB as db.js
        await mongoose.connect('mongodb://localhost:27017/pos_system');
        console.log('Connected to MongoDB (pos_system)');

        const email = 'admin@gmail.com';
        const password = 'admin123';

        const user = await User.findOne({ email });
        if (!user) {
            console.log('❌ User not found:', email);
            // List all users to see what's there
            const users = await User.find({});
            console.log('Available users:', users.map(u => u.email));
            process.exit(1);
        }
        console.log('✅ User found:', user.email);
        console.log('Stored hash:', user.password);

        const isMatch = await user.comparePassword(password);
        if (isMatch) {
            console.log('✅ Password match! Login should work.');
        } else {
            console.log('❌ Password mismatch!');
            console.log('Input password:', password);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

verifyLogin();
