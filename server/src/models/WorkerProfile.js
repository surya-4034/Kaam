import mongoose from 'mongoose';
import { getMongoDb } from '../config/mongoose.js';

export const workerProfileSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true, unique: true },
  trade_category: { type: String, required: true },
  trade_title: { type: String, required: true },
  experience_years: { type: Number, default: 1 },
  daily_rate: { type: Number, default: 650 },
  hourly_rate: { type: Number, default: 120 },
  visiting_charge: { type: Number, default: 149 },
  locality: { type: String, required: true },
  city: { type: String, default: 'Mumbai' },
  bio: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  is_available: { type: Boolean, default: true },
  is_account_locked: { type: Boolean, default: false },
  kyc_status: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING' },
  completed_jobs_count: { type: Number, default: 0 },
  rating_average: { type: Number, default: 5.0 },
  created_at: { type: Date, default: Date.now }
}, { timestamps: true, bufferCommands: false });

export const getWorkerProfileModel = () => {
  const db = getMongoDb();
  if (db) {
    return db.models.WorkerProfile || db.model('WorkerProfile', workerProfileSchema, 'partners');
  }
  return mongoose.models.WorkerProfile || mongoose.model('WorkerProfile', workerProfileSchema, 'partners');
};

const ProxyWorkerProfile = new Proxy({}, {
  get(target, prop) {
    const model = getWorkerProfileModel();
    if (typeof model[prop] === 'function') {
      return model[prop].bind(model);
    }
    return model[prop];
  }
});

export default ProxyWorkerProfile;

