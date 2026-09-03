import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true, index: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
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
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  gradedAt: Date,
  audit: [{
    action: String,
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });
export default mongoose.model('Submission', submissionSchema);