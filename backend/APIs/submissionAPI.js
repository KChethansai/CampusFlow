import { Router } from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import { auditLog } from '../middlewares/auditLog.js';
import { uploadSubmissionFile } from '../config/multer.js';
import {
  getAllSubmissions,
  getSubmissionById,
  createSubmission,
  submitAssignmentFiles,
  updateSubmission,
} from '../controllers/submissioncontroller.js';

export const submissionApp = Router();

// All routes require authentication
submissionApp.use(verifyToken());
submissionApp.use(auditLog);

// GET routes — faculty, student, and admins (scoped by controller)
submissionApp.get('/', verifyToken('faculty', 'student', 'college_admin', 'super_admin'), getAllSubmissions);

// POST — students only: multipart file submission for one assignment.
// Accepts `file` + `comments` (+ `studentId`, ignored: identity is session-forced).
submissionApp.post('/assignments/:assignmentId', verifyToken('student'), uploadSubmissionFile, submitAssignmentFiles);

submissionApp.get('/:id', verifyToken('faculty', 'student', 'college_admin', 'super_admin'), getSubmissionById);

// POST — students only
submissionApp.post('/', verifyToken('student'), createSubmission);

// PATCH — faculty only (grading)
submissionApp.patch('/:id', verifyToken('faculty'), updateSubmission);

