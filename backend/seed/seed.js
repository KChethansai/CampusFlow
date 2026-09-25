/**
 * CampusFlow – Comprehensive Seed Script
 * =======================================
 * Creates realistic demo data for every collection.
 *
 * Run:  npm run seed          (from backend/)
 *       node seed/seed.js     (from backend/)
 *
 * Idempotent: every section checks for existing documents first, so repeated
 * runs never duplicate data. Deterministic: all randomness flows from a fixed
 * seed, so repeated fresh seeds produce identical demo data.
 *
 * To wipe and reseed from scratch (never in production):
 *       node seed/seed.js --reset
 *
 * WARNING: --reset drops ALL existing data before seeding.
 */

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to run seed script in production (NODE_ENV=production).');
  process.exit(1);
}

const RESET = process.argv.includes('--reset');
if (RESET) {
  console.log('⚠ --reset: existing data will be dropped before seeding.');
}

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import { env } from '../config/env.js'

// ── Mongoose models ─────────────────────────────────────────────────────────
import { InstitutionModel as Institution } from '../models/InstitutionModel.js'
import { DepartmentModel as Department } from '../models/DepartmentModel.js'
import { CourseModel as Course } from '../models/CourseModel.js'
import { SubjectModel as Subject } from '../models/SubjectModel.js'
import { UserModel as User } from '../models/UserModel.js'
import { EnrollmentModel as Enrollment } from '../models/EnrollmentModel.js'
import { AssignmentModel as Assignment } from '../models/AssignmentModel.js'
import { AttendanceSessionModel as AttendanceSession } from '../models/AttendanceSessionModel.js'
import { CompanyModel as Company } from '../models/CompanyModel.js'
import { JobDriveModel as JobDrive } from '../models/JobDriveModel.js'
import { JobApplicationModel as JobApplication } from '../models/JobApplicationModel.js'
import { EventModel as Event } from '../models/EventModel.js'
import { RequestModel as Request } from '../models/RequestModel.js'
import { AnnouncementModel as Announcement } from '../models/AnnouncementModel.js'
import { LearningResourceModel as LearningResource } from '../models/LearningResourceModel.js'
import { NotificationModel as Notification } from '../models/NotificationModel.js'

// ── Helpers ─────────────────────────────────────────────────────────────────
const hash = (pw) => bcrypt.hashSync(pw, 12);

// Deterministic PRNG (mulberry32, fixed seed) — every run generates identical
// demo data. Never use Math.random() in this file.
let rngState = 20260801;
const rng = () => {
  rngState |= 0; rngState = (rngState + 0x6D2B79F5) | 0;
  let t = Math.imul(rngState ^ (rngState >>> 15), 1 | rngState);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** Return a random integer in [min, max] (inclusive). */
const randInt = (min, max) => Math.floor(rng() * (max - min + 1)) + min;

/** Pick a random element from an array. */
const pick = (arr) => arr[randInt(0, arr.length - 1)];

/** Return a Date `daysAgo` days before now, with a random hour offset. */
const daysAgo = (d) => {
  const dt = new Date();
  dt.setDate(dt.getDate() - d);
  dt.setHours(randInt(8, 16), randInt(0, 59));
  return dt;
};

/** Return a Date `daysAhead` days from now. */
const daysAhead = (d) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + d);
  dt.setHours(randInt(8, 16), randInt(0, 59));
  return dt;
};

// ── Main seed function ──────────────────────────────────────────────────────
async function seed() {
  try {
    await mongoose.connect(env.dbUrl);
    console.log(`✓ Connected to MongoDB: ${env.dbUrl}`);

    // ── Reset only on explicit flag ─────────────────────────────────────
    if (RESET) {
      const collections = await mongoose.connection.db.listCollections().toArray();
      for (const col of collections) {
        await mongoose.connection.db.dropCollection(col.name);
      }
      console.log(`✓ Dropped ${collections.length} existing collection(s)`);
    }

    // ====================================================================
    // 1. Institution (upsert by code — reruns reuse it)
    // ====================================================================
    let institution = await Institution.findOne({ code: 'ANURAG' });
    if (!institution) {
      [institution] = await Institution.insertMany([
        {
          name: 'Anurag University',
          code: 'ANURAG',
          emailDomainPattern: 'anurag.edu.in',
          address: { city: 'Bangalore', state: 'Karnataka', country: 'India' },
          contactEmail: 'info@anurag.edu.in',
          settings: {
            attendanceThreshold: 75,
            gradingScale: '10-point',
            academicYearStart: '2025-08-01',
          },
          isActive: true,
        },
      ]);
      console.log('✓ Seeded 1 Institution');
    } else {
      console.log('○ Institution exists — reusing');
    }

    // ====================================================================
    // 2. Departments (3)
    // ====================================================================
    const deptDefs = [
      { name: 'Computer Science & Engineering', code: 'CSE' },
      { name: 'Electronics & Communication Engineering', code: 'ECE' },
      { name: 'Mechanical Engineering', code: 'MECH' },
    ];
    let departments = await Department.find({ institution: institution._id });
    const existingDeptCodes = new Set(departments.map((d) => d.code));
    const missingDepts = deptDefs.filter((d) => !existingDeptCodes.has(d.code));
    if (missingDepts.length > 0) {
      const inserted = await Department.insertMany(
        missingDepts.map((d) => ({
          institution: institution._id,
          name: d.name,
          code: d.code,
          isActive: true,
        }))
      );
      departments = departments.concat(inserted);
      console.log(`✓ Seeded ${inserted.length} Departments`);
    } else {
      console.log(`○ ${departments.length} Departments exist — reusing`);
    }

    // Map for quick lookup: code → doc
    const deptMap = {};
    departments.forEach((d) => (deptMap[d.code] = d));

    // ====================================================================
    // 3. Courses (3)
    // ====================================================================
    const courseDefs = [
      { name: 'B.Tech in Computer Science & Engineering', code: 'BTCSE', dept: 'CSE' },
      { name: 'B.Tech in Electronics & Communication Engineering', code: 'BTECE', dept: 'ECE' },
      { name: 'B.Tech in Mechanical Engineering', code: 'BTMECH', dept: 'MECH' },
    ];
    let courses = await Course.find({ institution: institution._id });
    const existingCourseCodes = new Set(courses.map((c) => c.code));
    const missingCourses = courseDefs.filter((c) => !existingCourseCodes.has(c.code));
    if (missingCourses.length > 0) {
      const inserted = await Course.insertMany(
        missingCourses.map((c) => ({
          institution: institution._id,
          department: deptMap[c.dept]._id,
          name: c.name,
          code: c.code,
          durationYears: 4,
          totalSemesters: 8,
          isActive: true,
        }))
      );
      courses = courses.concat(inserted);
      console.log(`✓ Seeded ${inserted.length} Courses`);
    } else {
      console.log(`○ ${courses.length} Courses exist — reusing`);
    }

    const courseMap = {};
    courses.forEach((c) => (courseMap[c.code] = c));

    // ====================================================================
    // 4. Subjects (12 = 4 per department)
    // ====================================================================
    const subjectDefs = [
      // CSE
      { code: 'CS401', name: 'Database Management Systems',  course: 'BTCSE',  semester: 4, credits: 4 },
      { code: 'CS402', name: 'Operating Systems',            course: 'BTCSE',  semester: 4, credits: 4 },
      { code: 'CS501', name: 'Computer Networks',            course: 'BTCSE',  semester: 5, credits: 3 },
      { code: 'CS502', name: 'Web Technologies',             course: 'BTCSE',  semester: 5, credits: 3 },
      // ECE
      { code: 'EC401', name: 'VLSI Design',                  course: 'BTECE',  semester: 4, credits: 4 },
      { code: 'EC402', name: 'Digital Signal Processing',    course: 'BTECE',  semester: 4, credits: 4 },
      { code: 'EC501', name: 'Electromagnetic Theory',       course: 'BTECE',  semester: 5, credits: 3 },
      { code: 'EC502', name: 'Microcontrollers',             course: 'BTECE',  semester: 5, credits: 3 },
      // MECH
      { code: 'ME401', name: 'Thermodynamics',               course: 'BTMECH', semester: 4, credits: 4 },
      { code: 'ME402', name: 'Fluid Mechanics',              course: 'BTMECH', semester: 4, credits: 4 },
      { code: 'ME501', name: 'Manufacturing Methods',        course: 'BTMECH', semester: 5, credits: 3 },
      { code: 'ME502', name: 'Dynamics of Machines',         course: 'BTMECH', semester: 5, credits: 3 },
    ];
    let subjects = await Subject.find({ institution: institution._id });
    const existingSubjectCodes = new Set(subjects.map((s) => s.code));
    const missingSubjects = subjectDefs.filter((s) => !existingSubjectCodes.has(s.code));
    if (missingSubjects.length > 0) {
      const inserted = await Subject.insertMany(
        missingSubjects.map((s) => ({
          institution: institution._id,
          course: courseMap[s.course]._id,
          code: s.code,
          name: s.name,
          semester: s.semester,
          credits: s.credits,
          isActive: true,
        }))
      );
      subjects = subjects.concat(inserted);
      console.log(`✓ Seeded ${inserted.length} Subjects`);
    } else {
      console.log(`○ ${subjects.length} Subjects exist — reusing`);
    }

    const subjectMap = {};
    subjects.forEach((s) => (subjectMap[s.code] = s));

    // ====================================================================
    // 5. Users
    // ====================================================================
    const hashedAdmin = hash('Admin@123');
    const hashedFaculty = hash('Faculty@123');
    const hashedStudent = hash('Student@123');

    // --- Super Admin ---
    const superAdminDoc = {
      name: 'Super Admin',
      email: 'superadmin@campusflow.app',
      password: hashedAdmin,
      role: 'super_admin',
      institution: institution._id,
      isEmailVerified: true,
      isActive: true,
    };

    // --- College Admin ---
    const collegeAdminDoc = {
      name: 'Dr. Ramesh Kulkarni',
      email: 'admin@anurag.edu.in',
      password: hashedAdmin,
      role: 'college_admin',
      institution: institution._id,
      isEmailVerified: true,
      isActive: true,
    };

    // --- Placement Officer ---
    const placementOfficerDoc = {
      name: 'Sneha Rao',
      email: 'placement@anurag.edu.in',
      password: hashedAdmin,
      role: 'placement_officer',
      institution: institution._id,
      isEmailVerified: true,
      isActive: true,
    };

    // --- HOD (Head of Department, CSE) ---
    const hodDoc = {
      name: 'Dr. Priya Nair',
      email: 'hod.cse@anurag.edu.in',
      password: hashedFaculty,
      role: 'hod',
      institution: institution._id,
      department: deptMap['CSE']._id,
      profile: {
        designation: 'Professor & Head',
        qualification: 'Ph.D. in Computer Science',
        phone: `98${randInt(10000000, 99999999)}`,
      },
      isEmailVerified: true,
      isActive: true,
    };

    // --- Faculty (5) ---
    const facultyDetails = [
      { name: 'Dr. Anil Sharma',    dept: 'CSE',  designation: 'Professor',           qualification: 'Ph.D. in Computer Science' },
      { name: 'Prof. Meena Iyer',   dept: 'CSE',  designation: 'Associate Professor', qualification: 'M.Tech in Software Engineering' },
      { name: 'Dr. Kiran Patil',    dept: 'ECE',  designation: 'Professor',           qualification: 'Ph.D. in VLSI Design' },
      { name: 'Prof. Sunita Reddy', dept: 'ECE',  designation: 'Assistant Professor', qualification: 'M.Tech in Signal Processing' },
      { name: 'Dr. Vikram Singh',   dept: 'MECH', designation: 'Professor',           qualification: 'Ph.D. in Thermal Engineering' },
    ];
    const facultyDocs = facultyDetails.map((f, i) => ({
      name: f.name,
      email: `faculty${i + 1}@anurag.edu.in`,
      password: hashedFaculty,
      role: 'faculty',
      institution: institution._id,
      department: deptMap[f.dept]._id,
      profile: {
        designation: f.designation,
        qualification: f.qualification,
        phone: `98${randInt(10000000, 99999999)}`,
      },
      isEmailVerified: true,
      isActive: true,
    }));

    // --- Students (30) ---
    const indianFirstNames = [
      'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun',
      'Reyansh', 'Sai', 'Arnav', 'Dhruv', 'Kabir',
      'Ananya', 'Diya', 'Myra', 'Ishita', 'Saanvi',
      'Aadhya', 'Riya', 'Tanvi', 'Navya', 'Priya',
      'Rohan', 'Kunal', 'Harsh', 'Nikhil', 'Pranav',
      'Shreya', 'Pooja', 'Kavya', 'Meghana', 'Divya',
    ];
    const deptCodes = ['CSE', 'ECE', 'MECH'];
    const sections = ['A', 'B'];

    const studentDocs = indianFirstNames.map((firstName, i) => {
      const deptCode = deptCodes[i % 3]; // distribute evenly
      const courseCode = { CSE: 'BTCSE', ECE: 'BTECE', MECH: 'BTMECH' }[deptCode];
      const semester = randInt(3, 6);
      const cgpa = +(rng() * (9.8 - 5.5) + 5.5).toFixed(2);
      const backlogs = randInt(0, 3);
      return {
        name: `${firstName} ${pick(['Kumar', 'Reddy', 'Sharma', 'Patil', 'Joshi', 'Nair', 'Rao', 'Gupta', 'Iyer', 'Das'])}`,
        email: `student${i + 1}@anurag.edu.in`,
        password: hashedStudent,
        role: 'student',
        institution: institution._id,
        department: deptMap[deptCode]._id,
        profile: {
          rollNumber: `AU${deptCode}${String(i + 1).padStart(3, '0')}`,
          course: courseMap[courseCode]._id,
          semester,
          section: sections[i % 2],
          batchYear: 2026,
          cgpa,
          backlogs,
          phone: `97${randInt(10000000, 99999999)}`,
        },
        isEmailVerified: true,
        isActive: true,
      };
    });

    // Seeded accounts are provisioned complete — they must never see the questionnaire.
    // Email-keyed upserts: reruns reuse existing accounts, fresh DBs get all 39.
    const allUserDocs = [superAdminDoc, collegeAdminDoc, placementOfficerDoc, hodDoc, ...facultyDocs, ...studentDocs]
      .map((d) => ({ ...d, onboardingCompleted: true }));
    let insertedUsers = 0;
    for (const doc of allUserDocs) {
      const res = await User.updateOne(
        { email: doc.email },
        { $setOnInsert: doc },
        { upsert: true }
      );
      if (res.upsertedCount > 0) insertedUsers += 1;
    }
    const users = await User.find({ institution: institution._id });
    if (insertedUsers > 0) {
      console.log(`✓ Seeded ${insertedUsers} Users (1 super admin, 1 college admin, 1 placement officer, 1 hod, 5 faculty, 30 students)`);
    } else {
      console.log(`○ ${users.length} Users exist — reusing`);
    }

    // Quick lookup helpers
    const userByEmail = {};
    users.forEach((u) => (userByEmail[u.email] = u));

    const allFaculty = users.filter((u) => u.role === 'faculty');
    const allStudents = users.filter((u) => u.role === 'student');
    const collegeAdmin = userByEmail['admin@anurag.edu.in'];
    const placementOfficer = userByEmail['placement@anurag.edu.in'];

    // Assign faculty to subjects (update the subject docs)
    const facultySubjectAssignment = {
      CS401: 'faculty1@anurag.edu.in',
      CS402: 'faculty1@anurag.edu.in',
      CS501: 'faculty2@anurag.edu.in',
      CS502: 'faculty2@anurag.edu.in',
      EC401: 'faculty3@anurag.edu.in',
      EC402: 'faculty3@anurag.edu.in',
      EC501: 'faculty4@anurag.edu.in',
      EC502: 'faculty4@anurag.edu.in',
      ME401: 'faculty5@anurag.edu.in',
      ME402: 'faculty5@anurag.edu.in',
      ME501: 'faculty5@anurag.edu.in',
      ME502: 'faculty5@anurag.edu.in',
    };
    // Seed subject codes actually present in this institution's graph — foreign
    // subject graphs (other departments, other seeds) are never touched.
    const seedSubCodes = Object.keys(facultySubjectAssignment).filter((c) => subjectMap[c]);
    for (const [subCode, email] of Object.entries(facultySubjectAssignment)) {
      if (!subjectMap[subCode] || !userByEmail[email]) continue;
      await Subject.updateOne(
        { _id: subjectMap[subCode]._id },
        { faculty: userByEmail[email]._id }
      );
    }
    console.log('  → Assigned faculty to subjects');

    // Assign HODs (only where the department and user exist)
    if (deptMap['CSE'] && userByEmail['hod.cse@anurag.edu.in']) {
      await Department.updateOne({ _id: deptMap['CSE']._id },  { hod: userByEmail['hod.cse@anurag.edu.in']._id });
    }
    if (deptMap['ECE'] && userByEmail['faculty3@anurag.edu.in']) {
      await Department.updateOne({ _id: deptMap['ECE']._id },  { hod: userByEmail['faculty3@anurag.edu.in']._id });
    }
    if (deptMap['MECH'] && userByEmail['faculty5@anurag.edu.in']) {
      await Department.updateOne({ _id: deptMap['MECH']._id }, { hod: userByEmail['faculty5@anurag.edu.in']._id });
    }
    console.log('  → Assigned HODs to departments');

    // ====================================================================
    // 6. Enrollments (1 per student)
    // ====================================================================
    let insertedEnrollments = 0;
    for (const stu of allStudents) {
      const courseId = stu.profile?.course;
      const semester = stu.profile?.semester || 4;
      const res = await Enrollment.updateOne(
        { student: stu._id, course: courseId },
        { $setOnInsert: {
          institution: institution._id,
          student: stu._id,
          course: courseId,
          academicYear: '2025-26',
          semester,
          status: 'active',
        } },
        { upsert: true }
      );
      if (res.upsertedCount > 0) insertedEnrollments += 1;
    }
    const enrollments = await Enrollment.find({ institution: institution._id });
    if (insertedEnrollments > 0) {
      console.log(`✓ Seeded ${insertedEnrollments} Enrollments`);
    } else {
      console.log(`○ ${enrollments.length} Enrollments exist — reusing`);
    }

    // ====================================================================
    // 7. Assignments (10)
    // ====================================================================
    const assignmentDefs = [
      { title: 'ER Diagram Design',            subj: 'CS401', status: 'published', dueDays: -5 },
      { title: 'SQL Query Optimization',       subj: 'CS401', status: 'open',      dueDays: 7 },
      { title: 'Process Scheduling Simulation', subj: 'CS402', status: 'graded',    dueDays: -15 },
      { title: 'Socket Programming Lab',       subj: 'CS501', status: 'open',      dueDays: 10 },
      { title: 'Responsive Web Page',          subj: 'CS502', status: 'draft',     dueDays: 14 },
      { title: 'CMOS Inverter Analysis',       subj: 'EC401', status: 'closed',    dueDays: -10 },
      { title: 'FIR Filter Design',            subj: 'EC402', status: 'published', dueDays: 5 },
      { title: 'Antenna Gain Measurement',     subj: 'EC501', status: 'open',      dueDays: 8 },
      { title: 'Carnot Cycle Problems',        subj: 'ME401', status: 'graded',    dueDays: -20 },
      { title: 'Pipe Flow Calculations',       subj: 'ME402', status: 'open',      dueDays: 12 },
    ];
    let insertedAssignments = 0;
    let skippedAssignments = 0;
    for (const a of assignmentDefs) {
      const subj = subjectMap[a.subj];
      const fEmail = facultySubjectAssignment[a.subj];
      if (!subj || !userByEmail[fEmail]) { skippedAssignments += 1; continue; }
      const res = await Assignment.updateOne(
        { institution: institution._id, subject: subj._id, title: a.title },
        { $setOnInsert: {
          institution: institution._id,
          subject: subj._id,
          title: a.title,
          description: `Complete the ${a.title} assignment as per the guidelines discussed in class.`,
          maxScore: 100,
          dueDate: a.dueDays > 0 ? daysAhead(a.dueDays) : daysAgo(Math.abs(a.dueDays)),
          status: a.status,
          createdBy: userByEmail[fEmail]._id,
        } },
        { upsert: true }
      );
      if (res.upsertedCount > 0) insertedAssignments += 1;
    }
    const assignments = await Assignment.find({ institution: institution._id });
    if (insertedAssignments > 0) {
      console.log(`✓ Seeded ${insertedAssignments} Assignments`);
    } else {
      console.log(`○ ${assignments.length} Assignments exist — reusing`);
    }
    if (skippedAssignments > 0) {
      console.log(`○ ${skippedAssignments} Assignment defs skipped (subject absent from graph)`);
    }

    // ====================================================================
    // 8. Attendance Sessions (50)
    // ====================================================================
    // Attendance is generated only for seed subjects lacking sessions — never
    // duplicated on reruns, never fabricated for foreign subject graphs.
    const seedSubjectIds = Object.values(subjectMap).map((s) => s._id);
    const existingSeedSessions = await AttendanceSession.countDocuments({
      institution: institution._id,
      subject: { $in: seedSubjectIds },
    });
    let attendanceSessions = [];
    if (existingSeedSessions === 0 && seedSubCodes.length > 0) {
      const attendanceDocs = [];
      const subjectCodes = seedSubCodes;

      for (let i = 0; i < 50; i++) {
        const subCode = subjectCodes[i % subjectCodes.length];
        const subj = subjectMap[subCode];
        const fEmail = facultySubjectAssignment[subCode];
        const dayOffset = randInt(1, 30);
        const period = randInt(1, 6);

        // Find students in the same course as this subject
        const courseForSubject = subj.course;
        const studentsInCourse = allStudents.filter(
          (s) => s.profile?.course?.toString() === courseForSubject.toString()
        );

        const records = studentsInCourse.map((stu) => {
          const roll = rng();
          // Deterministic low-attendance cases: every 10th student struggles.
          const stuIdx = allStudents.findIndex((s) => String(s._id) === String(stu._id));
          const atRisk = stuIdx % 10 === 9;
          let status;
          if (atRisk) {
            if (roll < 0.45) status = 'absent';
            else if (roll < 0.65) status = 'present';
            else if (roll < 0.85) status = 'late';
            else status = 'od';
          } else {
            if (roll < 0.80) status = 'present';
            else if (roll < 0.90) status = 'absent';
            else status = 'late';
          }
          return { student: stu._id, status };
        });

        attendanceDocs.push({
          institution: institution._id,
          subject: subj._id,
          date: daysAgo(dayOffset),
          period,
          markedBy: userByEmail[fEmail]._id,
          records,
        });
      }
      attendanceSessions = await AttendanceSession.insertMany(attendanceDocs);
      console.log(`✓ Seeded ${attendanceSessions.length} Attendance Sessions`);
    } else if (seedSubCodes.length === 0) {
      console.log('○ No seed subjects in graph — attendance generation skipped');
    } else {
      console.log(`○ ${existingSeedSessions} Attendance Sessions exist — reusing`);
    }

    // ====================================================================
    // 9. Companies (5)
    // ====================================================================
    const companyDefs = [
      { name: 'Tata Consultancy Services', website: 'https://www.tcs.com',     industry: 'IT Services',    hr: 'hr@tcs.com' },
      { name: 'Infosys',                   website: 'https://www.infosys.com', industry: 'IT Services',    hr: 'hr@infosys.com' },
      { name: 'Wipro',                     website: 'https://www.wipro.com',   industry: 'IT Services',    hr: 'careers@wipro.com' },
      { name: 'Google',                    website: 'https://careers.google.com', industry: 'Technology',  hr: 'recruiting@google.com' },
      { name: 'Amazon',                    website: 'https://www.amazon.jobs',  industry: 'E-Commerce & Cloud', hr: 'campus@amazon.com' },
    ];
    let insertedCompanies = 0;
    for (const c of companyDefs) {
      const res = await Company.updateOne(
        { institution: institution._id, name: c.name },
        { $setOnInsert: {
          institution: institution._id,
          name: c.name,
          website: c.website,
          industry: c.industry,
          hrContact: c.hr,
          isActive: true,
        } },
        { upsert: true }
      );
      if (res.upsertedCount > 0) insertedCompanies += 1;
    }
    let companies = await Company.find({ institution: institution._id });
    if (insertedCompanies > 0) {
      console.log(`✓ Seeded ${insertedCompanies} Companies`);
    } else {
      console.log(`○ ${companies.length} Companies exist — reusing`);
    }

    // ====================================================================
    // 10. Job Drives (5)
    // ====================================================================
    const driveDefs = [
      { company: 0, role: 'Software Engineer',          pkg: 7.0,  minCGPA: 7.0, maxBack: 0, jt: 'full-time' },
      { company: 1, role: 'Systems Engineer',            pkg: 4.5,  minCGPA: 6.0, maxBack: 2, jt: 'full-time' },
      { company: 2, role: 'Project Engineer',            pkg: 5.0,  minCGPA: 6.5, maxBack: 1, jt: 'full-time' },
      { company: 3, role: 'SDE Intern',                  pkg: 12.0, minCGPA: 7.5, maxBack: 0, jt: 'internship' },
      { company: 4, role: 'Operations Associate',        pkg: 8.5,  minCGPA: 6.5, maxBack: 1, jt: 'full-time' },
    ];
    const companyByName = {};
    companies.forEach((c) => (companyByName[c.name] = c));
    let insertedDrives = 0;
    const seedDrives = [];
    for (const d of driveDefs) {
      const company = companyByName[companyDefs[d.company].name];
      let drive = await JobDrive.findOne({ company: company._id, role: d.role });
      if (!drive) {
        drive = await JobDrive.create({
          institution: institution._id,
          company: company._id,
          role: d.role,
          jobType: d.jt,
          packageLPA: d.pkg,
          location: 'Bangalore',
          eligibility: {
            minCGPA: d.minCGPA,
            graduationYear: 2026,
            maxBacklogs: d.maxBack,
            allowedDepartments: departments.map((dp) => dp._id),
          },
          applicationDeadline: daysAhead(randInt(10, 30)),
          status: 'active',
        });
        insertedDrives += 1;
      }
      seedDrives.push(drive);
    }
    const jobDrives = await JobDrive.find({ institution: institution._id });
    if (insertedDrives > 0) {
      console.log(`✓ Seeded ${insertedDrives} Job Drives`);
    } else {
      console.log(`○ ${jobDrives.length} Job Drives exist — reusing`);
    }

    // ====================================================================
    // 11. Job Applications (20)
    // ====================================================================
    const applicationStages = [
      'applied', 'shortlisted', 'assessment', 'interview_1',
      'interview_2', 'hr_round', 'offer', 'placed', 'rejected',
    ];
    let insertedApps = 0;
    {
      const usedPairs = new Set();
      for (let i = 0; i < 20; i++) {
        let driveIdx, stuIdx, pairKey;
        // Ensure unique (drive, student) pairs
        do {
          driveIdx = randInt(0, seedDrives.length - 1);
          stuIdx = randInt(0, allStudents.length - 1);
          pairKey = `${driveIdx}-${stuIdx}`;
        } while (usedPairs.has(pairKey));
        usedPairs.add(pairKey);

        const stage = applicationStages[randInt(0, applicationStages.length - 1)];
        const res = await JobApplication.updateOne(
          { drive: seedDrives[driveIdx]._id, student: allStudents[stuIdx]._id },
          { $setOnInsert: {
            drive: seedDrives[driveIdx]._id,
            student: allStudents[stuIdx]._id,
            stage,
            resumeUrl: `https://storage.campusflow.app/resumes/student${stuIdx + 1}.pdf`,
          } },
          { upsert: true }
        );
        if (res.upsertedCount > 0) insertedApps += 1;
      }
    }
    const jobApplications = await JobApplication.find({
      drive: { $in: seedDrives.map((d) => d._id) },
    });
    if (insertedApps > 0) {
      console.log(`✓ Seeded ${insertedApps} Job Applications`);
    } else {
      console.log(`○ ${jobApplications.length} Job Applications exist — reusing`);
    }

    // ====================================================================
    // 12. Events (5)
    // ====================================================================
    const eventDefs = [
      { title: 'Annual Technical Symposium – TechVista 2026', type: 'technical', startDays: 15, dur: 2, vis: 'public' },
      { title: 'Cultural Fest – Sargam 2026',                  type: 'cultural',  startDays: 30, dur: 3, vis: 'public' },
      { title: 'Workshop on Machine Learning with Python',     type: 'academic',  startDays: 7,  dur: 1, vis: 'department' },
      { title: 'Inter-College Cricket Tournament',             type: 'sports',    startDays: 20, dur: 2, vis: 'public' },
      { title: 'Campus Recruitment Drive – Orientation',       type: 'placement', startDays: 5,  dur: 1, vis: 'internal' },
    ];
    let insertedEvents = 0;
    for (const e of eventDefs) {
      const start = daysAhead(e.startDays);
      const end = new Date(start);
      end.setDate(end.getDate() + e.dur);
      const res = await Event.updateOne(
        { institution: institution._id, title: e.title },
        { $setOnInsert: {
          institution: institution._id,
          title: e.title,
          description: `Join us for ${e.title}. Open to all eligible participants.`,
          type: e.type,
          startAt: start,
          endAt: end,
          visibility: e.vis,
          registeredStudents: allStudents.slice(0, randInt(5, 15)).map((s) => s._id),
        } },
        { upsert: true }
      );
      if (res.upsertedCount > 0) insertedEvents += 1;
    }
    let events = await Event.find({ institution: institution._id });
    if (insertedEvents > 0) {
      console.log(`✓ Seeded ${insertedEvents} Events`);
    } else {
      console.log(`○ ${events.length} Events exist — reusing`);
    }

    // ====================================================================
    // 13. Requests (10)
    // ====================================================================
    const requestTypes = ['leave', 'bonafide', 'revaluation', 'other'];
    const requestStatuses = ['pending', 'in_review', 'approved', 'rejected'];
    const requestDefs = [
      { type: 'leave',        title: 'Sick leave for 3 days',              stu: 0,  status: 'approved' },
      { type: 'leave',        title: 'Family function leave',              stu: 3,  status: 'pending' },
      { type: 'bonafide',     title: 'Bonafide certificate for bank loan', stu: 5,  status: 'approved' },
      { type: 'bonafide',     title: 'Bonafide for passport application',  stu: 10, status: 'in_review' },
      { type: 'revaluation',  title: 'Revaluation – DBMS End Sem',        stu: 2,  status: 'pending' },
      { type: 'revaluation',  title: 'Revaluation – OS Mid Sem',          stu: 7,  status: 'rejected' },
      { type: 'leave',        title: 'Medical emergency leave',            stu: 15, status: 'approved' },
      { type: 'other',        title: 'Request for lab access extension',   stu: 20, status: 'in_review' },
      { type: 'bonafide',     title: 'Bonafide for education loan',        stu: 25, status: 'pending' },
      { type: 'leave',        title: 'Personal leave – 2 days',            stu: 28, status: 'approved' },
    ];
    let insertedRequests = 0;
    for (const r of requestDefs) {
      const student = allStudents[r.stu];
      if (!student || !collegeAdmin) continue;
      const exists = await Request.findOne({
        institution: institution._id,
        student: student._id,
        title: r.title,
      });
      if (exists) continue;
      const timeline = [
        {
          status: 'pending',
          remarks: 'Request submitted by student.',
          updatedBy: student._id,
          at: daysAgo(randInt(3, 10)),
        },
      ];
      if (r.status !== 'pending') {
        timeline.push({
          status: r.status,
          remarks:
            r.status === 'approved'
              ? 'Approved by admin.'
              : r.status === 'rejected'
                ? 'Rejected – insufficient documentation.'
                : 'Under review by department.',
          updatedBy: collegeAdmin._id,
          at: daysAgo(randInt(0, 2)),
        });
      }
      await Request.create({
        institution: institution._id,
        student: student._id,
        department: student.department,
        type: r.type,
        title: r.title,
        description: `${r.title}. Please process at the earliest.`,
        status: r.status,
        assignedTo: collegeAdmin._id,
        timeline,
      });
      insertedRequests += 1;
    }
    const requests = await Request.find({ institution: institution._id });
    if (insertedRequests > 0) {
      console.log(`✓ Seeded ${insertedRequests} Requests`);
    } else {
      console.log(`○ ${requests.length} Requests exist — reusing`);
    }

    // ====================================================================
    // 14. Announcements (10)
    // ====================================================================
    const announcementDefs = [
      { title: 'Mid-Semester Examination Schedule Released',         by: 'admin@anurag.edu.in',    dept: null },
      { title: 'Library Hours Extended During Exam Week',            by: 'admin@anurag.edu.in',    dept: null },
      { title: 'Hackathon Registration Open – CodeSprint 2026',     by: 'faculty1@anurag.edu.in', dept: 'CSE' },
      { title: 'Guest Lecture on 5G Technologies',                  by: 'faculty3@anurag.edu.in', dept: 'ECE' },
      { title: 'Workshop on CNC Programming – Register Now',        by: 'faculty5@anurag.edu.in', dept: 'MECH' },
      { title: 'Fee Payment Deadline: August 31, 2026',             by: 'admin@anurag.edu.in',    dept: null },
      { title: 'Annual Sports Day – Volunteer Registration',        by: 'admin@anurag.edu.in',    dept: null },
      { title: 'Internship Opportunities – Apply Before Sept 15',   by: 'placement@anurag.edu.in', dept: null },
      { title: 'DBMS Lab Rescheduled to Thursday',                  by: 'faculty1@anurag.edu.in', dept: 'CSE' },
      { title: 'ECE Project Expo – Submissions Due Sept 10',        by: 'faculty4@anurag.edu.in', dept: 'ECE' },
    ];
    let insertedAnnouncements = 0;
    for (const [i, a] of announcementDefs.entries()) {
      if (!userByEmail[a.by]) continue;
      const exists = await Announcement.findOne({ institution: institution._id, title: a.title });
      if (exists) continue;
      await Announcement.create({
        institution: institution._id,
        department: a.dept && deptMap[a.dept] ? deptMap[a.dept]._id : undefined,
        title: a.title,
        body: `${a.title}. Please check the notice board or your email for details.`,
        pinned: i < 3,
        createdBy: userByEmail[a.by]._id,
      });
      insertedAnnouncements += 1;
    }
    const announcements = await Announcement.find({ institution: institution._id });
    if (insertedAnnouncements > 0) {
      console.log(`✓ Seeded ${insertedAnnouncements} Announcements`);
    } else {
      console.log(`○ ${announcements.length} Announcements exist — reusing`);
    }

    // ====================================================================
    // 15. Learning Resources (5)
    // ====================================================================
    const resourceDefs = [
      { subj: 'CS401', topic: 'Normalization', title: 'Database Normalization – 1NF to BCNF',   url: 'https://www.youtube.com/watch?v=UrYLYV7WSHM', type: 'video',    diff: 'intermediate' },
      { subj: 'CS402', topic: 'Scheduling',    title: 'CPU Scheduling Algorithms Explained',     url: 'https://www.geeksforgeeks.org/cpu-scheduling-in-operating-systems/', type: 'document', diff: 'beginner' },
      { subj: 'EC401', topic: 'CMOS Logic',    title: 'CMOS Inverter – Static Characteristics',  url: 'https://nptel.ac.in/courses/117/106/117106092/', type: 'link',     diff: 'advanced' },
      { subj: 'ME401', topic: 'Carnot Cycle',  title: 'Thermodynamics Lecture Notes – Carnot',   url: 'https://ocw.mit.edu/courses/2-005-thermal-fluids-engineering/resources/', type: 'document', diff: 'intermediate' },
      { subj: 'CS501', topic: 'TCP/IP',        title: 'Computer Networks – TCP/IP Model Podcast', url: 'https://podcasts.example.com/cn-tcpip', type: 'podcast', diff: 'beginner' },
    ];
    let insertedResources = 0;
    for (const r of resourceDefs) {
      if (!subjectMap[r.subj]) continue;
      const exists = await LearningResource.findOne({
        institution: institution._id,
        subject: subjectMap[r.subj]._id,
        title: r.title,
      });
      if (exists) continue;
      await LearningResource.create({
        institution: institution._id,
        subject: subjectMap[r.subj]._id,
        topic: r.topic,
        title: r.title,
        url: r.url,
        type: r.type,
        difficulty: r.diff,
      });
      insertedResources += 1;
    }
    const learningResources = await LearningResource.find({ institution: institution._id });
    if (insertedResources > 0) {
      console.log(`✓ Seeded ${insertedResources} Learning Resources`);
    } else {
      console.log(`○ ${learningResources.length} Learning Resources exist — reusing`);
    }

    // ====================================================================
    // 16. Notifications (read + unread across roles)
    // ====================================================================
    const existingNotifs = await Notification.countDocuments({
      recipient: { $in: users.map((u) => u._id) },
    });
    let notificationCount = existingNotifs;
    if (existingNotifs === 0) {
      const notifDefs = [
        { to: 'student1@anurag.edu.in',  title: 'Assignment due soon',            message: 'SQL Query Optimization is due in 7 days.', type: 'warning', category: 'assignment', read: false },
        { to: 'student1@anurag.edu.in',  title: 'Low attendance alert',           message: 'Your DBMS attendance is below 75%. Attend upcoming sessions.', type: 'error', category: 'system', read: false },
        { to: 'student2@anurag.edu.in',  title: 'Assignment graded',              message: 'Process Scheduling Simulation has been graded.', type: 'success', category: 'assignment', read: true },
        { to: 'student5@anurag.edu.in',  title: 'Placement shortlist',            message: 'You are shortlisted for the Systems Engineer drive.', type: 'success', category: 'placement', read: false },
        { to: 'student10@anurag.edu.in', title: 'Bonafide request approved',      message: 'Your bonafide certificate request was approved.', type: 'success', category: 'request', read: true },
        { to: 'faculty1@anurag.edu.in',  title: 'Timetable updated',              message: 'CS401 moves to Thursday, period 3, effective next week.', type: 'info', category: 'system', read: false },
        { to: 'faculty3@anurag.edu.in',  title: 'Submissions pending review',     message: '12 FIR Filter Design submissions await review.', type: 'warning', category: 'assignment', read: false },
        { to: 'hod.cse@anurag.edu.in',   title: 'Department attendance review',   message: '3 students are below the 75% threshold this month.', type: 'warning', category: 'system', read: false },
        { to: 'admin@anurag.edu.in',     title: 'New leave requests',             message: '4 leave requests are waiting for approval.', type: 'info', category: 'request', read: false },
        { to: 'admin@anurag.edu.in',     title: 'Drive applications closed',      message: 'Applications closed for the Project Engineer drive.', type: 'info', category: 'placement', read: true },
        { to: 'placement@anurag.edu.in', title: 'Offer letters pending',          message: '2 offer letters await company confirmation.', type: 'warning', category: 'placement', read: false },
        { to: 'student15@anurag.edu.in', title: 'TechVista 2026 registrations',   message: 'Registrations close in 5 days. 40 seats left.', type: 'info', category: 'event', read: false },
        { to: 'student20@anurag.edu.in', title: 'Mid-sem schedule released',      message: 'The mid-semester examination schedule is now live.', type: 'info', category: 'announcement', read: true },
        { to: 'student25@anurag.edu.in', title: 'Welcome to CampusFlow',          message: 'Your account is ready. Complete your profile to get started.', type: 'info', category: 'account', read: true },
      ];
      const notifDocs = notifDefs
        .filter((n) => userByEmail[n.to])
        .map((n) => ({
          recipient: userByEmail[n.to]._id,
          title: n.title,
          message: n.message,
          type: n.type,
          category: n.category,
          isRead: n.read,
        }));
      const notifications = await Notification.insertMany(notifDocs);
      notificationCount = notifications.length;
      console.log(`✓ Seeded ${notifications.length} Notifications`);
    } else {
      console.log(`○ ${existingNotifs} Notifications exist — reusing`);
    }

    // ====================================================================
    // Summary
    // ====================================================================
    console.log('\n══════════════════════════════════════════');
    console.log('  🌱  Seed completed successfully!');
    console.log('══════════════════════════════════════════');
    console.log(`  Institution        : 1`);
    console.log(`  Departments        : ${departments.length}`);
    console.log(`  Courses            : ${courses.length}`);
    console.log(`  Subjects           : ${subjects.length}`);
    console.log(`  Users              : ${users.length}`);
    console.log(`  Enrollments        : ${enrollments.length}`);
    console.log(`  Assignments        : ${assignments.length}`);
    console.log(`  Attendance Sessions: ${attendanceSessions.length}`);
    console.log(`  Companies          : ${companies.length}`);
    console.log(`  Job Drives         : ${jobDrives.length}`);
    console.log(`  Job Applications   : ${jobApplications.length}`);
    console.log(`  Events             : ${events.length}`);
    console.log(`  Requests           : ${requests.length}`);
    console.log(`  Announcements      : ${announcements.length}`);
    console.log(`  Learning Resources : ${learningResources.length}`);
    console.log(`  Notifications      : ${notificationCount}`);
    console.log('══════════════════════════════════════════\n');
  } catch (err) {
    console.error('✗ Seed failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('✓ MongoDB connection closed');
  }
}

seed();
