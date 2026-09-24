// upload middleware: multer for assignment submissions and learning-resource
// attachments. Storage is env-gated (long-run: ephemeral disks can't be
// trusted): Cloudinary (memory buffer → SDK upload at controller time, after
// validation so rejects never orphan cloud assets) when CLOUDINARY_* is set,
// otherwise local disk. Filenames are server-generated so client names can
// never escape the upload dir or smuggle executable extensions.
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export const isCloudUpload = process.env.UPLOAD_DRIVER === 'cloudinary'
  ? true
  : process.env.UPLOAD_DRIVER === 'local'
    ? false
    : env.nodeEnv !== 'test' && Boolean( // tests stay hermetic (disk, no network)
      process.env.CLOUDINARY_URL ||
      (env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret)
    );

if (isCloudUpload) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret
  });
}

const uploadDir = path.isAbsolute(env.upload.dir)
  ? env.upload.dir
  : path.join(process.cwd(), env.upload.dir);
if (!isCloudUpload) fs.mkdirSync(uploadDir, { recursive: true });

const SUBMISSION_EXTS = new Set(['pdf', 'doc', 'docx', 'txt', 'md', 'csv', 'zip', 'png', 'jpg', 'jpeg']);
const RESOURCE_EXTS = new Set(['pdf', 'doc', 'docx', 'txt', 'md', 'png', 'jpg', 'jpeg']);

const extOf = (name) => String(name || '').split('.').pop().toLowerCase();

const sanitizeBase = (name) => {
  const base = String(name || 'file').split('/').pop().split('\\').pop().replace(/\.[^.]*$/, '');
  return base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'file';
};

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = extOf(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${sanitizeBase(file.originalname)}.${ext}`);
  }
});

const storage = isCloudUpload ? multer.memoryStorage() : diskStorage;

const filterFor = (allowed) => (_req, file, cb) => {
  if (allowed.has(extOf(file.originalname))) return cb(null, true);
  cb(new ApiError(415, `Unsupported file type: .${extOf(file.originalname) || '?'}. Allowed: ${[...allowed].join(', ')}`));
};

const limits = { fileSize: env.upload.maxMB * 1024 * 1024, files: 1 };

export const uploadSubmissionFile = multer({ storage, limits, fileFilter: filterFor(SUBMISSION_EXTS) }).single('file');
export const uploadResourceFile = multer({ storage, limits, fileFilter: filterFor(RESOURCE_EXTS) }).single('file');

// Bulk user CSVs parse in memory (never staged to disk/cloud).
export const uploadBulkFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: filterFor(new Set(['csv']))
}).single('file');
export const SUBMISSION_ACCEPT = [...SUBMISSION_EXTS].map((e) => `.${e}`).join(',');
export const RESOURCE_ACCEPT = [...RESOURCE_EXTS].map((e) => `.${e}`).join('');

// Resolve the URL for an uploaded file: Cloudinary signed/authenticated asset when
// configured, else the local path.
export const resolveFileUrl = async (req, options = {}) => {
  if (!req?.file) return undefined;
  if (!isCloudUpload) return `/uploads/${req.file.filename}`;
  const ext = extOf(req.file.originalname);
  const publicId = `campusflow/${Date.now()}-${Math.round(Math.random() * 1e9)}-${sanitizeBase(req.file.originalname)}`;
  const isPrivate = options.isPrivate !== false; // Default private for student submissions/resources
  const type = isPrivate ? 'authenticated' : 'upload';
  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'auto', type, public_id: publicId, format: ext || undefined },
      (err, res) => (err ? reject(err) : resolve(res))
    );
    stream.end(req.file.buffer);
  });
  return result.secure_url;
};

// Generates a short-lived signed delivery URL for protected Cloudinary assets.
// Legacy public assets are supported via fallback signing, while new assets use 'authenticated'.
export const generateSignedDeliveryUrl = (fileUrl, options = {}) => {
  if (!fileUrl) return fileUrl;
  if (!fileUrl.includes('cloudinary.com')) return fileUrl;
  try {
    const expiresAt = Math.floor(Date.now() / 1000) + (options.expiresInSeconds || 300); // 5 min
    let resourceType = 'auto';
    if (fileUrl.includes('/raw/')) resourceType = 'raw';
    else if (fileUrl.includes('/video/')) resourceType = 'video';
    else if (fileUrl.includes('/image/')) resourceType = 'image';

    const isLegacyPublic = fileUrl.includes('/upload/') && !fileUrl.includes('/authenticated/');
    const type = isLegacyPublic ? 'upload' : 'authenticated';

    const match = fileUrl.match(/(?:upload|authenticated)(?:\/v\d+)?\/(.+)$/);
    if (!match || !match[1]) return fileUrl;

    const publicIdWithExt = match[1];
    return cloudinary.url(publicIdWithExt, {
      resource_type: resourceType,
      type,
      sign_url: true,
      expires_at: expiresAt,
      secure: true
    });
  } catch {
    return fileUrl;
  }
};

// Remove an uploaded file when the controller rejects the request after
// multer already wrote it (disk only — memory buffers vanish on their own,
// cloud uploads happen post-validation in resolveFileUrl).
export const discardUploadedFile = (req) => {
  if (!req?.file?.path) return;
  fs.promises.unlink(req.file.path).catch(() => {});
};
