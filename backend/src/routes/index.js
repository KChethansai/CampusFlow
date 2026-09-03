import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import departmentRoutes from './department.routes.js';
import courseRoutes from './course.routes.js';
import subjectRoutes from './subject.routes.js';
import enrollmentRoutes from './enrollment.routes.js';
import assignmentRoutes from './assignment.routes.js';
import submissionRoutes from './submission.routes.js';
import attendanceRoutes from './attendance.routes.js';
import companyRoutes from './company.routes.js';
import jobDriveRoutes from './jobDrive.routes.js';
import jobApplicationRoutes from './jobApplication.routes.js';
import eventRoutes from './event.routes.js';
import requestRoutes from './request.routes.js';
import announcementRoutes from './announcement.routes.js';
import notificationRoutes from './notification.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/departments', departmentRoutes);
router.use('/courses', courseRoutes);
router.use('/subjects', subjectRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/submissions', submissionRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/companies', companyRoutes);
router.use('/job-drives', jobDriveRoutes);
router.use('/job-applications', jobApplicationRoutes);
router.use('/events', eventRoutes);
router.use('/requests', requestRoutes);
router.use('/announcements', announcementRoutes);
router.use('/notifications', notificationRoutes);

export default router;
