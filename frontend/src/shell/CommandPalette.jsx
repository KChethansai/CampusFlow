// ⌘K / Ctrl+K command center. Fuzzy grouped results, role quick actions, action items, full keyboard nav.
// Reskin only: scale/fade panel, Kokonut-AI-input-style search field, SmoothUI-dropdown-like rows.
// NOTE: components/ui/{buttons,cards,overlays}/ do not exist in this repo — composed locally.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Compass, Download, Flag, Moon, Printer, Search, Sparkles, Sun, Zap } from 'lucide-react';
import { useAuth } from '../store/useAuth';
import { useFocusTrap } from '../system/focusTrap';
import { useTheme } from '../system/theme';
import api from '../api/axios';
import { motionVariants, useReducedMotion } from '../system/motion';

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

const rowIcon = (item) => {
  if (item.Icon) return item.Icon;
  if (item.quick) return Zap;
  if (item.run) return Compass;
  return Compass;
};

export default function CommandPalette({ open, onClose, onDownloadCsv, onStartTour }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const [cache, setCache] = useState({});
  const [serverRows, setServerRows] = useState([]); // cross-entity /search hits

  // Debounced server search — replaces per-open collection fan-out for queries.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setServerRows([]);
      return;
    }
    const id = setTimeout(async () => {
      try {
        const { data } = await api.get('/search', { params: { q } });
        setServerRows(data.data || []);
      } catch { /* role-gated 403 — fall back to client cache */ }
    }, 250);
    return () => clearTimeout(id);
  }, [query]);
  const inputRef = useRef(null);
  const trapRef = useFocusTrap(open);
  const reduced = useReducedMotion();

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
    if (serverRows.length) {
      out.push({
        group: 'Search',
        items: serverRows.slice(0, 8).map((r) => ({
          title: r.title, sub: r.entity, link: r.link || '/dashboard'
        }))
      });
    }
    return out;
  }, [query, cache, serverRows, user?.role, actions]);

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
          transition={reduced ? { duration: 0.01 } : { duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          role="dialog"
          aria-modal="true"
          aria-label="Command center"
        >
          <button aria-label="Close command center" onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-default" />
          <motion.div
            ref={trapRef}
            {...(reduced ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } } : motionVariants.modal)}
            className="glass-card relative w-full max-w-xl rounded-[24px] border border-[var(--cf-line)] bg-[var(--cf-surface)]/90 backdrop-blur-2xl shadow-[0_24px_80px_-16px_rgba(0,0,0,0.65)] overflow-hidden"
          >
            {/* Kokonut-AI-input-style search field: hero input with icon tile + hints */}
            <div className="p-3 pb-0">
              <div className="flex items-center gap-2 rounded-[18px] border border-[var(--cf-line)] bg-[var(--cf-surface-2)]/60 py-1.5 pl-2 pr-2.5 transition-colors focus-within:border-[#D86D3E]/60 focus-within:ring-[3px] focus-within:ring-[#D86D3E]/20">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#D86D3E]/12 text-[#D86D3E] dark:text-[#8db4ff]" aria-hidden>
                  {query ? <Search size={16} /> : <Sparkles size={16} />}
                </span>
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
                  placeholder="Ask or search students, courses, drives…"
                  className="w-full bg-transparent py-2 text-sm font-medium text-[var(--cf-ink)] placeholder:text-[var(--cf-ink-mute)] focus:outline-none"
                  role="combobox"
                  aria-expanded="true"
                  aria-controls="cf-palette-list"
                  aria-activedescendant={flat[index] ? `cf-opt-${index}` : undefined}
                />
                <kbd className="shrink-0 rounded-md border border-[var(--cf-line)] bg-[var(--cf-surface)] font-mono text-[10px] font-semibold px-1.5 py-0.5 text-[var(--cf-ink-mute)]">ESC</kbd>
              </div>
            </div>
            {/* SmoothUI-dropdown-like sectioned rows */}
            <div id="cf-palette-list" role="listbox" className="max-h-[46vh] overflow-y-auto p-2">
              {flat.length === 0 && (
                <p className="text-center text-sm text-[var(--cf-ink-mute)] py-8">No results for “{query}”.</p>
              )}
              {results.map((g) => (
                <div key={g.group} className="mb-1">
                  <p className="flex items-center gap-2 px-2.5 pt-2 pb-1 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--cf-ink-mute)]">
                    {g.group}
                    <span className="rounded-full border border-[var(--cf-line)] bg-[var(--cf-surface-2)]/70 px-1.5 py-px font-mono text-[10px] font-semibold tracking-normal" aria-hidden>
                      {g.items.length}
                    </span>
                  </p>
                  {g.items.map((item) => {
                    const gi = flat.indexOf(item);
                    const ItemIcon = rowIcon(item);
                    const active = gi === index;
                    return (
                      <button
                        key={`${item.sub}-${item.title}-${gi}`}
                        id={`cf-opt-${gi}`}
                        role="option"
                        aria-selected={active}
                        onMouseEnter={() => setIndex(gi)}
                        onClick={() => go(item)}
                        className={`w-full text-left px-2 min-h-11 py-1.5 rounded-[14px] flex items-center gap-2.5 text-sm transition-all duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                          active
                            ? 'bg-[#D86D3E]/10 text-[var(--cf-ink)] ring-1 ring-inset ring-[#D86D3E]/25'
                            : 'text-[var(--cf-ink-soft)] hover:bg-black/[0.03] dark:hover:bg-white/[0.05]'
                        }`}
                      >
                        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-[10px] transition-colors ${
                          item.quick || active
                            ? 'bg-[#D86D3E]/12 text-[#D86D3E] dark:text-[#8db4ff]'
                            : 'bg-[var(--cf-surface-2)]/80 text-[var(--cf-ink-mute)]'
                        }`} aria-hidden>
                          <ItemIcon size={15} />
                        </span>
                        <span className="truncate font-medium flex-1">{item.title}</span>
                        <span className="rounded-full bg-[var(--cf-surface-2)]/80 font-mono text-[10px] font-medium px-1.5 py-0.5 shrink-0 text-[var(--cf-ink-mute)]">{item.sub}</span>
                        {active && <ArrowRight size={14} className="text-[#D86D3E] shrink-0" aria-hidden />}
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
