import { Schema, model } from 'mongoose';

const enrollmentSchema = new Schema({
  institution: { type: Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  academicYear: { type: String, required: true },
  semester: { type: Number, required: true, min: 1 },
  status: {
    type: String,
    enum: ['active', 'dropped', 'completed'],
    default: 'active'
  }
}, { timestamps: true, versionKey: false, strict: 'throw' });

enrollmentSchema.index({ student: 1, course: 1, academicYear: 1 }, { unique: true });
export const EnrollmentModel = model('Enrollment', enrollmentSchema);