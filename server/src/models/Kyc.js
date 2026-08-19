import mongoose from 'mongoose';

const kycSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  worker_id: { type: String, required: true, unique: true },
  account_holder_name: { type: String, required: true },
  bank_name: { type: String, required: true },
  account_number: { type: String, required: true },
  ifsc_code: { type: String, required: true },
  upi_id: { type: String, required: true },
  govt_id_type: { type: String, default: 'AADHAAR' },
  govt_id_number: { type: String, required: true },
  aadhaar_doc_url: { type: String },
  status: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING' },
  rejection_reason: { type: String },
  submitted_at: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.models.Kyc || mongoose.model('Kyc', kycSchema);
