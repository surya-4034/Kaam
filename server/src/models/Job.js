import mongoose from 'mongoose';
import { getMongoDb } from '../config/mongoose.js';

export const bookingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  jobId: { type: String, index: true },
  clientId: { type: String, required: true, index: true },
  clientName: { type: String, required: true },
  clientPhone: { type: String, required: true },
  clientEmail: { type: String, default: '' },
  workerId: { type: String, required: true, index: true },
  workerName: { type: String, default: 'Partner' },
  workerPhone: { type: String, default: '' },
  tradeCategory: { type: String, default: 'General Service' },
  categoryTitle: { type: String, default: 'General Service' },
  workDescription: { type: String, required: true },
  locationAddress: { type: String, required: true },
  timeSlot: { type: String, default: '' },
  packages: [
    {
      id: String,
      title: String,
      price: Number,
      duration: String,
      category: String
    }
  ],
  agreedTotalFee: { type: Number, required: true },
  platformFeeAmount: { type: Number, default: 0 },
  workerNetPayout: { type: Number, default: 0 },
  paymentMode: { type: String, default: 'DIRECT_CASH' },
  paymentStatus: { type: String, enum: ['PENDING', 'PAID', 'FAILED'], default: 'PENDING' },
  workerUpi: { type: String, default: '' },
  workerUpiPhone: { type: String, default: '' },
  workerUpiHolder: { type: String, default: '' },
  status: {
    type: String,
    enum: ['REQUESTED', 'ACCEPTED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    default: 'REQUESTED',
    index: true
  },
  completionCode: { type: String, default: '' },
  completedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true, bufferCommands: false });

export const getBookingModel = () => {
  const db = getMongoDb();
  if (db) {
    return db.models.Booking || db.model('Booking', bookingSchema, 'bookings');
  }
  return mongoose.models.Booking || mongoose.model('Booking', bookingSchema, 'bookings');
};

const ProxyBooking = new Proxy({}, {
  get(target, prop) {
    const model = getBookingModel();
    if (typeof model[prop] === 'function') {
      return model[prop].bind(model);
    }
    return model[prop];
  }
});

export const Job = ProxyBooking;
export default ProxyBooking;

