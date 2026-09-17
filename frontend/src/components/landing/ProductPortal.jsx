// ProductPortal: "tour the product" panel, glass restyle. Same pattern —
// top tab strip + 2x2 grid — and every cell is real product truth:
// feature links to real routes, pipeline stage names from tokens.
// No fake deadlines, percentages, or AI chat.
import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight } from 'lucide-react';
import { PIPELINE_STAGES, cn, roleLabel } from '../../system/tokens';

const TABS = ['student', 'faculty', 'placement', 'admin'];

const stageLabel = (s) => roleLabel(s);

const PANELS = {
  student: [
    {
      title: 'Today',
      body: 'Classes, due work and attendance health in one place.',
      links: [
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Attendance', to: '/attendance' },
        { label: 'Assignments', to: '/assignments' }
      ]
    },
    {
      title: 'Placement pulse',
      body: 'Where you stand in the hiring pipeline.',
      links: [{ label: 'Placement', to: '/placement' }],
      stages: true
    },
    {
      title: 'Study & requests',
      body: 'Workspace, enrollments and formal requests.',
      links: [
        { label: 'Study', to: '/study' },
        { label: 'My enrollments', to: '/enrollments' },
        { label: 'Requests', to: '/requests' }
      ]
    },
    {
      title: 'Campus',
      body: 'People, events and your profile.',
      links: [
        { label: 'Directory', to: '/directory' },
        { label: 'Events', to: '/events' },
        { label: 'Profile', to: '/profile' }
      ]
    }
  ],
  faculty: [
    {
      title: 'Mark attendance',
      body: 'Take attendance in seconds, spot gaps early.',
      links: [{ label: 'Attendance', to: '/attendance' }]
    },
    {
      title: 'Grading queue',
      body: 'Submissions arrive as a queue, not a mailbox hunt.',
      links: [
        { label: 'Assignments', to: '/assignments' },
        { label: 'Subjects', to: '/subjects' }
      ]
    },
    {
      title: 'Mentor & respond',
      body: 'Study workspace plus student requests.',
      links: [
        { label: 'Study', to: '/study' },
        { label: 'Requests', to: '/requests' }
      ]
    },
    {
      title: 'Campus',
      body: 'Directory, events and your dashboard.',
      links: [
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Directory', to: '/directory' },
        { label: 'Events', to: '/events' }
      ]
    }
  ],
  placement: [
    {
      title: 'The pipeline',
      body: 'Every applicant moves down one visible pipeline.',
      links: [{ label: 'Placement', to: '/placement' }],
      stages: true
    },
    {
      title: 'Drives & eligibility',
      body: 'Publish drives, check eligibility, schedule interviews.',
      links: [{ label: 'Placement', to: '/placement' }]
    },
    {
      title: 'People',
      body: 'Find students and coordinate with departments.',
      links: [
        { label: 'Directory', to: '/directory' },
        { label: 'Dashboard', to: '/dashboard' }
      ]
    },
    {
      title: 'Campus',
      body: 'Events for fairs and drives, plus your profile.',
      links: [
        { label: 'Events', to: '/events' },
        { label: 'Profile', to: '/profile' }
      ]
    }
  ],
  admin: [
    {
      title: 'People & structure',
      body: 'Users, departments, courses and subjects.',
      links: [
        { label: 'Users', to: '/users' },
        { label: 'Departments', to: '/departments' },
        { label: 'Courses', to: '/courses' },
        { label: 'Subjects', to: '/subjects' }
      ]
    },
    {
      title: 'Academics oversight',
      body: 'Attendance health and the grading queue.',
      links: [
        { label: 'Attendance', to: '/attendance' },
        { label: 'Assignments', to: '/assignments' }
      ]
    },
    {
      title: 'Placements & insight',
      body: 'Pipeline oversight plus grounded AI reports.',
      links: [
        { label: 'Placement', to: '/placement' },
        { label: 'AI reports', to: '/ai-reports' }
      ]
    },
    {
      title: 'Campus ops',
      body: 'Requests, events and directory.',
      links: [
        { label: 'Requests', to: '/requests' },
        { label: 'Events', to: '/events' },
        { label: 'Directory', to: '/directory' }
      ]
    }
  ]
};

export default function ProductPortal() {
  const [tab, setTab] = useState('student');
  const cells = PANELS[tab];

  return (
    <div className="cf-glass rounded-[32px] border border-black/10 dark:border-white/10 overflow-hidden select-none">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-black/10 dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <span
            className="w-7 h-7 rounded-full grid place-items-center font-display font-bold text-xs bg-[#2563FF] text-white"
            aria-hidden
          >
            C
          </span>
          <span className="font-display text-sm font-semibold tracking-tight text-[#0A0D12] dark:text-[#F5F7FA]">
            CampusFlow Portal
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#A7D700]/15 text-[#4d6a00] dark:text-[#A7D700] border border-[#A7D700]/30">
            Tour
          </span>
        </div>
        <div
          className="flex items-center gap-1 p-1 rounded-full border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.04]"
          role="tablist"
          aria-label="Preview workspace by role"
        >
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                'px-3 py-1.5 rounded-full font-display text-xs font-semibold transition-all',
                tab === t
                  ? 'bg-[#2563FF] text-white'
                  : 'text-[#4B5563] dark:text-[#A7B0BF] hover:text-[#0A0D12] dark:hover:text-white'
              )}
            >
              {t === 'admin' ? 'Admin' : roleLabel(t).split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 sm:p-5"
        role="tabpanel"
        aria-label={`${roleLabel(tab)} workspace tour`}
      >
        {cells.map((cell) => (
          <div
            key={cell.title}
            className="rounded-3xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-4 sm:p-5 flex flex-col justify-between gap-3"
          >
            <div>
              <h3 className="font-display text-base font-semibold tracking-tight text-[#0A0D12] dark:text-[#F5F7FA]">
                {cell.title}
              </h3>
              <p className="mt-1 text-[13px] leading-relaxed text-[#4B5563] dark:text-[#A7B0BF]">
                {cell.body}
              </p>
              {cell.stages && (
                <ol
                  className="mt-3 flex flex-wrap gap-1.5"
                  aria-label="Placement pipeline stages"
                >
                  {PIPELINE_STAGES.map((s) => (
                    <li
                      key={s}
                      className="px-2 py-0.5 rounded-full border border-black/10 dark:border-white/10 text-[10px] font-mono font-medium uppercase tracking-wide text-[#4B5563] dark:text-[#A7B0BF]"
                    >
                      {stageLabel(s)}
                    </li>
                  ))}
                </ol>
              )}
            </div>
            <ul className="space-y-1.5">
              {cell.links.map((l) => (
                <li key={l.to + l.label}>
                  <Link
                    to={l.to}
                    className="group flex items-center justify-between px-3 py-2 rounded-2xl border border-black/10 dark:border-white/10 text-[13px] font-semibold text-[#0A0D12] dark:text-[#F5F7FA] hover:border-[#2563FF]/50 hover:bg-[#2563FF]/[0.06] dark:hover:bg-[#2563FF]/10 transition-colors"
                  >
                    {l.label}
                    <ArrowUpRight
                      size={14}
                      className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      aria-hidden
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-5 sm:px-6 py-3.5 border-t border-black/10 dark:border-white/10">
        <p className="text-[11px] font-mono uppercase tracking-wider text-[#6B7280] dark:text-[#707A89]">
          Every link opens the real workspace
        </p>
        <Link
          to="/login"
          className="font-display text-xs font-semibold text-[#2563FF] dark:text-[#7DA6FF] hover:underline underline-offset-4"
        >
          Sign in to enter →
        </Link>
      </div>
    </div>
  );
}
