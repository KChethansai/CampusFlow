// CampusFlow Design System — single source of truth.
// Colors: CampusFlow Blue + navy/graphite/white/gray/silver/cyan/violet.
// Radius: sm 8 / md 12 / lg 16 / pill. Spacing: 8px base. Elevation L0-L5.
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...parts) => twMerge(clsx(...parts));

export const colors = {
  primary: '#0055ff',
  primaryStrong: '#0055ad',
  navy: '#0e1830',
  graphite: '#1c1c1e',
  cyan: '#22d3ee',
  violet: '#8b5cf6',
  success: '#16a34a',
  warning: '#d97706',
  error: '#e63b2e',
  volt: '#d4ff00',
  gold: '#ffcc00',
  paper: '#f5f0e8',
  cream: '#faf7f2',
  coal: '#111111'
};

export const ROLES = [
  'super_admin',
  'college_admin',
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

// Surfaces — neo-brutalist hard-shadow layers
export const pageHeader = 'flex flex-wrap items-center justify-between gap-3 mb-6';
export const cardClass =
  'bg-[var(--cf-surface)] rounded-xl shadow-brutal border-2 border-[var(--cf-ink)]';
export const floatClass =
  'bg-[var(--cf-surface)] rounded-xl shadow-brutal-lg border-2 border-[var(--cf-ink)]';
// Luxury glass + spotlight surfaces (brief §1-2, taste-restrained: single accent, no neon spam)
export const glassCard =
  'cf-glass bg-[var(--cf-surface)]/70 backdrop-blur-xl rounded-2xl border border-white/10 dark:border-white/10 shadow-card';
export const spotCard = 'cf-card-spot cf-spotlight';
export const glowFocus = 'cf-glow-focus';
export const bentoClass = cn(cardClass, spotCard, 'p-5 sm:p-6');
export const tableClass = 'w-full text-sm';
export const tableHeadClass = 'text-[var(--cf-ink-mute)] border-b border-[var(--cf-line)]';
export const tableCellHead = 'px-4 py-3 text-left font-medium text-xs uppercase tracking-wide';
export const tableCell = 'px-4 py-3';
export const tableRowHover = 'hover:bg-black/[.02] dark:hover:bg-white/[.04] transition-colors';
export const emptyState = 'text-center text-[var(--cf-ink-mute)] py-10 text-sm';
export const loadingState = 'text-[var(--cf-ink-mute)] text-sm';

// Forms
export const formGroup = 'mb-4';
export const labelClass = 'block mb-1.5 text-sm font-medium text-[var(--cf-ink-soft)]';
export const inputClass =
  'w-full px-3.5 py-2.5 text-sm bg-[var(--cf-surface)] border border-[var(--cf-line)] rounded-xl text-[var(--cf-ink)] placeholder:text-[var(--cf-ink-mute)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition';
export const selectClass = inputClass;
export const formCardClass =
  'bg-[var(--cf-surface)] rounded-2xl border border-[var(--cf-line)] shadow-sm p-5 mb-6 grid grid-cols-1 md:grid-cols-2 gap-3';

// Buttons — tactile brutal press physics via .btn-brutal
export const buttonBase =
  'btn-brutal inline-flex items-center justify-center gap-1.5 rounded-[10px] font-display text-sm font-semibold focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';

export const buttonVariants = {
  primary: 'bg-gold text-[#111111] hover:bg-volt',
  secondary: 'bg-[var(--cf-surface)] text-[var(--cf-ink)] hover:bg-[var(--cf-surface-2)]',
  success: 'bg-green-500 text-white hover:bg-green-400',
  danger: 'bg-flag text-white hover:brightness-110',
  outline: 'bg-[var(--cf-surface)] text-[var(--cf-ink)] hover:bg-[var(--cf-surface-2)]',
  ghost: 'bg-transparent text-[var(--cf-ink-soft)] hover:bg-black/[.05] dark:hover:bg-white/10',
  glow: 'bg-volt text-[#111111] hover:brightness-105'
};

export const buttonSizes = {
  small: 'px-3 py-1.5 text-xs',
  medium: 'px-4 py-2 text-sm',
  large: 'px-6 py-3 text-base'
};

export const btnClass = (variant = 'primary', size = 'medium') =>
  cn(buttonBase, buttonVariants[variant], buttonSizes[size]);

// Badges — single status language across product
export const badgeBase =
  'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap';
export const badge = (color = 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200') =>
  `${badgeBase} ${color}`;

export const statusColors = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  in_review: 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300',
  under_review: 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300',
  approved: 'bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300',
  draft: 'bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-300',
  published: 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300',
  open: 'bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300',
  closed: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  graded: 'bg-purple-100 text-purple-800 dark:bg-purple-500/15 dark:text-purple-300',
  archived: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400',
  active: 'bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300',
  inactive: 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300',
  applied: 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300',
  shortlisted: 'bg-purple-100 text-purple-800 dark:bg-purple-500/15 dark:text-purple-300',
  assessment: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-300',
  interview_1: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-300',
  interview_2: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-300',
  interview: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-300',
  hr_round: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-500/15 dark:text-fuchsia-300',
  offer: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  placed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  selected: 'bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300',
  submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300',
  late: 'bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300',
  present: 'bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300',
  absent: 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300',
  od: 'bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300'
};

export const roleColors = {
  super_admin: 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300',
  college_admin: 'bg-purple-100 text-purple-800 dark:bg-purple-500/15 dark:text-purple-300',
  faculty: 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300',
  student: 'bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300',
  placement_officer: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'
};

export const statusBadge = (status) =>
  badge(statusColors[status] || 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200');
export const roleBadge = (role) =>
  badge(roleColors[role] || 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200');

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
