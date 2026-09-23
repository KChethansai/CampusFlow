import { Router } from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import { auditLog } from '../middlewares/auditLog.js';
import { uploadBulkFile } from '../config/multer.js';
import {
  getAllUsers,
  getUserById,
  bulkCreateUsers,
  updateUser,
  deleteUser,
  completeOnboardingTour,
} from '../controllers/usercontroller.js';

export const userApp = Router();

// All routes require authenticated session
userApp.use(verifyToken());
userApp.use(auditLog);

userApp.route('/')
  .get(verifyToken('super_admin', 'college_admin', 'faculty', 'placement_officer'), getAllUsers);

userApp.post('/bulk', verifyToken('super_admin', 'college_admin'), uploadBulkFile, bulkCreateUsers);
userApp.patch('/me/onboarding-tour', completeOnboardingTour);

userApp.route('/:id')
  .get(verifyToken('super_admin', 'college_admin', 'faculty', 'placement_officer'), getUserById)
  .patch(verifyToken('super_admin', 'college_admin'), updateUser)
  .delete(verifyToken('super_admin', 'college_admin'), deleteUser);
