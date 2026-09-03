import { Schema, model } from 'mongoose'

const courseSchema = new Schema(
  {
    institution: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true
    },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    durationYears: { type: Number, default: 4, min: 1, max: 5 },
    totalSemesters: { type: Number, default: 8, min: 1, max: 10 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true, versionKey: false, strict: 'throw' }
)

courseSchema.index({ institution: 1, code: 1 }, { unique: true })
export const CourseModel = model('Course', courseSchema);
