import { Router } from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import {
  markSession,
  getSessions,
  getSessionById,
  getStudentAttendance,
} from '../controllers/attendancecontroller.js';

export const attendanceApp = Router();

// All routes require authentication
attendanceApp.use(verifyToken());

// POST — faculty marks attendance session
attendanceApp.post('/', verifyToken('faculty'), markSession);

// GET routes — all roles
attendanceApp.get('/', getSessions);
attendanceApp.get('/:id', getSessionById);

// GET student-specific attendance
attendanceApp.get('/student/:studentId', getStudentAttendance);

