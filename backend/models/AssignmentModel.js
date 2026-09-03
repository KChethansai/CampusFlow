import { Schema, model } from 'mongoose';

const assignmentSchema = new Schema({
  institution: { type: Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
  subject: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  title: { type: String, required: true, trim: true },
  description: String,
  maxScore: { type: Number, default: 100, min: 1 },
  dueDate: { type: Date, required: true },
  allowResubmission: { type: Boolean, default: false },
  maxResubmissions: { type: Number, default: 1, min: 0 },
  status: {
    type: String,
    enum: ['draft', 'published', 'open', 'closed', 'graded', 'archived'],
    default: 'draft'
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  audit: [{
    action: String,
    by: { type: Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now }
  }]
}, { timestamps: true, versionKey: false, strict: 'throw' });

export const AssignmentModel = model('Assignment', assignmentSchema);