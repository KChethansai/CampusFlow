import { Schema, model } from 'mongoose';
import { NOTIFICATION_CATEGORIES } from './UserModel.js';

const notificationSchema = new Schema({
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true },
  message: String,
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error'],
    default: 'info'
  },
  category: { type: String, enum: NOTIFICATION_CATEGORIES, default: 'system', index: true },
  link: String,
  isRead: { type: Boolean, default: false }
}, { timestamps: true, versionKey: false, strict: 'throw' });

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
export const NotificationModel = model('Notification', notificationSchema);
