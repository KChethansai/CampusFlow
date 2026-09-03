import { Router } from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import {
  getAllEnrollments,
  getEnrollmentById,
  createEnrollment,
  updateEnrollment,
  deleteEnrollment,
} from '../controllers/enrollmentcontroller.js';

export const enrollmentApp = Router();

// All routes require authentication
enrollmentApp.use(verifyToken());

// GET routes — all roles
enrollmentApp.get('/', getAllEnrollments);
enrollmentApp.get('/:id', getEnrollmentById);

// Write routes — restricted
enrollmentApp.post('/', verifyToken('super_admin', 'college_admin'), createEnrollment);
enrollmentApp.patch('/:id', verifyToken('super_admin', 'college_admin'), updateEnrollment);
enrollmentApp.delete('/:id', verifyToken('super_admin', 'college_admin'), deleteEnrollment);

