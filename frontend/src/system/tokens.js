// CampusFlow Design System — single source of truth.
// Platform DS: warm Obsidian Ember surfaces, ember accent, and quiet status colors.
// Radius: sm 8 / md 12 / lg 16 / pill. Spacing: 8px base. Elevation soft.
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...parts) => twMerge(clsx(...parts));

export const colors = {
  primary: '#D86D3E',
  primaryStrong: '#B6532B',
  navy: '#211713',
  graphite: '#241B15',
  copper: '#C87D4B',
  terracotta: '#B4806A',
  amberMuted: '#D97706',
  cyan: '#C87D4B',
  ember: '#D86D3E',
  success: '#43845E',
  warning: '#A66C1F',
  error: '#B94C43',
  volt: '#E7A66D',
  paper: '#F4EFE8',
  cream: '#FBF8F3',
  coal: '#100D0B'
};

export const ROLES = [
  'super_admin',
  'college_admin',
  'hod',
  'faculty',
  'student',
  'placement_officer'
];

export const roleLabel = (role) =>
  role ? String(role).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '—';

// Typography — Space Grotesk display, Inter body, JetBrains Mono meta
export const pageHeading = 'font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--cf-ink)]';
export const pageSubheading = 'mt-1 text-sm text-[var(--cf-ink-mute)]';
export const cardTitle = 'font-display text-base font-semibold text-[var(--cf-ink)]';
export const sectionTitle = 'font-mono text-xs font-semibold uppercase tracking-widest text-[var(--cf-ink-mute)]';

// Surfaces — cinematic glass layers
export const pageHeader = 'flex flex-wrap items-center justify-between gap-3 mb-6';
export const cardClass =
  'bg-[var(--cf-surface)] rounded-[24px] border border-[var(--cf-line)] shadow-brutal';
export const floatClass =
  'bg-[var(--cf-surface)] rounded-[24px] border border-[var(--cf-line)] shadow-brutal-lg';
// Luxury glass + spotlight surfaces (brief §1-2, taste-restrained: single accent, no neon spam)
// NOTE: the live `glassCard` surface is owned by components/landing/shared.jsx
// (landing-soft shadow); the former canonical duplicate here had zero imports.
export const spotCard = 'cf-card-spot cf-spotlight';
export const glowFocus = 'cf-glow-focus';
export const bentoClass = cn(cardClass, spotCard, 'p-5 sm:p-6');
export const tableClass = 'w-full text-sm text-left border-collapse';
export const tableHeadClass = 'text-[var(--cf-ink-mute)] border-b border-[var(--cf-line)] bg-[var(--cf-surface-2)]/30 backdrop-blur-sm sticky top-0 z-10';
export const tableCellHead = 'px-4 py-3 text-left font-mono font-medium text-[11px] uppercase tracking-wider text-[var(--cf-ink-mute)]';
export const tableCell = 'px-4 py-3.5 border-b border-[var(--cf-line)]/50 text-[var(--cf-ink)]';
export const tableRowHover = 'hover:bg-[var(--cf-accent)]/[0.04] dark:hover:bg-[var(--cf-accent)]/[0.06] transition-colors';
export const emptyState = 'text-center text-[var(--cf-ink-mute)] py-10 text-sm';
export const loadingState = 'text-[var(--cf-ink-mute)] text-sm';

// Forms
export const formGroup = 'mb-4';
export const labelClass = 'block mb-1.5 text-sm font-medium text-[var(--cf-ink-soft)]';
export const inputClass =
  'w-full px-3.5 py-2.5 text-sm bg-[var(--cf-surface)] border border-[var(--cf-line)] rounded-[14px] text-[var(--cf-ink)] placeholder:text-[var(--cf-ink-mute)] focus:outline-none focus:ring-[3px] focus:ring-[var(--cf-focus)] focus:border-[var(--cf-accent)] transition';
export const selectClass = inputClass;
export const formCardClass =
  'bg-[var(--cf-surface)] rounded-[24px] border border-[var(--cf-line)] shadow-brutal p-5 mb-6 grid grid-cols-1 md:grid-cols-2 gap-3';

// Buttons — glass press physics, 14px radius
export const buttonBase =
  'inline-flex items-center justify-center gap-1.5 rounded-[14px] font-display text-sm font-semibold transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[.98]';

export const buttonVariants = {
  primary: 'bg-[var(--cf-accent-strong)] text-white hover:brightness-110 shadow-brutal-sm dark:bg-[var(--cf-accent)] dark:text-[#100D0B]',
  secondary: 'glass-surface text-[var(--cf-ink)] hover:bg-[var(--cf-surface-2)]',
  success: 'bg-[var(--cf-success)] text-white hover:brightness-105 dark:text-[#100D0B]',
  danger: 'bg-[var(--cf-danger)] text-white hover:brightness-110',
  outline: 'bg-[var(--cf-surface)] text-[var(--cf-ink)] border border-[var(--cf-line)] hover:bg-[var(--cf-surface-2)]',
  ghost: 'bg-transparent text-[var(--cf-ink-soft)] hover:bg-black/[.05] dark:hover:bg-white/10',
  glow: 'bg-[var(--cf-volt)] text-[#100D0B] hover:brightness-105'
};

export const buttonSizes = {
  small: 'px-3 py-1.5 text-xs',
  medium: 'px-4 py-2 text-sm',
  large: 'px-6 py-3 text-base'
};

export const btnClass = (variant = 'primary', size = 'medium') =>
  cn(buttonBase, buttonVariants[variant], buttonSizes[size]);

// Badges — single status language across product (pill radius)
export const badgeBase =
  'status-pill inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap border border-[var(--cf-line)]';
export const badge = (color = 'bg-[var(--cf-surface-2)] text-[var(--cf-ink-soft)]') =>
  `${badgeBase} ${color}`;

const tint = {
  warn: 'bg-[var(--cf-warning)]/15 text-[var(--cf-warning-strong)] dark:text-[var(--cf-warning)]',
  accent: 'bg-[var(--cf-accent)]/12 text-[var(--cf-accent-strong)] dark:text-[var(--cf-accent-pale)]',
  ok: 'bg-[var(--cf-success)]/15 text-[var(--cf-success-strong)] dark:text-[var(--cf-success)]',
  bad: 'bg-[var(--cf-danger)]/12 text-[var(--cf-danger-strong)] dark:text-[var(--cf-danger)]',
  neutral: 'bg-[var(--cf-surface-2)] text-[var(--cf-ink-soft)]',
};

export const statusColors = {
  pending: tint.warn,
  in_review: tint.accent,
  under_review: tint.accent,
  approved: tint.ok,
  rejected: tint.bad,
  draft: tint.neutral,
  published: tint.accent,
  open: tint.ok,
  closed: tint.warn,
  graded: tint.accent,
  archived: tint.neutral,
  active: tint.ok,
  inactive: tint.bad,
  applied: tint.accent,
  shortlisted: tint.accent,
  assessment: tint.accent,
  interview_1: tint.accent,
  interview_2: tint.accent,
  interview: tint.accent,
  hr_round: tint.accent,
  offer: tint.ok,
  placed: tint.ok,
  selected: tint.ok,
  submitted: tint.accent,
  late: 'bg-[var(--cf-warning)]/20 text-[var(--cf-warning-strong)] dark:text-[var(--cf-warning)]',
  present: tint.ok,
  absent: tint.bad,
  od: tint.accent
};

export const roleColors = {
  super_admin: tint.bad,
  college_admin: tint.accent,
  faculty: tint.accent,
  student: tint.ok,
  placement_officer: tint.warn
};

export const statusBadge = (status) =>
  badge(statusColors[status] || 'bg-[var(--cf-surface-2)] text-[var(--cf-ink-soft)]');
export const roleBadge = (role) =>
  badge(roleColors[role] || 'bg-[var(--cf-surface-2)] text-[var(--cf-ink-soft)]');

// 8px spacing scale helper
export const space = { 1: 8, 2: 16, 3: 24, 4: 32, 5: 40, 6: 48 };

// Placement pipeline order (single definition)
export const PIPELINE_STAGES = [
  'applied',
  'shortlisted',
  'assessment',
  'interview',
  'offer',
  'placed'
];

export const normalizeStage = (stage) => {
  if (stage === 'interview_1' || stage === 'interview_2' || stage === 'hr_round') return 'interview';
  return stage;
};

// Attendance mark vocabulary (single definition — UI and metrics share it).
export const ATTENDANCE_STATUSES = ['present', 'absent', 'late', 'od'];

// DISPLAY-TYPE (LANDING ONLY) — restrained serif display, zero webfont bytes.
// System serif stack only; scale/leading/tracking live as CSS vars in
// index.css (:root + .dark). Components consume the class helpers below,
// never raw values — existing color/surface/button/badge tokens untouched.
export const displaySerifStack = "Georgia, 'Times New Roman', ui-serif, system-ui, serif";
export const landingDisplayHero = 'cf-display-hero';
export const landingDisplayH2 = 'cf-display-h2';
export const landingKicker = 'cf-kicker-landing';
export const landingChapter = 'cf-chapter-reveal';
