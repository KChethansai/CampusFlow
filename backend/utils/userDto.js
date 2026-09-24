// Centralized User Data Transfer Object (DTO) Sanitizer.
// Strictly strips passwords, reset/verification tokens, timestamps, and internal metadata
// from all HTTP API responses.

export const SENSITIVE_USER_FIELDS = [
  'password',
  'emailVerificationToken',
  'emailVerificationExpires',
  'passwordResetToken',
  'passwordResetExpires',
  'passwordChangedAt',
  'notificationPreferences',
  '__v'
];

/**
 * Sanitizes a single user document or plain object for client response.
 * @param {Object} user - Mongoose document or plain user object
 * @param {'self' | 'admin' | 'directory' | 'minimal'} [scope='self'] - Serialization scope
 * @returns {Object|null}
 */
export const sanitizeUser = (user, scope = 'self') => {
  if (!user) return null;

  const raw = typeof user.toObject === 'function' ? user.toObject() : { ...user };

  // Always delete all sensitive security fields
  for (const field of SENSITIVE_USER_FIELDS) {
    delete raw[field];
  }

  // Also sanitize embedded department or institution if populated as full document
  if (raw.department && typeof raw.department === 'object' && raw.department.name) {
    raw.department = {
      _id: raw.department._id,
      name: raw.department.name,
      code: raw.department.code
    };
  } else if (raw.department && typeof raw.department === 'object' && raw.department._id) {
    raw.department = raw.department._id;
  }

  if (raw.institution && typeof raw.institution === 'object' && raw.institution.name) {
    raw.institution = {
      _id: raw.institution._id,
      name: raw.institution.name,
      code: raw.institution.code
    };
  } else if (raw.institution && typeof raw.institution === 'object' && raw.institution._id) {
    raw.institution = raw.institution._id;
  }

  if (scope === 'minimal') {
    return {
      _id: raw._id,
      name: raw.name,
      email: raw.email,
      role: raw.role,
      department: raw.department,
      institution: raw.institution
    };
  }

  if (scope === 'directory') {
    return {
      _id: raw._id,
      name: raw.name,
      email: raw.email,
      role: raw.role,
      institution: raw.institution,
      department: raw.department,
      profile: raw.profile ? {
        avatarUrl: raw.profile.avatarUrl,
        rollNumber: raw.profile.rollNumber,
        designation: raw.profile.designation,
        course: raw.profile.course,
        semester: raw.profile.semester,
        section: raw.profile.section,
        batchYear: raw.profile.batchYear
      } : undefined
    };
  }

  // For 'self' and 'admin' scopes:
  return {
    _id: raw._id,
    name: raw.name,
    email: raw.email,
    role: raw.role,
    institution: raw.institution,
    department: raw.department,
    profile: raw.profile,
    isEmailVerified: raw.isEmailVerified,
    isActive: raw.isActive,
    lastLoginAt: raw.lastLoginAt,
    onboardingTourCompleted: raw.onboardingTourCompleted,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt
  };
};

/**
 * Sanitizes an array of user documents or plain objects.
 */
export const sanitizeUsers = (users, scope = 'directory') => {
  if (!Array.isArray(users)) return [];
  return users.map((u) => sanitizeUser(u, scope)).filter(Boolean);
};
