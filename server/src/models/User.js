import mongoose from 'mongoose';
import { getMongoDb } from '../config/mongoose.js';

export const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, sparse: true, index: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['CLIENT', 'WORKER', 'ADMIN'], required: true, index: true },
  full_name: { type: String, required: true },
  secondary_phone: { type: String, default: '' },
  locality: { type: String, default: '' },
  landmark: { type: String, default: '' },
  state: { type: String, default: 'Maharashtra' },
  pincode: { type: String, default: '' },
  address: { type: String, default: '' },
  location: {
    latitude: { type: Number },
    longitude: { type: Number }
  },
  onboarding_completed: { type: Boolean, default: false },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { timestamps: true, bufferCommands: false });

export const getUserModel = () => {
  const db = getMongoDb();
  if (db) {
    return db.models.User || db.model('User', userSchema, 'users');
  }
  return mongoose.models.User || mongoose.model('User', userSchema, 'users');
};

const ProxyUser = new Proxy({}, {
  get(target, prop) {
    const model = getUserModel();
    if (typeof model[prop] === 'function') {
      return model[prop].bind(model);
    }
    return model[prop];
  }
});

export default ProxyUser;

