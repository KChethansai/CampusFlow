# CampusFlow deployment

The repository documents the intended production path as MongoDB Atlas → Render → Vercel. Keep frontend and API origins explicit; the backend applies the same `CLIENT_URL` allowlist to HTTP and Socket.IO.

## 1. MongoDB Atlas

1. Create a production database and a database user with access only to that database.
2. Add the Render outbound IP policy appropriate to the Atlas plan, or use Atlas network access rules that match your organization’s security requirements.
3. Copy the application connection string into Render as `DB_URL`. URL-encode special characters in the database username and password.
4. Apply production indexes with `cd backend && npm run indexes` after deploying the code (the script only creates declared indexes; it does not drop indexes or data).

## 2. Backend on Render

Create a Web Service with root directory `backend`, Node runtime, build command `npm ci`, and start command `npm start`. Configure:

| Variable | Required | Value |
| --- | --- | --- |
| `NODE_ENV` | Yes | `production` |
| `DB_URL` | Yes | Atlas connection string |
| `SECRET_KEY` | Yes | Random access-token secret, at least 32 random bytes |
| `SECRET_KEY_REFRESH` | Yes | A different random refresh-token secret |
| `CLIENT_URL` | Yes | Exact Vercel production origin; comma-separate any approved preview origins |
| `PORT` | Render | Leave unset; Render supplies it |
| `ACCESS_TOKEN_EXPIRES` | No | Defaults to `15m` |
| `REFRESH_TOKEN_EXPIRES_DAYS` | No | Defaults to `7` |
| `COOKIE_SAME_SITE` | No | Defaults to `none` in production |
| `UPLOAD_DRIVER` | No | `cloudinary` for persistent uploads, or leave unset to auto-detect configured Cloudinary credentials |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | If using Cloudinary | Cloudinary credentials; alternatively set `CLOUDINARY_URL` |
| `UPLOAD_DIR`, `MAX_FILE_MB` | No | Defaults to `uploads/` and `10` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | If sending email | SMTP transport and sender; weekly digest and password mail need SMTP |
| `OPENAI_API_KEY` | No | Enables live AI reports; reports have a snapshot fallback |
| `OPENAI_MODEL`, `NEMOTRON_MODEL` | No | Optional model overrides |

Do not run `npm run seed` against production: the seed script drops existing collections. After deploy, verify `GET /api/health`, sign in, then check one dashboard, notification delivery, and an upload. Render health checks should target `/api/health`.

## 3. Frontend on Vercel

Create a Vite project with root directory `frontend`, install command `npm ci`, build command `npm run build`, and output directory `dist`. `frontend/vercel.json` supplies the SPA fallback. Set `VITE_API_URL` to the Render API base URL ending in `/api/v1`, such as `https://campusflow-api.onrender.com/api/v1`.

After the Vercel production URL is known, set that exact origin in the Render `CLIENT_URL` variable, including `https://` and without a trailing slash. If preview deployments need API access, add only the intended preview origin(s), comma-separated; wildcard CORS is not supported.

## 4. Release checks

1. Confirm the backend starts with `NODE_ENV=production` and can connect to Atlas.
2. Confirm CORS accepts the production frontend and rejects an unrelated origin.
3. Confirm HTTPS cookies, Helmet headers, authentication throttling, and Socket.IO connection from the frontend.
4. Confirm the deployed frontend has no unexpected large chunks in its Vite build output.
5. Run backend regression tests before release: `cd backend && npm test`.

All local environment keys are listed in `backend/.env.example` and `frontend/.env.example`. Never commit filled `.env` files or credentials.
