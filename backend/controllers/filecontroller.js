// file controller: authenticated and authorized file downloads/previews.
// Replaces unrestricted express.static for sensitive uploads.
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { UserModel as User } from '../models/UserModel.js';
import { SubmissionModel as Submission } from '../models/SubmissionModel.js';
import { LearningResourceModel as LearningResource } from '../models/LearningResourceModel.js';
import { SubjectModel as Subject } from '../models/SubjectModel.js';
import { EnrollmentModel as Enrollment } from '../models/EnrollmentModel.js';

const uploadDir = path.isAbsolute(env.upload.dir)
  ? env.upload.dir
  : path.join(process.cwd(), env.upload.dir);

// Helper to authenticate request via Bearer header OR ?token= query parameter
export const authenticateFileRequest = async (req) => {
  let token = null;
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    token = header.slice(7);
  } else if (req.query?.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    throw new ApiError(401, 'Not authorized, no token provided');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.secretKey);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Access token expired, please refresh');
    }
    throw new ApiError(401, 'Not authorized, token failed');
  }

  const user = await User.findById(decoded.sub).select('_id role institution isActive passwordChangedAt');
  if (!user) {
    throw new ApiError(401, 'User not found');
  }
  if (!user.isActive) {
    throw new ApiError(403, 'Account deactivated. Contact system admin.');
  }
  if (typeof user.changedPasswordAfter === 'function' && user.changedPasswordAfter(decoded.iat)) {
    throw new ApiError(401, 'Session expired after password change, please log in again');
  }

  return user;
};

// GET /uploads/:filename — authenticated, audience-authorized file delivery
export const serveProtectedUpload = asyncHandler(async (req, res) => {
  const filename = path.basename(req.params.filename || '');
  if (!filename || filename !== req.params.filename) {
    throw new ApiError(400, 'Invalid filename');
  }

  const user = await authenticateFileRequest(req);

  // 1. Check if the file is a submission attachment
  const submission = await Submission.findOne({
    fileUrl: { $regex: filename }
  }).populate('assignment');

  if (submission) {
    const assignment = submission.assignment;
    if (!assignment || String(assignment.institution) !== String(user.institution)) {
      throw new ApiError(404, 'File not found');
    }

    // Student can only access their own submission file
    if (user.role === 'student') {
      if (String(submission.student) !== String(user._id)) {
        throw new ApiError(403, 'Access denied to submission file');
      }
    } else if (user.role === 'faculty') {
      // Faculty must teach the subject or have created the assignment
      const subjectDoc = await Subject.findOne({ _id: assignment.subject, institution: user.institution });
      const teachesSubject = subjectDoc && String(subjectDoc.faculty) === String(user._id);
      const isCreator = String(assignment.createdBy) === String(user._id);
      if (!teachesSubject && !isCreator) {
        throw new ApiError(403, 'Access denied to submission file');
      }
    } else if (!['super_admin', 'college_admin'].includes(user.role)) {
      throw new ApiError(403, 'Access denied to submission file');
    }
  } else {
    // 2. Check if the file is a learning resource attachment
    const resource = await LearningResource.findOne({
      fileUrl: { $regex: filename }
    });

    if (resource) {
      if (String(resource.institution) !== String(user.institution)) {
        throw new ApiError(404, 'File not found');
      }

      if (user.role === 'student') {
        const subjectDoc = await Subject.findOne({ _id: resource.subject, institution: user.institution });
        if (subjectDoc) {
          const enrolled = await Enrollment.findOne({
            institution: user.institution,
            student: user._id,
            course: subjectDoc.course,
            status: 'active'
          });
          if (!enrolled) {
            throw new ApiError(403, 'Access denied to learning resource');
          }
        }
      }
    } else {
      // Not a recognized managed upload
      throw new ApiError(404, 'File not found');
    }
  }

  const filePath = path.join(uploadDir, filename);
  if (!fs.existsSync(filePath)) {
    throw new ApiError(404, 'File not found on storage');
  }

  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.sendFile(filePath);
});

// GET /api/v1/submissions/:id/file — explicit authenticated submission file download
export const getSubmissionFile = asyncHandler(async (req, res) => {
  const user = req.user;
  const submission = await Submission.findById(req.params.id).populate('assignment');
  if (!submission || !submission.fileUrl) {
    throw new ApiError(404, 'Submission or file not found');
  }

  const assignment = submission.assignment;
  if (!assignment || String(assignment.institution) !== String(user.institution)) {
    throw new ApiError(404, 'Submission not found');
  }

  if (user.role === 'student') {
    if (String(submission.student) !== String(user._id)) {
      throw new ApiError(403, 'Access denied to submission file');
    }
  } else if (user.role === 'faculty') {
    const subjectDoc = await Subject.findOne({ _id: assignment.subject, institution: user.institution });
    const teachesSubject = subjectDoc && String(subjectDoc.faculty) === String(user._id);
    const isCreator = String(assignment.createdBy) === String(user._id);
    if (!teachesSubject && !isCreator) {
      throw new ApiError(403, 'Access denied to submission file');
    }
  } else if (!['super_admin', 'college_admin'].includes(user.role)) {
    throw new ApiError(403, 'Access denied to submission file');
  }

  if (/^https?:\/\//.test(submission.fileUrl)) {
    return res.redirect(submission.fileUrl);
  }

  const filename = path.basename(submission.fileUrl);
  const filePath = path.join(uploadDir, filename);
  if (!fs.existsSync(filePath)) {
    throw new ApiError(404, 'File not found on storage');
  }

  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.sendFile(filePath);
});
