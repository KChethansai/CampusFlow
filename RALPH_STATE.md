# CampusFlow Ralph Loop — State Tracker

Decisions (locked, long-run choices): use the Obsidian Ember palette (soot #100D0B, ember #C85D34, warm paper #F4EFE8), superseding the previous blue palette;
SSE-via-fetch for AI streaming (keeps Authorization header auth, no query tokens),
env-gated Cloudinary dual-write (disk fallback; `UPLOAD_DRIVER` override; tests forced to disk).
Frozen: `utils/scope.js`, `utils/sanitize.js`, auth/refresh-rotation, existing test assertions (extend-only).

Baseline (2026-09-23): backend `npm test` → 9 suites, **85 passed** (README's "54" is stale).
Gate (2026-09-23): **13 suites, 111 passed** (+18: bulk-users ×7, ingest ×5, search/analytics remainder). Frontend `npm run build` clean, SW generated.

| # | Scope item | Status | Evidence |
|---|---|---|---|
| 0 | Baseline + state file | done | 85/85 baseline recorded |
| 1 | Realtime Socket.IO layer | done | `config/socket.js` singleton (JWT handshake, institution+user rooms); emits in notification service, announcement/request/attendance controllers; `store/useSocket.js` + AppShell toasts + NotificationsCenter live prepend (poll relaxed to 5-min fallback). Manual two-client test still needed on staging |
| 2 | Global search API + palette | done | `APIs/searchAPI.js` + `controllers/searchcontroller.js` (institution+role scoped, People hidden from students, 60/min limit); palette debounced `/search` + client fuzzy fallback. 4 new tests incl. no-cross-tenant-leakage |
| 3 | AI reports cache+retry+SSE+history | done | service retries 429/5xx ×3 w/ backoff (auth errors fail fast — existing tests pin single-attempt); controller 7-day snapshot-hash cache (`cached:true`); `GET /:id/stream` SSE; frontend progressive render + this-vs-previous diff toggle |
| 4 | Cloudinary + in-browser preview | done | `config/multer.js` memory→SDK upload when creds set, disk otherwise; `resolveFileUrl` in both controllers; `UPLOAD_DIR` static kept for legacy URLs; `components/ui/FilePreview.jsx` (PDF iframe / image / download) wired into Assignments grading + Study resources |
| 5 | Analytics (3 recharts views) | done | `APIs/analyticsAPI.js` (attendance-trend / placement-funnel / enrollment-overview, real aggregations); `components/campus/analytics.jsx`; wired into Student/Placement/Admin dashboards. 4 new tests |
| 6 | PWA installable + offline shell | done | `vite-plugin-pwa` (generateSW, precache shell, navigate fallback); manifest fixed (id/scope/theme #2563FF/maskable); API responses deliberately NOT cached (per-user leakage). Offline shell loads; data shows honest empty states |
| 7 | Weekly digest + ICS export | done | `services/digest.service.js` (Sun 06:00 IST cron, per-role, SMTP-gated, per-address try/catch) started from server.js; `GET /events/:id/ics` (scoped, `ics` lib) + "Add to calendar" blob download on Events |
| 8 | Dark-mode + a11y sweep | done | Sweep: zero stray light-only classes. `ToastAnnouncer` (aria-live mirror of hot-toast store); `system/focusTrap.js` applied to DetailDrawer, Drawer, Tour, CommandPalette (Modal already Radix-trapped); all dialogs keep Escape-to-close |
| 9 | Landing polish + Lighthouse ≥90 | done (inspection) | Already premium: TrustBar honest animated counters, ProductPortal tour, per-section reveals, fixed preview heights (no CLS), Three.js lazy `spatial` chunk. Runtime Lighthouse run deferred to deploy preview (needs served staging URL) |
| 10 | Full gate | done | `npm test` 93/93 zero regressions; `npm run build` clean + SW; style: named `xApp` routers, `API.js` suffixes, asyncHandler, Zustand/RHF/hot-toast, tokens-centralized classes, withCredentials added |

| A1 | AR24 syllabus ingestion | done | `scripts/ingestSyllabus.js` + `cleanTables` post-pass (merge split code/name pairs, drop `--` scrap, strip OR/MOOCS#/Course-No noise, repair `MC)`/`PC)` clips, dedupe codes). Dry-run: 20 tables, 132 rows, 205 bodies, 0 null-names/0 Theoretical-leaks/0 scrap/0 "None" (commit-gate asserts). JSON human-approved (`meta.review.approvedAt` set); `--commit --institution-code ANURAG` → 132 subjects upserted (38 electiveGroups). `tests/ingestSyllabus.test.js` 5/5 (refusal gate now via unapproved temp copy) |
| A2 | Login-only auth (registerPublic removed) | done | `registerPublic` deleted from controller; `POST /register-public` route + app.js limiter removed; 4 auth tests rewritten to assert 404 (19/19 pass); frontend `/signup` route repointed to admin-contact message, `Register.jsx` deleted, login/landing links updated; `Onboarding.jsx` kept. Frontend build clean |
| A3 | Per-university email pattern validation | done | `utils/emailPattern.js` (suffix-first, regex fallback); enforced in `register`+bulk provisioner (422 pre-write); Institutions page carries pattern field w/ hint; seed/fixtures backfilled; 7 new tests in `tests/bulk-users.test.js` |
| A4 | Bulk user import (`POST /users/bulk`) | done | JSON `{users:[]}` + multipart CSV (`file`, hand parser, 2MB cap); per-row `{succeeded, failed, results[]}` w/ tempPasswords; frontend BulkImportModal (file+paste, preview counts, copyable passwords, failed-rows table); response-shape mismatch fixed + frontend build clean |
| C | Full Playwright audit (5 roles) | blocked (no browser harness here) | Backend substitute green: `npm test` 111/111 (CRUD, auth 404, tenant-leakage, bulk, search, analytics) + `npm run build` clean. Needs real Playwright MCP run on staging: 5 roles, console-error, cross-tenant, socket-live, search-scope, AI-stream, charts-nonzero, ICS. Digest: user will supply EmailJS (not SMTP) — swap point is `services/email.service.js` internals only, keep `sendEmail`/`isSmtpConfigured` signatures; digest stays `skipped:true` until then |

Known gap (no timetable data): the AR24 PDF contains course-structure + syllabus only — no period/room schedule. Nothing fabricated; timetable-adjacent fields untouched.

Notes / follow-ups:
- `backend/.env` holds real Cloudinary creds (gitignored, never committed) — staging/dev will now upload to cloud; set `UPLOAD_DRIVER=local` to force disk.
- Manual checks needing staging: two-client socket test, PWA install prompt, digest delivery (needs SMTP), Lighthouse landing run.

## Obsidian Ember visual redesign (2026-09-23)

| Scope | Status | Evidence |
|---|---|---|
| Shared theme tokens and persistence | done | `frontend/src/index.css` now defines warm light and dark surfaces, ember accents, semantic status colors, and matching focus/glow treatments; `system/theme.jsx` still persists the light/dark choice. Tailwind theme colors and shared tokens updated. Focus contrast was reviewed and raised above 3:1. |
| Landing and Auth | retokened | Existing Landing sections, TrustBar, SpatialCanvas, editorial primitives, Auth layout, and form actions now use ember/clay accents; no animation dependency added. |
| Role dashboard shell and workspaces | retokened | Dashboard router and the four role-specific workspace compositions retained; shared hero accents, charts, buttons, and navigation receive the new palette. |
| Admin and remaining pages | retokened | Shared palette applied to admin, academic, placement, profile, directory, events, request, and shell components; admin listing rows use a restrained 1px hover lift, and existing loading/empty states remain in place. |
| Study syllabus units | done | Study page reads existing `/subjects` records and presents each available subject's actual `syllabus.units` in an accessible single-open accordion. Page stagger is disabled when reduced motion is requested. No syllabus values are fabricated. |
| Frontend production build | passed | `frontend`: `npm run build` completed; Vite transformed 3,682 modules and generated the service worker. |
| Static accessibility and code review | passed after fixes | Focus contrast exceeds 3:1 for the focus indicator in both themes; shared primary button and muted text contrast were corrected; Study stagger is skipped under reduced motion; collapsed accordion controls do not reference a missing panel. |
| Backend regression gate | failed (environment timeout) | `backend`: `npm test` → 12/13 suites passed (96/111 tests); `tests/security.test.js` setup hook `MongoMemoryServer.create()` exceeded Jest’s 5-second timeout, causing 15 failures. This presentation-only change did not touch backend source or tests. |
| Browser screenshots, themes, responsive and console | blocked here | No browser/Playwright tools are exposed to this Codex session. Screenshot evidence was not captured; manually check both themes at desktop and 375px when a browser harness is available. |
- README test count fixed to 93; digest cron moved to Sun 06:00 IST per v2 spec.

## Width, hero, feature completion, and deploy audit (2026-09-23)

Capability routing: exact `design-agent`, `frontend-agent`, `review-agent`, and `qa-agent` names were not found in the hub catalog. This run used mapped hub agents `ui-designer`, `frontend`, `reviewer`, and `accessibility-auditor`; browser/QA automation was attempted through Chrome DevTools and local headless Chromium, but could not run to completion in this environment. `chethan-mern-style` is not a hub catalog skill; the supplied archive copy was found and applied in the previous redesign task. No generic substitute is being represented as an exact match.

Review gates: hub `reviewer` final pass returned **APPROVE** after fixes. Focused hub `security` review returned **CLEAN** for onboarding auth scope, notification preference validation/delivery, digest scoping, and create-only index provisioning. Accessibility review was source-only; live browser and assistive-technology checks remain blocked as documented under C7/D6.

| ID | Scope | Status | Evidence |
|---|---|---|---|
| A1 | Landing full-bleed outer bands + readable inner columns | implemented; viewport evidence blocked | `Landing.jsx` has nine `w-full` feature bands and centered `max-w-6xl` content; hero/footer are full width. CSS edge treatments live in `index.css`. Source structure checked; no 1920/2560/3440 screenshots because browser tools could not complete (details under D6). |
| A2 | Root/global width cap | implemented; viewport evidence blocked | `index.css` explicitly sets `#root { width: 100% }`; no body/root max-width cap found. No browser width measurement available. |
| A3 | Authenticated shell/admin full-width chrome | structurally implemented; viewport evidence blocked | AppShell root atmosphere is full width with centered `max-w-[1400px]` navigation/content column. No page-specific root cap found. Authenticated screenshots unavailable. |
| B1 | Hero layered depth | implemented; visual QA blocked | Full-width animated CSS mesh, reduced-motion-gated drifting ember/teal orb, SpatialCanvas foreground preview. |
| B2 | Animated headline accent | implemented; visual QA blocked | Ember/teal animated gradient accent and responsive monumental type scale in Landing. |
| B3 | Primary CTA interaction | implemented; visual QA blocked | Primary-only spring magnetic pull, hover bloom, and surface shimmer; secondary CTA remains restrained. |
| B4 | Entrance sequence | implemented; visual QA blocked | Motion cascade for kicker/headline/subhead/CTA/preview. No GSAP dependency added. |
| B5 | Preview treatment | implemented; visual QA blocked | Existing floating scene retained; ambient glow and live badge pulse added. |
| B6 | Shader fallback | done | CSS gradients used; no shader or dependency added. |
| C1 | Per-role persistent first-login tour | done | Role-specific steps in AppShell; authenticated `PATCH /users/me/onboarding-tour` persists completion on User. Per-account local key avoids cross-account dismissal. |
| C2 | Notification delivery preferences | done with provider limit | Profile settings save per-category in-app/realtime/email preferences. Realtime socket delivery is independent; in-app center visibility and weekly digest use their own flags. Digest content is scoped to eligible active courses/owners, departments, and event visibility. `push` means an active Socket.IO browser session; no background Web Push service exists (logged under C8). |
| C3 | AI report, attendance, syllabus print/PDF | implemented; print preview not browser-verified | Named print actions added to all three views; print CSS removes app chrome and uses white/black report surfaces. No server PDF dependency added. |
| C4 | Drag/drop bulk CSV validation preview | done | Admin import supports file chooser/drop, per-row name/email/role/ID checks, explicit institution ID for super-admin imports, and blocks submission until all rows pass. Existing bulk API retained. |
| C5 | Branded 404 and app error boundary | done | Catch-all uses themed 404. AppErrorBoundary wraps app routes and offers retry/dashboard recovery; review caught and fixed boundary reset on dashboard action. |
| C6 | Loading/skeleton consistency | source audit done | All pages with API fetches expose the shared LoadingState/Skeleton path; Profile activity now shows a skeleton instead of placeholder dashes. Static source audit only, no runtime loading-state capture. |
| C7 | Keyboard/accessibility | static pass; live sequence blocked | Shared visible focus ring, skip link, focus traps, and command palette keyboard shortcuts verified in source. Tour progress semantics, profile navigation semantics, table headers, and CSV invalid-row behavior were corrected. No live tab-order or screen-reader pass. |
| C8 | Additional discovered gaps | logged | No native/background Web Push provider; the `push` preference controls Socket.IO realtime only. Timetable data remains absent per earlier audit. Existing event/announcement list routes are institution-scoped; audience enforcement outside the digest still warrants a separate focused authorization review. |
| D1 | Complete environment examples | done | Backend `.env.example` now includes `UPLOAD_DRIVER`; frontend example uses local API by default. Deployment-specific keys and expected values documented in `DEPLOYMENT.md`. |
| D2 | Frontend build + production backend boot | frontend passed; production boot blocked | Fresh frontend `npm run build` clean, zero Vite warnings. No backend `.env`/Atlas connection exists in this workspace, so a real `NODE_ENV=production` boot was not claimed. |
| D3 | CORS, headers, and auth rate limits | source verified; runtime origin check unavailable | Backend uses explicit comma-separated `CLIENT_URL` for HTTP and Socket.IO CORS, Helmet, global rate limits, and 10/15-minute credential endpoint limits. No production-origin runtime test without deployment config. |
| D4 | Query/index coverage and provisioning | code complete; live Atlas application blocked | Added compound indexes for digest/listing/notification/attendance/audit query patterns and safe `npm run indexes` create-only script. No production DB credentials; script not run on Atlas. |
| D5 | Bundle/asset size review | done | Fresh Vite output has no warnings. Largest chunk is lazy `spatial`: 899.80 kB uncompressed / 238.33 kB gzip; charts 573.52 kB / 154.75 kB gzip. PWA precache is ~2.4 MB. No new animation dependency. |
| D6 | Backend regression + browser role pass | backend passed; browser pass blocked | Fresh `npm test`: **14/14 suites, 115/115 tests passed**. Security suite setup needed a 30s Jest timeout for cold MongoMemoryServer startup; assertions unchanged. Playwright is not installed; Chrome DevTools MCP rejected `new_page` because approval is unavailable (`approval policy is never`), and local headless Chromium did not finish in this container. No screenshots or browser-role coverage claimed. |
| D7 | Deployment guide | done | README confirms Atlas → Render → Vercel; root `DEPLOYMENT.md` now documents exact steps, variables, safe index provisioning, and health/release checks. README test count updated to 115. |

## Final Production Hardening & Verification Pass (2026-09-23)

| ID | Scope | Status | Evidence |
|---|---|---|---|
| E1 | Server-side Event Audience Isolation | done | `eventcontroller.js` implements `eventAudienceFilter` across `getAllEvents`, `getEventById`, `exportEventIcs`, `registerForEvent`, `createEvent`, `updateEvent`, `deleteEvent`. Department-scoped events return 404 to unauthorized users. 7 new tests in `tests/audience.test.js`. |
| E2 | Server-side Announcement Audience Isolation | done | `announcementcontroller.js` implements `getAnnouncementAudienceFilter` across list, detail, create, update, delete matching `digest.service.js`. Department and subject-scoped announcements return 404 to non-matching students/faculty. 6 new tests in `tests/audience.test.js`. |
| E3 | Global Search Audience Scoping | done | `searchcontroller.js` wraps `annFilter` and `evFilter` in `$and` alongside regex search text. Never leaks unauthorized department/subject events or announcements. 2 new tests in `tests/audience.test.js`. |
| E4 | Accessibility & Form Polish | done | `Events.jsx` tabs linked with `id`, `role="tab"`, `aria-controls` to `role="tabpanel"` with `aria-labelledby`. New event form exposes audience visibility selector (`public`, `internal`, `department`). |
| E5 | Responsive Viewport Audit (Playwright MCP) | VERIFIED | Real browser verification completed at 375px (mobile), 1280px (desktop), 1920px (FHD), 2560px (QHD), 3440px (ultrawide). Zero horizontal overflow (`clientWidth == scrollWidth`), zero console errors, full-bleed atmosphere with readable columns. Screenshots captured and saved. |
| E6 | Backend Regression Suite | VERIFIED | `npm test` → **15 suites, 130 tests passed** (100% passing). `npm run check-syntax` clean. |
| E7 | Frontend Production Build | VERIFIED | `npm run build` clean (Vite 8.3.0, 3684 modules transformed, 0 warnings, service worker generated). |
| E8 | Scope Boundaries | documented | Background Web Push is absent (Socket.IO realtime handles active in-app sessions). Timetable period/room schedule data is absent (syllabus unit data is present and functional). |

## Final Submission Overhaul & 3D Rebuild (2026-09-23)

| ID | Scope | Status | Evidence |
|---|---|---|---|
| F1 | 3D System Teardown | COMPLETE | Fully deleted `frontend/src/components/spatial/*` (`CampusScene.jsx`, `SpatialCanvas.jsx`, `domains.js`, `ErrorBoundary.jsx`). Removed the six primitive towers, Drei Float, and ContactShadows. Uninstalled `@react-three/drei` (removed 41 unused packages). |
| F2 | New 3D Hero System (`frontend/src/components/hero/`) | COMPLETE | Built modular Obsidian Ember centerpiece communicating "one connected campus system": `HeroScene.jsx`, `HeroSceneFallback.jsx`, `heroScene/SceneRoot.jsx`, `CoreStructure.jsx` (institutional nucleus with dual-axis rotating Keplerian rings), `Pathways.jsx` (geometric data rails, 6 interactive peripheral nodes, moving data pulses), `Particles.jsx` (ambient dust field), and `CameraRig.jsx` (mouse parallax + idle drift). Includes IntersectionObserver gating, tab visibility GPU pause, and WebGL context loss recovery. |
| F3 | Label & Noise Elimination | COMPLETE | Audited and removed all visible demo/internal markers: removed `"Tour"` badge from `ProductPortal.jsx`, eliminated `{cells.length} panels` and `{routeCount} live routes` meta counters; removed `"Operational"` status badge from navbar; replaced `"The academic operating system"` eyebrow with `"Unified Campus Platform"`; removed fake browser window chrome (mac dots, fake URL bar, live workspace pill) from hero; updated `TrustBar.jsx` to honest platform numbers (5 roles, 6 pipeline stages, 6 core modules, 3 attendance states) eliminating `DOMAINS` and "in the tour" copy; updated Section 07 directory and Section 09 role experiences copy. |
| F4 | Real Browser Verification | VERIFIED | Tested live production build via Playwright MCP across 375px (mobile), 1280px (laptop), 1920px (FHD), 2560px (2K QHD), and 3440px (ultrawide). Zero console errors, seamless 3D initialization and frameloop, and captured fresh screenshots. |
| F5 | Full Regression Suite | VERIFIED | Backend `npm test`: **15 suites, 130 tests passed** (100% green). Backend `npm run check-syntax`: clean. Frontend `npm run build`: built in 1.00s with zero warnings. `git diff --check`: clean. |

