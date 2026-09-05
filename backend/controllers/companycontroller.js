import { CompanyModel as Company } from '../models/CompanyModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { pageParams, pagedResponse, pick, scopedOne, tenantFilter } from '../utils/scope.js';
import { cleanUrl } from '../utils/sanitize.js';

// List all companies scoped to institution (paginated)
export const getAllCompanies = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req);
  const filter = tenantFilter(req);
  const [companies, total] = await Promise.all([
    Company.find(filter).skip(skip).limit(limit),
    Company.countDocuments(filter),
  ]);
  pagedResponse(res, companies, total, { page, limit });
});

// Get single company (tenant-scoped)
export const getCompanyById = asyncHandler(async (req, res) => {
  const company = await scopedOne(Company, req, req.params.id);
  res.json({ success: true, data: company });
});

// Create company
export const createCompany = asyncHandler(async (req, res) => {
  const { name, website, industry, hrContact, notes } = req.body;
  const company = await Company.create({
    name,
    website: cleanUrl(website, 'website'),
    industry,
    hrContact,
    notes,
    institution: req.user.institution,
  });
  res.status(201).json({ success: true, data: company });
});

// Update company (tenant-scoped, allowlisted)
export const updateCompany = asyncHandler(async (req, res) => {
  const updates = pick(req.body, ['name', 'website', 'industry', 'hrContact', 'notes', 'isActive']);
  if (updates.website !== undefined) {
    const url = cleanUrl(updates.website, 'website');
    if (url === undefined) delete updates.website;
    else updates.website = url;
  }
  const company = await Company.findOneAndUpdate(
    { _id: req.params.id, institution: req.user.institution },
    updates,
    {
      new: true,
      runValidators: true,
    }
  );
  if (!company) throw new ApiError(404, 'Company not found');
  res.json({ success: true, data: company });
});

// Delete company (tenant-scoped)
export const deleteCompany = asyncHandler(async (req, res) => {
  const company = await Company.findOneAndDelete({
    _id: req.params.id,
    institution: req.user.institution,
  });
  if (!company) throw new ApiError(404, 'Company not found');
  res.json({ success: true, message: 'Company deleted' });
});
