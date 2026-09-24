import { Schema, model } from 'mongoose';

export const TIMETABLE_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const timetableSchema = new Schema({
  institution: { type: Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
  subject: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
  faculty: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  room: { type: Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
  dayOfWeek: { type: String, enum: TIMETABLE_DAYS, required: true },
  startTime: { type: String, required: true, match: TIME_RE },
  endTime: { type: String, required: true, match: TIME_RE }
}, { timestamps: true, versionKey: false, strict: 'throw' });

timetableSchema.index({ institution: 1, dayOfWeek: 1, room: 1, startTime: 1 });
export const TimetableModel = model('Timetable', timetableSchema);
