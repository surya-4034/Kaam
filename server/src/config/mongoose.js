import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

export const connectMongoDB = async () => {
  const mongoURI = process.env.MONGO_URI;
  if (!mongoURI) {
    console.log('[kaam Database] No MONGO_URI provided in .env');
    return false;
  }

  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('🍃 [kaam MongoDB Atlas] Connected successfully to Cloud Cluster!');
    return true;
  } catch (err) {
    console.error('⚠️ [kaam MongoDB Atlas Connection Warning]', err.message);
    return false;
  }
};
