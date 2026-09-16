// upload middleware: multer disk storage for assignment submissions and
// learning-resource attachments. Filenames are server-generated (timestamp +
// random + sanitized base) so client names can never escape the upload dir or
// smuggle executable extensions. Size cap comes from env (MAX_FILE_MB).
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const uploadDir = path.isAbsolute(env.upload.dir)
  ? env.upload.dir
  : path.join(process.cwd(), env.upload.dir);
fs.mkdirSync(uploadDir, { recursive: true });

const SUBMISSION_EXTS = new Set(['pdf', 'doc', 'docx', 'txt', 'md', 'csv', 'zip', 'png', 'jpg', 'jpeg']);
const RESOURCE_EXTS = new Set(['pdf', 'doc', 'docx', 'txt', 'md', 'png', 'jpg', 'jpeg']);

const extOf = (name) => String(name || '').split('.').pop().toLowerCase();

const sanitizeBase = (name) => {
  const base = String(name || 'file').split('/').pop().split('\\').pop().replace(/\.[^.]*$/, '');
  return base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'file';
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = extOf(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${sanitizeBase(file.originalname)}.${ext}`);
  }
});

const filterFor = (allowed) => (_req, file, cb) => {
  if (allowed.has(extOf(file.originalname))) return cb(null, true);
  cb(new ApiError(415, `Unsupported file type: .${extOf(file.originalname) || '?'}. Allowed: ${[...allowed].join(', ')}`));
};

const limits = { fileSize: env.upload.maxMB * 1024 * 1024, files: 1 };

export const uploadSubmissionFile = multer({ storage, limits, fileFilter: filterFor(SUBMISSION_EXTS) }).single('file');
export const uploadResourceFile = multer({ storage, limits, fileFilter: filterFor(RESOURCE_EXTS) }).single('file');
export const SUBMISSION_ACCEPT = [...SUBMISSION_EXTS].map((e) => `.${e}`).join(',');
export const RESOURCE_ACCEPT = [...RESOURCE_EXTS].map((e) => `.${e}`).join('');

// Remove an uploaded file when the controller rejects the request after
// multer already wrote it (e.g. unknown assignment/subject) — otherwise
// rejected uploads orphan files on disk.
export const discardUploadedFile = (req) => {
  if (!req?.file?.path) return;
  fs.promises.unlink(req.file.path).catch(() => {});
};
