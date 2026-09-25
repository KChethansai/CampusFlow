# CampusFlow — Ops Handover

Every claim below cites an actual file. Seed data first, env second, release last.

## 1. Seed commands

```bash
cd backend
cp .env.example .env   # fill DB_URL + SECRET_KEY + SECRET_KEY_REFRESH first
npm install
npm run seed           # node seed/seed.js — DROPS all collections first; never run in prod
npm run dev            # http://localhost:5000/api/health → {"status":"ok"}
```

Script sources: `backend/package.json` (`seed`, `dev`, `start`, `smoke`, `indexes`,
`check-syntax`, `test`); seed logic `backend/seed/seed.js`; health route `backend/app.js`.

## 2. Env matrix

### Backend (`backend/.env` — see `backend/.env.example`; validated by `backend/config/env.js`)

| Var | Required | Default / notes |
|---|---|---|
| `DB_URL` (alias `MONGO_URI`) | yes — server refuses to boot without it | Atlas URI prod, local URI dev |
| `SECRET_KEY` (alias `JWT_ACCESS_SECRET`) | yes | access-token HMAC secret (`openssl rand -hex 32`) |
| `SECRET_KEY_REFRESH` (alias `JWT_REFRESH_SECRET`) | yes | refresh-token HMAC secret, different value |
| `CLIENT_URL` | prod only | comma-separated allowed origins, exact Vercel origin |
| `COOKIE_SAME_SITE` | no | `lax` dev; `none` implied in prod (`config/env.js`) |
| `ACCESS_TOKEN_EXPIRES` (alias `JWT_ACCESS_EXPIRES`) | no | `15m` |
| `REFRESH_TOKEN_EXPIRES_DAYS` (alias `JWT_REFRESH_EXPIRES_DAYS`) | no | `7` |
| `PORT` / `NODE_ENV` | no | `5000` / `development` |
| `UPLOAD_DIR` / `MAX_FILE_MB` / `UPLOAD_DRIVER` | no | `uploads/` / `10` / `local`; prod on Render must use `cloudinary` (ephemeral disk) |
| `CLOUDINARY_URL` or `CLOUDINARY_CLOUD_NAME` + `CLOUDINARY_API_KEY` + `CLOUDINARY_API_SECRET` | when `UPLOAD_DRIVER=cloudinary` | enforced at boot |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `EMAIL_FROM` | no | unset → password-reset + digest fall back to in-app notifications (`services/email.service.js`, `services/digest.service.js`) |
| `OPENAI_API_KEY` / `OPENAI_MODEL` / `NEMOTRON_MODEL` | no | unset → AI reports return snapshot summary (`services/ai.service.js`) |

### Frontend (`frontend/.env` — see `frontend/.env.example`)

| Var | Required | Notes |
|---|---|---|
| `VITE_API_URL` | yes | must include `/api/v1` suffix, no trailing slash; e.g. `http://localhost:5000/api/v1` |

## 3. Per-role demo credentials (from `backend/seed/seed.js`)

Seeded tenant uses domain `anurag.edu.in` (`emailDomainPattern`, `seed.js:84`).
Passwords: `Admin@123` (admin-group hash, `seed.js:182`), `Faculty@123` (faculty-group
hash, `:183`), `Student@123` (student-group hash, `:184`).

| Role (`UserModel.js` enum) | Email | Password |
|---|---|---|
| `super_admin` | `superadmin@campusflow.app` | `Admin@123` |
| `college_admin` | `admin@anurag.edu.in` | `Admin@123` |
| `placement_officer` | `placement@anurag.edu.in` | `Admin@123` |
| `hod` | `hod.cse@anurag.edu.in` | `Faculty@123` |
| `faculty` | `faculty1@anurag.edu.in` | `Faculty@123` |
| `student` | `student1@anurag.edu.in` | `Student@123` |

Login: `POST /api/v1/auth/login`. Manual flows per router:
`backend/https/campusflow.http` (full collection); multipart examples in
`backend/https/study.http`, `backend/https/submissions.http`.

## 4. Manual release checklist

- [ ] `cd backend && npm run check-syntax && npm test` green (8 suites: auth, onboarding, attendance, security, files, socket, contracts, integrity).
- [ ] `cd frontend && npm run build` succeeds; `git diff --check` clean.
- [ ] Render: root `backend`, build `npm ci`, start `npm start`, health path `/api/health`; `NODE_ENV=production`, `DB_URL`, both secrets, exact `CLIENT_URL`, `UPLOAD_DRIVER=cloudinary` + creds set.
- [ ] Vercel: root `frontend`, `VITE_API_URL=https://<api>/api/v1`; SPA fallback (`vercel.json`) serves `index.html` for non-`api/` routes.
- [ ] Live checks: `GET /api/health`; CORS allow (Vercel origin) + deny (random origin); Helmet headers present; 10/15-min credential limiter trips on 11th rapid login; Socket.IO connects with access token and receives an announcement event.
- [ ] Spot-check login + dashboard, assignments, placement pipeline, requests workflow; upload a file and confirm it survives a redeploy (Cloudinary).
- [ ] Never run `npm run seed` against production (drops collections).
