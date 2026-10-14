import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const createAccounts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/online-learning');
    
    const adminPass = await bcrypt.hash('admin123', 10);
    const instPass = await bcrypt.hash('instructor123', 10);

    await mongoose.connection.collection('users').updateOne(
      { email: 'admin@learnhub.com' },
      {
        $set: {
          name: 'Platform Admin',
          email: 'admin@learnhub.com',
          password: adminPass,
          role: 'admin',
          isTwoFactorEnabled: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    await mongoose.connection.collection('users').updateOne(
      { email: 'instructor@learnhub.com' },
      {
        $set: {
          name: 'Alex Rivera',
          email: 'instructor@learnhub.com',
          password: instPass,
          role: 'instructor',
          isTwoFactorEnabled: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    console.log('SUCCESS: Admin and Instructor accounts created successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Failed to create accounts:', err);
    process.exit(1);
  }
};

createAccounts();
