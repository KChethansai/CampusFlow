// smoke script: validates deployment-critical backend files exist.
import { existsSync } from 'node:fs';

const requiredFiles = [
  'server.js',
  'app.js',
  'config/env.js',
  'config/security.js',
  'config/multer.js',
  'APIs/submissionAPI.js',
  'APIs/studyAPI.js',
  'middlewares/errorHandler.js',
  'middlewares/verifyToken.js'
];

const missing = requiredFiles.filter((file) => !existsSync(file));

if (missing.length > 0) {
  throw new Error(`Missing backend files: ${missing.join(', ')}`);
}

process.stdout.write('Backend smoke checks passed\n');
