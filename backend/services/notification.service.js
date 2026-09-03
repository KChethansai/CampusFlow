import { NotificationModel as Notification } from '../models/NotificationModel.js';

export async function createNotification({ recipient, title, message, type = 'info', link }) {
  const notification = await Notification.create({ recipient, title, message, type, link });
  return notification;
}

export async function createBulkNotifications(notifications) {
  return Notification.insertMany(notifications);
}