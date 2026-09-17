// ⌘K / Ctrl+K command center. Fuzzy grouped results, role quick actions, action items, full keyboard nav.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Download, Flag, Moon, Printer, Search, Sun, Zap } from 'lucide-react';
import { useAuth } from '../store/useAuth';
import { useTheme } from '../system/theme';
import api from '../api/axios';
import { motionVariants } from '../system/motion';

const GROUPS = [
  { key: 'academics', label: 'Academics', endpoints: [['Courses', '/courses'], ['Subjects', '/subjects'], ['Assignments', '/assignments']] },
  { key: 'people', label: 'People', endpoints: [['Users', '/users'], ['Departments', '/departments']] },
  { key: 'career', label: 'Placements', endpoints: [['Drives', '/job-drives'], ['Companies', '/companies'], ['Applications', '/job-applications']] },
  { key: 'ops', label: 'Requests & Reports', endpoints: [['Requests', '/requests']] }
];

const QUICK_BY_ROLE = {
  student: [['View my assignments', '/assignments'], ['Open placement board', '/placement'], ['Check attendance', '/attendance']],
  faculty: [['Grade assignments', '/assignments'], ['Mark attendance', '/attendance'], ['My subjects', '/subjects']],
  college_admin: [['Manage users', '/users'], ['View AI reports', '/ai-reports'], ['Manage courses', '/courses']],
  super_admin: [['Manage users', '/users'], ['View AI reports', '/ai-reports'], ['Manage courses', '/courses']],
  placement_officer: [['Open placement board', '/placement'], ['Manage users', '/users'], ['View events', '/events']]
};

// Fuzzy subsequence score with prefix/contiguous bonuses (Raycast-feel, zero deps).
const score = (q, text) => {
  const t = text.toLowerCase();
  const query = q.toLowerCase().trim();
  if (!query) return 0;
  if (t.startsWith(query)) return 100 + query.length;
  if (t.includes(query)) return 60 + query.length;
  let ti = 0, matched = 0, contiguous = 0, best = 0;
  for (let qi = 0; qi < query.length; qi++) {
    const idx = t.indexOf(query[qi], ti);
    if (idx === -1) return 0;
    if (idx === ti) { contiguous += 1; best = Math.max(best, contiguous); }
    else contiguous = 0;
    ti = idx + 1; matched += 1;
  }
  if (matched !== query.replace(/\s/g, '').length && !query.split(/\s+/).every((w) => t.includes(w))) return 0;
  return 20 + best * 4 + Math.max(0, 10 - t.length / 12);
};

export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return [open, setOpen];
}

const linkFor = (label) =>
  label === 'Users' ? '/users' :
  label === 'Departments' ? '/departments' :
  label === 'Courses' ? '/courses' :
  label === 'Subjects' ? '/subjects' :
  label === 'Assignments' ? '/assignments' :
  label === 'Drives' ? '/placement' :
  label === 'Companies' ? '/placement' :
  label === 'Applications' ? '/placement' : '/requests';

export default function CommandPalette({ open, onClose, onDownloadCsv, onStartTour }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const [cache, setCache] = useState({});
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setIndex(0);
      setTimeout(() => inputRef.current?.focus(), 30);
      // Prefetch searchable collections once per open.
      GROUPS.forEach((g) =>
        g.endpoints.forEach(async ([label, ep]) => {
          const key = `${g.key}:${label}`;
          if (cache[key]) return;
          try {
            const { data } = await api.get(ep);
            const rows = data.data || [];
            setCache((c) => ({ ...c, [key]: rows }));
          } catch { /* role-gated endpoints 403 — skip silently */ }
        })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open ]);

  const actions = useMemo(() => [
    { title: theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode', sub: 'Action', Icon: theme === 'dark' ? Sun : Moon, run: () => toggle() },
    { title: 'Print this page', sub: 'Action', Icon: Printer, run: () => window.print() },
    { title: 'Download CSV', sub: 'Action', Icon: Download, run: () => onDownloadCsv?.() },
    { title: 'Start guided tour', sub: 'Action', Icon: Flag, run: () => onStartTour?.() },
    { title: 'Go to Dashboard', sub: 'Go to', link: '/dashboard' },
    { title: 'Go to Assignments', sub: 'Go to', link: '/assignments' },
    { title: 'Go to Placement', sub: 'Go to', link: '/placement' },
    { title: 'Go to Requests', sub: 'Go to', link: '/requests' },
    { title: 'Go to Directory', sub: 'Go to', link: '/directory' }
  ], [theme, toggle, onDownloadCsv, onStartTour]);

  const results = useMemo(() => {
    const out = [];
    const role = user?.role;
    const q = query.trim();
    if (!q) {
      const quick = (QUICK_BY_ROLE[role] || QUICK_BY_ROLE.student).map(([title, link]) => ({ title, sub: 'Quick action', link, quick: true }));
      return [
        ...(quick.length ? [{ group: 'Quick actions', items: quick }] : []),
        { group: 'Actions', items: actions.filter((a) => a.run) },
        { group: 'Screens', items: actions.filter((a) => a.link) }
      ];
    }
    const matchedActions = actions
      .filter((a) => a.run)
      .map((a) => ({ ...a, rank: score(q, a.title) }))
      .filter((a) => a.rank > 0)
      .sort((x, y) => y.rank - x.rank);
    if (matchedActions.length) out.push({ group: 'Actions', items: matchedActions });
    const matchedScreens = actions
      .filter((a) => a.link)
      .map((a) => ({ ...a, rank: score(q, a.title) }))
      .filter((a) => a.rank > 0)
      .sort((x, y) => y.rank - x.rank);
    if (matchedScreens.length) out.push({ group: 'Screens', items: matchedScreens });
    const data = [];
    GROUPS.forEach((g) => {
      g.endpoints.forEach(([label, ep]) => {
        (cache[`${g.key}:${label}`] || []).forEach((row) => {
          const title = row.title || row.name || row.role || row.email || 'Item';
          const s = Math.max(score(query, title), score(query, `${label} ${title}`));
          if (s > 0) data.push({ title, sub: label, link: linkFor(label), rank: s });
        });
      });
    });
    data.sort((a, b) => b.rank - a.rank);
    if (data.length) out.push({ group: 'Data', items: data.slice(0, 8) });
    return out;
  }, [query, cache, user?.role, actions]);

  const flat = useMemo(() => results.flatMap((r) => r.items), [results]);

  const go = (item) => {
    if (!item) return;
    onClose();
    if (item.run) { item.run(); return; }
    navigate(item.link);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Command center"
        >
          <button aria-label="Close command center" onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-default" />
          <motion.div
            {...motionVariants.modal}
            className="cf-glass relative w-full max-w-xl rounded-3xl border border-[var(--cf-line)] shadow-[0_24px_80px_-16px_rgba(16,24,40,0.4)] overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 border-b border-[var(--cf-line)]">
              <Search size={16} className="text-[var(--cf-ink-mute)] shrink-0" aria-hidden />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setIndex(0); }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') { e.preventDefault(); setIndex((i) => Math.min(i + 1, flat.length - 1)); }
                  if (e.key === 'ArrowUp') { e.preventDefault(); setIndex((i) => Math.max(i - 1, 0)); }
                  if (e.key === 'Enter') go(flat[index]);
                  if (e.key === 'Escape') onClose();
                }}
                placeholder="Search students, courses, drives, requests…"
                className="w-full py-3.5 bg-transparent rounded-[14px] text-sm font-medium text-[var(--cf-ink)] placeholder:text-[var(--cf-ink-mute)] focus:outline-none"
                role="combobox"
                aria-expanded="true"
                aria-controls="cf-palette-list"
                aria-activedescendant={flat[index] ? `cf-opt-${index}` : undefined}
              />
              <kbd className="rounded-md border border-[var(--cf-line)] bg-[var(--cf-surface-2)]/70 font-mono text-[10px] font-semibold px-1.5 py-0.5 text-[var(--cf-ink-mute)]">ESC</kbd>
            </div>
            <div id="cf-palette-list" role="listbox" className="max-h-[46vh] overflow-y-auto p-2">
              {flat.length === 0 && (
                <p className="text-center text-sm text-[var(--cf-ink-mute)] py-8">No results for “{query}”.</p>
              )}
              {results.map((g) => (
                <div key={g.group} className="mb-1">
                  <p className="px-2.5 pt-2 pb-1 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--cf-ink-mute)]">{g.group}</p>
                  {g.items.map((item) => {
                    const gi = flat.indexOf(item);
                    const ItemIcon = item.Icon;
                    return (
                      <button
                        key={`${item.sub}-${item.title}-${gi}`}
                        id={`cf-opt-${gi}`}
                        role="option"
                        aria-selected={gi === index}
                        onMouseEnter={() => setIndex(gi)}
                        onClick={() => go(item)}
                        className={`w-full text-left px-2.5 min-h-11 py-2 rounded-xl flex items-center gap-2 text-sm transition-all duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                          gi === index
                            ? 'bg-[#2563FF]/10 text-[var(--cf-ink)]'
                            : 'text-[var(--cf-ink-soft)]'
                        }`}
                      >
                        {item.quick ? <Zap size={14} className="text-[#2563FF] shrink-0" aria-hidden /> : null}
                        {ItemIcon ? <ItemIcon size={14} className="shrink-0" aria-hidden /> : null}
                        <span className="truncate font-medium flex-1">{item.title}</span>
                        <span className="rounded-full bg-[var(--cf-surface-2)]/80 font-mono text-[10px] font-medium px-1.5 py-0.5 shrink-0 text-[var(--cf-ink-mute)]">{item.sub}</span>
                        {gi === index && <ArrowRight size={14} className="text-[#2563FF]" aria-hidden />}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 px-4 py-2.5 border-t border-[var(--cf-line)] font-mono text-[11px] font-medium uppercase tracking-wider text-[var(--cf-ink-mute)]">
              <span><kbd className="rounded px-1 border border-[var(--cf-line)] bg-[var(--cf-surface-2)]/70">↑↓</kbd> navigate</span>
              <span><kbd className="rounded px-1 border border-[var(--cf-line)] bg-[var(--cf-surface-2)]/70">↵</kbd> open</span>
              <span><kbd className="rounded px-1 border border-[var(--cf-line)] bg-[var(--cf-surface-2)]/70">esc</kbd> close</span>
              <span className="ml-auto">Ctrl/⌘ K to toggle</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
