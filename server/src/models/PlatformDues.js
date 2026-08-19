import mongoose from 'mongoose';

const platformDuesSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  worker_id: { type: String, required: true },
  job_id: { type: String, required: true },
  commission_amount: { type: Number, required: true },
  due_date: { type: Date, required: true },
  payment_qr_url: { type: String },
  status: { type: String, enum: ['PENDING', 'PAID', 'OVERDUE_LOCKED'], default: 'PENDING' },
  created_at: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.models.PlatformDues || mongoose.model('PlatformDues', platformDuesSchema);
