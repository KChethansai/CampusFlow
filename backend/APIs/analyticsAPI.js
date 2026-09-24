import { Router } from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import { auditLog } from '../middlewares/auditLog.js';
import { attendanceTrend, placementFunnel, enrollmentOverview } from '../controllers/analyticscontroller.js';

export const analyticsApp = Router();

// All routes require authentication; students get own-trend only (controller-enforced).
analyticsApp.use(verifyToken());
analyticsApp.use(auditLog);

analyticsApp.get('/attendance-trend', attendanceTrend);
analyticsApp.get('/placement-funnel', verifyToken('super_admin', 'college_admin', 'placement_officer'), placementFunnel);
analyticsApp.get('/enrollment-overview', verifyToken('super_admin', 'college_admin'), enrollmentOverview);
