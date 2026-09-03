import { Router } from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import {
  getAllJobApplications,
  getJobApplicationById,
  createJobApplication,
  updateJobApplication,
} from '../controllers/jobApplicationcontroller.js';

export const jobApplicationApp = Router();

// All routes require authentication
jobApplicationApp.use(verifyToken());

// GET routes — placement_officer, college_admin, student
jobApplicationApp.get('/', verifyToken('placement_officer', 'college_admin', 'student'), getAllJobApplications);
jobApplicationApp.get('/:id', verifyToken('placement_officer', 'college_admin', 'student'), getJobApplicationById);

// POST — student only
jobApplicationApp.post('/', verifyToken('student'), createJobApplication);

// PATCH — placement_officer only
jobApplicationApp.patch('/:id', verifyToken('placement_officer'), updateJobApplication);

