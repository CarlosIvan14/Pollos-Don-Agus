import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema({
  name: { type: String, required: true },
  role: { type: String, enum: ['admin','caja'], required: true },
  pinHash: { type: String, required: true }, // 4-6 digit PIN hashed
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
