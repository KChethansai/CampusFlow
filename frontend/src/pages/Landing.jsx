// Landing: cinematic 12-section product story. ONE dominant interaction per
// section, never stacked effects. Oversized type, sticky scenes, scroll
// choreography (Motion useScroll/useTransform), scene entrances. Dark-first
// Obsidian Ember tokens (soot, ember, warm clay, radii 24/32, pill CTAs).
// No fake stats/personas/testimonials. CTAs only to /login, /dashboard.
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import {
  motion,
  AnimatePresence,
  useMotionValueEvent,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useScroll,
  useTransform
} from 'motion/react';
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  Briefcase,
  CalendarCheck,
  ChevronDown,
  ClipboardList,
  FileText,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Users
} from 'lucide-react';
import SpatialCanvas from '../components/spatial/SpatialCanvas';
import ProductPortal from '../components/landing/ProductPortal';
import TrustBar from '../components/landing/TrustBar';
import { SpotCard, SplitReveal, BeamCard } from '../components/ui/editorial';
import { PIPELINE_STAGES, ROLES, cn, roleLabel } from '../system/tokens';
import { DOMAINS } from '../components/spatial/domains';

const NAV = [
  { label: 'Platform', to: '/dashboard' },
  { label: 'Academics', to: '/attendance' },
  { label: 'Placements', to: '/placement' },
  { label: 'Intelligence', to: '/ai-reports' }
];

const kicker = 'font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#4B5563] dark:text-[#707A89]';
const sub = 'mt-3 text-[15px] leading-relaxed text-[#4B5563] dark:text-[#A7B0BF] max-w-xl';
const glassCard = 'cf-glass rounded-[24px] border border-black/10 dark:border-white/10';
const MotionLink = motion(Link);

/* BlurText (React Bits pattern, inline: word-stagger blur reveal). */
function BlurText({ text, className }) {
  const reduced = useReducedMotion();
  if (reduced) return <span className={className}>{text}</span>;
  const words = String(text).split(' ');
  return (
    <span className={className} aria-label={text}>
      {words.map((w, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="inline-block will-change-transform"
          style={{ marginRight: i < words.length - 1 ? '0.26em' : 0 }}
          initial={{ opacity: 0, filter: 'blur(10px)', y: 10 }}
          whileInView={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          viewport={{ once: true, margin: '-10% 0px' }}
          transition={{ duration: 0.55, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
        >
          {w}
        </motion.span>
      ))}
    </span>
  );
}

/* Scene entrance: single fade-rise per section. */
function Reveal({ children, className, delay = 0 }) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-12% 0px' }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function SectionHead({ number, eyebrow, title, body }) {
  return (
    <Reveal>
      <p className={kicker}>
        <span className="text-[#D86D3E] dark:text-[#F5B08A]">{number}</span>
        {'  /  '}
        {eyebrow}
      </p>
      <h2
        className="font-display font-bold tracking-tight text-balance text-[#100D0B] dark:text-[#F5F7FA] mt-3"
        style={{ fontSize: 'clamp(2rem,4.6vw,3.6rem)', lineHeight: 1.05 }}
      >
        {title}
      </h2>
      {body && <p className={sub}>{body}</p>}
    </Reveal>
  );
}

/* Magnetic primary CTA with an accent bloom and a CSS light sweep. */
function ParticleButton({ to, children }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const x = useSpring(useMotionValue(0), { stiffness: 260, damping: 20 });
  const y = useSpring(useMotionValue(0), { stiffness: 260, damping: 20 });
  return (
    <MotionLink
      ref={ref}
      to={to}
      className="landing-primary group relative inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#E7A66D] text-[#100D0B] font-semibold overflow-hidden"
      style={reduced ? undefined : { x, y }}
      onPointerMove={(event) => {
        if (reduced || window.innerWidth < 768 || !ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        x.set((event.clientX - rect.left - rect.width / 2) * 0.09);
        y.set((event.clientY - rect.top - rect.height / 2) * 0.12);
      }}
      onPointerLeave={() => { x.set(0); y.set(0); }}
    >
      {children}
    </MotionLink>
  );
}

function ScrollCue() {
  const reduced = useReducedMotion();
  return (
    <div className="mt-10 flex justify-center" aria-hidden>
      <span className={cn('inline-flex flex-col items-center gap-1 text-[#707A89]', !reduced && 'animate-bounce')}>
        <span className="font-mono text-[10px] uppercase tracking-[0.25em]">Scroll</span>
        <ChevronDown size={16} />
      </span>
    </div>
  );
}

/* Structural area shape: pipeline position curve (order, not cohort size). */
const AREA_POINTS = [8, 22, 18, 34, 30, 48];
function AreaShape() {
  const reduced = useReducedMotion();
  const w = 560; const h = 220; const pad = 12;
  const step = (w - pad * 2) / (AREA_POINTS.length - 1);
  const max = Math.max(...AREA_POINTS);
  const coords = AREA_POINTS.map((v, i) => [pad + i * step, h - pad - (v / max) * (h - pad * 2)]);
  const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c[0].toFixed(1)},${c[1].toFixed(1)}`).join(' ');
  const area = `${line} L${(w - pad).toFixed(1)},${h - pad} L${pad},${h - pad} Z`;
  const gradId = 'cf-area-fill';
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" role="img" aria-label="Pipeline position curve across the six placement stages">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D86D3E" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#D86D3E" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1={pad} x2={w - pad} y1={h * f} y2={h * f} stroke="currentColor" strokeOpacity="0.08" strokeDasharray="3 5" />
      ))}
      <path d={area} fill={`url(#${gradId})`} />
      <motion.path
        d={line}
        fill="none"
        stroke="#D86D3E"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={reduced ? false : { pathLength: 0 }}
        whileInView={reduced ? undefined : { pathLength: 1 }}
        viewport={{ once: true, margin: '-15% 0px' }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
      />
      {coords.map((c, i) => (
        <g key={i}>
          <circle cx={c[0]} cy={c[1]} r="3.5" fill="#100D0B" stroke="#D86D3E" strokeWidth="2" />
          <text x={c[0]} y={h - 1} textAnchor="middle" fontSize="9" fill="currentColor" opacity="0.55" fontFamily="monospace">
            {PIPELINE_STAGES[i].slice(0, 5)}
          </text>
        </g>
      ))}
    </svg>
  );
}

const ATTENDANCE_STATES = [
  { key: 'present', label: 'Present', color: '#D86D3E', hint: 'Marked in the live matrix' },
  { key: 'od', label: 'On duty', color: '#E7A66D', hint: 'Approved leave shapes' },
  { key: 'absent', label: 'Absent', color: '#B4806A', hint: 'Watch-list inputs' }
];

/* Illustrative status vocabulary — equal thirds, captioned as language not data. */
function StatusRing() {
  const r = 58; const c = 2 * Math.PI * r; const third = c / 3;
  return (
    <svg width="168" height="168" viewBox="0 0 168 168" role="img" aria-label="The three attendance states: present, on duty, absent">
      {ATTENDANCE_STATES.map((s, i) => (
        <circle
          key={s.key}
          cx="84" cy="84" r={r}
          fill="none"
          stroke={s.color}
          strokeWidth="14"
          strokeLinecap="butt"
          strokeDasharray={`${third - 6} ${c - third + 6}`}
          strokeDashoffset={-i * third}
          transform="rotate(-90 84 84)"
        />
      ))}
      <text x="84" y="80" textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.6" fontFamily="monospace">3</text>
      <text x="84" y="96" textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.6" fontFamily="monospace">states</text>
    </svg>
  );
}

const HEAT_CELLS = Array.from({ length: 48 }, (_, i) => ATTENDANCE_STATES[i % 3].key);
function StatusHeatmap() {
  const reduced = useReducedMotion();
  const color = (k) => ATTENDANCE_STATES.find((s) => s.key === k).color;
  return (
    <div
      className="grid grid-cols-8 gap-1.5"
      role="img"
      aria-label="Illustrative attendance matrix showing the present, on duty and absent status key"
    >
      {HEAT_CELLS.map((k, i) => (
        <motion.span
          key={i}
          className="aspect-square rounded-[6px]"
          style={{ background: color(k), opacity: 0.85 }}
          initial={reduced ? false : { opacity: 0, scale: 0.6 }}
          whileInView={reduced ? undefined : { opacity: 0.85, scale: 1 }}
          viewport={{ once: true, margin: '-10% 0px' }}
          transition={{ duration: 0.3, delay: (i % 8) * 0.03 + Math.floor(i / 8) * 0.05 }}
        />
      ))}
    </div>
  );
}

const ROLE_CARDS = [
  { Icon: GraduationCap, tag: 'Student', title: 'One command center', body: 'Next class, due work, attendance health and placement pulse.', points: 'Attendance · Assignments · Placement · Study' },
  { Icon: Users, tag: 'Faculty', title: 'Teach, don’t file', body: 'Attendance in seconds, grading in a queue, requests without paperwork.', points: 'Attendance · Grading · Subjects · Requests' },
  { Icon: Briefcase, tag: 'Placement cell', title: 'Drives to offers', body: 'Publish drives, track eligibility, move candidates down the pipeline.', points: 'Pipeline · Directory · Events · Dashboard' },
  { Icon: ShieldCheck, tag: 'Administration', title: 'The operating picture', body: 'People, departments, academics and insight — one governed workspace.', points: 'Users · Courses · AI reports · Requests' }
];

const REPORT_CHAIN = [
  { step: 'Finding', body: 'Submission gaps cluster ahead of assessment weeks — the queue shows where.' },
  { step: 'Evidence', body: 'Late and missing marks from the grading queue, attached per subject.' },
  { step: 'Implication', body: 'At-risk learners surface while there is still time to intervene.' },
  { step: 'Recommendation', body: 'Nudge mentors for the flagged subjects before the next window.' },
  { step: 'Confidence', body: 'Stated on every report — grounded in workspace records, never a black box.' }
];

const JOURNEY = [
  { title: 'Sign in', body: 'Your role unlocks its workspace.', to: '/login', cta: 'Sign in' },
  { title: 'Open your workspace', body: 'Dashboard, attendance, placement — one record per student.', to: '/dashboard', cta: 'Open dashboard' },
  { title: 'Work the queue', body: 'Requests, grading and drives move pending → done.', to: '/dashboard', cta: 'See the flow' },
  { title: 'Follow the signals', body: 'AI reports attach evidence to every finding.', to: '/dashboard', cta: 'See signals' }
];

export default function Landing() {
  const reduced = useReducedMotion();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 24));

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const previewY = useTransform(scrollYProgress, [0, 1], [0, 90]);

  const [stage, setStage] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setStage((s) => (s + 1) % PIPELINE_STAGES.length), 2200);
    return () => clearInterval(id);
  }, [reduced]);

  const journeyRef = useRef(null);
  const { scrollYProgress: journeyProgress } = useScroll({ target: journeyRef, offset: ['start 0.75', 'end 0.55'] });
  const journeyScale = useTransform(journeyProgress, [0, 1], [0, 1]);

  return (
    <div className="min-h-screen bg-[#F6F7F9] dark:bg-[#100D0B] text-[#100D0B] dark:text-[#F5F7FA] antialiased overflow-x-clip">
      {/* 01 — capsule nav, scroll blur transition */}
      <header className="fixed top-3 sm:top-5 inset-x-0 z-50 px-3 sm:px-4">
        <motion.div
          animate={reduced ? {} : { y: scrolled ? 0 : 4, opacity: 1 }}
          initial={{ y: -16, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            'max-w-5xl mx-auto rounded-full border pl-4 pr-2 py-2 flex items-center justify-between gap-2 transition-all duration-300',
            scrolled
              ? 'cf-glass border-black/10 dark:border-white/15 shadow-lg shadow-black/[0.06] dark:shadow-black/40'
              : 'bg-transparent border-transparent'
          )}
        >
          <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="CampusFlow home">
            <span className="w-8 h-8 rounded-full bg-[#A94727] text-white grid place-items-center font-display font-bold text-sm" aria-hidden>
              C
            </span>
            <span className="font-display font-semibold tracking-tight text-[17px]">CampusFlow</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1" aria-label="Product">
            {NAV.map((n) => (
              <Link
                key={n.label}
                to={n.to}
                className="px-3.5 py-2 rounded-full text-sm font-medium text-[#4B5563] dark:text-[#A7B0BF] hover:text-[#100D0B] dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.07] transition-colors"
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
            <Link
              to="/login"
              className="hidden sm:block px-3 py-2 rounded-full text-sm font-semibold text-[#4B5563] dark:text-[#A7B0BF] hover:text-[#100D0B] dark:hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-full bg-[#E7A66D] text-[#100D0B] text-sm font-semibold hover:brightness-95 transition"
            >
              Get started
            </Link>
          </div>
        </motion.div>
      </header>

      <main>
        {/* 02 — hero: dot grid only + BlurText + product visual + particle CTA */}
        <section ref={heroRef} className="landing-hero relative isolate w-full overflow-hidden" aria-label="Introduction">
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div
              className="absolute inset-0 opacity-70 dark:opacity-100"
              style={{
                backgroundImage: 'radial-gradient(rgba(10,13,18,0.10) 1px, transparent 1px)',
                backgroundSize: '26px 26px'
              }}
            />
            <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_35%,black,transparent)] bg-gradient-to-b from-[#D86D3E]/[0.07] dark:from-[#D86D3E]/[0.12] to-transparent" />
            {!reduced && <motion.div className="landing-hero-orb absolute rounded-full pointer-events-none" animate={{ x: [0, 24, -10, 0], y: [0, -14, 12, 0], scale: [1, 1.05, .98, 1] }} transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }} />}
          </div>

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-32 sm:pt-44 pb-8 text-center">
            <motion.p initial={reduced ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .42, delay: .02 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/10 dark:border-white/10 cf-glass text-xs font-semibold uppercase tracking-[0.14em] text-[#4B5563] dark:text-[#A7B0BF]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E7A66D]" aria-hidden />
              The academic operating system
            </motion.p>
            <h1
              className="font-display font-bold tracking-tight leading-[1.02] mt-6 text-balance"
              style={{ fontSize: 'clamp(3.2rem,8vw,9.5rem)' }}
            >
              <BlurText text="Your campus." className="block" />
              <span className="landing-accent block bg-gradient-to-r from-[var(--cf-accent)] via-[var(--cf-teal)] to-[var(--cf-volt)] bg-clip-text text-transparent">
                <BlurText text="In sync." />
              </span>
            </h1>
            <motion.p initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .48, delay: .16 }} className="mt-6 text-base sm:text-lg leading-relaxed text-[#4B5563] dark:text-[#A7B0BF] max-w-2xl mx-auto">
              Attendance, assignments, placements and insight — moving together
              in one workspace, one record per student.
            </motion.p>
            <motion.div initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .48, delay: .22 }} className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <ParticleButton to="/login">
                Get started <ArrowRight size={17} aria-hidden />
              </ParticleButton>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-black/10 dark:border-white/15 cf-glass font-semibold hover:border-[#D86D3E]/50 transition-colors"
              >
                Sign in <ArrowUpRight size={17} aria-hidden />
              </Link>
            </motion.div>
            <ScrollCue />
          </div>

          <motion.div initial={reduced ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65, delay: .28, ease: [0.16, 1, 0.3, 1] }} style={reduced ? undefined : { y: previewY }} className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 pb-4">
            <div className="landing-preview cf-glass rounded-[32px] border border-black/10 dark:border-white/10 overflow-hidden shadow-2xl shadow-[#D86D3E]/[0.08] dark:shadow-black/50">
              <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-black/10 dark:border-white/10">
                <div className="flex items-center gap-1.5" aria-hidden>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                </div>
                <p className="hidden sm:block font-mono text-xs text-[#4B5563] dark:text-[#707A89] px-4 py-1.5 rounded-full border border-black/10 dark:border-white/10">
                  campusflow.app/dashboard
                </p>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-[#4B5563] dark:text-[#A7B0BF] border border-black/10 dark:border-white/10">
                  <span className="landing-live-dot w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden />
                  Live workspace
                </span>
              </div>
              <div inert aria-hidden className="h-[320px] sm:h-[420px]">
                <SpatialCanvas className="w-full h-full" compact />
              </div>
              <div className="flex flex-wrap gap-1.5 px-4 sm:px-5 py-3.5 border-t border-black/10 dark:border-white/10">
                {DOMAINS.map((d) => (
                  <span
                    key={d.key}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-full border border-black/10 dark:border-white/10"
                  >
                    <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5" style={{ background: d.color }} />
                    {d.label}
                  </span>
                ))}
              </div>
            </div>
            <p className="mt-3 text-center text-[13px] text-[#4B5563] dark:text-[#707A89]">
              A preview of the real product — sign in to enter.
            </p>
          </motion.div>
        </section>

        {/* 03 — platform pulse: number tickers, structural facts only */}
        <section className="landing-band relative isolate w-full" aria-label="CampusFlow at a glance">
          <div className="landing-inner max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <SectionHead
            number="03"
            eyebrow="Platform pulse"
            title="The shape of the system."
            body="Four structural facts. No vanity metrics — every number names something real in the workspace."
          />
          <Reveal className="mt-7">
            <TrustBar />
          </Reveal>

          </div>
        </section>

        {/* 04 — academic intelligence: area chart + spotlight + text reveal */}
        <section id="intelligence" className="landing-band relative isolate w-full" aria-label="Academic intelligence">
          <div className="landing-inner max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <SectionHead
            number="04"
            eyebrow="Academic intelligence"
            title="Signals, not noise."
            body="Attendance health, queue movement and pipeline position — each insight ships with its evidence attached."
          />
          <div className="mt-7 grid lg:grid-cols-5 gap-3.5 sm:gap-4">
            <Reveal className="lg:col-span-3">
              <div className={`${glassCard} p-5 sm:p-6 text-[#100D0B] dark:text-[#F5F7FA]`}>
                <p className={kicker}>Pipeline position</p>
                <div className="mt-4">
                  <AreaShape />
                </div>
                <p className="mt-3 text-[13px] text-[#4B5563] dark:text-[#A7B0BF]">
                  Structural diagram — the curve follows stage order ({PIPELINE_STAGES.length} stages), not cohort sizes.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.08} className="lg:col-span-2">
              <SpotCard className={`${glassCard} p-5 sm:p-6 h-full`}>
                <p className={kicker}>Spotlight</p>
                <SplitReveal
                  className="font-display font-bold tracking-tight text-xl sm:text-2xl mt-3 text-[#100D0B] dark:text-[#F5F7FA]"
                  lines={['At-risk signals surface', 'early — evidence attached,', 'never a black box.']}
                />
                <ul className="mt-4 space-y-2.5">
                  {[
                    { Icon: CalendarCheck, text: 'Attendance patterns flag drift before it compounds.' },
                    { Icon: ClipboardList, text: 'Late and missing work queues up per subject.' },
                    { Icon: Sparkles, text: 'AI reports cite the records behind each finding.' }
                  ].map(({ Icon, text }) => (
                    <li key={text} className="flex gap-3 text-[13px] leading-relaxed text-[#4B5563] dark:text-[#A7B0BF]">
                      <span className="mt-0.5 w-8 h-8 shrink-0 rounded-full grid place-items-center bg-[#D86D3E]/10 dark:bg-[#D86D3E]/15 text-[#D86D3E] dark:text-[#F5B08A]" aria-hidden>
                        <Icon size={15} />
                      </span>
                      {text}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/dashboard"
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#D86D3E] dark:text-[#F5B08A] hover:underline underline-offset-4"
                >
                  Open the workspace <ArrowUpRight size={15} aria-hidden />
                </Link>
              </SpotCard>
            </Reveal>
          </div>

          </div>
        </section>

        {/* 05 — attendance: ring + heatmap + trend */}
        <section id="attendance" className="landing-band relative isolate w-full" aria-label="Attendance">
          <div className="landing-inner max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <SectionHead
            number="05"
            eyebrow="Attendance"
            title="Every mark, one matrix."
            body="Present, on duty, absent — three states resolve every session in the live grid."
          />
          <div className="mt-7 grid md:grid-cols-3 gap-3.5 sm:gap-4">
            <Reveal>
              <div className={`${glassCard} p-5 sm:p-6 text-center h-full`}>
                <p className={kicker}>The three states</p>
                <div className="mt-4 flex justify-center">
                  <StatusRing />
                </div>
                <ul className="mt-4 space-y-1.5 text-left text-[13px] font-medium text-[#4B5563] dark:text-[#A7B0BF]">
                  {ATTENDANCE_STATES.map((s) => (
                    <li key={s.key} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: s.color }} aria-hidden />
                      {s.label} — {s.hint}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className={`${glassCard} p-5 sm:p-6 h-full`}>
                <p className={kicker}>Status key, set as a matrix</p>
                <div className="mt-4">
                  <StatusHeatmap />
                </div>
                <p className="mt-3 text-[13px] text-[#4B5563] dark:text-[#A7B0BF]">
                  Illustrative pattern of the status vocabulary — live marks live inside the app.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.16}>
              <div className={`${glassCard} p-5 sm:p-6 h-full flex flex-col`}>
                <p className={kicker}>Movement shape</p>
                <svg viewBox="0 0 200 90" className="mt-4 w-full h-auto" role="img" aria-label="Direction-only trend shape">
                  <motion.polyline
                    points="4,70 34,62 64,66 94,48 124,52 154,30 184,34"
                    fill="none"
                    stroke="#E7A66D"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={reduced ? false : { pathLength: 0 }}
                    whileInView={reduced ? undefined : { pathLength: 1 }}
                    viewport={{ once: true, margin: '-15% 0px' }}
                    transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                  />
                </svg>
                <p className="mt-3 text-[13px] text-[#4B5563] dark:text-[#A7B0BF]">
                  Direction only — live values resolve per subject after sign-in.
                </p>
                <Link
                  to="/dashboard"
                  className="mt-auto pt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#D86D3E] dark:text-[#F5B08A] hover:underline underline-offset-4"
                >
                  Check attendance <ArrowUpRight size={15} aria-hidden />
                </Link>
              </div>
            </Reveal>
          </div>

          </div>
        </section>

        {/* 06 — placement: funnel + stage transitions + role cards (sticky scene) */}
        <section id="placement" className="landing-band relative isolate w-full" aria-label="Placements">
          <div className="landing-inner max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <SectionHead
            number="06"
            eyebrow="Placement"
            title="Drives to offers, in one pipeline."
            body="Every applicant moves down one visible funnel — applied to placed, no side channels."
          />
          <div className="mt-7 grid lg:grid-cols-2 gap-3.5 sm:gap-4">
            <div>
              <Reveal>
                <div className={`${glassCard} p-5 sm:p-6`}>
                  <p className={kicker}>The funnel</p>
                  <ol className="mt-4 space-y-2">
                    {PIPELINE_STAGES.map((s, i) => (
                      <li key={s}>
                        <button
                          type="button"
                          onClick={() => setStage(i)}
                          aria-pressed={stage === i}
                          className={cn(
                            'w-full text-left px-3 py-2 rounded-2xl border text-[13px] font-semibold transition-all',
                            stage === i
                              ? 'border-[#D86D3E]/60 bg-[#D86D3E]/[0.08] dark:bg-[#D86D3E]/15'
                              : 'border-black/10 dark:border-white/10 hover:border-[#D86D3E]/40'
                          )}
                          style={{ maxWidth: `${100 - i * 9}%` }}
                        >
                          <span className="font-mono text-[11px] text-[#4B5563] dark:text-[#707A89] mr-2" aria-hidden>
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          {roleLabel(s)}
                        </button>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-3 text-[13px] text-[#4B5563] dark:text-[#A7B0BF]">
                    Widths illustrate stage order, not cohort sizes.
                  </p>
                </div>
              </Reveal>
            </div>
            <Reveal delay={0.08} className="lg:sticky lg:top-24 self-start">
              <div className={`${glassCard} p-5 sm:p-6 min-h-[280px] flex flex-col`}>
                <p className={kicker}>Stage transition</p>
                <div className="mt-4 flex-1" aria-live="polite">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={stage}
                      initial={reduced ? { opacity: 0 } : { opacity: 0, x: 32 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={reduced ? { opacity: 0 } : { opacity: 0, x: -32 }}
                      transition={reduced ? { duration: 0.01 } : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <p className="font-mono text-[11px] uppercase tracking-wider text-[#4B5563] dark:text-[#707A89]">
                        Stage {String(stage + 1).padStart(2, '0')} of {PIPELINE_STAGES.length}
                      </p>
                      <p className="font-display text-3xl font-bold tracking-tight mt-1">
                        {roleLabel(PIPELINE_STAGES[stage])}
                      </p>
                      <p className="mt-2 text-[15px] leading-relaxed text-[#4B5563] dark:text-[#A7B0BF]">
                        {stage < PIPELINE_STAGES.length - 1
                          ? `Candidates advance to ${roleLabel(PIPELINE_STAGES[stage + 1])} — eligibility checked, interviews scheduled, movement logged.`
                          : 'Hired — the offer letter lands and the record closes clean.'}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>
                <div className="mt-4 flex items-center gap-1.5" role="tablist" aria-label="Placement stages">
                  {PIPELINE_STATES_DOTS(stage, setStage)}
                </div>
                <Link
                  to="/placement"
                  className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#A94727] text-white text-sm font-semibold hover:brightness-110 transition w-fit"
                >
                  Open placement <ArrowUpRight size={15} aria-hidden />
                </Link>
              </div>
            </Reveal>
          </div>

          </div>
        </section>

        {/* 07 — people: profile-card directory preview, real entities */}
        <section id="people" className="landing-band relative isolate w-full" aria-label="People">
          <div className="landing-inner max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <SectionHead
            number="07"
            eyebrow="People"
            title="Everyone, findable."
            body="Five roles, six domains — the directory mirrors the real identity model."
          />
          <div className="mt-7 grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {ROLES.map((role, i) => (
              <Reveal key={role} delay={Math.min(i * 0.06, 0.24)}>
                <SpotCard className={`${glassCard} p-5 flex gap-4 items-start h-full`}>
                  <span
                    className="w-12 h-12 shrink-0 rounded-2xl grid place-items-center font-display font-bold text-lg bg-[#D86D3E]/10 dark:bg-[#D86D3E]/15 text-[#D86D3E] dark:text-[#F5B08A]"
                    aria-hidden
                  >
                    {roleLabel(role).charAt(0)}
                  </span>
                  <span>
                    <span className="block font-display font-semibold tracking-tight text-[17px]">{roleLabel(role)}</span>
                    <span className="block font-mono text-[11px] text-[#4B5563] dark:text-[#707A89] mt-0.5">@{role}</span>
                    <span className="mt-2 flex flex-wrap gap-1">
                      {DOMAINS.slice(0, 3).map((d) => (
                        <span
                          key={d.key}
                          className="inline-block w-2.5 h-2.5 rounded-full border border-black/10 dark:border-white/20"
                          style={{ background: d.color }}
                          title={d.label}
                        />
                      ))}
                    </span>
                    <Link
                      to="/dashboard"
                      className="mt-2.5 inline-flex items-center gap-1 text-[13px] font-semibold text-[#D86D3E] dark:text-[#F5B08A] hover:underline underline-offset-4"
                    >
                      View workspace <ArrowRight size={13} aria-hidden />
                    </Link>
                  </span>
                </SpotCard>
              </Reveal>
            ))}
            <Reveal delay={0.24}>
              <Link to="/dashboard" className={`group ${glassCard} p-5 flex flex-col justify-center h-full hover:border-[#D86D3E]/40 transition-colors min-h-[148px]`}>
                <span className="inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-[#4B5563] dark:text-[#A7B0BF]">
                  <Bell size={14} aria-hidden /> {DOMAINS.length} domains
                </span>
                <span className="mt-2 font-display font-semibold text-[17px] tracking-tight">
                  Browse the full directory after sign-in
                </span>
                <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[#D86D3E] dark:text-[#F5B08A]">
                  Enter directory
                  <ArrowRight size={15} aria-hidden className="transition-transform duration-200 group-hover:translate-x-1.5" />
                </span>
              </Link>
            </Reveal>
          </div>

          </div>
        </section>

        {/* 08 — AI reports: glass + border beam, full reasoning chain */}
        <section id="ai-reports" className="landing-band relative isolate w-full" aria-label="AI reports">
          <div className="landing-inner max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <SectionHead
            number="08"
            eyebrow="AI reports"
            title="Every finding shows its work."
            body="An example of the anatomy every report follows — grounded in workspace records."
          />
          <Reveal className="mt-7">
            <BeamCard className="p-px">
              <div className="rounded-[calc(1rem-1px)] p-5 sm:p-8">
                <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-black/10 dark:border-white/10 text-xs font-semibold text-[#4B5563] dark:text-[#A7B0BF]">
                  <Sparkles size={13} aria-hidden className="text-[#D86D3E] dark:text-[#F5B08A]" />
                  Example report · At-risk learners
                </p>
                <ol className="mt-5 space-y-0">
                  {REPORT_CHAIN.map((r, i) => (
                    <li key={r.step} className="relative pl-8 pb-5 last:pb-0">
                      {i < REPORT_CHAIN.length - 1 && (
                        <span aria-hidden className="absolute left-[9px] top-6 bottom-0 w-px bg-[#D86D3E]/25" />
                      )}
                      <span aria-hidden className="absolute left-1 top-1.5 w-[11px] h-[11px] rounded-full border-[2.5px] border-[#D86D3E] bg-transparent" />
                      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#D86D3E] dark:text-[#F5B08A]">
                        {r.step}
                      </p>
                      <p className="mt-1 text-[15px] leading-relaxed text-[#100D0B] dark:text-[#F5F7FA] max-w-2xl">
                        {r.body}
                      </p>
                    </li>
                  ))}
                </ol>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#E7A66D] text-[#100D0B] text-sm font-semibold hover:brightness-95 transition"
                  >
                    Get reports <ArrowRight size={15} aria-hidden />
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-black/10 dark:border-white/15 text-sm font-semibold hover:border-[#D86D3E]/50 transition-colors"
                  >
                    Sign in <ArrowUpRight size={15} aria-hidden />
                  </Link>
                </div>
              </div>
            </BeamCard>
          </Reveal>

          </div>
        </section>

        {/* 09 — role experiences: morphing switcher */}
        <section id="roles" className="landing-band relative isolate w-full" aria-label="Role experiences">
          <div className="landing-inner max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <SectionHead
            number="09"
            eyebrow="Role experiences"
            title="One platform. Four tailored experiences."
            body="Switch tabs — headline, facts, panels and CTA morph in place. No reload, every link real."
          />
          <Reveal className="mt-7">
            <ProductPortal />
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 mt-4">
            {ROLE_CARDS.map(({ Icon, tag, title, body, points }) => (
              <Reveal key={tag}>
                <Link
                  to="/login"
                  className={`group ${glassCard} p-6 flex flex-col gap-4 hover:border-[#D86D3E]/40 dark:hover:border-[#D86D3E]/50 transition-colors h-full`}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-[#D86D3E]/10 dark:bg-[#D86D3E]/15 text-[#D86D3E] dark:text-[#F5B08A]">
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
                  <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-[#D86D3E] dark:text-[#F5B08A]">
                    Enter workspace
                    <ArrowRight size={15} aria-hidden className="transition-transform duration-200 group-hover:translate-x-1.5" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>

          </div>
        </section>

        {/* 10 — journey: scroll-driven stepper */}
        <section id="journey" className="landing-band relative isolate w-full" aria-label="Getting started journey">
          <div className="landing-inner max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <SectionHead
            number="10"
            eyebrow="Journey"
            title="Live in four steps."
            body="From sign-in to signal — the line fills as you scroll."
          />
          <div ref={journeyRef} className="mt-7 relative">
            <div aria-hidden className="absolute left-[21px] sm:left-[23px] top-2 bottom-2 w-[2px] bg-black/10 dark:bg-white/10 rounded-full">
              <motion.div
                className="w-full h-full origin-top bg-[#D86D3E] rounded-full"
                style={reduced ? undefined : { scaleY: journeyScale }}
              />
            </div>
            <ol className="space-y-3.5 sm:space-y-4">
              {JOURNEY.map((j, i) => (
                <li key={j.title} className="relative ml-12 sm:ml-14">
                  <span
                    aria-hidden
                    className="absolute -left-12 sm:-left-14 top-5 w-[22px] h-[22px] sm:w-6 sm:h-6 rounded-full grid place-items-center font-mono text-[10px] font-bold bg-[#A94727] text-white"
                  >
                    {i + 1}
                  </span>
                  <Reveal className={`${glassCard} p-5 flex flex-wrap items-center justify-between gap-3`}>
                    <div className="min-w-0">
                      <h3 className="font-display font-semibold tracking-tight text-lg">{j.title}</h3>
                      <p className="mt-0.5 text-[13px] text-[#4B5563] dark:text-[#A7B0BF]">{j.body}</p>
                    </div>
                    <Link
                      to={j.to}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-black/10 dark:border-white/15 text-sm font-semibold hover:border-[#D86D3E]/50 transition-colors shrink-0"
                    >
                      {j.cta} <ArrowUpRight size={14} aria-hidden />
                    </Link>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>

          </div>
        </section>

        {/* 11 — CTA: glow only */}
        <section className="landing-band relative isolate w-full" aria-label="Get started">
          <div className="landing-inner max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <Reveal>
            <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#100D0B] px-6 py-16 sm:py-24 text-center">
              <div
                aria-hidden
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[420px] rounded-full bg-[#D86D3E]/25 blur-[130px] pointer-events-none"
              />
              <div className="relative">
                <p className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/15 text-xs font-semibold uppercase tracking-[0.14em] text-[#A7B0BF]">
                  <FileText size={13} aria-hidden /> Get started
                </p>
                <h2 className="font-display font-bold tracking-tight text-balance text-white mt-5" style={{ fontSize: 'clamp(2.2rem,5.5vw,4.2rem)', lineHeight: 1.04 }}>
                  Bring your campus in sync.
                </h2>
                <p className="mt-4 text-[#A7B0BF] max-w-md mx-auto">
                  Sign in to step into the workspace your role unlocks.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <ParticleButton to="/login">
                    Get started <ArrowRight size={17} aria-hidden />
                  </ParticleButton>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-white/20 text-white font-semibold hover:bg-white/10 transition-colors"
                  >
                    Sign in <ArrowUpRight size={17} aria-hidden />
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>

          </div>
        </section>
      </main>

      {/* 12 — footer */}
      <footer className="border-t border-black/10 dark:border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <p className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-[#A94727] text-white grid place-items-center font-display font-bold text-xs" aria-hidden>
              C
            </span>
            <span className="font-display font-semibold tracking-tight">CampusFlow</span>
            <span className="text-xs text-[#4B5563] dark:text-[#707A89]">
              © {new Date().getFullYear()}
            </span>
          </p>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm font-medium" aria-label="Footer">
            <Link to="/dashboard" className="text-[#4B5563] dark:text-[#A7B0BF] hover:text-[#100D0B] dark:hover:text-white transition-colors">Dashboard</Link>
            <Link to="/placement" className="text-[#4B5563] dark:text-[#A7B0BF] hover:text-[#100D0B] dark:hover:text-white transition-colors">Placement</Link>
            <Link to="/login" className="text-[#4B5563] dark:text-[#A7B0BF] hover:text-[#100D0B] dark:hover:text-white transition-colors">Sign in</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function PIPELINE_STATES_DOTS(active, setStage) {
  return PIPELINE_STAGES.map((s, i) => (
    <button
      key={s}
      type="button"
      role="tab"
      aria-selected={active === i}
      aria-label={`Show stage ${roleLabel(s)}`}
      onClick={() => setStage(i)}
      className={cn(
        'h-2 rounded-full transition-all',
        active === i ? 'w-7 bg-[#D86D3E]' : 'w-2 bg-black/15 dark:bg-white/20 hover:bg-black/30 dark:hover:bg-white/40'
      )}
    />
  ));
}
