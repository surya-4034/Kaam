import mongoose from 'mongoose';
import { getMongoDb } from '../config/mongoose.js';

export const platformDuesSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  workerId: { type: String, required: true, index: true },
  jobId: { type: String, required: true, index: true },
  commissionAmount: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  paymentQrUrl: { type: String, default: '' },
  status: { type: String, enum: ['PENDING', 'PAID', 'OVERDUE_LOCKED'], default: 'PENDING', index: true },
  paidAt: { type: Date, default: null },
  paymentTransactionRef: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true, bufferCommands: false });

export const getPlatformDuesModel = () => {
  const db = getMongoDb();
  if (db) {
    return db.models.PlatformDues || db.model('PlatformDues', platformDuesSchema, 'platform_dues');
  }
  return mongoose.models.PlatformDues || mongoose.model('PlatformDues', platformDuesSchema, 'platform_dues');
};

const ProxyPlatformDues = new Proxy({}, {
  get(target, prop) {
    const model = getPlatformDuesModel();
    if (typeof model[prop] === 'function') {
      return model[prop].bind(model);
    }
    return model[prop];
  }
});

export default ProxyPlatformDues;

