import { Schema, model } from 'mongoose';

const submissionSchema = new Schema({
  assignment: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true, index: true },
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  fileUrl: String,
  textNotes: String,
  submittedAt: { type: Date, default: Date.now },
  attempt: { type: Number, default: 1, min: 1 },
  status: {
    type: String,
    enum: ['submitted', 'under_review', 'graded', 'resubmission_requested', 'late'],
    default: 'submitted'
  },
  score: Number,
  feedback: String,
  gradedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  gradedAt: Date,
  audit: [{
    action: String,
    by: { type: Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now }
  }]
}, { timestamps: true, versionKey: false, strict: 'throw' });

submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });
export const SubmissionModel = model('Submission', submissionSchema);