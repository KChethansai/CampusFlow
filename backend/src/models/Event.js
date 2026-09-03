import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  title: { type: String, required: true, trim: true },
  description: String,
  type: {
    type: String,
    enum: ['academic', 'cultural', 'sports', 'technical', 'placement', 'other']
  },
  startAt: Date,
  endAt: Date,
  visibility: {
    type: String,
    enum: ['public', 'department', 'internal'],
    default: 'public'
  },
  registeredStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

export default mongoose.model('Event', eventSchema);