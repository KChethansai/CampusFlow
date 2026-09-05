import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { checkEligibility } from '../services/eligibility.service.js';
import { createBulkNotifications } from '../services/notification.service.js';
import { JobApplicationModel as JobApplication } from '../models/JobApplicationModel.js';
import { JobDriveModel as JobDrive } from '../models/JobDriveModel.js';
import { UserModel as User } from '../models/UserModel.js';

export const checkEligibilityForDrive = asyncHandler(async (req, res) => {
  const { driveId } = req.params;
  const student = req.user;

  const drive = await JobDrive.findOne({ _id: driveId, institution: req.user.institution });
  if (!drive) throw new ApiError(404, 'Job drive not found');

  const result = checkEligibility(student, drive);
  res.json({ success: true, data: result });
});

const notifyPlacementTeam = async (drive, student) => {
  const team = await User.find({
    institution: drive.institution,
    role: { $in: ['placement_officer', 'college_admin', 'super_admin'] }
  }).select('_id');

  if (team.length > 0) {
    await createBulkNotifications(
      team.map((member) => ({
        recipient: member._id,
        title: 'New job application',
        message: `${student.name} applied for ${drive.role}`,
        type: 'info',
        link: '/placement'
      }))
    );
  }
};

export const applyForJob = asyncHandler(async (req, res) => {
  const { driveId } = req.params;
  const student = req.user;

  const drive = await JobDrive.findOne({ _id: driveId, institution: req.user.institution });
  if (!drive) throw new ApiError(404, 'Job drive not found');

  const existing = await JobApplication.findOne({
    drive: driveId,
    student: student._id
  });
  if (existing) {
    throw new ApiError(409, 'You have already applied to this drive');
  }

  const eligibility = checkEligibility(student, drive);

  const jobApplication = await JobApplication.create({
    drive: driveId,
    student: student._id,
    stage: 'applied',
    eligibilitySnapshot: eligibility,
    history: [
      { stage: 'applied', at: new Date(), remarks: 'Application submitted' }
    ]
  });

  await notifyPlacementTeam(drive, student);

  res.status(201).json({ success: true, data: jobApplication, eligibility });
});

export const getApplications = asyncHandler(async (req, res) => {
  const { driveId } = req.params;

  const drive = await JobDrive.findOne({ _id: driveId, institution: req.user.institution });
  if (!drive) throw new ApiError(404, 'Job drive not found');

  const applications = await JobApplication.find({ drive: driveId })
    .populate('student')
    .populate('drive');
  res.json({ success: true, data: applications });
});

export const updateApplicationStage = asyncHandler(async (req, res) => {
  const { stage } = req.body;
  const { driveId, applicationId } = req.params;

  const validStages = [
    'applied',
    'shortlisted',
    'assessment',
    'interview_1',
    'interview_2',
    'hr_round',
    'offer',
    'placed',
    'rejected'
  ];
  if (!validStages.includes(stage)) {
    throw new ApiError(400, 'Invalid stage');
  }

  const application = await JobApplication.findOne({
    _id: applicationId,
    drive: driveId
  }).populate('student').populate('drive');
  if (!application) throw new ApiError(404, 'Application not found');
  if (String(application.drive?.institution) !== String(req.user.institution)) {
    throw new ApiError(404, 'Application not found');
  }

  application.stage = stage;
  application.history.push({
    stage,
    at: new Date(),
    remarks: `Stage updated to ${stage}`
  });

  if (['placed', 'rejected'].includes(stage)) {
    application.outcome = stage === 'placed' ? 'accepted' : 'rejected';
  }

  await application.save();

  if (application.student?._id) {
    await createBulkNotifications([
      {
        recipient: application.student._id,
        title: 'Application status update',
        message: `Your application is now: ${stage.replace('_', ' ')}`,
        type: stage === 'rejected' ? 'error' : 'success',
        link: '/placement'
      }
    ]);
  }

  res.json({ success: true, data: application });
});
