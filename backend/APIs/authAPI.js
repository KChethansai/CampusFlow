import { Router } from 'express';
import { body } from 'express-validator';
import { verifyToken } from '../middlewares/verifyToken.js';
import { validate } from '../middlewares/validate.js';
import {
  login,
  refresh,
  register,
  registerPublic,
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
authApp.post(
  '/register-public',
  validate([
    body('name').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('role')
      .isIn(['student', 'faculty', 'placement_officer'])
      .withMessage('Role must be student, faculty or placement_officer'),
  ]),
  registerPublic
);

// Protected routes
authApp.post('/register', verifyToken('super_admin', 'college_admin'), register);
authApp.post('/logout', verifyToken(), logout);
authApp.patch('/change-password', verifyToken(), changePassword);
authApp.get('/me', verifyToken(), getMe);

