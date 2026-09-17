// CampusFlow Design System — single source of truth.
// Platform DS: cinematic glass, royal/volt/violet + success/warning/danger.
// Radius: sm 8 / md 12 / lg 16 / pill. Spacing: 8px base. Elevation soft.
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...parts) => twMerge(clsx(...parts));

export const colors = {
  primary: '#2563FF',
  primaryStrong: '#1D4FD7',
  navy: '#0e1830',
  graphite: '#1c1c1e',
  cyan: '#22d3ee',
  violet: '#7C5CFF',
  success: '#25D890',
  warning: '#FFBD4A',
  error: '#FF5964',
  volt: '#A7D700',
  paper: '#F6F7F9',
  cream: '#FFFFFF',
  coal: '#0A0D12'
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

// Surfaces — cinematic glass layers
export const pageHeader = 'flex flex-wrap items-center justify-between gap-3 mb-6';
export const cardClass =
  'bg-[var(--cf-surface)] rounded-[24px] border border-[var(--cf-line)] shadow-brutal';
export const floatClass =
  'bg-[var(--cf-surface)] rounded-[24px] border border-[var(--cf-line)] shadow-brutal-lg';
// Luxury glass + spotlight surfaces (brief §1-2, taste-restrained: single accent, no neon spam)
export const glassCard =
  'glass-card bg-[var(--cf-surface)]/70 backdrop-blur-xl rounded-[24px] border border-[var(--cf-line)] shadow-brutal';
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
  'w-full px-3.5 py-2.5 text-sm bg-[var(--cf-surface)] border border-[var(--cf-line)] rounded-[14px] text-[var(--cf-ink)] placeholder:text-[var(--cf-ink-mute)] focus:outline-none focus:ring-[3px] focus:ring-[#2563FF]/30 focus:border-[#2563FF] transition';
export const selectClass = inputClass;
export const formCardClass =
  'bg-[var(--cf-surface)] rounded-[24px] border border-[var(--cf-line)] shadow-brutal p-5 mb-6 grid grid-cols-1 md:grid-cols-2 gap-3';

// Buttons — glass press physics, 14px radius
export const buttonBase =
  'inline-flex items-center justify-center gap-1.5 rounded-[14px] font-display text-sm font-semibold transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[.98]';

export const buttonVariants = {
  primary: 'bg-[#2563FF] text-white hover:brightness-110 shadow-brutal-sm',
  secondary: 'glass-surface text-[var(--cf-ink)] hover:bg-[var(--cf-surface-2)]',
  success: 'bg-[#25D890] text-[#0A0D12] hover:brightness-105',
  danger: 'bg-[#FF5964] text-white hover:brightness-110',
  outline: 'bg-[var(--cf-surface)] text-[var(--cf-ink)] border border-[var(--cf-line)] hover:bg-[var(--cf-surface-2)]',
  ghost: 'bg-transparent text-[var(--cf-ink-soft)] hover:bg-black/[.05] dark:hover:bg-white/10',
  glow: 'bg-[#A7D700] text-[#0A0D12] hover:brightness-105'
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
export const badge = (color = 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200') =>
  `${badgeBase} ${color}`;

export const statusColors = {
  pending: 'bg-[#FFBD4A]/15 text-[#8a5a00] dark:text-[#FFBD4A]',
  in_review: 'bg-[#2563FF]/12 text-[#1D4FD7] dark:text-[#8fabff]',
  under_review: 'bg-[#2563FF]/12 text-[#1D4FD7] dark:text-[#8fabff]',
  approved: 'bg-[#25D890]/15 text-[#0b6b4a] dark:text-[#25D890]',
  rejected: 'bg-[#FF5964]/12 text-[#c22e3a] dark:text-[#FF5964]',
  draft: 'bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-300',
  published: 'bg-[#2563FF]/12 text-[#1D4FD7] dark:text-[#8fabff]',
  open: 'bg-[#25D890]/15 text-[#0b6b4a] dark:text-[#25D890]',
  closed: 'bg-[#FFBD4A]/15 text-[#8a5a00] dark:text-[#FFBD4A]',
  graded: 'bg-[#7C5CFF]/12 text-[#5a3fd4] dark:text-[#b3a1ff]',
  archived: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400',
  active: 'bg-[#25D890]/15 text-[#0b6b4a] dark:text-[#25D890]',
  inactive: 'bg-[#FF5964]/12 text-[#c22e3a] dark:text-[#FF5964]',
  applied: 'bg-[#2563FF]/12 text-[#1D4FD7] dark:text-[#8fabff]',
  shortlisted: 'bg-[#7C5CFF]/12 text-[#5a3fd4] dark:text-[#b3a1ff]',
  assessment: 'bg-[#7C5CFF]/12 text-[#5a3fd4] dark:text-[#b3a1ff]',
  interview_1: 'bg-[#7C5CFF]/12 text-[#5a3fd4] dark:text-[#b3a1ff]',
  interview_2: 'bg-[#7C5CFF]/12 text-[#5a3fd4] dark:text-[#b3a1ff]',
  interview: 'bg-[#7C5CFF]/12 text-[#5a3fd4] dark:text-[#b3a1ff]',
  hr_round: 'bg-[#7C5CFF]/12 text-[#5a3fd4] dark:text-[#b3a1ff]',
  offer: 'bg-[#25D890]/15 text-[#0b6b4a] dark:text-[#25D890]',
  placed: 'bg-[#25D890]/15 text-[#0b6b4a] dark:text-[#25D890]',
  selected: 'bg-[#25D890]/15 text-[#0b6b4a] dark:text-[#25D890]',
  submitted: 'bg-[#2563FF]/12 text-[#1D4FD7] dark:text-[#8fabff]',
  late: 'bg-[#FFBD4A]/20 text-[#8a5a00] dark:text-[#FFBD4A]',
  present: 'bg-[#25D890]/15 text-[#0b6b4a] dark:text-[#25D890]',
  absent: 'bg-[#FF5964]/12 text-[#c22e3a] dark:text-[#FF5964]',
  od: 'bg-[#7C5CFF]/12 text-[#5a3fd4] dark:text-[#b3a1ff]'
};

export const roleColors = {
  super_admin: 'bg-[#FF5964]/12 text-[#c22e3a] dark:text-[#FF5964]',
  college_admin: 'bg-[#7C5CFF]/12 text-[#5a3fd4] dark:text-[#b3a1ff]',
  faculty: 'bg-[#2563FF]/12 text-[#1D4FD7] dark:text-[#8fabff]',
  student: 'bg-[#25D890]/15 text-[#0b6b4a] dark:text-[#25D890]',
  placement_officer: 'bg-[#FFBD4A]/15 text-[#8a5a00] dark:text-[#FFBD4A]'
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
