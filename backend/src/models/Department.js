import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  hod: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  description: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

departmentSchema.index({ institution: 1, code: 1 }, { unique: true });
export default mongoose.model('Department', departmentSchema);