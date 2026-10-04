import mongoose from 'mongoose';
import { getMongoDb } from '../config/mongoose.js';

export const kycSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  workerId: { type: String, required: true, index: true },
  accountHolderName: { type: String, required: true },
  bankName: { type: String, required: true },
  accountNumber: { type: String, required: true },
  ifscCode: { type: String, required: true },
  upiId: { type: String, required: true },
  upiPhone: { type: String, default: '' },
  govtIdType: { type: String, default: 'AADHAAR' },
  govtIdNumber: { type: String, required: true },
  aadhaarDocUrl: { type: String, default: '' },
  status: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING' },
  rejectionReason: { type: String, default: '' },
  verifiedAt: { type: Date, default: null },
  submittedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true, bufferCommands: false });

export const getKycModel = () => {
  const db = getMongoDb();
  if (db) {
    return db.models.Kyc || db.model('Kyc', kycSchema, 'kyc_records');
  }
  return mongoose.models.Kyc || mongoose.model('Kyc', kycSchema, 'kyc_records');
};

const ProxyKyc = new Proxy({}, {
  get(target, prop) {
    const model = getKycModel();
    if (typeof model[prop] === 'function') {
      return model[prop].bind(model);
    }
    return model[prop];
  }
});

export default ProxyKyc;

