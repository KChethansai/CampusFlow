import { Schema, model } from 'mongoose';

const requestSchema = new Schema({
  institution: { type: Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  department: { type: Schema.Types.ObjectId, ref: 'Department' },
  type: {
    type: String,
    enum: ['leave', 'bonafide', 'revaluation', 'other'],
    required: true
  },
  title: { type: String, required: true, trim: true },
  description: String,
  attachments: [String],
  status: {
    type: String,
    enum: ['pending', 'in_review', 'approved', 'rejected'],
    default: 'pending'
  },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  resolution: String,
  timeline: [{
    status: String,
    remarks: String,
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now }
  }]
}, { timestamps: true, versionKey: false, strict: 'throw' });

export const RequestModel = model('Request', requestSchema);