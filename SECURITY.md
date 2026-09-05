# CampusFlow — Security Notes

Threat model: multi-tenant SaaS (Atlas → Render → Vercel). Untrusted input is
any client-supplied value: body, params, query, uploaded link strings.

## Enforced boundaries

- **Tenant isolation** — every single-object read/mutation is scoped with
  `findOne({ _id, institution })` (`backend/utils/scope.js#scopedOne`); a valid
  ObjectId never implies authorization. Lists are institution-filtered;
  students additionally see only their own rows (requests, enrollments,
  submissions, attendance, notifications).
- **Role re-check** — `verifyToken` loads the user from the database per
  request: role comes from DB (never the JWT claim), deactivated accounts get
  403, and tokens issued before a password change are rejected via
  `passwordChangedAt` (`changedPasswordAfter`).
- **Privilege-escalation guards** — only `super_admin` can create or promote to
  `super_admin`; non-super callers are forced into their own institution on
  register and admin-create. Users cannot change their own role or deactivate
  themselves.
- **Mass-assignment allowlists** — every PATCH uses `pick()`; `institution`,
  `createdBy`, `student`, `drive`, `role` (non-super) are never client-settable.
  Password changes go through `save()` so bcrypt hashing always runs.
- **Workflow transitions** — assignment (`draft→published→open→closed→graded→archived`)
  and request (`pending→in_review→approved/rejected`) transitions are
  server-enforced; placement stages are enum-validated with history + outcome.
- **Refresh rotation** — DB-backed tokens with `type` verification, expiry
  check, reuse detection (reuse revokes the whole chain), env-driven lifetimes.
  Logout revokes the presented token.
- **Rate limits** — global 300/15min (prod) plus per-endpoint 10/15min budgets
  on login, register, refresh, forgot-password and reset-password (separate
  instances so budgets don't starve each other).
- **Injection** — `rejectUnsafePayload` drops `$`/`.` keys (NoSQL injection);
  all ids flow through Mongoose casting (invalid → 400, no stacks to client
  in production).
- **URL fields** — avatar/file/resume/attachment/website/syllabus links must
  be `http(s)` URLs (`utils/sanitize.js`); no file bytes are accepted or
  served by the API (uploads are link strings; `/uploads` is a static dir).
- **Secrets** — JWT secrets + DB URL required at boot (`config/env.js` throws
  otherwise); `.env` files are gitignored and were never committed
  (verified via `git log -- backend/.env frontend/.env`).

## Verified by tests

`backend/tests/security.test.js` (adversarial): super_admin minting,
institution forcing, PATCH escalation, plaintext-password regression,
cross-tenant course read, notification IDOR, deactivated-token rejection,
refresh type-confusion. Full suite: 7 files, 54 tests.

## Accepted residual risks (deliberate, re-evaluate on change)

- **Login error messages** distinguish unverified/deactivated accounts (also
  register 409). Chosen for UX; enables account enumeration. Revisit if
  targeted phishing becomes a concern.
- **Password-reset fallback** stores the raw token in the recipient's own
  notification when SMTP is unset (required for reset to work without email).
  Cross-user reads are blocked by recipient scoping; tokens expire in 10 min.
  Set SMTP in production to avoid the fallback entirely.
- **nodemailer GHSA-p6gq** (high) is not reachable: the app never uses the
  `raw` message option or `jsonTransport`. Upgrade to nodemailer ≥9 when
  convenient. `qs`/`react-router` moderates require breaking majors
  (Express 5 / RR7) — tracked, not scheduled.
- **No SAST/DAST in CI** — no scanner MCP/binary is installed in this
  environment. CI runs the adversarial test suite + frontend build.
  Add Semgrep/ZAP when available.
- **Login rate limit (10/15min/IP)** is shared by NATed campuses — acceptable
  for an institutional product; tighten per-email if abuse appears.
