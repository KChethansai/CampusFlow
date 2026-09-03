import { Schema, model } from 'mongoose';

const jobApplicationSchema = new Schema({
  drive: { type: Schema.Types.ObjectId, ref: 'JobDrive', required: true, index: true },
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  stage: {
    type: String,
    enum: ['applied', 'shortlisted', 'assessment', 'interview_1', 'interview_2', 'hr_round', 'offer', 'placed', 'rejected'],
    default: 'applied'
  },
  eligibilitySnapshot: Schema.Types.Mixed,
  resumeUrl: String,
  history: [{
    stage: { type: String, enum: ['applied', 'shortlisted', 'assessment', 'interview_1', 'interview_2', 'hr_round', 'offer', 'placed', 'rejected'] },
    status: { type: String, enum: ['pending', 'approved', 'rejected'] },
    remarks: String,
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now }
  }],
  outcome: String,
  offerPackageLPA: Number
}, { timestamps: true, versionKey: false, strict: 'throw' });

jobApplicationSchema.index({ drive: 1, student: 1 });
export const JobApplicationModel = model('JobApplication', jobApplicationSchema);