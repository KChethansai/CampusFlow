import { Router } from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import {
  login,
  refresh,
  register,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe,
} from '../controllers/authcontroller.js';

export const authApp = Router();

// Public routes (no auth needed)
authApp.post('/login', login);
authApp.post('/refresh', refresh);
authApp.post('/forgot-password', forgotPassword);
authApp.post('/reset-password', resetPassword);

// Protected routes
authApp.post('/register', verifyToken('super_admin', 'college_admin'), register);
authApp.post('/logout', verifyToken(), logout);
authApp.patch('/change-password', verifyToken(), changePassword);
authApp.get('/me', verifyToken(), getMe);

