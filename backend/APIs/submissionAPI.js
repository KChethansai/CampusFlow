import { Router } from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import { auditLog } from '../middlewares/auditLog.js';
import {
  getAllSubmissions,
  getSubmissionById,
  createSubmission,
  updateSubmission,
} from '../controllers/submissioncontroller.js';

export const submissionApp = Router();

// All routes require authentication
submissionApp.use(verifyToken());
submissionApp.use(auditLog);

// GET routes — faculty and student
submissionApp.get('/', verifyToken('faculty', 'student'), getAllSubmissions);
submissionApp.get('/:id', verifyToken('faculty', 'student'), getSubmissionById);

// POST — students only
submissionApp.post('/', verifyToken('student'), createSubmission);

// PATCH — faculty only (grading)
submissionApp.patch('/:id', verifyToken('faculty'), updateSubmission);

