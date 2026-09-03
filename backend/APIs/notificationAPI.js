import { Router } from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import {
  getMyNotifications,
  markAsRead,
} from '../controllers/notificationcontroller.js';

export const notificationApp = Router();

// All routes require authentication
notificationApp.use(verifyToken());

// GET user's own notifications
notificationApp.get('/', getMyNotifications);

// PATCH mark notification as read
notificationApp.patch('/:id/read', markAsRead);

