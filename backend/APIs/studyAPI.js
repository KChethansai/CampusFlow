import { Router } from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import { auditLog } from '../middlewares/auditLog.js';
import { getStudyPlan, getLearningResources } from '../controllers/studycontroller.js';

export const studyApp = Router();

// All routes require authentication
studyApp.use(verifyToken());
studyApp.use(auditLog);

// Students see their own plan; faculty/admins may pass ?studentId=
studyApp.get('/plan', getStudyPlan);
studyApp.get('/learning-resources', getLearningResources);
