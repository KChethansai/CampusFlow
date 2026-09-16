// Landing: flagship conversion page — ambient hero, bento pillars, tilt 3D,
// live structural counters, capability marquee, role access matrix.
// Reading this as: enterprise SaaS campus OS for campus citizens, Linear-precision luxury.
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Briefcase,
  Building2,
  CalendarCheck,
  GraduationCap,
  Moon,
  Sparkles,
  Sun,
  Users
} from 'lucide-react';
import SpatialCanvas from '../components/spatial/SpatialCanvas';
import {
  AnimatedCounter,
  BeamCard,
  BentoCell,
  BentoGrid,
  HeroBackdrop,
  MagneticButton,
  Marquee,
  Preloader,
  SplitReveal,
  TiltCard
} from '../components/ui/editorial';
import { useTheme } from '../system/theme';
import { btnClass, cardClass, cn } from '../system/tokens';
import { PIPELINE_STAGES } from '../system/tokens';

const NAV = [
  { label: 'System', href: '#system' },
  { label: "Who it's for", href: '#audience' },
  { label: 'Campus', href: '#campus' },
  { label: 'Access', href: '#access' },
  { label: 'Journey', href: '#journey' }
];

const PILLARS = [
  { Icon: BarChart3, title: 'Academic Analytics', body: 'Per-subject attendance health, submission momentum and at-risk signals with evidence beside every insight.', span: 'md:col-span-4' },
  { Icon: Briefcase, title: 'Placement Drives', body: 'Drives, eligibility and interviews move down one visible pipeline.', span: 'md:col-span-2' },
  { Icon: CalendarCheck, title: 'Attendance Matrix', body: 'Mark in seconds. Heatmaps and watch-lists replace registers.', span: 'md:col-span-2' },
  { Icon: Sparkles, title: 'AI Reports', body: 'What changed, why it matters, what happens next. Grounded, never a black box.', span: 'md:col-span-4' }
];

const AUDIENCES = [
  { Icon: GraduationCap, title: 'Students & Learners', body: 'Next class, due work, attendance health and placement pulse — one command center instead of five portals.' },
  { Icon: Users, title: 'Faculty & Mentors', body: 'Attendance in seconds, grading in a queue, announcements without the paperwork.' },
  { Icon: Briefcase, title: 'Recruiters & Admins', body: 'Drives, applicants, departments and academic health — one operating picture.' }
];

const SPLITS = [
  { n: '01', Icon: Building2, claim: ['A living twin', 'of <em>your university.</em>'], body: 'Academics, people, placements and insight rendered as one place you can walk through, not tabs you drown in.', tint: 'from-primary-500/25 via-primary-500/5 to-transparent' },
  { n: '02', Icon: BookOpen, claim: ['Looks like a campus.', '<em>Works like software.</em>'], body: 'Enrollment, attendance and grading become structured, searchable data underneath a familiar campus feel.', tint: 'from-primary-500/15 via-primary-500/5 to-transparent' }
];

const JOURNEY = [
  { n: '01', title: 'Enroll', body: 'Admissions, departments and courses — one record per student from day one.' },
  { n: '02', title: 'Learn', body: 'Attendance, assignments and feedback flow into a living academic profile.' },
  { n: '03', title: 'Get placed', body: 'Drives, eligibility and interviews move down a visible pipeline.' },
  { n: '04', title: 'See clearly', body: 'Every step leaves evidence — reports, timelines and insight, not guesses.' }
];

const CAPABILITIES = ['Attendance Matrix', 'Placement Pipeline', 'Command Palette', 'Audit Trails', 'AI Reports', 'Directory', 'Events', 'Study Workspace'];

const MATRIX_ROWS = [
  { cap: 'Assignments & grading queue', student: true, faculty: true, admin: true, placement: false },
  { cap: 'Attendance mark & heatmaps', student: true, faculty: true, admin: true, placement: false },
  { cap: 'Placement drives & pipeline', student: true, faculty: false, admin: true, placement: true },
  { cap: 'Users, departments & courses', student: false, faculty: false, admin: true, placement: false },
  { cap: 'AI reports & audit trails', student: false, faculty: false, admin: true, placement: false }
];

function Check({ on }) {
  return (
    <span aria-label={on ? 'Included' : 'Not included'} className={cn('inline-grid place-items-center w-5 h-5 rounded-full text-xs', on ? 'bg-primary-600 text-white' : 'bg-black/10 dark:bg-white/10 text-transparent')}>
      {on ? '✓' : '·'}
    </span>
  );
}

export default function Landing() {
  const { theme, toggle } = useTheme();
  const heroRef = useRef(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, reduced ? 1 : 1.08]);
  const heroFade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="min-h-screen bg-[var(--cf-bg)] text-[var(--cf-ink)]">
      <Preloader />
      <header className="sticky top-0 z-50 cf-glass border-b border-[var(--cf-line)]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5" aria-label="CampusFlow home">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-accent-violet grid place-items-center text-white font-bold text-sm shadow-2" aria-hidden>C</span>
            <span className="font-bold tracking-tight">CampusFlow</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1" aria-label="Sections">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="px-3 py-2 rounded-full text-sm text-[var(--cf-ink-soft)] hover:bg-black/[.04] dark:hover:bg-white/10 transition">{n.label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={toggle} aria-label="Toggle theme" className="p-2 rounded-full hover:bg-black/[.05] dark:hover:bg-white/10 transition">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link to="/login" className="hidden sm:block text-sm font-medium px-3 py-2 rounded-full hover:bg-black/[.05] dark:hover:bg-white/10 transition">Sign in</Link>
            <MagneticButton className={cn(btnClass('primary', 'small'))}>
              <Link to="/login" className="flex items-center gap-1">Apply now <ArrowUpRight size={14} /></Link>
            </MagneticButton>
          </div>
        </div>
      </header>

      <main>
        {/* Hero — left-aligned, fits viewport, ambient beams + tilt 3D */}
        <section ref={heroRef} className="relative overflow-hidden cf-grain" aria-label="Introduction">
          <HeroBackdrop />
          <motion.div style={reduced ? undefined : { scale: heroScale, opacity: heroFade }} className="relative max-w-[1400px] mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-8 grid lg:grid-cols-2 gap-10 items-center min-h-[82dvh]">
            <div>
              <p className="cf-kicker">Campus operating system</p>
              <h1 className="cf-statement mt-4">
                <SplitReveal lines={['The campus,', '<em>alive</em> in software.']} />
              </h1>
              <p className="mt-5 max-w-md text-base sm:text-lg text-[var(--cf-ink-mute)]">
                Classes, placements, people and insight moving together in real time.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <MagneticButton className={cn(btnClass('glow', 'large'))}>
                  <Link to="/login" className="flex items-center gap-2">Explore CampusFlow <ArrowRight size={17} /></Link>
                </MagneticButton>
                <a href="#campus" className={cn(btnClass('outline', 'large'))}>See how it works</a>
              </div>
              <dl className="mt-8 flex flex-wrap gap-6">
                <div><dt className="text-[11px] uppercase tracking-wider text-[var(--cf-ink-mute)]">Roles, one identity</dt><dd className="text-2xl font-bold tabular-nums"><AnimatedCounter value={5} /></dd></div>
                <div><dt className="text-[11px] uppercase tracking-wider text-[var(--cf-ink-mute)]">Placement stages</dt><dd className="text-2xl font-bold tabular-nums"><AnimatedCounter value={PIPELINE_STAGES.length} /></dd></div>
                <div><dt className="text-[11px] uppercase tracking-wider text-[var(--cf-ink-mute)]">Core pillars</dt><dd className="text-2xl font-bold tabular-nums"><AnimatedCounter value={PILLARS.length} /></dd></div>
              </dl>
            </div>
            <TiltCard className="h-[340px] sm:h-[460px] rounded-3xl overflow-hidden border border-white/10 shadow-4">
              <SpatialCanvas className="w-full h-full" compact={false} />
            </TiltCard>
          </motion.div>
        </section>

        {/* Capability marquee — single marquee per page */}
        <section aria-label="Capabilities" className="border-y border-[var(--cf-line)] py-4">
          <Marquee label="CampusFlow capabilities">
            {CAPABILITIES.map((c) => (
              <span key={c} className="mx-2 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--cf-line)] bg-[var(--cf-surface)] text-sm whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500" aria-hidden />{c}
              </span>
            ))}
          </Marquee>
        </section>

        {/* Bento pillars — asymmetric 4-cell rhythm */}
        <section id="system" className="max-w-[1400px] mx-auto px-4 sm:px-6 py-20 sm:py-28" aria-label="System">
          <p className="cf-kicker">The system</p>
          <SplitReveal className="cf-statement-sm mt-3 max-w-3xl" lines={['Four pillars.', '<em>One campus.</em>']} />
          <BentoGrid className="mt-10">
            {PILLARS.map(({ Icon, title, body, span }) => (
              <BentoCell key={title} span={span}>
                <Icon size={22} className="text-primary-500" aria-hidden />
                <h3 className="cf-display text-2xl mt-4">{title}</h3>
                <p className="mt-2 text-sm text-[var(--cf-ink-mute)] leading-relaxed max-w-[52ch]">{body}</p>
              </BentoCell>
            ))}
          </BentoGrid>
        </section>

        {/* Audience — vertical-stack cards, no eyebrow (restraint) */}
        <section id="audience" className="max-w-[1400px] mx-auto px-4 sm:px-6 py-16 sm:py-24" aria-label="Who it's for">
          <SplitReveal className="cf-statement-sm mt-3 max-w-2xl" lines={['Made for people who', '<em>live on campus.</em>']} />
          <div className="grid md:grid-cols-3 gap-4 mt-10">
            {AUDIENCES.map(({ Icon, title, body }) => (
              <article key={title} className={cn(cardClass, 'cf-card-spot p-7 hover:shadow-3 hover:-translate-y-1 transition-all duration-300')}>
                <Icon size={22} className="text-primary-500" aria-hidden />
                <h3 className="cf-display text-2xl mt-4">{title}</h3>
                <p className="mt-2 text-sm text-[var(--cf-ink-mute)] leading-relaxed">{body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Campus splits — max 2 zigzag in a row, then break with matrix */}
        <div id="campus" className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-20 sm:space-y-28" aria-label="Campus in depth">
          {SPLITS.map((s, i) => (
            <section key={s.n} className={cn('grid lg:grid-cols-2 gap-8 items-center', i % 2 && 'lg:[&>*:first-child]:order-2')}>
              <div>
                <SplitReveal className="cf-statement-sm mt-3" lines={s.claim} />
                <p className="mt-4 text-[var(--cf-ink-mute)] max-w-md leading-relaxed">{s.body}</p>
              </div>
              <div className={cn('relative h-[300px] sm:h-[380px] rounded-3xl overflow-hidden border border-[var(--cf-line)] bg-gradient-to-br cf-grain', s.tint)} aria-hidden>
                <s.Icon size={120} strokeWidth={0.6} className="absolute inset-0 m-auto text-[var(--cf-ink)] opacity-15" />
                <span className="cf-display italic absolute bottom-5 left-6 text-6xl opacity-20">{s.n}</span>
              </div>
            </section>
          ))}
        </div>

        {/* Access matrix — honest role comparison, no fake pricing */}
        <section id="access" className="max-w-[1400px] mx-auto px-4 sm:px-6 py-16 sm:py-24" aria-label="Role access">
          <p className="cf-kicker">Access</p>
          <SplitReveal className="cf-statement-sm mt-3 max-w-2xl" lines={['One identity.', '<em>Right-sized</em> access.']} />
          <BeamCard className="mt-10">
            <div className="overflow-x-auto p-2">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-[var(--cf-ink-mute)]">
                    <th className="px-4 py-3 font-medium">Capability</th>
                    <th className="px-4 py-3 font-medium text-center">Student</th>
                    <th className="px-4 py-3 font-medium text-center">Faculty</th>
                    <th className="px-4 py-3 font-medium text-center">Admin</th>
                    <th className="px-4 py-3 font-medium text-center">Placement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--cf-line)]">
                  {MATRIX_ROWS.map((r) => (
                    <tr key={r.cap}>
                      <td className="px-4 py-3 font-medium">{r.cap}</td>
                      <td className="px-4 py-3 text-center"><Check on={r.student} /></td>
                      <td className="px-4 py-3 text-center"><Check on={r.faculty} /></td>
                      <td className="px-4 py-3 text-center"><Check on={r.admin} /></td>
                      <td className="px-4 py-3 text-center"><Check on={r.placement} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </BeamCard>
          <p className="mt-3 text-xs text-[var(--cf-ink-mute)]">Accounts are provisioned by your institution. Sign in to enter the workspace your role unlocks.</p>
        </section>

        {/* Journey */}
        <section id="journey" className="max-w-[1400px] mx-auto px-4 sm:px-6 py-16 sm:py-24" aria-label="How CampusFlow works">
          <SplitReveal className="cf-statement-sm mt-3 max-w-2xl" lines={['From admission', 'to <em>offer letter.</em>']} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
            {JOURNEY.map((j) => (
              <article key={j.n} className={cn(cardClass, 'p-6')}>
                <p className="cf-display italic text-4xl opacity-30" aria-hidden>{j.n}</p>
                <h3 className="font-semibold mt-2">{j.title}</h3>
                <p className="mt-1 text-sm text-[var(--cf-ink-mute)]">{j.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Get started */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center" aria-label="Get started">
          <h2 className="cf-statement-sm mt-3">Your campus, <em>finally in focus.</em></h2>
          <p className="mt-3 text-[var(--cf-ink-mute)] max-w-md mx-auto">Sign in to step into the operating system, where students, faculty and staff each get their own command center.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/login" className={cn(btnClass('glow', 'large'))}>Sign in <ArrowRight size={17} /></Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--cf-line)]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10 grid sm:grid-cols-3 gap-6">
          <div>
            <p className="font-bold tracking-tight">CampusFlow</p>
            <p className="mt-1 text-xs text-[var(--cf-ink-mute)]">The digital campus itself.</p>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Footer">
            {NAV.map((n) => <a key={n.href} href={n.href} className="text-[var(--cf-ink-soft)] hover:text-primary-600 transition">{n.label}</a>)}
          </nav>
          <p className="text-xs text-[var(--cf-ink-mute)] sm:text-right">© {new Date().getFullYear()} CampusFlow · Crafted with restraint</p>
        </div>
      </footer>
    </div>
  );
}
