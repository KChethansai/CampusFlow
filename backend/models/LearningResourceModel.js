import { Schema, model } from 'mongoose';

const learningResourceSchema = new Schema({
  institution: { type: Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
  subject: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
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
}, { timestamps: true, versionKey: false, strict: 'throw' });

export const LearningResourceModel = model('LearningResource', learningResourceSchema);