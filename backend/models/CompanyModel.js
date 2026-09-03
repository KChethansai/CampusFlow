import { Schema, model } from 'mongoose';

const companySchema = new Schema({
  institution: { type: Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
  name: { type: String, required: true, trim: true },
  website: String,
  industry: String,
  hrContact: { type: String, lowercase: true },
  notes: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true, versionKey: false, strict: 'throw' });

export const CompanyModel = model('Company', companySchema);