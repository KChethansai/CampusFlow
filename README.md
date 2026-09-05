# CampusFlow — Smart College Management Platform

A multi-tenant, AI-enabled College Management Platform: Express REST API +
MongoDB backend, React (Vite) frontend.

## Overview

CampusFlow connects five key stakeholders within a single application while enforcing strict tenant and role isolation:

- **Super Admin** — Institutions, platform configuration, system-wide analytics
- **College Admin** — Departments, faculty, students, courses, institutional reports
- **Faculty** — Subjects, attendance, assignments, grading, announcements
- **Student** — Courses, attendance, assignments, requests, placements, study assistance
- **Placement Officer** — Companies, job drives, applications, eligibility, outcomes

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js v20 LTS |
| Database | MongoDB + Mongoose |
| Backend | Express.js |
| Frontend | React (Vite) + Zustand |
| Styling | Tailwind CSS |
| 3D / Motion | Three.js (lazy) + Motion.dev |
| AI | OpenAI (optional — graceful placeholder fallback without a key) |
| Auth | JWT (access + refresh rotation, DB-backed) |

## Quick Start

```bash
git clone <repo-url>
cd CampusFlow
npm install              # single root lockfile covers both workspaces

cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit both .env files (DB_URL, JWT secrets, VITE_API_URL — see below)

npm run seed --workspace=backend   # demo data (drops existing data first)
npm run dev                        # backend + frontend together
```

- Backend: `http://localhost:<PORT>/api/health` (`PORT` from `backend/.env`, default 5000)
- Frontend: `http://localhost:5173` (proxied by `VITE_API_URL` in `frontend/.env`)

Seed logins: `superadmin@campusflow.app` / `admin@sit.edu` / `placement@sit.edu`
(`Admin@123`), `faculty1@sit.edu` (`Faculty@123`), `student1@sit.edu` (`Student@123`).

## Architecture

### Key Patterns

1. **Multi-Tenancy Boundary** — Every entity includes an `institution` ObjectId;
   single-object reads/mutations are scoped with `findOne({_id, institution})`
   (`backend/utils/scope.js`), so a valid ObjectId never implies authorization.
2. **Workflow State Machines** — Assignment, Request and JobApplication follow
   explicit server-enforced status transitions.
3. **Grounded AI + rule-based study help** — AI reports use verified snapshots
   with hash validation; `/study/plan` is deterministic computation over real
   records (scores, attendance, deadlines), labeled as such.
4. **Auth hardening** — Role is re-checked from the database per request
   (never trusted from the JWT claim); deactivated users and post-password-change
   sessions are rejected; refresh tokens rotate with reuse detection.

## Project Structure

```
CampusFlow/
├── docker-compose.yml      # local full-stack (expects backend/.env)
├── Procfile                # backend process type
├── backend/
│   ├── server.js           # entrypoint (connect DB, then listen)
│   ├── app.js              # Express wiring, rate limits, /api/health
│   ├── APIs/               # route wiring (one router per resource)
│   ├── config/             # env validation, DB, security middleware
│   ├── controllers/        # business logic (tenant-scoped, allowlisted writes)
│   ├── middlewares/        # verifyToken (DB role check), auditLog, errorHandler
│   ├── models/             # 20 Mongoose models
│   ├── services/           # AI, email, eligibility, notification, activity log
│   ├── utils/              # scope (tenant/pagination), sanitize, tokens
│   ├── seed/seed.js        # demo dataset (npm run seed --workspace=backend)
│   └── tests/              # jest + supertest + mongodb-memory-server
└── frontend/
    ├── vercel.json         # SPA fallback (deploy frontend/ as project root)
    ├── src/
    │   ├── api/            # Axios client (VITE_API_URL, refresh interceptor)
    │   ├── store/          # Zustand auth session
    │   ├── shell/          # App shell, ⌘K palette, notifications, quick actions
    │   ├── system/         # Design tokens, motion language, theme
    │   ├── components/     # ui primitives, editorial, spatial (lazy 3D), data views
    │   ├── pages/          # routes: landing, auth, dashboards, academics,
    │   │                   # placement, requests, events, study, admin, profile
    │   └── styles/         # legacy re-export shim (use system/tokens)
    └── index.html
```

## Testing

```bash
npm test --workspace=backend     # jest (memory server; no external DB needed)
npm run build --workspace=frontend
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) (Atlas → Render → Vercel).
