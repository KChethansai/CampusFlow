import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema({
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
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
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolution: String,
  timeline: [{
    status: String,
    remarks: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export default mongoose.model('Request', requestSchema);