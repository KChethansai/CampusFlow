// API index: single router aggregating every resource router under /api/v1.
import { Router } from 'express'
import { authApp } from './authAPI.js'
import { userApp } from './userAPI.js'
import { departmentApp } from './departmentAPI.js'
import { courseApp } from './courseAPI.js'
import { subjectApp } from './subjectAPI.js'
import { enrollmentApp } from './enrollmentAPI.js'
import { assignmentApp } from './assignmentAPI.js'
import { submissionApp } from './submissionAPI.js'
import { attendanceApp } from './attendanceAPI.js'
import { companyApp } from './companyAPI.js'
import { jobDriveApp } from './jobDriveAPI.js'
import { jobApplicationApp } from './jobApplicationAPI.js'
import { eventApp } from './eventAPI.js'
import { requestApp } from './requestAPI.js'
import { announcementApp } from './announcementAPI.js'
import { notificationApp } from './notificationAPI.js'
import { aiReportApp } from './aiReportAPI.js'
import { studyApp } from './studyAPI.js'

const router = Router()

router.use('/auth', authApp)
router.use('/users', userApp)
router.use('/departments', departmentApp)
router.use('/courses', courseApp)
router.use('/subjects', subjectApp)
router.use('/enrollments', enrollmentApp)
router.use('/assignments', assignmentApp)
router.use('/submissions', submissionApp)
router.use('/attendance', attendanceApp)
router.use('/companies', companyApp)
router.use('/job-drives', jobDriveApp)
router.use('/job-applications', jobApplicationApp)
router.use('/events', eventApp)
router.use('/requests', requestApp)
router.use('/announcements', announcementApp)
router.use('/notifications', notificationApp)
router.use('/ai-reports', aiReportApp)
router.use('/study', studyApp)

export default router
