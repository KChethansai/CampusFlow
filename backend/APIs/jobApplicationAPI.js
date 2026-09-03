import { Router } from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import { auditLog } from '../middlewares/auditLog.js';
import {
  getAllJobApplications,
  getJobApplicationById,
  createJobApplication,
  updateJobApplication
} from '../controllers/jobApplicationcontroller.js';
import {
  checkEligibilityForDrive,
  applyForJob,
  getApplications,
  updateApplicationStage
} from '../controllers/placementcontroller.js';

export const jobApplicationApp = Router();

// All routes require authentication
jobApplicationApp.use(verifyToken());
jobApplicationApp.use(auditLog);

// Placement flow — per-drive helpers
jobApplicationApp.get('/drives/:driveId/eligibility', checkEligibilityForDrive);
jobApplicationApp.post('/drives/:driveId/apply', verifyToken('student'), applyForJob);
jobApplicationApp.get(
  '/drives/:driveId/applications',
  verifyToken('placement_officer', 'college_admin', 'super_admin'),
  getApplications
);
jobApplicationApp.patch(
  '/drives/:driveId/applications/:applicationId',
  verifyToken('placement_officer', 'college_admin', 'super_admin'),
  updateApplicationStage
);

// GET routes — placement_officer, college_admin, student
jobApplicationApp.get(
  '/',
  verifyToken('placement_officer', 'college_admin', 'student'),
  getAllJobApplications
);
jobApplicationApp.get(
  '/:id',
  verifyToken('placement_officer', 'college_admin', 'student'),
  getJobApplicationById
);

// POST — student only
jobApplicationApp.post('/', verifyToken('student'), createJobApplication);

// PATCH — placement_officer only
jobApplicationApp.patch('/:id', verifyToken('placement_officer'), updateJobApplication);
