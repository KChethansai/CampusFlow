import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  title: { type: String, required: true, trim: true },
  body: String,
  pinned: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model('Announcement', announcementSchema);