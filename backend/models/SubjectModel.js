import { Schema, model } from 'mongoose';

const subjectSchema = new Schema({
  institution: { type: Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  name: { type: String, required: true, trim: true },
  semester: { type: Number, required: true, min: 1 },
  credits: { type: Number, default: 4, min: 1 },
  faculty: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  syllabusFileUrl: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true, versionKey: false, strict: 'throw' });

subjectSchema.index({ course: 1, semester: 1, code: 1 }, { unique: true });
export const SubjectModel = model('Subject', subjectSchema);