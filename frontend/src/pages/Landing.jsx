// Landing: NOTA-grade editorial narrative — one promise per viewport,
// scroll-scrubbed 3D hero, statement splits, journey, kit. Every CTA is real.
// Original copy throughout; NOTA supplies structure and craft, never content.
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Briefcase,
  Building2,
  GraduationCap,
  Moon,
  Sparkles,
  Sun,
  Users
} from 'lucide-react';
import SpatialCanvas from '../components/spatial/SpatialCanvas';
import { MagneticButton, Preloader, SplitReveal } from '../components/ui/editorial';
import { useTheme } from '../system/theme';
import { btnClass, cardClass, cn } from '../system/tokens';

const NAV = [
  { label: 'System', href: '#system' },
  { label: "Who it's for", href: '#audience' },
  { label: 'Campus', href: '#campus' },
  { label: 'Inside', href: '#inside' },
  { label: 'Journey', href: '#journey' }
];

const SPECS = [
  { k: 'Learn', title: 'Academics, alive', body: 'Courses, subjects and assignments that behave like a modern workspace — clear deadlines, honest feedback, nothing lost in a register.' },
  { k: 'Work', title: 'Placements, engineered', body: 'A pipeline from applied to placed. Drives, eligibility and interviews in one marketplace worth opening every morning.' },
  { k: 'Know', title: 'Intelligence, grounded', body: 'Every insight answers what changed, why it matters and what happens next — with evidence beside it, never a black box.' }
];

const AUDIENCES = [
  { Icon: GraduationCap, title: 'Students & Learners', body: 'Your day, understood. Next class, due work, attendance health and placement pulse — one command center instead of five portals.' },
  { Icon: Users, title: 'Faculty & Mentors', body: 'Teach, don’t administrate. Attendance in seconds, grading in a queue, announcements without the paperwork.' },
  { Icon: Briefcase, title: 'Recruiters & Admins', body: 'See the institution clearly. Drives, applicants, departments and academic health — one operating picture.' }
];

const SPLITS = [
  { n: '01', Icon: Building2, claim: ['A living twin', 'of <em>your university.</em>'], body: 'Every system on campus — academics, people, placements, intelligence — rendered as one place you can walk through, not tabs you drown in.', tint: 'from-primary-500/25 via-primary-500/5 to-transparent' },
  { n: '02', Icon: BookOpen, claim: ['Looks like a campus.', '<em>Works like software.</em>'], body: 'For you it feels like college. Underneath, every stroke of admin — enrollment, attendance, grading — becomes structured, searchable data.', tint: 'from-accent-violet/25 via-accent-violet/5 to-transparent' },
  { n: '03', Icon: Briefcase, claim: ['No chaos. No follow-ups', '<em>lost in chat.</em>'], body: 'Applications move down a visible pipeline. Students always know where they stand; officers always know what’s stuck.', tint: 'from-green-500/20 via-green-500/5 to-transparent' },
  { n: '04', Icon: Sparkles, claim: ['Quiet intelligence,', '<em>loud clarity.</em>'], body: 'Attendance dips, placement surges, at-risk cohorts — surfaced with reasons and next actions, then out of your way.', tint: 'from-amber-500/20 via-amber-500/5 to-transparent' }
];

const JOURNEY = [
  { n: '01', title: 'Enroll', body: 'Admissions, departments and courses — one record per student from day one.' },
  { n: '02', title: 'Learn', body: 'Attendance, assignments and feedback flow into a living academic profile.' },
  { n: '03', title: 'Get placed', body: 'Drives, eligibility and interviews move down a visible pipeline.' },
  { n: '04', title: 'See clearly', body: 'Every step leaves evidence — reports, timelines and insight, not guesses.' }
];

const KIT = [
  { title: 'Student app', body: 'Command center, attendance pulse, placement board. Your day, understood.' },
  { title: 'Faculty console', body: 'Classes, grading queue, announcements. Teach, don’t administrate.' },
  { title: 'Placement board', body: 'Drives, applicants, pipeline. Classroom to career, visibly.' },
  { title: 'Intelligence', body: 'Signals with evidence. What changed, why, what next.' }
];

export default function Landing() {
  const { theme, toggle } = useTheme();
  const heroRef = useRef(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, reduced ? 1 : 1.12]);
  const heroFade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="min-h-screen bg-[var(--cf-bg)] text-[var(--cf-ink)]">
      <Preloader />
      {/* Sticky nav + priced CTA */}
      <header className="sticky top-0 z-50 cf-glass border-b border-[var(--cf-line)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
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
        {/* Hero — scrubbed 3D */}
        <section ref={heroRef} className="relative overflow-hidden cf-grain" aria-label="Introduction">
          <motion.div style={reduced ? undefined : { scale: heroScale, opacity: heroFade }} className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-6">
            <p className="cf-kicker">Writing infrastructure for modern campuses</p>
            <h1 className="cf-statement mt-4 max-w-5xl">
              <SplitReveal lines={['The campus,', '<em>alive</em> in software.']} />
            </h1>
            <p className="mt-5 max-w-xl text-base sm:text-lg text-[var(--cf-ink-mute)]">
              CampusFlow turns a university into one intelligent place — classes, placements,
              people and insight, moving together in real time.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <MagneticButton className={cn(btnClass('glow', 'large'))}>
                <Link to="/login" className="flex items-center gap-2">Explore CampusFlow <ArrowRight size={17} /></Link>
              </MagneticButton>
              <a href="#campus" className={cn(btnClass('outline', 'large'))}>See how it works</a>
            </div>
          </motion.div>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-14">
            <div className="h-[380px] sm:h-[520px] rounded-3xl overflow-hidden border border-[var(--cf-line)]">
              <SpatialCanvas className="w-full h-full" compact={false} />
            </div>
          </div>
        </section>

        {/* Spec strip */}
        <section id="system" className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28" aria-label="System">
          <p className="cf-kicker">The system</p>
          <SplitReveal className="cf-statement-sm mt-3 max-w-3xl" lines={['Three systems.', '<em>One campus.</em>']} />
          <div className="grid md:grid-cols-3 gap-px mt-10 rounded-3xl overflow-hidden border border-[var(--cf-line)] bg-[var(--cf-line)]">
            {SPECS.map((s) => (
              <article key={s.k} className="bg-[var(--cf-surface)] p-7">
                <p className="cf-kicker">{s.k}</p>
                <h3 className="cf-display text-2xl mt-2">{s.title}</h3>
                <p className="mt-2 text-sm text-[var(--cf-ink-mute)] leading-relaxed">{s.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Philosophy interstitial */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center" aria-label="Philosophy">
          <SplitReveal className="cf-statement" lines={['Some places need time,', 'space, and <em>a pulse</em> to exist.']} />
          <p className="mt-5 text-[var(--cf-ink-mute)] max-w-xl mx-auto">A campus is not a database of records. It’s thousands of days unfolding at once — and software should feel like that.</p>
        </section>

        {/* Audience */}
        <section id="audience" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24" aria-label="Who it's for">
          <p className="cf-kicker">Who it’s for</p>
          <SplitReveal className="cf-statement-sm mt-3 max-w-2xl" lines={['Made for people who', '<em>live on campus.</em>']} />
          <div className="grid md:grid-cols-3 gap-4 mt-10">
            {AUDIENCES.map(({ Icon, title, body }) => (
              <article key={title} className={cn(cardClass, 'p-7 hover:shadow-3 hover:-translate-y-1 transition-all duration-300')}>
                <Icon size={22} className="text-primary-500" aria-hidden />
                <h3 className="cf-display text-2xl mt-4">{title}</h3>
                <p className="mt-2 text-sm text-[var(--cf-ink-mute)] leading-relaxed">{body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Alternating splits */}
        <div id="campus" className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-20 sm:space-y-28" aria-label="Campus in depth">
          {SPLITS.map((s, i) => (
            <section key={s.n} className={cn('grid lg:grid-cols-2 gap-8 items-center', i % 2 && 'lg:[&>*:first-child]:order-2')}>
              <div>
                <p className="cf-kicker">{s.n} — CampusFlow</p>
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

        {/* Journey — what the product actually does, step by step */}
        <section id="journey" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24" aria-label="How CampusFlow works">
          <p className="cf-kicker">How it works</p>
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

        {/* Inside the box */}
        <section id="inside" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24" aria-label="Inside CampusFlow">
          <p className="cf-kicker">Inside CampusFlow</p>
          <SplitReveal className="cf-statement-sm mt-3 max-w-2xl" lines={['A complete,', '<em>ready-to-run</em> campus.']} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
            {KIT.map((k, i) => (
              <article key={k.title} className={cn(cardClass, 'p-6')}>
                <p className="cf-display italic text-4xl opacity-30" aria-hidden>0{i + 1}</p>
                <h3 className="font-semibold mt-2">{k.title}</h3>
                <p className="mt-1 text-sm text-[var(--cf-ink-mute)]">{k.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Get started — provisioned accounts, real product */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center" aria-label="Get started">
          <p className="cf-kicker">Begin</p>
          <h2 className="cf-statement-sm mt-3">Your campus, <em>finally in focus.</em></h2>
          <p className="mt-3 text-[var(--cf-ink-mute)] max-w-md mx-auto">Accounts are provisioned by your institution — sign in to step into the operating system, where students, faculty and staff each get their own command center.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/login" className={cn(btnClass('glow', 'large'))}>Sign in <ArrowRight size={17} /></Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--cf-line)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid sm:grid-cols-3 gap-6">
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
