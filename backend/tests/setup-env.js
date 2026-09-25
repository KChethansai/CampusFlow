// Jest setup: CI has no backend/.env, but config/env.js throws on missing vars
// at import time. Provide inert test-only values here (setupFiles runs before
// any test module imports app code). Tests use MongoMemoryServer + supertest,
// so DB_URL is never dialed; secrets only sign test JWTs.
process.env.DB_URL ??= 'mongodb://127.0.0.1:27017/campusflow-test-unused';
process.env.SECRET_KEY ??= 'test-access-secret-not-for-production';
process.env.SECRET_KEY_REFRESH ??= 'test-refresh-secret-not-for-production';
