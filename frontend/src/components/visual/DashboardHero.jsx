import { Link } from 'react-router';
import { motion } from 'motion/react';
import { useAuth } from '../../store/useAuth';
import { useReducedMotion } from '../../system/motion';
import { roleLabel } from '../../system/tokens';
import {
  Sparkles,
  Command,
  CalendarCheck,
  Briefcase,
  FileCheck,
  GraduationCap,
  Users,
  ShieldCheck,
  ArrowUpRight
} from 'lucide-react';

export default function DashboardHero({ onOpenCommandPalette }) {
  const { user } = useAuth();
  const reduced = useReducedMotion();

  const role = user?.role || 'student';
  const firstName = user?.name ? user.name.split(' ')[0] : 'Member';

  const roleCopy = {
    student: {
      greeting: `Good morning, ${firstName}.`,
      subhead: 'Your academic pulse for today — classes, assignments, and placement drives.',
      icon: GraduationCap,
      color: '#D86D3E',
      quickLinks: [
        { label: 'Today’s Attendance', to: '/attendance', icon: CalendarCheck },
        { label: 'Pending Assignments', to: '/assignments', icon: FileCheck },
        { label: 'Job Drives', to: '/placement', icon: Briefcase }
      ]
    },
    faculty: {
      greeting: `Welcome, ${user?.name || 'Professor'}.`,
      subhead: 'Your teaching queue — class attendance rosters, grading deadlines, and student requests.',
      icon: Users,
      color: '#79B8A6',
      quickLinks: [
        { label: 'Mark Attendance', to: '/attendance', icon: CalendarCheck },
        { label: 'Review Submissions', to: '/assignments', icon: FileCheck },
        { label: 'Student Requests', to: '/requests', icon: Sparkles }
      ]
    },
    placement_officer: {
      greeting: `Recruitment in motion, ${firstName}.`,
      subhead: 'Active corporate hiring pipelines, student eligibility verification, and interviews.',
      icon: Briefcase,
      color: '#E7A66D',
      quickLinks: [
        { label: 'Active Job Drives', to: '/placement', icon: Briefcase },
        { label: 'Placement Funnel', to: '/dashboard', icon: Sparkles },
        { label: 'Publish New Drive', to: '/placement', icon: ArrowUpRight }
      ]
    },
    college_admin: {
      greeting: `Institutional command, ${firstName}.`,
      subhead: 'Real-time campus operations, academic department health, and governance signals.',
      icon: ShieldCheck,
      color: '#F5B08A',
      quickLinks: [
        { label: 'User Provisioning', to: '/users', icon: Users },
        { label: 'Department Analytics', to: '/dashboard', icon: Sparkles },
        { label: 'AI Intelligence', to: '/ai-reports', icon: Sparkles }
      ]
    },
    super_admin: {
      greeting: `System root active, ${firstName}.`,
      subhead: 'Multi-institution tenancy, system audits, and global security policies.',
      icon: ShieldCheck,
      color: '#F5B08A',
      quickLinks: [
        { label: 'Institutions', to: '/institutions', icon: ShieldCheck },
        { label: 'Global Directory', to: '/directory', icon: Users },
        { label: 'System Reports', to: '/ai-reports', icon: Sparkles }
      ]
    }
  }[role] || {
    greeting: `Welcome back, ${firstName}.`,
    subhead: 'Your campus workspace is ready.',
    icon: Sparkles,
    color: '#D86D3E',
    quickLinks: []
  };

  const Icon = roleCopy.icon;

  return (
    <div className="relative mb-6 rounded-3xl border border-[var(--cf-line)] bg-gradient-to-r from-[var(--cf-surface)] via-[var(--cf-surface)] to-[var(--cf-surface-soft)] p-6 sm:p-8 overflow-hidden shadow-sm">
      {/* Ambient background lighting */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background: `radial-gradient(420px 240px at 95% 10%, ${roleCopy.color}15, transparent 70%)`
        }}
      />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold uppercase tracking-wider"
              style={{
                backgroundColor: `${roleCopy.color}15`,
                color: roleCopy.color,
                border: `1px solid ${roleCopy.color}30`
              }}
            >
              <Icon size={13} aria-hidden />
              {roleLabel(role)}
            </span>
            <span className="text-xs text-[var(--cf-ink-mute)] font-medium">
              {user?.department?.name || user?.institution?.name || 'Campus Workspace'}
            </span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--cf-ink)]">
            {roleCopy.greeting}
          </h1>
          <p className="mt-1 text-sm text-[var(--cf-ink-soft)] max-w-xl leading-relaxed">
            {roleCopy.subhead}
          </p>
        </div>

        {/* Quick action shortcuts */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenCommandPalette && (
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[var(--cf-line)] bg-[var(--cf-bg)]/80 text-xs font-medium text-[var(--cf-ink-soft)] hover:text-[var(--cf-ink)] hover:border-[var(--cf-accent)]/50 transition-all shadow-sm"
              title="Open Command Palette (Ctrl+K or ⌘K)"
            >
              <Command size={13} className="text-[var(--cf-accent)]" />
              <span>Jump to...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-[var(--cf-surface)] border border-[var(--cf-line)] font-mono text-[10px] text-[var(--cf-ink-mute)]">
                ⌘K
              </kbd>
            </button>
          )}

          {roleCopy.quickLinks.map((link) => {
            const LinkIcon = link.icon;
            return (
              <Link
                key={link.label}
                to={link.to}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[var(--cf-line)] bg-[var(--cf-bg)]/60 text-xs font-medium text-[var(--cf-ink-soft)] hover:text-[var(--cf-ink)] hover:border-[var(--cf-accent)]/40 hover:bg-[var(--cf-surface)] transition-all"
              >
                <LinkIcon size={13} className="text-[var(--cf-accent)]" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
