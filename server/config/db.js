import mongoose from 'mongoose';
import { runAutoSeed } from './seedDataHelper.js';

let mongodInstance = null;

export const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/online-learning';

  try {
    const conn = await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    await runAutoSeed();
  } catch (error) {
    console.warn(`[Database] Primary MongoDB (${primaryUri}) unavailable: ${error.message}`);
    console.log('[Database] Launching embedded development MongoDB engine...');

    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create({
        instance: { dbName: 'online-learning' },
      });
      const memoryUri = mongodInstance.getUri();
      console.log(`[Database] Embedded MongoDB instance active at: ${memoryUri}`);

      const conn = await mongoose.connect(memoryUri);
      console.log(`[Database] Connected to Embedded MongoDB: ${conn.connection.host}`);
      await runAutoSeed();
    } catch (innerError) {
      console.error(`[Database] Fatal: Unable to initialize embedded database: ${innerError.message}`);
      process.exit(1);
    }
  }
};

process.on('SIGINT', async () => {
  if (mongodInstance) {
    await mongodInstance.stop();
  }
  process.exit(0);
});
