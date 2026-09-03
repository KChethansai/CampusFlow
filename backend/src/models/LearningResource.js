import mongoose from 'mongoose';

const learningResourceSchema = new mongoose.Schema({
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  topic: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  url: String,
  type: {
    type: String,
    enum: ['video', 'document', 'link', 'podcast', 'other'],
    default: 'link'
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  }
}, { timestamps: true });

export default mongoose.model('LearningResource', learningResourceSchema);