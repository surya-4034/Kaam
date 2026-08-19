import mongoose from 'mongoose';

const workerProfileSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true, unique: true },
  trade_category: { type: String, required: true },
  trade_title: { type: String, required: true },
  experience_years: { type: Number, default: 1 },
  daily_rate: { type: Number, required: true },
  hourly_rate: { type: Number, required: true },
  locality: { type: String, required: true },
  city: { type: String, default: 'Noida' },
  bio: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  is_available: { type: Boolean, default: true },
  is_account_locked: { type: Boolean, default: false },
  kyc_status: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING' },
  completed_jobs_count: { type: Number, default: 0 },
  rating_average: { type: Number, default: 5.0 },
  created_at: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.models.WorkerProfile || mongoose.model('WorkerProfile', workerProfileSchema);
