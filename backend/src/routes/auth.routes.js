import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { restrictTo } from '../middleware/rbac.js';
import {
  login,
  refresh,
  register,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe,
} from '../controllers/auth.controller.js';

const router = Router();

// Public routes (no auth needed)
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.post('/register', protect, restrictTo('super_admin', 'college_admin'), register);
router.post('/logout', protect, logout);
router.patch('/change-password', protect, changePassword);
router.get('/me', protect, getMe);

export default router;
