import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { restrictTo } from '../middleware/rbac.js';
import {
  getAllJobApplications,
  getJobApplicationById,
  createJobApplication,
  updateJobApplication,
} from '../controllers/jobApplication.controller.js';

const router = Router();

// All routes require authentication
router.use(protect);

// GET routes — placement_officer, college_admin, student
router.get('/', restrictTo('placement_officer', 'college_admin', 'student'), getAllJobApplications);
router.get('/:id', restrictTo('placement_officer', 'college_admin', 'student'), getJobApplicationById);

// POST — student only
router.post('/', restrictTo('student'), createJobApplication);

// PATCH — placement_officer only
router.patch('/:id', restrictTo('placement_officer'), updateJobApplication);

export default router;
