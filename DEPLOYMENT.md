# CampusFlow Deployment

Production path: **MongoDB Atlas → Render (backend) → Vercel (frontend)**

All local environment variable keys are documented in `backend/.env.example` and
`frontend/.env.example`. Never commit filled `.env` files or credentials.

---

## 1. MongoDB Atlas

1. Create a production database and a database user scoped to that database only.
2. Add the Render outbound IP range (or `0.0.0.0/0` if you use a free Atlas cluster)
   under **Network Access**.
3. Copy the Atlas connection string to Render as `DB_URL`.
   URL-encode any special characters in the username or password.
4. After the first deploy, provision indexes once:
   ```
   cd backend && npm run indexes
   ```
   The script only creates declared indexes; it never drops data.

---

## 2. Backend on Render

| Render setting | Value |
|---|---|
| **Root directory** | `backend` |
| **Runtime** | Node |
| **Build command** | `npm ci` |
| **Start command** | `npm start` |
| **Health-check path** | `/api/health` |

### Required environment variables

| Variable | Required | Notes |
|---|---|---|
| `NODE_ENV` | **Yes** | Set to `production` |
| `DB_URL` | **Yes** | Atlas connection string |
| `SECRET_KEY` | **Yes** | Access-token secret — `openssl rand -hex 32` |
| `SECRET_KEY_REFRESH` | **Yes** | Refresh-token secret — use a *different* value |
| `CLIENT_URL` | **Yes** | Exact Vercel production origin (`https://…vercel.app`); comma-separate any extra approved preview origins. Wildcard CORS is not supported. |
| `PORT` | Render-injected | Leave unset; Render provides it automatically |

### Optional environment variables

| Variable | Default | Notes |
|---|---|---|
| `ACCESS_TOKEN_EXPIRES` | `15m` | JWT access-token lifetime |
| `REFRESH_TOKEN_EXPIRES_DAYS` | `7` | Refresh-token lifetime in days |
| `COOKIE_SAME_SITE` | `none` in production | Override only if needed |
| `UPLOAD_DRIVER` | auto-detected | Set to `cloudinary` in production — Render's local disk is **ephemeral**; uploads stored locally are lost on every redeploy or instance restart |
| `CLOUDINARY_CLOUD_NAME` | — | Required when `UPLOAD_DRIVER=cloudinary` |
| `CLOUDINARY_API_KEY` | — | Required when `UPLOAD_DRIVER=cloudinary` |
| `CLOUDINARY_API_SECRET` | — | Required when `UPLOAD_DRIVER=cloudinary` |
| `UPLOAD_DIR` | `uploads/` | Local-only; ignored when using Cloudinary |
| `MAX_FILE_MB` | `10` | Maximum single-file upload size |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | — | SMTP transport; weekly digest and password-reset email fall back to in-app notifications when unset |
| `OPENAI_API_KEY` | — | Enables live AI reports; degrades gracefully to snapshot without a key |
| `OPENAI_MODEL` | `gpt-4o-mini` | Optional model override |
| `NEMOTRON_MODEL` | — | Optional secondary model |

> [!IMPORTANT]
> Do **not** run `npm run seed` against a production database. The seed script
> drops all existing collections before inserting demo data.

> [!WARNING]
> Render's free tier filesystem is ephemeral. If `UPLOAD_DRIVER` is `local`
> (or not set and Cloudinary credentials are absent), uploaded files will be
> lost on every service restart or redeploy. Set up Cloudinary before accepting
> production uploads.

---

## 3. Frontend on Vercel

| Vercel setting | Value |
|---|---|
| **Root directory** | `frontend` |
| **Framework preset** | Vite |
| **Build command** | `npm run build` |
| **Output directory** | `dist` |

`frontend/vercel.json` provides the SPA fallback so that client-side routes
(anything that does not start with `api/`) resolve to `index.html`.

### Environment variable

| Variable | Value |
|---|---|
| `VITE_API_URL` | Render API base URL ending in `/api/v1`, e.g. `https://campusflow-api.onrender.com/api/v1` |

After the Vercel production URL is known, set that exact origin (including
`https://`, without a trailing slash) in the Render `CLIENT_URL` variable.

---

## 4. Authentication — session storage

The frontend stores the auth session in **`localStorage`** under the key
**`cf_auth`**. The value is a JSON object:

```json
{ "user": { … }, "accessToken": "…", "refreshToken": "…" }
```

The backend **also** sets the refresh token as an `HttpOnly` cookie
(`refreshToken`, `Secure` + `SameSite=none` in production, `Path=/`,
lifetime = `REFRESH_TOKEN_EXPIRES_DAYS`). `POST /auth/refresh` and
`POST /auth/logout` accept the token from **either** the JSON body (current
frontend behavior) **or** the cookie, so cookie-based rotation keeps working
cross-site as long as the frontend sends `withCredentials` / `credentials:
'include'` (the Axios client and AI-report streaming already do).

The backend applies refresh-token rotation with reuse detection; a reused token
invalidates the entire rotation family. A refresh arriving within ~15s of its
own rotation (concurrent retry) gets a `401 …recently refreshed…` without
destroying the new session. On logout the `cf_auth` key is removed, the
server-side session is revoked, and the cookie is cleared. Logout works even
with an expired access token. Changing or resetting the password revokes all
sessions — the client signs out locally and returns to `/login`.

---

## 5. Release checks

1. Confirm the backend health endpoint: `GET /api/health` → `{"status":"ok"}`.
2. Confirm CORS accepts the production Vercel origin and rejects an unrelated origin.
3. Confirm Helmet security headers, authentication rate-limiting, and
   Socket.IO connection from the frontend.
4. Sign in and spot-check: dashboard, notifications, an upload, and a placement event.
5. Confirm uploaded files persist across a manual Render redeploy (Cloudinary).
6. Run backend regression tests before release:
   ```
   cd backend && npm test
   ```

---

## 6. CI

Continuous integration runs on every push and pull-request to `main` via
`.github/workflows/ci.yml`:

- **backend** job — `npm ci`, `npm run check-syntax`, `npm test -- --forceExit`
  (`NODE_ENV=test`)
- **frontend** job — `npm ci`, `npm run build` (depends on backend passing)
- **lint** job — `git diff --check` (depends on backend passing)
