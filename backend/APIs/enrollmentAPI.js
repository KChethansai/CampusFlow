import { Router } from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import { auditLog } from '../middlewares/auditLog.js';
import {
  getAllEnrollments,
  getEnrollmentById,
  createEnrollment,
  updateEnrollment,
  deleteEnrollment,
  enrollSelf,
  dropSelfEnrollment
} from '../controllers/enrollmentcontroller.js';

export const enrollmentApp = Router();

// All routes require authentication
enrollmentApp.use(verifyToken());
enrollmentApp.use(auditLog);

// Student self-service routes
enrollmentApp.post('/me', verifyToken('student'), enrollSelf);
enrollmentApp.delete('/me/:id', verifyToken('student'), dropSelfEnrollment);

// GET routes — all roles (students see only their own)
enrollmentApp.get('/', getAllEnrollments);
enrollmentApp.get('/:id', getEnrollmentById);

// Write routes — restricted
enrollmentApp.post('/', verifyToken('super_admin', 'college_admin'), createEnrollment);
enrollmentApp.patch('/:id', verifyToken('super_admin', 'college_admin'), updateEnrollment);
enrollmentApp.delete('/:id', verifyToken('super_admin', 'college_admin'), deleteEnrollment);
