import { Schema, model } from 'mongoose';

const notificationSchema = new Schema({
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true },
  message: String,
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error'],
    default: 'info'
  },
  link: String,
  isRead: { type: Boolean, default: false }
}, { timestamps: true, versionKey: false, strict: 'throw' });

export const NotificationModel = model('Notification', notificationSchema);