import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer = null;

export const connectDB = async () => {
  try {
    let connUri = process.env.MONGODB_URI;

    if (!connUri) {
      console.log('No MONGODB_URI provided. Starting in-memory MongoDB fallback...');
      mongoMemoryServer = await MongoMemoryServer.create();
      connUri = mongoMemoryServer.getUri();
      console.log(`In-memory MongoDB started at: ${connUri}`);
    }

    const conn = await mongoose.connect(connUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export const closeDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
      console.log('In-memory MongoDB stopped.');
    }
  } catch (error) {
    console.error(`Error closing MongoDB: ${error.message}`);
  }
};
