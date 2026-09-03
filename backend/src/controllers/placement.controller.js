import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { checkEligibility } from '../services/eligibility.service.js';
import JobApplication from '../models/JobApplication.js';

export const checkEligibilityForDrive = asyncHandler(async (req, res) => {
  const { driveId } = req.params;
  const student = req.user;

  const drive = await JobDrive.findById(driveId);
  if (!drive) throw new ApiError(404, 'Job drive not found');

  const result = checkEligibility(student, drive);
  res.json({ success: true, data: result });
});

export const applyForJob = asyncHandler(async (req, res) => {
  const { driveId } = req.params;
  const student = req.user;

  const drive = await JobDrive.findById(driveId);
  if (!drive) throw new ApiError(404, 'Job drive not found');

  const eligibility = checkEligibility(student, drive);

  const jobApplication = await JobApplication.create({
    drive: driveId,
    student: student._id,
    stage: 'applied',
    eligibilitySnapshot: eligibility,
    history: [{ stage: 'applied', timestamp: new Date(), note: 'Application submitted' }]
  });

  res.status(201).json({ success: true, data: jobApplication, eligibility });
});

export const getApplications = asyncHandler(async (req, res) => {
  const { driveId } = req.params;
  const applications = await JobApplication.find({ drive: driveId });
  res.json({ success: true, data: applications });
});

export const updateApplicationStage = asyncHandler(async (req, res) => {
  const { applicationId, stage } = req.body;
  const { driveId } = req.params;

  const application = await JobApplication.findById(applicationId);
  if (!application) throw new ApiError(404, 'Application not found');

  const validStages = ['applied', 'shortlisted', 'assessment', 'interview_1', 'interview_2', 'hr_round', 'offer', 'placed', 'rejected'];
  if (!validStages.includes(stage)) {
    throw new ApiError(400, 'Invalid stage');
  }

  application.stage = stage;
  application.history.push({ stage, timestamp: new Date(), note: `Stage updated to ${stage}` });

  if (['placed', 'rejected'].includes(stage)) {
    application.outcome = stage === 'placed' ? 'accepted' : 'rejected';
  }

  await application.save();

  res.json({ success: true, data: application });
});