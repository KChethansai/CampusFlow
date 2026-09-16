import { Router } from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import { auditLog } from '../middlewares/auditLog.js';
import { uploadResourceFile } from '../config/multer.js';
import { getStudyPlan, getLearningResources, createLearningResource, updateLearningResource, deleteLearningResource } from '../controllers/studycontroller.js';

export const studyApp = Router();

// All routes require authentication
studyApp.use(verifyToken());
studyApp.use(auditLog);

// Students see their own plan; faculty/admins may pass ?studentId=
studyApp.get('/plan', getStudyPlan);
studyApp.get('/learning-resources', getLearningResources);
// faculty/admin only — JSON url or multipart file attachment (PDFs, docs)
studyApp.post('/learning-resources', verifyToken('super_admin', 'college_admin', 'faculty'), uploadResourceFile, createLearningResource);
studyApp.patch('/learning-resources/:id', verifyToken('super_admin', 'college_admin', 'faculty'), uploadResourceFile, updateLearningResource);
studyApp.delete('/learning-resources/:id', verifyToken('super_admin', 'college_admin', 'faculty'), deleteLearningResource);
