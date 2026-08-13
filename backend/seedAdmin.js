const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const dns = require('dns');
const Admin = require('./models/Admin');

// Force Google DNS for Mobile Hotspot connections
dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB Atlas...');

        const targetEmail = 'casayrpodcast@gmail.com';
        const targetPassword = '7452';

        const existingAdmin = await Admin.findOne({ email: targetEmail });
        if (existingAdmin) {
            console.log('⚠️ Admin account already exists!');
            process.exit(0);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(targetPassword, salt);

        await Admin.create({
            first_name: 'System',
            mid_name: '',
            last_name: 'Admin',
            email: targetEmail,
            password_hash: hashedPassword
        });

        console.log('\n✅ SUCCESS: Admin account created successfully!');
        console.log('------------------------------------------');
        console.log(`EMAIL:    ${targetEmail}`);
        console.log(`PASSWORD: ${targetPassword}`);
        console.log('------------------------------------------\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin:', error.message);
        process.exit(1);
    }
};

seedAdmin();