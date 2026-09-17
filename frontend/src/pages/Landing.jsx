// Landing: neo-brutalist public experience — paper navbar + racing stripe,
// hero split with ProductPortal, reorderable pillar bento, role cards with
// real capabilities, truthful RBAC matrix, journey + readiness checklist,
// generic trust band, black CTA. CTAs only to /login /signup /dashboard.
// Counters reflect structural facts only (roles, pipeline stages, pillars).
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Briefcase,
  Building2,
  CalendarCheck,
  Check,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  GripVertical,
  Moon,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Sun,
  Users
} from 'lucide-react';
import SpatialCanvas from '../components/spatial/SpatialCanvas';
import ProductPortal from '../components/landing/ProductPortal';
import TrustBar from '../components/landing/TrustBar';
import {
  AnimatedCounter,
  BentoGrid,
  Marquee,
  Preloader,
  SplitReveal
} from '../components/ui/editorial';
import { useTheme } from '../system/theme';
import { PIPELINE_STAGES, ROLES, btnClass, cn } from '../system/tokens';

const NAV = [
  { label: 'System', href: '#system' },
  { label: 'Roles', href: '#roles' },
  { label: 'Access', href: '#access' },
  { label: 'Journey', href: '#journey' }
];

const PILLAR_ORDER_KEY = 'cf_pillar_order';
const READINESS_KEY = 'cf_readiness';

const DEFAULT_PILLARS = [
  {
    id: 'analytics',
    Icon: BarChart3,
    title: 'Academic Analytics',
    body: 'Per-subject attendance health, submission momentum and at-risk signals — evidence beside every insight.',
    tint: 'bg-gold',
    to: '/dashboard',
    action: 'Open dashboard'
  },
  {
    id: 'drives',
    Icon: Briefcase,
    title: 'Placement Drives',
    body: 'Drives, eligibility and interviews move down one visible pipeline.',
    tint: 'bg-volt',
    to: '/placement',
    action: 'Open placement'
  },
  {
    id: 'attendance',
    Icon: CalendarCheck,
    title: 'Attendance Matrix',
    body: 'Mark in seconds. Heatmaps and watch-lists replace registers.',
    tint: 'bg-royal',
    to: '/attendance',
    action: 'Open attendance'
  },
  {
    id: 'ai',
    Icon: Sparkles,
    title: 'AI Reports',
    body: 'What changed, why it matters, what happens next. Grounded, never a black box.',
    tint: 'bg-flag',
    to: '/ai-reports',
    action: 'Open AI reports'
  }
];

const PILLAR_SPANS = ['md:col-span-4', 'md:col-span-2', 'md:col-span-2', 'md:col-span-4'];

const ROLES_CARDS = [
  {
    Icon: GraduationCap,
    tag: 'Student',
    title: 'One command center',
    body: 'Next class, due work, attendance health and placement pulse.',
    points: [
      ['Attendance health', '/attendance'],
      ['Assignments queue', '/assignments'],
      ['Placement pipeline', '/placement'],
      ['Study workspace', '/study']
    ]
  },
  {
    Icon: Users,
    tag: 'Faculty',
    title: 'Teach, don’t file',
    body: 'Attendance in seconds, grading in a queue, requests without paperwork.',
    points: [
      ['Mark attendance', '/attendance'],
      ['Grade submissions', '/assignments'],
      ['Subjects', '/subjects'],
      ['Requests', '/requests']
    ]
  },
  {
    Icon: Briefcase,
    tag: 'Placement cell',
    title: 'Drives to offers',
    body: 'Publish drives, track eligibility, move candidates down the pipeline.',
    points: [
      ['Placement pipeline', '/placement'],
      ['Student directory', '/directory'],
      ['Drive events', '/events'],
      ['Dashboard', '/dashboard']
    ]
  },
  {
    Icon: ShieldCheck,
    tag: 'Administration',
    title: 'The operating picture',
    body: 'People, departments, academics and insight — one governed workspace.',
    points: [
      ['Users & departments', '/users'],
      ['Courses & subjects', '/courses'],
      ['AI reports', '/ai-reports'],
      ['Requests', '/requests']
    ]
  }
];

const MATRIX_ROWS = [
  { cap: 'Dashboard', to: '/dashboard', student: true, faculty: true, placement: true, admin: true },
  { cap: 'Assignments & grading queue', to: '/assignments', student: true, faculty: true, placement: false, admin: true },
  { cap: 'Attendance mark & heatmaps', to: '/attendance', student: true, faculty: true, placement: false, admin: true },
  { cap: 'Placement drives & pipeline', to: '/placement', student: true, faculty: false, placement: true, admin: true },
  { cap: 'Subjects & courses', to: '/subjects', student: false, faculty: true, placement: false, admin: true },
  { cap: 'Study workspace', to: '/study', student: true, faculty: true, placement: false, admin: true },
  { cap: 'Requests', to: '/requests', student: true, faculty: true, placement: false, admin: true },
  { cap: 'My enrollments', to: '/enrollments', student: true, faculty: false, placement: false, admin: false },
  { cap: 'Users, departments & courses', to: '/users', student: false, faculty: false, placement: false, admin: true },
  { cap: 'AI reports & audit trails', to: '/ai-reports', student: false, faculty: false, placement: false, admin: true },
  { cap: 'Directory & events', to: '/directory', student: true, faculty: true, placement: true, admin: true }
];

const JOURNEY = [
  { n: '01', title: 'Enroll', body: 'Departments, courses and one record per student from day one.', to: '/departments' },
  { n: '02', title: 'Learn', body: 'Attendance, assignments and feedback build a living academic profile.', to: '/attendance' },
  { n: '03', title: 'Get placed', body: 'Drives, eligibility and interviews down a visible pipeline.', to: '/placement' },
  { n: '04', title: 'See clearly', body: 'Reports, timelines and insight — evidence, not guesses.', to: '/ai-reports' }
];

const READINESS_ITEMS = [
  { id: 'structure', label: 'Add departments, courses & subjects', to: '/departments' },
  { id: 'people', label: 'Invite users across the 5 roles', to: '/users' },
  { id: 'attendance', label: 'Take the first attendance', to: '/attendance' },
  { id: 'drive', label: 'Publish the first placement drive', to: '/placement' }
];

const CAPABILITIES = [
  ['Attendance Matrix', '/attendance'],
  ['Placement Pipeline', '/placement'],
  ['Assignments Queue', '/assignments'],
  ['AI Reports', '/ai-reports'],
  ['Directory', '/directory'],
  ['Events', '/events'],
  ['Study Workspace', '/study'],
  ['Requests', '/requests']
];

function MatrixCheck({ on }) {
  return (
    <span
      role="img"
      aria-label={on ? 'Included' : 'Not included'}
      className={cn(
        'inline-grid place-items-center w-5 h-5 rounded-full border-2 border-[var(--cf-ink)] text-xs font-bold',
        on ? 'bg-volt' : 'bg-[var(--cf-surface-2)] text-transparent'
      )}
    >
      {on ? <Check size={12} strokeWidth={3.5} /> : '·'}
    </span>
  );
}

function loadOrder() {
  try {
    const saved = JSON.parse(localStorage.getItem(PILLAR_ORDER_KEY) || '[]');
    if (Array.isArray(saved) && saved.length === DEFAULT_PILLARS.length) {
      const ordered = saved
        .map((id) => DEFAULT_PILLARS.find((p) => p.id === id))
        .filter(Boolean);
      if (ordered.length === DEFAULT_PILLARS.length) return ordered;
    }
  } catch { /* fall through to defaults */ }
  return DEFAULT_PILLARS;
}

export default function Landing() {
  const { theme, toggle } = useTheme();
  const reduced = useReducedMotion();
  const heroRef = useRef(null);
  const [pillars, setPillars] = useState(loadOrder);
  const [dragged, setDragged] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [readiness, setReadiness] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(READINESS_KEY) || '{}');
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(PILLAR_ORDER_KEY, JSON.stringify(pillars.map((p) => p.id)));
    } catch { /* storage unavailable */ }
  }, [pillars]);

  useEffect(() => {
    try {
      localStorage.setItem(READINESS_KEY, JSON.stringify(readiness));
    } catch { /* storage unavailable */ }
  }, [readiness]);

  const movePillar = (index, dir) => {
    const target = dir === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= pillars.length) return;
    const next = [...pillars];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    setPillars(next);
  };

  const onDropPillar = (e, dropIndex) => {
    e.preventDefault();
    if (dragged === null || dragged === dropIndex) {
      setDragged(null);
      setDragOver(null);
      return;
    }
    const next = [...pillars];
    const [item] = next.splice(dragged, 1);
    next.splice(dropIndex, 0, item);
    setPillars(next);
    setDragged(null);
    setDragOver(null);
  };

  const isCustomOrder = pillars.some((p, i) => p.id !== DEFAULT_PILLARS[i].id);
  const readyCount = READINESS_ITEMS.filter((r) => readiness[r.id]).length;

  return (
    <div className="min-h-screen bg-[var(--cf-bg)] text-[var(--cf-ink)]">
      <Preloader />

      <header className="sticky top-0 z-50 bg-[var(--cf-surface)] border-b-2 border-[var(--cf-ink)]">
        <div className="racing-stripe h-1.5" aria-hidden />
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5" aria-label="CampusFlow home">
            <span className="w-8 h-8 bg-frame text-volt grid place-items-center font-display font-bold text-sm border-2 border-[var(--cf-ink)] shadow-brutal-sm" aria-hidden>C</span>
            <span className="font-display font-bold tracking-tight text-lg">CampusFlow</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1" aria-label="Sections">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="px-3 py-2 rounded-full font-display text-sm font-semibold text-[var(--cf-ink-soft)] hover:bg-volt hover:text-coal transition">
                {n.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <span className="hidden lg:inline-flex brutal-tag bg-[var(--cf-bg)] px-2.5 py-1 text-[11px] font-mono font-bold" title="Command palette inside the app">
              ⌘K
            </span>
            <button onClick={toggle} aria-label="Toggle theme" className="p-2 border-2 border-transparent hover:border-[var(--cf-ink)] hover:bg-volt transition">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link to="/login" className="hidden sm:block font-display text-sm font-bold px-3 py-2 hover:bg-volt transition">
              Sign in
            </Link>
            <Link to="/signup" className={cn(btnClass('primary', 'small'))}>
              Apply <ArrowUpRight size={14} aria-hidden />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero split: headline left, live product tour right */}
        <section ref={heroRef} className="relative overflow-hidden" aria-label="Introduction">
          <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-10 grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="brutal-tag inline-flex items-center gap-2 bg-volt px-3 py-1 text-xs font-bold uppercase tracking-wider">
                <span className="w-2 h-2 bg-flag border border-frame" aria-hidden />
                The academic operating system
              </p>
              <h1 className="font-display font-black uppercase tracking-tight leading-[1.02] text-4xl sm:text-5xl xl:text-6xl mt-5">
                <SplitReveal lines={['One campus.', 'Every workflow.']} />
                <span className="block mt-2">
                  <mark className="bg-gold text-coal border-2 border-[var(--cf-ink)] px-3 shadow-brutal">Perfectly connected.</mark>
                </span>
              </h1>
              <p className="mt-5 max-w-md text-base sm:text-lg text-[var(--cf-ink-mute)] font-medium">
                Attendance, assignments, placements and insight — moving together in one workspace, one record per student.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link to="/signup" className={cn(btnClass('primary', 'large'))}>
                  Apply now <ArrowRight size={17} aria-hidden />
                </Link>
                <Link to="/login" className={cn(btnClass('secondary', 'large'))}>
                  Sign in <ArrowUpRight size={17} aria-hidden />
                </Link>
                <a href="#system" className="font-display text-sm font-bold underline underline-offset-4 decoration-gold decoration-2 hover:bg-volt px-1">
                  Explore the platform ↓
                </a>
              </div>
              <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-4">
                <div>
                  <dt className="font-mono text-[11px] uppercase tracking-wider text-[var(--cf-ink-mute)]">Roles, one identity</dt>
                  <dd className="font-display text-3xl font-black tabular-nums"><AnimatedCounter value={ROLES.length} /></dd>
                </div>
                <div>
                  <dt className="font-mono text-[11px] uppercase tracking-wider text-[var(--cf-ink-mute)]">Placement stages</dt>
                  <dd className="font-display text-3xl font-black tabular-nums"><AnimatedCounter value={PIPELINE_STAGES.length} /></dd>
                </div>
                <div>
                  <dt className="font-mono text-[11px] uppercase tracking-wider text-[var(--cf-ink-mute)]">Core pillars</dt>
                  <dd className="font-display text-3xl font-black tabular-nums"><AnimatedCounter value={DEFAULT_PILLARS.length} /></dd>
                </div>
              </dl>
            </div>
            <motion.div
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <ProductPortal />
              <p className="mt-3 text-center text-xs text-[var(--cf-ink-mute)]">
                A tour of the real product — switch tabs, follow any link after signing in.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Capability marquee */}
        <section aria-label="Capabilities" className="border-y-2 border-[var(--cf-ink)] bg-[var(--cf-surface)] py-4">
          <Marquee label="CampusFlow capabilities">
            {CAPABILITIES.map(([label, to]) => (
              <Link
                key={label}
                to={to}
                className="brutal-tag mx-2 inline-flex items-center gap-2 bg-[var(--cf-bg)] px-4 py-2 text-sm font-bold whitespace-nowrap hover:bg-volt transition-colors"
              >
                <span className="w-1.5 h-1.5 bg-royal" aria-hidden />{label}
              </Link>
            ))}
          </Marquee>
        </section>

        {/* Pillar bento — reorderable */}
        <section id="system" className="max-w-[1400px] mx-auto px-4 sm:px-6 py-16 sm:py-24" aria-label="System">
          <p className="brutal-tag inline-block bg-gold text-coal px-3 py-1 text-xs font-bold uppercase tracking-wider">Architecture &amp; capabilities</p>
          <SplitReveal className="font-display font-black uppercase tracking-tight text-3xl sm:text-4xl lg:text-5xl mt-4 max-w-3xl" lines={['Everything your campus needs,', 'in one place.']} />
          <p className="mt-3 text-[var(--cf-ink-mute)] max-w-xl font-medium">
            Four pillars, one record. Drag the cards to order your own campus priorities — saved in this browser.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--cf-surface)] border-2 border-[var(--cf-ink)] shadow-brutal-sm font-mono text-[11px] font-bold uppercase">
              <GripVertical size={14} aria-hidden /> Drag cards to reorder
            </span>
            {isCustomOrder && (
              <button
                type="button"
                onClick={() => setPillars(DEFAULT_PILLARS)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--cf-surface)] border-2 border-[var(--cf-ink)] shadow-brutal-sm font-display text-[11px] font-bold uppercase hover:bg-volt transition-colors"
              >
                <RotateCcw size={13} aria-hidden /> Reset order
              </button>
            )}
          </div>
          <BentoGrid className="mt-8 md:grid-cols-6">
            {pillars.map(({ id, Icon, title, body, tint, to, action }, index) => (
              <div
                key={id}
                draggable
                onDragStart={(e) => { setDragged(index); e.dataTransfer.effectAllowed = 'move'; }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(index); }}
                onDrop={(e) => onDropPillar(e, index)}
                onDragEnd={() => { setDragged(null); setDragOver(null); }}
                className={cn(
                  'card-brutal p-6 sm:p-7 flex flex-col justify-between gap-5 cursor-grab active:cursor-grabbing select-none',
                  PILLAR_SPANS[index],
                  dragged === index && 'opacity-40',
                  dragOver === index && dragged !== index && 'outline-4 outline-volt'
                )}
                aria-label={`${title}, priority ${index + 1} of ${pillars.length}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className={cn('w-14 h-14 border-2 border-[var(--cf-ink)] grid place-items-center shadow-brutal-sm', tint)} aria-hidden>
                      <Icon size={26} strokeWidth={2.5} className={tint === 'bg-royal' || tint === 'bg-flag' ? 'text-white' : 'text-coal'} />
                    </span>
                    <span className="flex items-center gap-1" onClick={(e) => e.stopPropagation()} onDragStart={(e) => e.preventDefault()}>
                      <button type="button" disabled={index === 0} onClick={() => movePillar(index, 'up')} aria-label={`Move ${title} up`} className="p-1 border-2 border-[var(--cf-ink)] bg-[var(--cf-surface)] hover:bg-volt transition-colors disabled:opacity-30">
                        <ChevronUp size={13} />
                      </button>
                      <button type="button" disabled={index === pillars.length - 1} onClick={() => movePillar(index, 'down')} aria-label={`Move ${title} down`} className="p-1 border-2 border-[var(--cf-ink)] bg-[var(--cf-surface)] hover:bg-volt transition-colors disabled:opacity-30">
                        <ChevronDown size={13} />
                      </button>
                      <span className="font-display font-black text-lg bg-frame text-volt px-2.5 py-1 border-2 border-[var(--cf-ink)] ml-1" aria-hidden>
                        {`0${index + 1}`}
                      </span>
                    </span>
                  </div>
                  <h3 className="font-display text-2xl font-black uppercase tracking-tight mt-5">{title}</h3>
                  <p className="mt-2 text-sm text-[var(--cf-ink-mute)] leading-relaxed max-w-[52ch]">{body}</p>
                </div>
                <Link to={to} className="font-display text-xs font-black uppercase flex items-center gap-1.5 hover:bg-volt px-1 py-0.5 w-fit transition-colors">
                  {action} <span aria-hidden>→</span>
                </Link>
              </div>
            ))}
          </BentoGrid>
        </section>

        {/* Role cards */}
        <section id="roles" className="border-y-2 border-[var(--cf-ink)] bg-[var(--cf-surface-2)]" aria-label="Who it's for">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-16 sm:py-24">
            <p className="brutal-tag inline-block bg-volt px-3 py-1 text-xs font-bold uppercase tracking-wider">Role-based workspaces</p>
            <SplitReveal className="font-display font-black uppercase tracking-tight text-3xl sm:text-4xl lg:text-5xl mt-4 max-w-2xl" lines={['One platform.', 'Four tailored experiences.']} />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
              {ROLES_CARDS.map(({ Icon, tag, title, body, points }, i) => (
                <article key={tag} className="card-brutal role-card-animated p-6 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="brutal-tag bg-gold px-2.5 py-1 text-[11px] font-bold uppercase">{tag}</span>
                    <span className="font-mono text-xs font-bold text-[var(--cf-ink-mute)]" aria-hidden>{`0${i + 1}/04`}</span>
                  </div>
                  <span className="role-card-icon w-12 h-12 border-2 border-[var(--cf-ink)] bg-[var(--cf-bg)] grid place-items-center shadow-brutal-sm" aria-hidden>
                    <Icon size={22} strokeWidth={2.5} />
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-black uppercase tracking-tight">{title}</h3>
                    <p className="mt-1 text-sm text-[var(--cf-ink-mute)]">{body}</p>
                  </div>
                  <ul className="space-y-1.5 text-sm">
                    {points.map(([label, to]) => (
                      <li key={label}>
                        <Link to={to} className="flex items-center justify-between px-3 py-1.5 border-2 border-[var(--cf-ink)] bg-[var(--cf-surface)] text-[13px] font-bold hover:bg-volt transition-colors">
                          {label}<ArrowUpRight size={13} aria-hidden />
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link to="/login" className="role-card-arrow mt-auto font-display text-xs font-black uppercase underline underline-offset-4 decoration-gold decoration-2">
                    Sign in to enter →
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Storytelling splits */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-16 sm:py-24 space-y-16 sm:space-y-24" aria-label="Campus in depth">
          <section className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-[var(--cf-ink-mute)]">01 — Living twin</p>
              <SplitReveal className="font-display font-black uppercase tracking-tight text-3xl sm:text-4xl mt-3" lines={['A living twin', 'of your university.']} />
              <p className="mt-4 text-[var(--cf-ink-mute)] max-w-md leading-relaxed">
                Academics, people, placements and insight rendered as one place you can walk through — not tabs you drown in.
              </p>
              <Link to="/dashboard" className={cn(btnClass('secondary', 'medium'), 'mt-6')}>
                Open the dashboard <ArrowUpRight size={15} aria-hidden />
              </Link>
            </div>
            <div className="h-[300px] sm:h-[380px] border-2 border-[var(--cf-ink)] shadow-brutal-lg overflow-hidden" aria-label="3D campus preview">
              <SpatialCanvas className="w-full h-full" compact={false} />
            </div>
          </section>
          <section className="grid lg:grid-cols-2 gap-8 items-center lg:[&>*:first-child]:order-2">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-[var(--cf-ink-mute)]">02 — Structured work</p>
              <SplitReveal className="font-display font-black uppercase tracking-tight text-3xl sm:text-4xl mt-3" lines={['Looks like a campus.', 'Works like software.']} />
              <p className="mt-4 text-[var(--cf-ink-mute)] max-w-md leading-relaxed">
                Enrollment, attendance and grading become structured, searchable data underneath a familiar campus feel — with audit trails on the moments that matter.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/requests" className={cn(btnClass('secondary', 'medium'))}>
                  Requests <ArrowUpRight size={15} aria-hidden />
                </Link>
                <Link to="/directory" className={cn(btnClass('secondary', 'medium'))}>
                  Directory <ArrowUpRight size={15} aria-hidden />
                </Link>
              </div>
            </div>
            <div className="relative h-[300px] sm:h-[380px] border-2 border-[var(--cf-ink)] shadow-brutal-lg bg-[var(--cf-surface)] overflow-hidden" aria-hidden>
              <div className="absolute inset-0 grid place-items-center">
                <Building2 size={110} strokeWidth={0.7} className="opacity-15" />
              </div>
              <ol className="absolute inset-x-5 bottom-5 top-5 flex flex-col justify-end gap-2">
                {['One record per student', 'Evidence beside every insight', 'Audit trails on key actions'].map((t, i) => (
                  <li key={t} className="flex items-center gap-3 bg-[var(--cf-bg)] border-2 border-[var(--cf-ink)] px-3.5 py-2.5 text-sm font-bold shadow-brutal-sm">
                    <span className="font-display font-black bg-frame text-volt w-6 h-6 grid place-items-center text-xs shrink-0">{i + 1}</span>
                    {t}
                  </li>
                ))}
              </ol>
              <span className="font-display italic absolute top-4 right-5 text-6xl opacity-20">02</span>
            </div>
          </section>
        </div>

        {/* RBAC access matrix */}
        <section id="access" className="max-w-[1400px] mx-auto px-4 sm:px-6 py-16 sm:py-24" aria-label="Role access">
          <p className="brutal-tag inline-block bg-frame text-volt px-3 py-1 text-xs font-bold uppercase tracking-wider">Access</p>
          <SplitReveal className="font-display font-black uppercase tracking-tight text-3xl sm:text-4xl mt-4 max-w-2xl" lines={['One identity.', 'Right-sized access.']} />
          <div className="card-brutal mt-10 overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <caption className="sr-only">Capability access by role</caption>
              <thead>
                <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-[var(--cf-ink-mute)] border-b-2 border-[var(--cf-ink)]">
                  <th scope="col" className="px-4 py-3 font-bold">Capability</th>
                  <th scope="col" className="px-4 py-3 font-bold text-center">Student</th>
                  <th scope="col" className="px-4 py-3 font-bold text-center">Faculty</th>
                  <th scope="col" className="px-4 py-3 font-bold text-center">Placement</th>
                  <th scope="col" className="px-4 py-3 font-bold text-center">Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--cf-line)]">
                {MATRIX_ROWS.map((r) => (
                  <tr key={r.cap}>
                    <td className="px-4 py-3 font-bold">
                      <Link to={r.to} className="hover:bg-volt px-1 transition-colors">{r.cap}</Link>
                    </td>
                    <td className="px-4 py-3 text-center"><MatrixCheck on={r.student} /></td>
                    <td className="px-4 py-3 text-center"><MatrixCheck on={r.faculty} /></td>
                    <td className="px-4 py-3 text-center"><MatrixCheck on={r.placement} /></td>
                    <td className="px-4 py-3 text-center"><MatrixCheck on={r.admin} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-[var(--cf-ink-mute)] max-w-3xl">
            Admin covers <strong>super_admin</strong> and <strong>college_admin</strong>: both share the same route set in this build.
            super_admin is reserved for multi-college scope; college_admin governs a single institution. Accounts are provisioned by your institution — sign in to enter the workspace your role unlocks.
          </p>
        </section>

        {/* Journey + readiness checklist */}
        <section id="journey" className="border-y-2 border-[var(--cf-ink)] bg-[var(--cf-surface)]" aria-label="How CampusFlow works">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-16 sm:py-24">
            <SplitReveal className="font-display font-black uppercase tracking-tight text-3xl sm:text-4xl max-w-2xl" lines={['From admission', 'to offer letter.']} />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
              {JOURNEY.map((j) => (
                <Link key={j.n} to={j.to} className="card-brutal p-6 block hover:bg-volt/20">
                  <p className="font-display italic text-4xl opacity-30" aria-hidden>{j.n}</p>
                  <h3 className="font-display font-black uppercase tracking-tight text-lg mt-2">{j.title}</h3>
                  <p className="mt-1 text-sm text-[var(--cf-ink-mute)]">{j.body}</p>
                </Link>
              ))}
            </div>
            <div className="card-brutal mt-6 p-6 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-display text-lg font-black uppercase tracking-tight">
                  Readiness checklist <span className="font-mono text-sm font-bold text-[var(--cf-ink-mute)]">{readyCount}/{READINESS_ITEMS.length}</span>
                </h3>
                <div className="w-full sm:w-56 h-3.5 bg-[var(--cf-bg)] border-2 border-[var(--cf-ink)]" role="progressbar" aria-valuenow={readyCount} aria-valuemin={0} aria-valuemax={READINESS_ITEMS.length} aria-label="Setup readiness">
                  <div className="h-full bg-volt border-r-2 border-[var(--cf-ink)] transition-all" style={{ width: `${(readyCount / READINESS_ITEMS.length) * 100}%` }} />
                </div>
              </div>
              <ul className="mt-5 grid sm:grid-cols-2 gap-2.5">
                {READINESS_ITEMS.map((item) => {
                  const done = Boolean(readiness[item.id]);
                  return (
                    <li key={item.id} className={cn('flex items-center gap-3 border-2 border-[var(--cf-ink)] px-3.5 py-2.5 text-sm font-bold', done ? 'bg-volt/40' : 'bg-[var(--cf-bg)]')}>
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={done}
                        aria-label={item.label}
                        onClick={() => setReadiness((r) => ({ ...r, [item.id]: !r[item.id] }))}
                        className={cn('w-5 h-5 grid place-items-center border-2 border-[var(--cf-ink)] shrink-0 transition-colors', done ? 'bg-frame text-volt' : 'bg-[var(--cf-surface)]')}
                      >
                        {done && <Check size={13} strokeWidth={3.5} />}
                      </button>
                      <Link to={item.to} className="hover:underline underline-offset-4">{item.label}</Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </section>

        {/* Trust band — generic institution types only */}
        <section className="max-w-[1400px] mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center" aria-label="Who CampusFlow is built for">
          <p className="brutal-tag inline-block bg-[var(--cf-surface)] px-3 py-1 text-xs font-bold uppercase tracking-wider">Built for campuses like yours</p>
          <div className="mt-6"><TrustBar /></div>
          <div className="mt-8 grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto text-left">
            <figure className="card-brutal p-5">
              <blockquote className="font-display text-lg font-bold leading-snug">“One record per student, from admission to offer — nothing slips through the cracks.”</blockquote>
              <figcaption className="mt-2 font-mono text-[11px] uppercase tracking-wider text-[var(--cf-ink-mute)]">The product promise — not a customer quote</figcaption>
            </figure>
            <figure className="card-brutal p-5">
              <blockquote className="font-display text-lg font-bold leading-snug">“Every insight ships with its evidence attached. Never a black box.”</blockquote>
              <figcaption className="mt-2 font-mono text-[11px] uppercase tracking-wider text-[var(--cf-ink-mute)]">How reporting works — not a customer quote</figcaption>
            </figure>
          </div>
        </section>

        {/* Black CTA + volt bar */}
        <section className="bg-frame text-cream border-y-2 border-[var(--cf-ink)]" aria-label="Get started">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
            <p className="brutal-tag inline-block bg-volt text-coal px-3 py-1 text-xs font-bold uppercase tracking-wider">Get started</p>
            <h2 className="font-display font-black uppercase tracking-tight text-3xl sm:text-5xl mt-4">Your campus, finally in focus.</h2>
            <p className="mt-3 text-cream/70 max-w-md mx-auto">Sign in to step into the workspace your role unlocks — or create your account to begin.</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link to="/login" className={cn(btnClass('glow', 'large'))}>Sign in <ArrowRight size={17} aria-hidden /></Link>
              <Link to="/signup" className="btn-brutal inline-flex items-center gap-2 rounded-[10px] font-display font-bold px-6 py-3 bg-cream text-coal hover:bg-volt">
                Create account <ArrowUpRight size={17} aria-hidden />
              </Link>
            </div>
          </div>
          <div className="racing-stripe h-2.5" aria-hidden />
        </section>
      </main>

      <footer className="bg-[var(--cf-surface)]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-12 grid gap-8 md:grid-cols-[1.2fr_2fr]">
          <div>
            <p className="flex items-center gap-2.5">
              <span className="w-8 h-8 bg-frame text-volt grid place-items-center font-display font-bold text-sm border-2 border-[var(--cf-ink)]" aria-hidden>C</span>
              <span className="font-display font-bold tracking-tight text-lg">CampusFlow</span>
            </p>
            <p className="mt-2 text-sm text-[var(--cf-ink-mute)]">The digital campus itself.</p>
          </div>
          <nav className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm" aria-label="Footer">
            <div>
              <h3 className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--cf-ink-mute)]">Product</h3>
              <ul className="mt-2.5 space-y-1.5 font-bold">
                <li><Link to="/dashboard" className="hover:bg-volt px-0.5">Dashboard</Link></li>
                <li><Link to="/placement" className="hover:bg-volt px-0.5">Placement</Link></li>
                <li><Link to="/attendance" className="hover:bg-volt px-0.5">Attendance</Link></li>
                <li><Link to="/assignments" className="hover:bg-volt px-0.5">Assignments</Link></li>
                <li><Link to="/ai-reports" className="hover:bg-volt px-0.5">AI reports</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--cf-ink-mute)]">Campus</h3>
              <ul className="mt-2.5 space-y-1.5 font-bold">
                <li><Link to="/directory" className="hover:bg-volt px-0.5">Directory</Link></li>
                <li><Link to="/events" className="hover:bg-volt px-0.5">Events</Link></li>
                <li><Link to="/study" className="hover:bg-volt px-0.5">Study</Link></li>
                <li><Link to="/requests" className="hover:bg-volt px-0.5">Requests</Link></li>
                <li><Link to="/enrollments" className="hover:bg-volt px-0.5">Enrollments</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--cf-ink-mute)]">Admin</h3>
              <ul className="mt-2.5 space-y-1.5 font-bold">
                <li><Link to="/users" className="hover:bg-volt px-0.5">Users</Link></li>
                <li><Link to="/departments" className="hover:bg-volt px-0.5">Departments</Link></li>
                <li><Link to="/courses" className="hover:bg-volt px-0.5">Courses</Link></li>
                <li><Link to="/subjects" className="hover:bg-volt px-0.5">Subjects</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--cf-ink-mute)]">Account</h3>
              <ul className="mt-2.5 space-y-1.5 font-bold">
                <li><Link to="/login" className="hover:bg-volt px-0.5">Sign in</Link></li>
                <li><Link to="/signup" className="hover:bg-volt px-0.5">Create account</Link></li>
                <li><Link to="/profile" className="hover:bg-volt px-0.5">Profile</Link></li>
                <li><Link to="/onboarding" className="hover:bg-volt px-0.5">Onboarding</Link></li>
              </ul>
            </div>
          </nav>
        </div>
        <div className="border-t-2 border-[var(--cf-ink)]">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--cf-ink-mute)]">© {new Date().getFullYear()} CampusFlow</p>
            <nav className="flex flex-wrap gap-x-5 gap-y-1 text-sm font-bold" aria-label="Sections">
              {NAV.map((n) => <a key={n.href} href={n.href} className="hover:bg-volt px-0.5">{n.label}</a>)}
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
