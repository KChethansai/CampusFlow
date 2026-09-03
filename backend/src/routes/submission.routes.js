import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { restrictTo } from '../middleware/rbac.js';
import {
  getAllSubmissions,
  getSubmissionById,
  createSubmission,
  updateSubmission,
} from '../controllers/submission.controller.js';

const router = Router();

// All routes require authentication
router.use(protect);

// GET routes — faculty and student
router.get('/', restrictTo('faculty', 'student'), getAllSubmissions);
router.get('/:id', restrictTo('faculty', 'student'), getSubmissionById);

// POST — students only
router.post('/', restrictTo('student'), createSubmission);

// PATCH — faculty only (grading)
router.patch('/:id', restrictTo('faculty'), updateSubmission);

export default router;
