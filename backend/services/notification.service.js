import { NotificationModel as Notification } from '../models/NotificationModel.js';
import { UserModel as User, getNotificationPreferences } from '../models/UserModel.js';
import { emitToInstitution, emitToUser } from '../config/socket.js';

export const publishRealtimeToUser = (userId, event, payload) => emitToUser(userId, event, payload);
export const publishRealtimeToInstitution = (institutionId, event, payload) =>
  emitToInstitution(institutionId, event, payload);

export async function createNotification({ recipient, title, message, type = 'info', category = 'system', link, institution }) {
  const recipientUser = await User.findById(recipient).select('notificationPreferences').lean();
  const prefs = getNotificationPreferences(recipientUser?.notificationPreferences)[category];
  if (!prefs.inApp && !prefs.push && !prefs.email) return null;
  const notification = await Notification.create({ recipient, title, message, type, category, link });
  if (prefs.push) publishRealtimeToUser(recipient, 'notification:new', { notification, institution });
  return notification;
}

export async function createBulkNotifications(notifications) {
  const recipients = [...new Set(notifications.map(({ recipient }) => String(recipient)))];
  const users = await User.find({ _id: { $in: recipients } }).select('_id notificationPreferences').lean();
  const preferencesByUser = new Map(users.map((user) => [String(user._id), getNotificationPreferences(user.notificationPreferences)]));
  const allowed = notifications.filter(({ recipient, category = 'system' }) => {
    const prefs = (preferencesByUser.get(String(recipient)) || getNotificationPreferences())[category];
    return prefs.inApp || prefs.push || prefs.email;
  });
  const rows = allowed.length ? await Notification.insertMany(allowed) : [];
  rows.forEach((notification) => {
    const prefs = (preferencesByUser.get(String(notification.recipient)) || getNotificationPreferences())[notification.category];
    if (prefs.push) publishRealtimeToUser(notification.recipient, 'notification:new', { notification });
  });
  return rows;
}
