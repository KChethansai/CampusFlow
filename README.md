# CampusFlow — Smart College Management Platform

Multi-tenant college management: Express + MongoDB REST API (`backend/`),
React + Vite frontend (`frontend/`). Five roles: super admin, college admin,
faculty, student, placement officer.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Express.js, Mongoose, JWT access + DB-backed refresh rotation |
| Frontend | React 18 (Vite), Zustand, Tailwind, Motion.dev, lazy Three.js |
| Database | MongoDB (Atlas in production) |
| AI | OpenAI optional — reports degrade gracefully without a key |

## Quick Start

```bash
# Backend
cd backend
cp .env.example .env        # fill DB_URL + JWT secrets (see below)
npm install
npm run seed                # demo data (drops existing data first)
npm run dev                 # http://localhost:<PORT>/api/health (PORT in .env)

# Frontend (new terminal)
cd frontend
cp .env.example .env        # set VITE_API_URL=http://localhost:<PORT>/api/v1
npm install
npm run dev                 # http://localhost:5173
```

Seed logins: `superadmin@campusflow.app` / `admin@sit.edu` / `placement@sit.edu`
(`Admin@123`), `faculty1@sit.edu` (`Faculty@123`), `student1@sit.edu` (`Student@123`).

## Environment

Backend (`backend/.env`): `PORT`, `DB_URL` (or `MONGO_URI`), `SECRET_KEY`,
`SECRET_KEY_REFRESH` (`openssl rand -hex 32`), `CLIENT_URL` (comma-separated
origins), `ACCESS_TOKEN_EXPIRES`, `REFRESH_TOKEN_EXPIRES_DAYS`, optional
`SMTP_*`, `OPENAI_API_KEY`, `UPLOAD_DIR`, `MAX_FILE_MB`. Missing `DB_URL` or
JWT secrets → the server refuses to boot (by design).

Frontend (`frontend/.env`): `VITE_API_URL` — must include the `/api/v1`
suffix, e.g. `http://localhost:4000/api/v1`. `.env` files are gitignored and
have never been committed.

## Testing

```bash
cd backend && npm test      # jest + supertest + mongodb-memory-server (54 tests)
cd frontend && npm run build
```

## Deployment (Atlas → Render → Vercel)

- **Render (backend)**: root directory `backend`, build `npm ci`, start
  `npm start`. Set `NODE_ENV=production` (Render injects `PORT`), `DB_URL`,
  secrets, `CLIENT_URL=https://<your-app>.vercel.app`.
- **Vercel (frontend)**: root directory `frontend`, preset Vite, build
  `npm run build`, output `dist`. `frontend/vercel.json` adds the SPA
  fallback (`/(.*)` → `/index.html`). Set `VITE_API_URL` to the Render URL
  with `/api/v1` suffix.
- Smoke: `GET {backend}/api/health` → `{"status":"ok"}`; login; spot-check
  dashboard, assignments, placement, requests.

## Security model

Tenant isolation on every object route (`findOne({_id, institution})`);
role re-checked from DB per request (never the JWT claim); deactivated and
post-password-change sessions rejected; refresh rotation with reuse detection;
allowlisted writes; server-enforced workflow transitions; per-endpoint rate
limits; `http(s)`-only URL fields. Details + accepted risks:
`backend/` controllers use `utils/scope.js` / `utils/sanitize.js`; adversarial
coverage lives in `backend/tests/security.test.js`.
