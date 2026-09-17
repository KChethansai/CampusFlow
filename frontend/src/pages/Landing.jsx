// Landing: Stitch-spec public experience — floating capsule navbar,
// centered hero with glass product-preview mockup, counter bar of real
// structural facts, role-tabbed portal tour, intelligence bento, role
// cards, cinematic CTA, single-row footer. No fake stats, no testimonials,
// no deadlines. CTAs only to /login, /signup, /dashboard (+ /placement
// where the spec names it).
import { Link } from 'react-router';
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  Briefcase,
  GraduationCap,
  ShieldCheck,
  Users
} from 'lucide-react';
import SpatialCanvas from '../components/spatial/SpatialCanvas';
import ProductPortal from '../components/landing/ProductPortal';
import TrustBar from '../components/landing/TrustBar';
import { PIPELINE_STAGES, ROLES, roleLabel } from '../system/tokens';

const NAV = [
  { label: 'Platform', to: '/dashboard' },
  { label: 'Academics', to: '/attendance' },
  { label: 'Placements', to: '/placement' },
  { label: 'Intelligence', to: '/ai-reports' }
];

const ROLE_CARDS = [
  {
    Icon: GraduationCap,
    tag: 'Student',
    title: 'One command center',
    body: 'Next class, due work, attendance health and placement pulse.',
    points: 'Attendance · Assignments · Placement · Study'
  },
  {
    Icon: Users,
    tag: 'Faculty',
    title: 'Teach, don’t file',
    body: 'Attendance in seconds, grading in a queue, requests without paperwork.',
    points: 'Attendance · Grading · Subjects · Requests'
  },
  {
    Icon: Briefcase,
    tag: 'Placement cell',
    title: 'Drives to offers',
    body: 'Publish drives, track eligibility, move candidates down the pipeline.',
    points: 'Pipeline · Directory · Events · Dashboard'
  },
  {
    Icon: ShieldCheck,
    tag: 'Administration',
    title: 'The operating picture',
    body: 'People, departments, academics and insight — one governed workspace.',
    points: 'Users · Courses · AI reports · Requests'
  }
];

const ALERTS = [
  {
    tag: 'Placement',
    title: 'Pipeline movement',
    body: 'Candidates advance applied → shortlisted → assessment → interview → offer → placed.'
  },
  {
    tag: 'Requests',
    title: 'Request queue',
    body: 'Every request moves pending → in review → approved, with audit trails on key actions.'
  },
  {
    tag: 'Intelligence',
    title: 'At-risk signals',
    body: 'Attendance and submission patterns surface early — evidence attached, never a black box.'
  }
];

const LOG_LINES = [
  '$ campusflow workspace --status',
  `ok  ${ROLES.length} roles · ${PIPELINE_STAGES.length} pipeline stages · one record per student`,
  '→ pipeline: applied → shortlisted → assessment → interview → offer → placed',
  '→ routes: /dashboard /attendance /placement /ai-reports',
  'ok  evidence attached · audit trails on'
];

const kicker = 'font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#4B5563] dark:text-[#707A89]';
const h2 = 'font-display font-bold tracking-tight text-3xl sm:text-4xl text-[#0A0D12] dark:text-[#F5F7FA] mt-3 text-balance';
const sub = 'mt-3 text-[15px] leading-relaxed text-[#4B5563] dark:text-[#A7B0BF] max-w-xl';
const glassCard =
  'cf-glass rounded-[24px] border border-black/10 dark:border-white/10';

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#F6F7F9] dark:bg-[#07090D] text-[#0A0D12] dark:text-[#F5F7FA] antialiased overflow-x-clip">
      {/* (1) floating capsule navbar */}
      <header className="fixed top-3 sm:top-5 inset-x-0 z-50 px-3 sm:px-4">
        <div className="max-w-5xl mx-auto cf-glass rounded-full border border-black/10 dark:border-white/10 pl-4 pr-2 py-2 flex items-center justify-between gap-2 shadow-lg shadow-black/[0.06] dark:shadow-black/40">
          <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="CampusFlow home">
            <span className="w-8 h-8 rounded-full bg-[#2563FF] text-white grid place-items-center font-display font-bold text-sm" aria-hidden>
              C
            </span>
            <span className="font-display font-semibold tracking-tight text-[17px]">CampusFlow</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1" aria-label="Product">
            {NAV.map((n) => (
              <Link
                key={n.label}
                to={n.to}
                className="px-3.5 py-2 rounded-full text-sm font-medium text-[#4B5563] dark:text-[#A7B0BF] hover:text-[#0A0D12] dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.07] transition-colors"
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-black/10 dark:border-white/10 text-xs font-medium text-[#4B5563] dark:text-[#A7B0BF]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden />
              Operational
            </span>
            <span
              className="hidden xl:inline-flex px-2.5 py-1.5 rounded-full border border-black/10 dark:border-white/10 font-mono text-[11px] text-[#4B5563] dark:text-[#A7B0BF]"
              title="Command palette inside the app"
            >
              ⌘K
            </span>
            <Link
              to="/login"
              className="hidden sm:block px-3 py-2 rounded-full text-sm font-semibold text-[#4B5563] dark:text-[#A7B0BF] hover:text-[#0A0D12] dark:hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="px-5 py-2.5 rounded-full bg-[#A7D700] text-[#0A0D12] text-sm font-semibold hover:brightness-95 transition"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* (2) centered hero + product preview */}
        <section className="relative overflow-hidden" aria-label="Introduction">
          {/* ambient: blue + volt glows, dot grid, lazy 3D hero visual */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[520px] rounded-full bg-[#2563FF]/[0.16] dark:bg-[#2563FF]/25 blur-[120px]" />
            <div className="absolute top-40 -left-40 w-[420px] h-[420px] rounded-full bg-[#7C5CFF]/10 dark:bg-[#7C5CFF]/15 blur-[100px]" />
            <div className="absolute top-24 -right-32 w-[320px] h-[320px] rounded-full bg-[#A7D700]/[0.07] dark:bg-[#A7D700]/10 blur-[100px]" />
            <div
              className="absolute inset-0 opacity-70 dark:opacity-100"
              style={{
                backgroundImage: 'radial-gradient(rgba(10,13,18,0.10) 1px, transparent 1px)',
                backgroundSize: '26px 26px'
              }}
            />
          </div>
          <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-50" aria-hidden>
            <div className="absolute inset-x-0 top-0 h-[560px] [mask-image:linear-gradient(to_bottom,black,transparent)]">
              <div inert aria-hidden className="w-full h-full">
                <SpatialCanvas className="w-full h-full" compact />
              </div>
            </div>
          </div>

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-32 sm:pt-44 pb-10 text-center">
            <p className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/10 dark:border-white/10 cf-glass text-xs font-semibold uppercase tracking-[0.14em] text-[#4B5563] dark:text-[#A7B0BF]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#A7D700]" aria-hidden />
              The academic operating system
            </p>
            <h1
              className="font-display font-bold tracking-tight leading-[1.02] mt-6 text-balance"
              style={{ fontSize: 'clamp(3.2rem,7vw,7.5rem)' }}
            >
              Your campus.
              <span className="block bg-gradient-to-r from-[#2563FF] via-[#7C5CFF] to-[#2563FF] bg-clip-text text-transparent">
                In sync.
              </span>
            </h1>
            <p className="mt-6 text-base sm:text-lg leading-relaxed text-[#4B5563] dark:text-[#A7B0BF] max-w-2xl mx-auto">
              Attendance, assignments, placements and insight — moving together
              in one workspace, one record per student.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#A7D700] text-[#0A0D12] font-semibold hover:brightness-95 transition"
              >
                Get started <ArrowRight size={17} aria-hidden />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-black/10 dark:border-white/15 cf-glass font-semibold hover:border-[#2563FF]/50 transition-colors"
              >
                Sign in <ArrowUpRight size={17} aria-hidden />
              </Link>
            </div>
            <Link
              to="/dashboard"
              className="inline-block mt-5 text-sm font-semibold text-[#2563FF] dark:text-[#7DA6FF] hover:underline underline-offset-4"
            >
              Explore the live workspace →
            </Link>
          </div>

          {/* full-width glass product preview */}
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pb-4">
            <div className="cf-glass rounded-[32px] border border-black/10 dark:border-white/10 overflow-hidden shadow-2xl shadow-[#2563FF]/[0.08] dark:shadow-black/50">
              {/* telemetry header row */}
              <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-black/10 dark:border-white/10">
                <div className="flex items-center gap-1.5" aria-hidden>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                </div>
                <p className="hidden sm:block font-mono text-xs text-[#4B5563] dark:text-[#707A89] px-4 py-1.5 rounded-full border border-black/10 dark:border-white/10">
                  campusflow.app/dashboard
                </p>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-[#4B5563] dark:text-[#A7B0BF] border border-black/10 dark:border-white/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden />
                    Live workspace
                  </span>
                  <span className="hidden sm:inline-flex px-2.5 py-1.5 rounded-full border border-black/10 dark:border-white/10 font-mono text-[11px] text-[#4B5563] dark:text-[#A7B0BF]">
                    ⌘K
                  </span>
                </div>
              </div>
              {/* bento: radial + funnel + terminal */}
              <div className="grid md:grid-cols-3 gap-3.5 sm:gap-4 p-4 sm:p-5">
                <div className="rounded-[24px] border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-5">
                  <p className={kicker}>Academic pulse</p>
                  <div className="mt-4 flex items-center justify-center" aria-hidden>
                    <svg width="140" height="140" viewBox="0 0 140 140" role="presentation">
                      <circle cx="70" cy="70" r="58" fill="none" strokeWidth="12" className="stroke-black/10 dark:stroke-white/10" />
                      <circle cx="70" cy="70" r="58" fill="none" stroke="#2563FF" strokeWidth="12" strokeLinecap="round" strokeDasharray="240 365" transform="rotate(-90 70 70)" />
                      <circle cx="70" cy="70" r="58" fill="none" stroke="#A7D700" strokeWidth="12" strokeDasharray="52 365" strokeDashoffset="-240" transform="rotate(-90 70 70)" />
                      <circle cx="70" cy="70" r="58" fill="none" stroke="#7C5CFF" strokeWidth="12" strokeDasharray="30 365" strokeDashoffset="-292" transform="rotate(-90 70 70)" />
                    </svg>
                  </div>
                  <ul className="mt-4 flex flex-wrap justify-center gap-2 text-xs font-medium text-[#4B5563] dark:text-[#A7B0BF]">
                    <li className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#2563FF]" aria-hidden />Present</li>
                    <li className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#A7D700]" aria-hidden />On duty</li>
                    <li className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#7C5CFF]" aria-hidden />Absent</li>
                  </ul>
                  <p className="mt-3 text-center text-[13px] text-[#4B5563] dark:text-[#A7B0BF]">
                    Per-subject attendance health
                  </p>
                </div>
                <div className="rounded-[24px] border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-5">
                  <p className={kicker}>Placement funnel</p>
                  <ol className="mt-4 space-y-2">
                    {PIPELINE_STAGES.map((s, i) => (
                      <li
                        key={s}
                        className="flex items-center gap-3 px-3 py-2 rounded-2xl border border-black/10 dark:border-white/10 text-[13px] font-semibold"
                      >
                        <span className="font-mono text-[11px] text-[#4B5563] dark:text-[#707A89]" aria-hidden>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        {roleLabel(s)}
                      </li>
                    ))}
                  </ol>
                  <p className="mt-3 text-[13px] text-[#4B5563] dark:text-[#A7B0BF]">
                    {PIPELINE_STAGES.length} stages, one visible pipeline
                  </p>
                </div>
                <div className="rounded-[24px] bg-[#0A0D12] dark:bg-black/60 border border-black dark:border-white/10 p-5 overflow-hidden">
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#707A89]">
                    Live log
                  </p>
                  <div className="mt-3 space-y-2 font-mono text-[12px] leading-relaxed">
                    {LOG_LINES.map((line, i) => (
                      <p
                        key={line}
                        className={i === 0 ? 'text-[#F5F7FA]' : line.startsWith('ok') ? 'text-[#A7D700]' : 'text-[#A7B0BF]'}
                      >
                        {line}
                      </p>
                    ))}
                    <p className="text-[#F5F7FA]">
                      <span className="inline-block w-2 h-4 bg-[#A7D700] align-middle animate-pulse" aria-hidden />
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-3 text-center text-[13px] text-[#4B5563] dark:text-[#707A89]">
              A preview of the real product — sign in to enter.
            </p>
          </div>
        </section>

        {/* (3) counter bar */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14" aria-label="CampusFlow at a glance">
          <TrustBar />
        </section>

        {/* (4) role-tabbed portal */}
        <section id="platform" className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14" aria-label="Product tour">
          <p className={kicker}>Platform</p>
          <h2 className={h2}>Tour the real product.</h2>
          <p className={sub}>
            Switch tabs to preview each workspace. Every link opens the real
            route after signing in.
          </p>
          <div className="mt-7">
            <ProductPortal />
          </div>
        </section>

        {/* (5) asymmetric intelligence bento */}
        <section id="intelligence" className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14" aria-label="Intelligence">
          <p className={kicker}>Intelligence</p>
          <h2 className={h2}>Signals, not noise.</h2>
          <p className={sub}>
            Attendance health, queue movement and pipeline position — each
            insight ships with its evidence attached.
          </p>
          <div className="mt-7 grid lg:grid-cols-5 gap-3.5 sm:gap-4">
            <div className={`${glassCard} p-5 sm:p-6 lg:col-span-2`}>
              <p className={kicker}>Attendance gauge</p>
              <div className="mt-5" aria-hidden>
                <svg viewBox="0 0 200 110" className="w-full max-w-[260px] mx-auto" role="presentation">
                  <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" strokeWidth="16" strokeLinecap="round" className="stroke-black/10 dark:stroke-white/10" />
                  <path d="M 20 100 A 80 80 0 0 1 115 24" fill="none" stroke="#2563FF" strokeWidth="16" strokeLinecap="round" />
                  <path d="M 122 27 A 80 80 0 0 1 150 46" fill="none" stroke="#A7D700" strokeWidth="16" strokeLinecap="round" />
                  <path d="M 155 52 A 80 80 0 0 1 180 100" fill="none" stroke="#7C5CFF" strokeWidth="16" strokeLinecap="round" />
                </svg>
              </div>
              <ul className="mt-4 space-y-1.5 text-[13px] font-medium text-[#4B5563] dark:text-[#A7B0BF]">
                <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#2563FF]" aria-hidden />Present — marked in the live matrix</li>
                <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#A7D700]" aria-hidden />On duty — approved leave shapes</li>
                <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#7C5CFF]" aria-hidden />Absent — watch-list inputs</li>
              </ul>
              <p className="mt-3 text-[13px] text-[#4B5563] dark:text-[#A7B0BF]">
                Shapes from the live attendance matrix.
              </p>
            </div>
            <div className={`${glassCard} p-5 sm:p-6 lg:col-span-3`}>
              <p className={kicker}>Attention queue</p>
              <ul className="mt-4 space-y-3">
                {ALERTS.map((a) => (
                  <li
                    key={a.title}
                    className="flex gap-3.5 px-4 py-3.5 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.03]"
                  >
                    <span className="mt-0.5 w-9 h-9 shrink-0 rounded-full grid place-items-center bg-[#2563FF]/10 dark:bg-[#2563FF]/15 text-[#2563FF] dark:text-[#7DA6FF]" aria-hidden>
                      <Bell size={16} />
                    </span>
                    <div>
                      <p className="text-[11px] font-mono uppercase tracking-wider text-[#4B5563] dark:text-[#707A89]">
                        {a.tag}
                      </p>
                      <p className="font-display font-semibold text-[15px]">{a.title}</p>
                      <p className="mt-0.5 text-[13px] leading-relaxed text-[#4B5563] dark:text-[#A7B0BF]">
                        {a.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className={`${glassCard} p-5 sm:p-6 lg:col-span-5 overflow-x-auto`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className={kicker}>Placement pipeline</p>
                  <p className="mt-2 font-display font-semibold text-lg">Every stage, one table.</p>
                </div>
                <Link
                  to="/placement"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563FF] dark:text-[#7DA6FF] hover:underline underline-offset-4"
                >
                  Open placement <ArrowUpRight size={15} aria-hidden />
                </Link>
              </div>
              <table className="mt-4 w-full text-sm min-w-[480px]">
                <caption className="sr-only">Placement pipeline stages</caption>
                <thead>
                  <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-[#4B5563] dark:text-[#707A89] border-b border-black/10 dark:border-white/10">
                    <th scope="col" className="py-2.5 pr-4 font-semibold">Order</th>
                    <th scope="col" className="py-2.5 pr-4 font-semibold">Stage</th>
                    <th scope="col" className="py-2.5 font-semibold">Movement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10 dark:divide-white/10">
                  {PIPELINE_STAGES.map((s, i) => (
                    <tr key={s}>
                      <td className="py-2.5 pr-4 font-mono text-xs text-[#4B5563] dark:text-[#707A89]">
                        {String(i + 1).padStart(2, '0')}
                      </td>
                      <td className="py-2.5 pr-4 font-semibold">{roleLabel(s)}</td>
                      <td className="py-2.5 text-[13px] text-[#4B5563] dark:text-[#A7B0BF]">
                        {i < PIPELINE_STAGES.length - 1
                          ? `Advances to ${roleLabel(PIPELINE_STAGES[i + 1])}`
                          : 'Hired — the offer letter'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* (6) role cards */}
        <section id="roles" className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14" aria-label="Who it's for">
          <p className={kicker}>Roles</p>
          <h2 className={h2}>One platform. Four tailored experiences.</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 mt-7">
            {ROLE_CARDS.map(({ Icon, tag, title, body, points }) => (
              <Link
                key={tag}
                to="/login"
                className={`group ${glassCard} p-6 flex flex-col gap-4 hover:border-[#2563FF]/40 dark:hover:border-[#2563FF]/50 transition-colors`}
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-[#2563FF]/10 dark:bg-[#2563FF]/15 text-[#2563FF] dark:text-[#7DA6FF]">
                    {tag}
                  </span>
                  <span className="w-10 h-10 rounded-2xl grid place-items-center border border-black/10 dark:border-white/10 text-[#4B5563] dark:text-[#A7B0BF]" aria-hidden>
                    <Icon size={19} />
                  </span>
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold tracking-tight">{title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-[#4B5563] dark:text-[#A7B0BF]">{body}</p>
                </div>
                <p className="text-xs text-[#4B5563] dark:text-[#707A89]">{points}</p>
                <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563FF] dark:text-[#7DA6FF]">
                  Enter workspace
                  <ArrowRight size={15} aria-hidden className="transition-transform duration-200 group-hover:translate-x-1.5" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* (7) cinematic CTA */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14" aria-label="Get started">
          <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#0A0D12] px-6 py-16 sm:py-24 text-center">
            <div className="absolute inset-0 pointer-events-none" aria-hidden>
              <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[640px] h-[380px] rounded-full bg-[#2563FF]/30 blur-[110px]" />
              <div className="absolute -bottom-40 -left-24 w-[380px] h-[380px] rounded-full bg-[#7C5CFF]/20 blur-[100px]" />
              <div className="absolute -bottom-40 -right-24 w-[300px] h-[300px] rounded-full bg-[#A7D700]/10 blur-[100px]" />
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: 'radial-gradient(rgba(255,255,255,0.09) 1px, transparent 1px)',
                  backgroundSize: '26px 26px'
                }}
              />
            </div>
            <div className="relative">
              <p className="inline-flex px-4 py-1.5 rounded-full border border-white/15 text-xs font-semibold uppercase tracking-[0.14em] text-[#A7B0BF]">
                Get started
              </p>
              <h2 className="font-display font-bold tracking-tight text-balance text-white mt-5 text-3xl sm:text-5xl">
                Bring your campus in sync.
              </h2>
              <p className="mt-4 text-[#A7B0BF] max-w-md mx-auto">
                Sign in to step into the workspace your role unlocks — or create
                your account to begin.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#A7D700] text-[#0A0D12] font-semibold hover:brightness-95 transition"
                >
                  Create account <ArrowRight size={17} aria-hidden />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-white/20 text-white font-semibold hover:bg-white/10 transition-colors"
                >
                  Sign in <ArrowUpRight size={17} aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* single-row footer */}
      <footer className="border-t border-black/10 dark:border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <p className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-[#2563FF] text-white grid place-items-center font-display font-bold text-xs" aria-hidden>
              C
            </span>
            <span className="font-display font-semibold tracking-tight">CampusFlow</span>
            <span className="text-xs text-[#4B5563] dark:text-[#707A89]">
              © {new Date().getFullYear()}
            </span>
          </p>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm font-medium" aria-label="Footer">
            <Link to="/dashboard" className="text-[#4B5563] dark:text-[#A7B0BF] hover:text-[#0A0D12] dark:hover:text-white transition-colors">Dashboard</Link>
            <Link to="/placement" className="text-[#4B5563] dark:text-[#A7B0BF] hover:text-[#0A0D12] dark:hover:text-white transition-colors">Placement</Link>
            <Link to="/login" className="text-[#4B5563] dark:text-[#A7B0BF] hover:text-[#0A0D12] dark:hover:text-white transition-colors">Sign in</Link>
            <Link to="/signup" className="text-[#4B5563] dark:text-[#A7B0BF] hover:text-[#0A0D12] dark:hover:text-white transition-colors">Create account</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
