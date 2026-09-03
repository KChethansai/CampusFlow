import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { restrictTo } from '../middleware/rbac.js';
import {
  markSession,
  getSessions,
  getSessionById,
  getStudentAttendance,
} from '../controllers/attendance.controller.js';

const router = Router();

// All routes require authentication
router.use(protect);

// POST — faculty marks attendance session
router.post('/', restrictTo('faculty'), markSession);

// GET routes — all roles
router.get('/', getSessions);
router.get('/:id', getSessionById);

// GET student-specific attendance
router.get('/student/:studentId', getStudentAttendance);

export default router;
