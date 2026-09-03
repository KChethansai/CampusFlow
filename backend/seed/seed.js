/**
 * CampusFlow – Comprehensive Seed Script
 * =======================================
 * Creates realistic demo data for every collection.
 *
 * Run:  npm run seed          (from backend/)
 *       node seed/seed.js     (from backend/)
 *
 * WARNING: Drops ALL existing data before seeding.
 */

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

// ── Helpers ─────────────────────────────────────────────────────────────────
const hash = (pw) => bcrypt.hashSync(pw, 12);

/** Return a random integer in [min, max] (inclusive). */
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

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

    // ── Drop existing data ────────────────────────────────────────────────
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const col of collections) {
      await mongoose.connection.db.dropCollection(col.name);
    }
    console.log(`✓ Dropped ${collections.length} existing collection(s)`);

    // ====================================================================
    // 1. Institution
    // ====================================================================
    const [institution] = await Institution.insertMany([
      {
        name: 'Suntek Institute of Technology',
        code: 'SIT',
        address: { city: 'Bangalore', state: 'Karnataka', country: 'India' },
        contactEmail: 'info@sit.edu',
        settings: {
          attendanceThreshold: 75,
          gradingScale: '10-point',
          academicYearStart: '2025-08-01',
        },
        isActive: true,
      },
    ]);
    console.log('✓ Seeded 1 Institution');

    // ====================================================================
    // 2. Departments (3)
    // ====================================================================
    const deptDefs = [
      { name: 'Computer Science & Engineering', code: 'CSE' },
      { name: 'Electronics & Communication Engineering', code: 'ECE' },
      { name: 'Mechanical Engineering', code: 'MECH' },
    ];
    const departments = await Department.insertMany(
      deptDefs.map((d) => ({
        institution: institution._id,
        name: d.name,
        code: d.code,
        isActive: true,
      }))
    );
    console.log(`✓ Seeded ${departments.length} Departments`);

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
    const courses = await Course.insertMany(
      courseDefs.map((c) => ({
        institution: institution._id,
        department: deptMap[c.dept]._id,
        name: c.name,
        code: c.code,
        durationYears: 4,
        totalSemesters: 8,
        isActive: true,
      }))
    );
    console.log(`✓ Seeded ${courses.length} Courses`);

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
    const subjects = await Subject.insertMany(
      subjectDefs.map((s) => ({
        institution: institution._id,
        course: courseMap[s.course]._id,
        code: s.code,
        name: s.name,
        semester: s.semester,
        credits: s.credits,
        isActive: true,
      }))
    );
    console.log(`✓ Seeded ${subjects.length} Subjects`);

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
      isEmailVerified: true,
      isActive: true,
    };

    // --- College Admin ---
    const collegeAdminDoc = {
      name: 'Dr. Ramesh Kulkarni',
      email: 'admin@sit.edu',
      password: hashedAdmin,
      role: 'college_admin',
      institution: institution._id,
      isEmailVerified: true,
      isActive: true,
    };

    // --- Placement Officer ---
    const placementOfficerDoc = {
      name: 'Sneha Rao',
      email: 'placement@sit.edu',
      password: hashedAdmin,
      role: 'placement_officer',
      institution: institution._id,
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
      email: `faculty${i + 1}@sit.edu`,
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
      const cgpa = +(Math.random() * (9.8 - 5.5) + 5.5).toFixed(2);
      const backlogs = randInt(0, 3);
      return {
        name: `${firstName} ${pick(['Kumar', 'Reddy', 'Sharma', 'Patil', 'Joshi', 'Nair', 'Rao', 'Gupta', 'Iyer', 'Das'])}`,
        email: `student${i + 1}@sit.edu`,
        password: hashedStudent,
        role: 'student',
        institution: institution._id,
        department: deptMap[deptCode]._id,
        profile: {
          rollNumber: `SIT${deptCode}${String(i + 1).padStart(3, '0')}`,
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

    const allUserDocs = [superAdminDoc, collegeAdminDoc, placementOfficerDoc, ...facultyDocs, ...studentDocs];
    const users = await User.insertMany(allUserDocs);
    console.log(`✓ Seeded ${users.length} Users (1 super admin, 1 college admin, 1 placement officer, 5 faculty, 30 students)`);

    // Quick lookup helpers
    const userByEmail = {};
    users.forEach((u) => (userByEmail[u.email] = u));

    const allFaculty = users.filter((u) => u.role === 'faculty');
    const allStudents = users.filter((u) => u.role === 'student');
    const collegeAdmin = userByEmail['admin@sit.edu'];
    const placementOfficer = userByEmail['placement@sit.edu'];

    // Assign faculty to subjects (update the subject docs)
    const facultySubjectAssignment = {
      CS401: 'faculty1@sit.edu',
      CS402: 'faculty1@sit.edu',
      CS501: 'faculty2@sit.edu',
      CS502: 'faculty2@sit.edu',
      EC401: 'faculty3@sit.edu',
      EC402: 'faculty3@sit.edu',
      EC501: 'faculty4@sit.edu',
      EC502: 'faculty4@sit.edu',
      ME401: 'faculty5@sit.edu',
      ME402: 'faculty5@sit.edu',
      ME501: 'faculty5@sit.edu',
      ME502: 'faculty5@sit.edu',
    };
    for (const [subCode, email] of Object.entries(facultySubjectAssignment)) {
      await Subject.updateOne(
        { _id: subjectMap[subCode]._id },
        { faculty: userByEmail[email]._id }
      );
    }
    console.log('  → Assigned faculty to subjects');

    // Assign HODs
    await Department.updateOne({ _id: deptMap['CSE']._id },  { hod: userByEmail['faculty1@sit.edu']._id });
    await Department.updateOne({ _id: deptMap['ECE']._id },  { hod: userByEmail['faculty3@sit.edu']._id });
    await Department.updateOne({ _id: deptMap['MECH']._id }, { hod: userByEmail['faculty5@sit.edu']._id });
    console.log('  → Assigned HODs to departments');

    // ====================================================================
    // 6. Enrollments (1 per student)
    // ====================================================================
    const enrollmentDocs = allStudents.map((stu) => {
      const courseId = stu.profile?.course;
      const semester = stu.profile?.semester || 4;
      return {
        institution: institution._id,
        student: stu._id,
        course: courseId,
        academicYear: '2025-26',
        semester,
        status: 'active',
      };
    });
    const enrollments = await Enrollment.insertMany(enrollmentDocs);
    console.log(`✓ Seeded ${enrollments.length} Enrollments`);

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
    const assignmentDocs = assignmentDefs.map((a) => {
      const subj = subjectMap[a.subj];
      const fEmail = facultySubjectAssignment[a.subj];
      return {
        institution: institution._id,
        subject: subj._id,
        title: a.title,
        description: `Complete the ${a.title} assignment as per the guidelines discussed in class.`,
        maxScore: 100,
        dueDate: a.dueDays > 0 ? daysAhead(a.dueDays) : daysAgo(Math.abs(a.dueDays)),
        status: a.status,
        createdBy: userByEmail[fEmail]._id,
      };
    });
    const assignments = await Assignment.insertMany(assignmentDocs);
    console.log(`✓ Seeded ${assignments.length} Assignments`);

    // ====================================================================
    // 8. Attendance Sessions (50)
    // ====================================================================
    const attendanceDocs = [];
    const subjectCodes = Object.keys(subjectMap);

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
        const roll = Math.random();
        let status;
        if (roll < 0.80) status = 'present';
        else if (roll < 0.90) status = 'absent';
        else status = 'late';
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
    const attendanceSessions = await AttendanceSession.insertMany(attendanceDocs);
    console.log(`✓ Seeded ${attendanceSessions.length} Attendance Sessions`);

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
    const companies = await Company.insertMany(
      companyDefs.map((c) => ({
        institution: institution._id,
        name: c.name,
        website: c.website,
        industry: c.industry,
        hrContact: c.hr,
        isActive: true,
      }))
    );
    console.log(`✓ Seeded ${companies.length} Companies`);

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
    const jobDrives = await JobDrive.insertMany(
      driveDefs.map((d) => ({
        institution: institution._id,
        company: companies[d.company]._id,
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
      }))
    );
    console.log(`✓ Seeded ${jobDrives.length} Job Drives`);

    // ====================================================================
    // 11. Job Applications (20)
    // ====================================================================
    const applicationStages = [
      'applied', 'shortlisted', 'assessment', 'interview_1',
      'interview_2', 'hr_round', 'offer', 'placed', 'rejected',
    ];
    const jobAppDocs = [];
    const usedPairs = new Set();

    for (let i = 0; i < 20; i++) {
      let driveIdx, stuIdx, pairKey;
      // Ensure unique (drive, student) pairs
      do {
        driveIdx = randInt(0, jobDrives.length - 1);
        stuIdx = randInt(0, allStudents.length - 1);
        pairKey = `${driveIdx}-${stuIdx}`;
      } while (usedPairs.has(pairKey));
      usedPairs.add(pairKey);

      const stage = applicationStages[randInt(0, applicationStages.length - 1)];
      jobAppDocs.push({
        drive: jobDrives[driveIdx]._id,
        student: allStudents[stuIdx]._id,
        stage,
        resumeUrl: `https://storage.campusflow.app/resumes/student${stuIdx + 1}.pdf`,
      });
    }
    const jobApplications = await JobApplication.insertMany(jobAppDocs);
    console.log(`✓ Seeded ${jobApplications.length} Job Applications`);

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
    const events = await Event.insertMany(
      eventDefs.map((e) => {
        const start = daysAhead(e.startDays);
        const end = new Date(start);
        end.setDate(end.getDate() + e.dur);
        return {
          institution: institution._id,
          title: e.title,
          description: `Join us for ${e.title}. Open to all eligible participants.`,
          type: e.type,
          startAt: start,
          endAt: end,
          visibility: e.vis,
          registeredStudents: allStudents.slice(0, randInt(5, 15)).map((s) => s._id),
        };
      })
    );
    console.log(`✓ Seeded ${events.length} Events`);

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
    const requestDocsArr = requestDefs.map((r) => {
      const student = allStudents[r.stu];
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
      return {
        institution: institution._id,
        student: student._id,
        department: student.department,
        type: r.type,
        title: r.title,
        description: `${r.title}. Please process at the earliest.`,
        status: r.status,
        assignedTo: collegeAdmin._id,
        timeline,
      };
    });
    const requests = await Request.insertMany(requestDocsArr);
    console.log(`✓ Seeded ${requests.length} Requests`);

    // ====================================================================
    // 14. Announcements (10)
    // ====================================================================
    const announcementDefs = [
      { title: 'Mid-Semester Examination Schedule Released',         by: 'admin@sit.edu',    dept: null },
      { title: 'Library Hours Extended During Exam Week',            by: 'admin@sit.edu',    dept: null },
      { title: 'Hackathon Registration Open – CodeSprint 2026',     by: 'faculty1@sit.edu', dept: 'CSE' },
      { title: 'Guest Lecture on 5G Technologies',                  by: 'faculty3@sit.edu', dept: 'ECE' },
      { title: 'Workshop on CNC Programming – Register Now',        by: 'faculty5@sit.edu', dept: 'MECH' },
      { title: 'Fee Payment Deadline: August 31, 2026',             by: 'admin@sit.edu',    dept: null },
      { title: 'Annual Sports Day – Volunteer Registration',        by: 'admin@sit.edu',    dept: null },
      { title: 'Internship Opportunities – Apply Before Sept 15',   by: 'placement@sit.edu', dept: null },
      { title: 'DBMS Lab Rescheduled to Thursday',                  by: 'faculty1@sit.edu', dept: 'CSE' },
      { title: 'ECE Project Expo – Submissions Due Sept 10',        by: 'faculty4@sit.edu', dept: 'ECE' },
    ];
    const announcements = await Announcement.insertMany(
      announcementDefs.map((a, i) => ({
        institution: institution._id,
        department: a.dept ? deptMap[a.dept]._id : undefined,
        title: a.title,
        body: `${a.title}. Please check the notice board or your email for details.`,
        pinned: i < 3,
        createdBy: userByEmail[a.by]._id,
      }))
    );
    console.log(`✓ Seeded ${announcements.length} Announcements`);

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
    const learningResources = await LearningResource.insertMany(
      resourceDefs.map((r) => ({
        institution: institution._id,
        subject: subjectMap[r.subj]._id,
        topic: r.topic,
        title: r.title,
        url: r.url,
        type: r.type,
        difficulty: r.diff,
      }))
    );
    console.log(`✓ Seeded ${learningResources.length} Learning Resources`);

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
