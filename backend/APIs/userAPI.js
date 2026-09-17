import { Router } from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import { auditLog } from '../middlewares/auditLog.js';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/usercontroller.js';

export const userApp = Router();

// All routes require authenticated session
userApp.use(verifyToken());
userApp.use(auditLog);

userApp.route('/')
  .get(verifyToken('super_admin', 'college_admin', 'faculty', 'placement_officer'), getAllUsers)
  .post(verifyToken('super_admin', 'college_admin'), createUser);

userApp.route('/:id')
  .get(verifyToken('super_admin', 'college_admin', 'faculty', 'placement_officer'), getUserById)
  .patch(verifyToken('super_admin', 'college_admin'), updateUser)
  .delete(verifyToken('super_admin', 'college_admin'), deleteUser);

