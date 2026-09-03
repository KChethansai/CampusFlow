import { Schema, model } from 'mongoose';

const eventSchema = new Schema({
  institution: { type: Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
  department: { type: Schema.Types.ObjectId, ref: 'Department' },
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
  registeredStudents: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true, versionKey: false, strict: 'throw' });

export const EventModel = model('Event', eventSchema);