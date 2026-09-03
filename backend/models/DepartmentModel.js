import { Schema, model } from 'mongoose';

const departmentSchema = new Schema({
  institution: { type: Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  hod: { type: Schema.Types.ObjectId, ref: 'User' },
  description: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true, versionKey: false, strict: 'throw' });

departmentSchema.index({ institution: 1, code: 1 }, { unique: true });
export const DepartmentModel = model('Department', departmentSchema);