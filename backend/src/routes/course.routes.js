import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { restrictTo } from '../middleware/rbac.js';
import {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} from '../controllers/course.controller.js';

const router = Router();

// All routes require authentication
router.use(protect);

// GET routes — all roles
router.get('/', getAllCourses);
router.get('/:id', getCourseById);

// Write routes — restricted
router.post('/', restrictTo('super_admin', 'college_admin'), createCourse);
router.patch('/:id', restrictTo('super_admin', 'college_admin'), updateCourse);
router.delete('/:id', restrictTo('super_admin', 'college_admin'), deleteCourse);

export default router;
