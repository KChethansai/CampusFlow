import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { restrictTo } from '../middleware/rbac.js';
import {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
} from '../controllers/subject.controller.js';

const router = Router();

// All routes require authentication
router.use(protect);

// GET routes — all roles
router.get('/', getAllSubjects);
router.get('/:id', getSubjectById);

// Write routes — restricted
router.post('/', restrictTo('super_admin', 'college_admin'), createSubject);
router.patch('/:id', restrictTo('super_admin', 'college_admin'), updateSubject);
router.delete('/:id', restrictTo('super_admin', 'college_admin'), deleteSubject);

export default router;
