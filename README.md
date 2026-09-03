# 🎓 CampusFlow — Smart College Management Platform

A multi-tenant, AI-enabled, production-grade College Management Platform.

## 🏫 Overview

CampusFlow connects five key stakeholders within a single application while enforcing strict tenant, department, and role isolation:

- **Super Admin** — Manage institutions, configure platform, system-wide analytics
- **College Admin** — Manage departments, courses, faculty, students, academic calendars
- **Faculty** — Manage subjects, record attendance, publish assignments, grade submissions
- **Student** — View courses, track attendance, submit assignments, apply for placement drives
- **Placement Officer** — Manage company profiles, post job drives, run shortlisting & interview pipelines

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js v20 LTS |
| Database | MongoDB + Mongoose |
| Backend | Express.js |
| Frontend | React (Vite) + Redux Toolkit |
| Styling | Tailwind CSS |
| AI Gateway | OpenAI / Nemotron |
| Auth | JWT (access + refresh rotation) |

## 🚀 Quick Start

```bash
# Clone and install
git clone <repo-url>
cd CampusFlow

# Backend
cd backend
npm install
# Add .env file
npm run dev

# Frontend (in separate terminal)
cd frontend
npm install
npm run dev
```

## 🏗️ Architecture

See the [Implementation Plan](/home/chethan/Downloads/implementation_plan.md) for full technical specification.

### Key Patterns

1. **Multi-Tenancy Boundary** — Every entity includes an `institution` ObjectId
2. **Workflow State Machines** — Assignment, Submission, Request, and JobApplication follow explicit state transitions
3. **Grounded AI** — All AI interactions use verified snapshots with hash validation

## 📁 Project Structure

```
CampusFlow/
├── docker-compose.yml
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── seed/
│   └── src/
│       ├── config/     # DB, env configuration
│       ├── controllers/
│       ├── middleware/  # Auth, RBAC, error handling
│       ├── models/      # All 20 MongoDB models
│       ├── routes/
│       ├── services/    # AI, email, eligibility, notification
│       └── utils/
└── frontend/
    ├── src/
    │   ├── api/         # Axios with interceptors
    │   ├── app/         # Redux store
    │   ├── components/  # Common + UI + Layout
    │   ├── features/    # Auth slice
    │   ├── pages/       # Route components
    │   └── utils/
    └── index.html
```# CampusFlow
