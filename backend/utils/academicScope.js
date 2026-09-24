import { AssignmentModel as Assignment } from '../models/AssignmentModel.js';
import { SubjectModel as Subject } from '../models/SubjectModel.js';
import { EnrollmentModel as Enrollment } from '../models/EnrollmentModel.js';

/**
 * Returns the Subject IDs taught by the given faculty within their institution.
 */
export const getFacultyTaughtSubjectIds = async (user) => {
  return await Subject.find({
    faculty: user._id,
    institution: user.institution
  }).distinct('_id');
};

/**
 * Returns all Assignment IDs visible to the given user based on their role and tenant.
 * - super_admin / college_admin: all assignments in institution
 * - faculty: assignments created by faculty OR for subjects taught by faculty
 * - student: assignments for subjects in courses student is actively enrolled in, non-draft
 */
export const getVisibleAssignmentIds = async (user) => {
  if (user.role === 'student') {
    const activeCourses = await Enrollment.find({
      student: user._id,
      institution: user.institution,
      status: 'active'
    }).distinct('course');
    const enrolledSubjects = await Subject.find({
      course: { $in: activeCourses },
      institution: user.institution
    }).distinct('_id');
    const assignments = await Assignment.find({
      institution: user.institution,
      subject: { $in: enrolledSubjects },
      status: { $ne: 'draft' }
    }).select('_id');
    return assignments.map((a) => a._id);
  }

  if (user.role === 'faculty') {
    const taughtSubjects = await getFacultyTaughtSubjectIds(user);
    const assignments = await Assignment.find({
      institution: user.institution,
      $or: [
        { createdBy: user._id },
        { subject: { $in: taughtSubjects } }
      ]
    }).select('_id');
    return assignments.map((a) => a._id);
  }

  // college_admin / super_admin
  const scoped = await Assignment.find({ institution: user.institution }).select('_id');
  return scoped.map((a) => a._id);
};

/**
 * Checks whether a faculty user can access/view/grade an assignment or submission.
 * Allowed if:
 * 1. Faculty created the assignment (assignment.createdBy == faculty._id)
 * 2. Faculty is assigned to teach the subject (subject.faculty == faculty._id)
 */
export const canFacultyAccessAssignment = async (facultyUser, assignment, subjectDoc = null) => {
  if (String(assignment.createdBy?._id || assignment.createdBy) === String(facultyUser._id)) {
    return true;
  }
  const subjectId = assignment.subject?._id || assignment.subject;
  if (!subjectId) return false;

  const subject = subjectDoc || await Subject.findOne({
    _id: subjectId,
    institution: facultyUser.institution
  }).select('faculty');

  return Boolean(subject && String(subject.faculty) === String(facultyUser._id));
};

/**
 * Checks whether a user can access a submission.
 */
export const canUserAccessSubmission = async (user, submission, assignmentDoc = null) => {
  if (!submission) return false;

  // Student can only access their own submission
  if (user.role === 'student') {
    return String(submission.student?._id || submission.student) === String(user._id);
  }

  const assignment = assignmentDoc || submission.assignment;
  if (!assignment) return false;

  // Institution check
  if (assignment.institution && String(assignment.institution) !== String(user.institution)) {
    return false;
  }

  // College Admin / Super Admin within institution
  if (['college_admin', 'super_admin'].includes(user.role)) {
    return true;
  }

  // Faculty: must be creator or teach the subject
  if (user.role === 'faculty') {
    return await canFacultyAccessAssignment(user, assignment);
  }

  return false;
};
