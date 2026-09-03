import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { restrictTo } from '../middleware/rbac.js';
import {
  getAllEnrollments,
  getEnrollmentById,
  createEnrollment,
  updateEnrollment,
  deleteEnrollment,
} from '../controllers/enrollment.controller.js';

const router = Router();

// All routes require authentication
router.use(protect);

// GET routes — all roles
router.get('/', getAllEnrollments);
router.get('/:id', getEnrollmentById);

// Write routes — restricted
router.post('/', restrictTo('super_admin', 'college_admin'), createEnrollment);
router.patch('/:id', restrictTo('super_admin', 'college_admin'), updateEnrollment);
router.delete('/:id', restrictTo('super_admin', 'college_admin'), deleteEnrollment);

export default router;
