import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { restrictTo } from '../middleware/rbac.js';
import {
  getAllJobDrives,
  getJobDriveById,
  createJobDrive,
  updateJobDrive,
  deleteJobDrive,
} from '../controllers/jobDrive.controller.js';

const router = Router();

// All routes require authentication
router.use(protect);

// GET routes — all roles
router.get('/', getAllJobDrives);
router.get('/:id', getJobDriveById);

// Write routes — restricted
router.post('/', restrictTo('placement_officer', 'college_admin'), createJobDrive);
router.patch('/:id', restrictTo('placement_officer', 'college_admin'), updateJobDrive);
router.delete('/:id', restrictTo('placement_officer', 'college_admin'), deleteJobDrive);

export default router;
