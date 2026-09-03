# CampusFlow — Deployment Guide

CampusFlow is a MERN monorepo (npm workspaces): `backend/` (Express +
Mongoose) and `frontend/` (React + Vite). The recommended split is
**MongoDB Atlas** for the database, **Render** for the backend and
**Vercel** for the frontend.

---

## 1. MongoDB Atlas setup

1. Create a free cluster at https://cloud.mongodb.com.
2. Under **Database Access**, create a user with read/write on the cluster
   and note the password.
3. Under **Network Access**, allow `0.0.0.0/0` (Render's egress IPs vary) or
   restrict to your region.
4. Click **Connect → Drivers** and copy the connection string
   (`mongodb+srv://<user>:<password>@<cluster>/...`).
5. Use it as `DB_URL` below (legacy name `MONGO_URI` is also accepted).

## 2. Render (backend)

1. Create a **new Web Service** and point it at the repo. Set:

   | Setting | Value |
   | --- | --- |
   | Root directory | `backend` (or use the root with workspaces — see note) |
   | Build command | `npm install` (root, installs workspaces) |
   | Start command | `npm run start --workspace backend` |

   Alternatively, if you deploy with a root-level Procfile, the included
   `Procfile` already runs the same start command.

2. Environment variables (all defined in `backend/.env.example`):

   - `NODE_ENV=production`
   - `PORT=10000` (Render injects `PORT`; the app respects it)
   - `DB_URL` — Atlas connection string
   - `SECRET_KEY` and `SECRET_KEY_REFRESH` — long random strings
     (`openssl rand -hex 32`)
   - `CLIENT_URL` — comma-separated allowed origins, e.g.
     `https://campusflow.vercel.app`
   - `ACCESS_TOKEN_EXPIRES`, `REFRESH_TOKEN_EXPIRES_DAYS`
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` (optional)
   - `OPENAI_API_KEY` (optional — AI reports degrade gracefully without it)
   - `UPLOAD_DIR`, `MAX_FILE_MB` (optional)

3. The production start path is plain `node server.js` (no nodemon), the
   logger writes to stdout only (no local files — Render's filesystem is
   ephemeral), and `connectDB()` resolves before the server listens.

## 3. Vercel (frontend)

1. Import the repo in Vercel; framework preset **Vite**.
2. Set the env variable `VITE_API_URL` to your Render URL, e.g.
   `https://campusflow-backend.onrender.com/api/v1` (no trailing slash).
3. Build output is `dist` (Vite's default — no config change needed).
   If you deploy `frontend/` as the root directory, keep `npm run build`.

`src/api/axios.js` reads `import.meta.env.VITE_API_URL` and falls back to
`http://localhost:5000/api/v1` for local development only.

## 4. Post-deploy smoke checklist

- [ ] `GET {BACKEND_URL}/api/health` returns `{"status":"ok",...}`
- [ ] Register/seed an admin, then **login** — tokens returned, dashboard loads
- [ ] Create one of each: **Department**, **Course**, **Subject**, **User**
- [ ] **Assignment** created by faculty; visible to students
- [ ] **Attendance** session visible
- [ ] Student **enrolls** into a course from *My Courses* and drops it
- [ ] **Placement**: officer adds a **Company** and a **Job Drive**; student
      checks eligibility, **applies**, officer advances the **stage**;
      both parties receive a **notification**
- [ ] Student creates a **Request**; staff reviews → approves/rejects
- [ ] Admin opens **AI Reports** and generates a summary (placeholder output
      is expected if `OPENAI_API_KEY` is unset)
- [ ] Logout works and the refresh token is revoked (re-login succeeds)
