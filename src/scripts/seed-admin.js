const bcrypt = require('bcryptjs');
const User = require('../modules/user/user.model');
const databaseService = require('../configs/database');
const logger = require('../utils/logger');

const seedAdmins = async () => {
    try {
        // Connect to database
        await databaseService.connect();
        logger.info('Connected to database');

        // Admin users to seed
        const admins = [
            {
                email: 'admin@college.edu',
                password: 'admin123',
                name: 'System Administrator',
                role: 'admin'
            }
        ];

        for (const adminData of admins) {
            // Check if admin already exists
            const existingAdmin = await User.findOne({ email: adminData.email });

            if (existingAdmin) {
                logger.info(`Admin already exists: ${adminData.email}`);
                continue;
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(adminData.password, salt);

            // Create admin
            const admin = await User.create({
                ...adminData,
                password: hashedPassword
            });

            logger.info(`✅ Admin created: ${admin.email}`);
            console.log(`   Email: ${adminData.email}`);
            console.log(`   Password: ${adminData.password}`);
            console.log(`   Name: ${adminData.name}`);
            console.log('');
        }

        console.log('✅ Admin seeding completed');
        process.exit(0);
    } catch (err) {
        logger.error('Error seeding admins:', err);
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
};

seedAdmins();

