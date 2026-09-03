import { Router } from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import { auditLog } from '../middlewares/auditLog.js';
import { getAIReports, generateReport } from '../controllers/aicontroller.js';

export const aiReportApp = Router();

// Admin-only surface for AI-generated performance reports
aiReportApp.use(verifyToken('super_admin', 'college_admin'));
aiReportApp.use(auditLog);

aiReportApp.get('/', getAIReports);
aiReportApp.post('/generate', generateReport);
