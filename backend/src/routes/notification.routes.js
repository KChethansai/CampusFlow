import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  getMyNotifications,
  markAsRead,
} from '../controllers/notification.controller.js';

const router = Router();

// All routes require authentication
router.use(protect);

// GET user's own notifications
router.get('/', getMyNotifications);

// PATCH mark notification as read
router.patch('/:id/read', markAsRead);

export default router;
