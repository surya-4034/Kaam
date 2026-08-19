import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  client_id: { type: String },
  client_name: { type: String, required: true },
  client_phone: { type: String, required: true },
  worker_id: { type: String, required: true },
  worker_name: { type: String },
  worker_phone: { type: String },
  trade_title: { type: String },
  trade_category: { type: String },
  location_address: { type: String, required: true },
  work_description: { type: String, required: true },
  agreed_total_fee: { type: Number, required: true },
  payment_mode: { type: String, default: 'DIRECT_CASH' },
  status: { type: String, enum: ['REQUESTED', 'ACCEPTED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], default: 'REQUESTED' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.models.Job || mongoose.model('Job', jobSchema);
