import { Schema, model } from 'mongoose';

const subjectSchema = new Schema({
  institution: { type: Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  name: { type: String, required: true, trim: true },
  semester: { type: Number, required: true, min: 1 },
  credits: { type: Number, default: 4, min: 0 },
  category: { type: String, trim: true },
  l: { type: Number, min: 0 },
  t: { type: Number, min: 0 },
  p: { type: Number, min: 0 },
  electiveGroup: {
    name: { type: String, trim: true },
    options: [{ code: { type: String, trim: true }, courseName: { type: String, trim: true } }]
  },
  syllabus: {
    outcomes: [{ type: String, trim: true }],
    units: [{ title: { type: String, trim: true }, content: { type: String, trim: true } }],
    labExperiments: [{ type: String, trim: true }],
    references: [{ type: String, trim: true }]
  },
  faculty: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  syllabusFileUrl: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true, versionKey: false, strict: 'throw' });

subjectSchema.index({ course: 1, semester: 1, code: 1 }, { unique: true });
export const SubjectModel = model('Subject', subjectSchema);
