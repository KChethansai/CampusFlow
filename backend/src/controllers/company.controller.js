import Company from '../models/Company.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

// List all companies scoped to institution
export const getAllCompanies = asyncHandler(async (req, res) => {
  const companies = await Company.find({ institution: req.user.institution });
  res.json({ success: true, data: companies });
});

// Get single company
export const getCompanyById = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id);
  if (!company) throw new ApiError(404, 'Company not found');
  res.json({ success: true, data: company });
});

// Create company
export const createCompany = asyncHandler(async (req, res) => {
  const { name, website, industry, hrContact, notes } = req.body;
  const company = await Company.create({
    name,
    website,
    industry,
    hrContact,
    notes,
    institution: req.user.institution,
  });
  res.status(201).json({ success: true, data: company });
});

// Update company
export const updateCompany = asyncHandler(async (req, res) => {
  const company = await Company.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!company) throw new ApiError(404, 'Company not found');
  res.json({ success: true, data: company });
});

// Delete company
export const deleteCompany = asyncHandler(async (req, res) => {
  const company = await Company.findByIdAndDelete(req.params.id);
  if (!company) throw new ApiError(404, 'Company not found');
  res.json({ success: true, message: 'Company deleted' });
});
