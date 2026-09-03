// common: shared Tailwind class tokens — Apple Light theme (white surface,
// #1d1d1f ink, #0066cc accent, rounded-full buttons, rounded-xl inputs,
// rounded-2xl cards).

// Typography
export const pageHeading =
  'text-2xl font-bold text-gray-900 tracking-tight';
export const pageSubheading = 'mt-1 text-sm text-gray-500';
export const cardTitle = 'text-lg font-semibold text-gray-900';

// Surfaces
export const pageHeader = 'flex flex-wrap items-center justify-between gap-3 mb-6';
export const cardClass =
  'bg-white rounded-2xl shadow-sm border border-gray-100';
export const tableClass = 'w-full text-sm';
export const tableHeadClass = 'bg-gray-50 text-gray-600';
export const tableCellHead = 'px-4 py-3 text-left font-medium';
export const tableCell = 'px-4 py-3';
export const tableRowHover = 'hover:bg-gray-50';
export const emptyState = 'text-center text-gray-400 py-10';
export const loadingState = 'text-gray-500';

// Forms
export const formGroup = 'mb-4';
export const labelClass = 'block mb-1.5 text-sm font-medium text-gray-700';
export const inputClass =
  'w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition';
export const selectClass = inputClass;
export const formCardClass =
  'bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 grid grid-cols-1 md:grid-cols-2 gap-3';

// Buttons (rounded-full per theme)
export const buttonBase =
  'inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

export const buttonVariants = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-400',
  success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  outline:
    'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary-500'
};

export const buttonSizes = {
  small: 'px-3 py-1.5 text-xs',
  medium: 'px-4 py-2 text-sm',
  large: 'px-6 py-3 text-base'
};

export const btnClass = (variant = 'primary', size = 'medium') =>
  `${buttonBase} ${buttonVariants[variant]} ${buttonSizes[size]}`;

// Badges
export const badgeBase = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
export const badge = (color = 'bg-gray-100 text-gray-700') => `${badgeBase} ${color}`;

export const statusColors = {
  pending: 'bg-amber-100 text-amber-800',
  in_review: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  draft: 'bg-gray-100 text-gray-800',
  published: 'bg-blue-100 text-blue-800',
  open: 'bg-green-100 text-green-800',
  closed: 'bg-amber-100 text-amber-800',
  graded: 'bg-purple-100 text-purple-800',
  archived: 'bg-gray-100 text-gray-600',
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-red-100 text-red-800',
  applied: 'bg-blue-100 text-blue-800',
  shortlisted: 'bg-purple-100 text-purple-800',
  selected: 'bg-green-100 text-green-800',
  under_review: 'bg-blue-100 text-blue-800'
};

export const roleColors = {
  super_admin: 'bg-red-100 text-red-800',
  college_admin: 'bg-purple-100 text-purple-800',
  faculty: 'bg-blue-100 text-blue-800',
  student: 'bg-green-100 text-green-800',
  placement_officer: 'bg-amber-100 text-amber-800'
};
