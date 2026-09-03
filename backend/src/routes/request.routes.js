import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { restrictTo } from '../middleware/rbac.js';
import {
  getAllRequests,
  getRequestById,
  createRequest,
  updateRequestStatus,
} from '../controllers/request.controller.js';

const router = Router();

// All routes require authentication
router.use(protect);

// GET routes — all roles (controller filters by role)
router.get('/', getAllRequests);
router.get('/:id', getRequestById);

// POST — students only
router.post('/', restrictTo('student'), createRequest);

// PATCH status — faculty and college_admin
router.patch('/:id/status', restrictTo('faculty', 'college_admin'), updateRequestStatus);

export default router;
