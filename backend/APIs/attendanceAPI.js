import { Router } from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import { auditLog } from '../middlewares/auditLog.js';
import {
  markSession,
  getSessions,
  getSessionById,
  getStudentAttendance,
} from '../controllers/attendancecontroller.js';

export const attendanceApp = Router();

// All routes require authentication
attendanceApp.use(verifyToken());
attendanceApp.use(auditLog);

// POST — faculty marks attendance session; HOD for own-department subjects
attendanceApp.post('/', verifyToken('faculty', 'hod'), markSession);

// GET routes — all roles (specific-before-generic so /student/:id is never swallowed by /:id)
attendanceApp.get('/', getSessions);

// GET student-specific attendance
attendanceApp.get('/student/:studentId', getStudentAttendance);

attendanceApp.get('/:id', getSessionById);

