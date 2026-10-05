import mongoose from 'mongoose';
import { getMongoDb } from '../config/mongoose.js';

const packageSchema = new mongoose.Schema({
  id: { type: String },
  title: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  duration: { type: String, default: '1 hour' },
  category: { type: String, default: 'plumber' }
}, { _id: false });

const bankSchema = new mongoose.Schema({
  holder: { type: String },
  upi: { type: String },
  upiPhone: { type: String },
  qrCodeUrl: { type: String },
  payoutMode: { type: String, default: 'UPI Instant Payout' },
  bankName: { type: String, default: 'UPI Direct' },
  accountNumber: { type: String },
  ifscCode: { type: String }
}, { _id: false });

const portfolioSchema = new mongoose.Schema({
  id: { type: String },
  title: { type: String },
  category: { type: String },
  url: { type: String },
  description: { type: String },
  date: { type: String }
}, { _id: false });

export const partnerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  partnerId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, default: '' },
  tradeCategory: { type: String, required: true, index: true },
  categories: [{ type: String }],
  tradeTitle: { type: String, required: true },
  locality: { type: String, required: true, index: true },
  city: { type: String, default: 'Mumbai' },
  experienceYears: { type: Number, default: 1 },
  bio: { type: String },
  dailyRate: { type: Number, default: 650 },
  hourlyRate: { type: Number, default: 120 },
  visitingCharge: { type: Number, default: 149 },
  onboardingCompleted: { type: Boolean, default: false, index: true },
  isAvailable: { type: Boolean, default: true, index: true },
  isAccountLocked: { type: Boolean, default: false },
  completedJobsCount: { type: Number, default: 0 },
  ratingAverage: { type: Number, default: 5.0 },
  packages: [packageSchema],
  bank: bankSchema,
  portfolio: [portfolioSchema],
  location: {
    latitude: { type: Number, default: 19.1363 },
    longitude: { type: Number, default: 72.8277 }
  },
  latitude: { type: Number, default: 19.1363 },
  longitude: { type: Number, default: 72.8277 }
}, { timestamps: true, bufferCommands: false });

export const getPartnerModel = () => {
  const db = getMongoDb();
  if (db) {
    const partnerDb = db.useDb ? db.useDb('kaam_partner_db') : db;
    return partnerDb.models.Partner || partnerDb.model('Partner', partnerSchema, 'partners');
  }
  return mongoose.models.Partner || mongoose.model('Partner', partnerSchema, 'partners');
};

export const generatePartnerId = () => {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `KP-${num}`;
};

export const seedSamplePartners = async () => {
  // No-op: Dummy accounts disabled as per user specification.
  return;
};
