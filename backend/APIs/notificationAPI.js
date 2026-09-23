import { Router } from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import { auditLog } from '../middlewares/auditLog.js';
import {
  getMyNotifications,
  markAsRead,
  getMyNotificationPreferences,
  updateMyNotificationPreferences,
} from '../controllers/notificationcontroller.js';

export const notificationApp = Router();

// All routes require authentication
notificationApp.use(verifyToken());
notificationApp.use(auditLog);

// GET user's own notifications
notificationApp.get('/', getMyNotifications);
notificationApp.route('/preferences')
  .get(getMyNotificationPreferences)
  .patch(updateMyNotificationPreferences);

// PATCH mark notification as read
notificationApp.patch('/:id/read', markAsRead);
