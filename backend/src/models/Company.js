import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
  name: { type: String, required: true, trim: true },
  website: String,
  industry: String,
  hrContact: { type: String, lowercase: true },
  notes: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Company', companySchema);