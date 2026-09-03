import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { restrictTo } from '../middleware/rbac.js';
import {
  getAllAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  updateAssignmentStatus,
} from '../controllers/assignment.controller.js';

const router = Router();

// All routes require authentication
router.use(protect);

// GET routes — all roles
router.get('/', getAllAssignments);
router.get('/:id', getAssignmentById);

// Write routes — restricted
router.post('/', restrictTo('faculty'), createAssignment);
router.patch('/:id', restrictTo('faculty'), updateAssignment);
router.patch('/:id/status', restrictTo('faculty'), updateAssignmentStatus);
router.delete('/:id', restrictTo('super_admin', 'college_admin', 'faculty'), deleteAssignment);

export default router;
