import { AIReportModel as AIReport } from '../models/AIReportModel.js';
import { UserModel as User } from '../models/UserModel.js';
import { AttendanceSessionModel as AttendanceSession } from '../models/AttendanceSessionModel.js';
import { EnrollmentModel as Enrollment } from '../models/EnrollmentModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { generatePerformanceSummary } from '../services/ai.service.js';
import { logActivity } from '../services/activityLog.service.js';

const gatherPerformanceData = async (studentId) => {
  const data = {
    profile: {},
    enrollments: 0,
    attendance: null
  };

  const student = await User.findById(studentId).select('name profile');
  if (student?.profile) {
    data.profile = {
      rollNumber: student.profile.rollNumber,
      cgpa: student.profile.cgpa,
      backlogs: student.profile.backlogs,
      batchYear: student.profile.batchYear,
      semester: student.profile.semester,
      course: student.profile.course,
      department: student.profile.department
    };
  }

  try {
    data.enrollments = await Enrollment.countDocuments({
      student: studentId,
      status: 'active'
    });
  } catch {
    // best-effort aggregate
  }

  try {
    const sessions = await AttendanceSession.find({ 'records.student': studentId });
    const records = sessions.flatMap((s) =>
      (s.records || []).filter((r) => String(r.student) === String(studentId))
    );
    data.attendance = {
      sessions: sessions.length,
      present: records.filter((r) => r.status === 'present').length,
      absent: records.filter((r) => r.status === 'absent').length,
      late: records.filter((r) => r.status === 'late').length
    };
  } catch {
    data.attendance = null;
  }

  return { student, data };
};

export const getAIReports = asyncHandler(async (req, res) => {
  // Tenant-scoped via the report's student.
  const studentIds = await User.find({ institution: req.user.institution }).select('_id');
  const reports = await AIReport.find({ student: { $in: studentIds.map((s) => s._id) } })
    .populate('student', 'name email')
    .populate('generatedBy', 'name')
    .sort('-createdAt')
    .limit(100);
  res.json({ success: true, data: reports });
});

export const generateReport = asyncHandler(async (req, res) => {
  const { studentId } = req.body;
  if (!studentId) throw new ApiError(400, 'studentId is required');

  const student = await User.findOne({ _id: studentId, institution: req.user.institution });
  if (!student) throw new ApiError(404, 'Student not found');

  const { student: withProfile, data } = await gatherPerformanceData(studentId);

  const result = await generatePerformanceSummary(withProfile || student, data);

  const report = await AIReport.create({
    student: studentId,
    type: 'performance_summary',
    generatedBy: req.user._id,
    dataSnapshotHash: result.snapshotHash,
    input: data,
    output: { summary: result.summary, provider: result.provider },
    provider: result.provider
  });

  await logActivity({
    req,
    action: 'ai_report.generate',
    entityType: 'AIReport',
    entityId: report._id
  });

  res.status(201).json({ success: true, data: report });
});
