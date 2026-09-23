import { InstitutionModel as Institution, institutionAcceptsEmail } from '../models/InstitutionModel.js';
import { DepartmentModel as Department } from '../models/DepartmentModel.js';
import { UserModel as User } from '../models/UserModel.js';
import { ApiError } from '../utils/ApiError.js';

const allowedRoles = ['super_admin', 'college_admin', 'faculty', 'student', 'placement_officer'];

export const provisionInstitutionForAccount = async ({ caller, role, email, requestedInstitution, department }) => {
  if (!allowedRoles.includes(role)) throw new ApiError(400, 'Invalid role');
  if (role === 'super_admin' && caller.role !== 'super_admin') {
    throw new ApiError(403, 'Only super_admin can create super_admin users');
  }

  const institutionId = caller.role === 'super_admin'
    ? (requestedInstitution || caller.institution)
    : caller.institution;
  const institution = await Institution.findById(institutionId);
  if (!institution) throw new ApiError(400, 'A valid institution is required');
  if (typeof email !== 'string' || email.length > 254 || /\s/.test(email)) {
    throw new ApiError(422, 'A valid email address is required');
  }
  const normalizedEmail = email.toLowerCase();
  const emailParts = normalizedEmail.split('@');
  if (emailParts.length !== 2 || !emailParts[0] || !emailParts[1] || emailParts[0].length > 64 || emailParts[1].length > 253) {
    throw new ApiError(422, 'A valid email address is required');
  }
  if (!institutionAcceptsEmail(institution, normalizedEmail)) {
    throw new ApiError(422, 'Email does not match the institution email pattern');
  }

  if (await User.findOne({ email: normalizedEmail })) throw new ApiError(409, 'Email already registered');

  const departmentId = await validateProvisioningDepartment(institution, department);
  return { institution, email: normalizedEmail, department: departmentId };
};

export const validateProvisioningDepartment = async (institution, department) => {
  if (department === undefined || department === null || department === '') return undefined;
  const departmentId = String(department);
  if (!/^[a-f\d]{24}$/i.test(departmentId)) throw new ApiError(422, 'Invalid department');
  const doc = await Department.findOne({ _id: departmentId, institution: institution._id }).select('_id');
  if (!doc) throw new ApiError(422, 'Department does not belong to the institution');
  return doc._id;
};
