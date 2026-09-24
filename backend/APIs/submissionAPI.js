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
import { getSubmissionFile } from '../controllers/filecontroller.js';

export const submissionApp = Router();

// All routes require authentication
submissionApp.use(verifyToken());
submissionApp.use(auditLog);

// GET routes — faculty, HOD (own department), student, and admins (scoped by controller)
submissionApp.get('/', verifyToken('faculty', 'hod', 'student', 'college_admin', 'super_admin'), getAllSubmissions);

// POST — students only: multipart file submission for one assignment.
// Accepts `file` + `comments` (+ `studentId`, ignored: identity is session-forced).
submissionApp.post('/assignments/:assignmentId', verifyToken('student'), uploadSubmissionFile, submitAssignmentFiles);

submissionApp.get('/:id', verifyToken('faculty', 'hod', 'student', 'college_admin', 'super_admin'), getSubmissionById);
submissionApp.get('/:id/file', verifyToken('faculty', 'hod', 'student', 'college_admin', 'super_admin'), getSubmissionFile);

// POST — students only
submissionApp.post('/', verifyToken('student'), createSubmission);

// PATCH — faculty and HOD (own department) grading
submissionApp.patch('/:id', verifyToken('faculty', 'hod'), updateSubmission);

