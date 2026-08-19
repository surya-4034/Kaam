import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, sparse: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['CLIENT', 'WORKER', 'ADMIN'], required: true },
  full_name: { type: String, required: true },
  secondary_phone: { type: String },
  locality: { type: String },
  landmark: { type: String },
  state: { type: String, default: 'Uttar Pradesh' },
  pincode: { type: String },
  address: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  onboarding_completed: { type: Boolean, default: false },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', userSchema);
