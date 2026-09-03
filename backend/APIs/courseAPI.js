import { Router } from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} from '../controllers/coursecontroller.js';

export const courseApp = Router();

// All routes require authentication
courseApp.use(verifyToken());

// GET routes — all roles
courseApp.get('/', getAllCourses);
courseApp.get('/:id', getCourseById);

// Write routes — restricted
courseApp.post('/', verifyToken('super_admin', 'college_admin'), createCourse);
courseApp.patch('/:id', verifyToken('super_admin', 'college_admin'), updateCourse);
courseApp.delete('/:id', verifyToken('super_admin', 'college_admin'), deleteCourse);

