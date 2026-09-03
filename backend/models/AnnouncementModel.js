import { Schema, model } from 'mongoose';

const announcementSchema = new Schema({
  institution: { type: Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
  department: { type: Schema.Types.ObjectId, ref: 'Department' },
  subject: { type: Schema.Types.ObjectId, ref: 'Subject' },
  title: { type: String, required: true, trim: true },
  body: String,
  pinned: { type: Boolean, default: false },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true, versionKey: false, strict: 'throw' });

export const AnnouncementModel = model('Announcement', announcementSchema);