import { InstitutionModel as Institution } from '../models/InstitutionModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { pageParams, pagedResponse, pick } from '../utils/scope.js';

export const getAllInstitutions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req);
  const filter = req.user.role === 'super_admin' ? {} : { _id: req.user.institution };
  const [institutions, total] = await Promise.all([
    Institution.find(filter).skip(skip).limit(limit).sort('name'),
    Institution.countDocuments(filter),
  ]);
  pagedResponse(res, institutions, total, { page, limit });
});

export const getInstitutionById = asyncHandler(async (req, res) => {
  const doc = await Institution.findById(req.params.id);
  if (!doc) throw new ApiError(404, 'Institution not found');
  if (req.user.role !== 'super_admin' && String(doc._id) !== String(req.user.institution)) {
    throw new ApiError(404, 'Institution not found');
  }
  res.json({ success: true, data: doc });
});

export const createInstitution = asyncHandler(async (req, res) => {
  const { name, code, address, contactEmail, logoUrl, settings } = req.body;
  const existing = await Institution.findOne({ code: String(code).toUpperCase().trim() });
  if (existing) throw new ApiError(409, 'Institution code already exists');
  const doc = await Institution.create({ name, code, address, contactEmail, logoUrl, settings });
  res.status(201).json({ success: true, data: doc });
});

export const updateInstitution = asyncHandler(async (req, res) => {
  const doc = await Institution.findByIdAndUpdate(
    req.params.id,
    pick(req.body, ['name', 'code', 'address', 'contactEmail', 'logoUrl', 'settings', 'isActive']),
    { new: true, runValidators: true }
  );
  if (!doc) throw new ApiError(404, 'Institution not found');
  res.json({ success: true, data: doc });
});

export const deleteInstitution = asyncHandler(async (req, res) => {
  const doc = await Institution.findByIdAndDelete(req.params.id);
  if (!doc) throw new ApiError(404, 'Institution not found');
  res.json({ success: true, message: 'Institution deleted' });
});
