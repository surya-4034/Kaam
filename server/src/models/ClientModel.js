import mongoose from 'mongoose';
import { getMongoDb } from '../config/mongoose.js';
import { userSchema, getUserModel } from './User.js';
import { bookingSchema, getBookingModel } from './Job.js';

const savedAddressSchema = new mongoose.Schema({
  label: { type: String, default: 'Home' }, // 'Home', 'Work', 'Other'
  address: { type: String, required: true },
  locality: { type: String, default: '' },
  landmark: { type: String, default: '' },
  city: { type: String, default: 'Mumbai' },
  state: { type: String, default: 'Maharashtra' },
  pincode: { type: String, default: '' },
  isDefault: { type: Boolean, default: true },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  }
}, { _id: false });

export const clientSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  clientId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  fullName: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true, index: true },
  email: { type: String, default: '', index: true },
  secondaryPhone: { type: String, default: '' },
  locality: { type: String, default: 'Mumbai', index: true },
  landmark: { type: String, default: '' },
  city: { type: String, default: 'Mumbai' },
  state: { type: String, default: 'Maharashtra' },
  pincode: { type: String, default: '' },
  address: { type: String, default: '' },
  location: {
    latitude: { type: Number },
    longitude: { type: Number }
  },
  savedAddresses: [savedAddressSchema],
  totalBookingsCount: { type: Number, default: 0 },
  completedBookingsCount: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  preferredCategories: [{ type: String }],
  ratingAverage: { type: Number, default: 5.0 },
  onboardingCompleted: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true, bufferCommands: false });

export const generateClientId = () => {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `KC-${num}`;
};

export const getClientModel = () => {
  const db = getMongoDb();
  if (db) {
    const clientDb = db.useDb ? db.useDb('kaam_client_db') : db;
    return clientDb.models.Client || clientDb.model('Client', clientSchema, 'clients');
  }
  return mongoose.models.Client || mongoose.model('Client', clientSchema, 'clients');
};

const ProxyClient = new Proxy({}, {
  get(target, prop) {
    const model = getClientModel();
    if (typeof model[prop] === 'function') {
      return model[prop].bind(model);
    }
    return model[prop];
  }
});

export const clientUserSchema = userSchema;
export const clientJobBookingSchema = bookingSchema;
export const getClientUserModel = () => getUserModel();
export const getClientBookingModel = () => getBookingModel();

export default ProxyClient;


