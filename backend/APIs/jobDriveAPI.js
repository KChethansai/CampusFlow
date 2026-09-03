import { Router } from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import { auditLog } from '../middlewares/auditLog.js';
import {
  getAllJobDrives,
  getJobDriveById,
  createJobDrive,
  updateJobDrive,
  deleteJobDrive,
} from '../controllers/jobDrivecontroller.js';

export const jobDriveApp = Router();

// All routes require authentication
jobDriveApp.use(verifyToken());
jobDriveApp.use(auditLog);

// GET routes — all roles
jobDriveApp.get('/', getAllJobDrives);
jobDriveApp.get('/:id', getJobDriveById);

// Write routes — restricted
jobDriveApp.post('/', verifyToken('placement_officer', 'college_admin'), createJobDrive);
jobDriveApp.patch('/:id', verifyToken('placement_officer', 'college_admin'), updateJobDrive);
jobDriveApp.delete('/:id', verifyToken('placement_officer', 'college_admin'), deleteJobDrive);

