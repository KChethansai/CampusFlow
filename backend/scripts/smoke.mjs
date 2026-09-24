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

// Post-deploy route check: invalid credentials must yield 401 from the real
// auth route. A 404 here means the API base lost its /api/v1 prefix (the
// deployed frontend's VITE_API_URL must end in /api/v1) — fail loudly.
const smokeBaseUrl = (process.env.SMOKE_BASE_URL || process.env.BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

let loginRes;
try {
  loginRes = await fetch(`${smokeBaseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'smoke-nonexistent@campusflow.app', password: 'Wrong@123!' })
  });
} catch (err) {
  throw new Error(`SMOKE FAIL: cannot reach ${smokeBaseUrl} — start the backend or set SMOKE_BASE_URL (cause: ${err?.message || err})`);
}

if (loginRes.status === 404) {
  const body = await loginRes.text().catch(() => '');
  throw new Error(`SMOKE FAIL: POST /api/v1/auth/login returned 404 (body: ${body.slice(0, 200)}) — route wiring or API base prefix is broken; expected 401 for invalid credentials`);
}

if (loginRes.status !== 401) {
  throw new Error(`SMOKE FAIL: POST /api/v1/auth/login returned ${loginRes.status}, expected 401 for invalid credentials`);
}

process.stdout.write('Login route smoke check passed (invalid creds → 401)\n');
