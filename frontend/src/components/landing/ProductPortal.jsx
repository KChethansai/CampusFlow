// ProductPortal: "tour the product" panel. Layout nods to the reference
// InteractivePortal (top tab strip + 2x2 grid) but every cell is real product
// truth: feature bullets that link to real routes, pipeline stage names from
// tokens.PIPELINE_STAGES. No fake deadlines, percentages, or AI chat.
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
    <div className="bg-[var(--cf-surface)] border-2 border-[var(--cf-ink)] shadow-brutal-xl select-none">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b-2 border-[var(--cf-ink)]">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 bg-frame text-volt grid place-items-center font-display font-bold text-xs border-2 border-[var(--cf-ink)]" aria-hidden>
            CF
          </span>
          <span className="font-display text-sm font-bold uppercase tracking-tight">CampusFlow Portal</span>
          <span className="brutal-tag bg-volt px-2 py-0.5 text-[10px] font-bold uppercase">Tour</span>
        </div>
        <div className="flex items-center gap-1 bg-[var(--cf-surface-2)] p-1 border-2 border-[var(--cf-ink)]" role="tablist" aria-label="Preview workspace by role">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                'px-2.5 py-1 font-display text-xs font-bold uppercase tracking-wider transition-all',
                tab === t ? 'bg-frame text-volt' : 'hover:bg-[var(--cf-surface)]'
              )}
            >
              {t === 'admin' ? 'Admin' : roleLabel(t).split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 sm:p-5" role="tabpanel" aria-label={`${roleLabel(tab)} workspace tour`}>
        {cells.map((cell) => (
          <div key={cell.title} className="border-2 border-[var(--cf-ink)] bg-[var(--cf-bg)] p-4 flex flex-col justify-between gap-3 shadow-brutal-sm">
            <div>
              <h3 className="font-display text-base font-bold uppercase tracking-tight">{cell.title}</h3>
              <p className="mt-1 text-xs text-[var(--cf-ink-mute)] leading-relaxed">{cell.body}</p>
              {cell.stages && (
                <ol className="mt-3 flex flex-wrap gap-1.5" aria-label="Placement pipeline stages">
                  {PIPELINE_STAGES.map((s, i) => (
                    <li
                      key={s}
                      className={cn(
                        'px-2 py-0.5 border border-[var(--cf-ink)] text-[10px] font-mono font-bold uppercase',
                        i === 0 ? 'bg-gold' : 'bg-[var(--cf-surface)]'
                      )}
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
                    className="group flex items-center justify-between px-3 py-1.5 bg-[var(--cf-surface)] border-2 border-[var(--cf-ink)] text-xs font-bold hover:bg-volt transition-colors"
                  >
                    {l.label}
                    <ArrowUpRight size={13} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-3 border-t-2 border-[var(--cf-ink)]">
        <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--cf-ink-mute)]">
          Every link opens the real workspace
        </p>
        <Link to="/login" className="font-display text-xs font-bold uppercase underline underline-offset-4 decoration-gold decoration-2 hover:bg-volt px-1">
          Sign in to enter →
        </Link>
      </div>
      <div className="racing-stripe h-2 border-t-2 border-[var(--cf-ink)]" aria-hidden />
    </div>
  );
}
