// ⌘K / Ctrl+K command center. Grouped results, full keyboard nav.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Search } from 'lucide-react';
import api from '../api/axios';
import { motionVariants } from '../system/motion';

const GROUPS = [
  { key: 'academics', label: 'Academics', endpoints: [['Courses', '/courses'], ['Subjects', '/subjects'], ['Assignments', '/assignments']] },
  { key: 'people', label: 'People', endpoints: [['Users', '/users'], ['Departments', '/departments']] },
  { key: 'career', label: 'Placements', endpoints: [['Drives', '/job-drives'], ['Companies', '/companies'], ['Applications', '/job-applications']] },
  { key: 'ops', label: 'Requests & Reports', endpoints: [['Requests', '/requests']] }
];

const score = (q, text) => {
  const t = text.toLowerCase();
  const query = q.toLowerCase().trim();
  if (!query) return 0;
  if (t.startsWith(query)) return 3;
  if (t.includes(query)) return 2;
  return query.split(/\s+/).every((w) => t.includes(w)) ? 1 : 0;
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

export default function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
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

  const results = useMemo(() => {
    const out = [];
    if (!query.trim()) {
      return [
        { group: 'Go to', items: [
          { title: 'Dashboard', sub: 'Home', link: '/dashboard' },
          { title: 'Assignments', sub: 'All · upcoming · graded', link: '/assignments' },
          { title: 'Placement', sub: 'Drives · pipeline', link: '/placement' },
          { title: 'Requests', sub: 'Workflow', link: '/requests' },
          { title: 'Directory', sub: 'People · departments', link: '/directory' }
        ]}
      ];
    }
    GROUPS.forEach((g) => {
      const items = [];
      g.endpoints.forEach(([label, ep]) => {
        (cache[`${g.key}:${label}`] || []).forEach((row) => {
          const title = row.title || row.name || row.role || row.email || 'Item';
          const s = Math.max(score(query, title), score(query, `${label} ${title}`));
          if (s > 0) {
            const link =
              label === 'Users' ? '/users' :
              label === 'Departments' ? '/departments' :
              label === 'Courses' ? '/courses' :
              label === 'Subjects' ? '/subjects' :
              label === 'Assignments' ? '/assignments' :
              label === 'Drives' ? '/placement' :
              label === 'Companies' ? '/placement' :
              label === 'Applications' ? '/placement' : '/requests';
            items.push({ title, sub: label, link, rank: s });
          }
        });
      });
      items.sort((a, b) => b.rank - a.rank);
      if (items.length) out.push({ group: g.label, items: items.slice(0, 6) });
    });
    return out;
  }, [query, cache]);

  const flat = useMemo(() => results.flatMap((r) => r.items), [results]);

  const go = (item) => {
    if (!item) return;
    onClose();
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
          <button aria-label="Close command center" onClick={onClose} className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm cursor-default" />
          <motion.div
            {...motionVariants.popover}
            className="relative w-full max-w-xl bg-[var(--cf-surface)] border border-[var(--cf-line)] rounded-2xl shadow-4 overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 border-b border-[var(--cf-line)]">
              <Search size={16} className="text-[var(--cf-ink-mute)]" aria-hidden />
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
                className="w-full py-3.5 bg-transparent text-sm text-[var(--cf-ink)] placeholder:text-[var(--cf-ink-mute)] focus:outline-none"
                role="combobox"
                aria-expanded="true"
                aria-controls="cf-palette-list"
                aria-activedescendant={flat[index] ? `cf-opt-${index}` : undefined}
              />
              <kbd className="text-[10px] px-1.5 py-0.5 rounded-md border border-[var(--cf-line)] text-[var(--cf-ink-mute)]">ESC</kbd>
            </div>
            <div id="cf-palette-list" role="listbox" className="max-h-[46vh] overflow-y-auto p-2">
              {flat.length === 0 && (
                <p className="text-center text-sm text-[var(--cf-ink-mute)] py-8">No results for “{query}”.</p>
              )}
              {results.map((g) => (
                <div key={g.group} className="mb-1">
                  <p className="px-2.5 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--cf-ink-mute)]">{g.group}</p>
                  {g.items.map((item) => {
                    const gi = flat.indexOf(item);
                    return (
                      <button
                        key={`${item.sub}-${item.title}-${gi}`}
                        id={`cf-opt-${gi}`}
                        role="option"
                        aria-selected={gi === index}
                        onMouseEnter={() => setIndex(gi)}
                        onClick={() => go(item)}
                        className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between gap-2 text-sm transition ${
                          gi === index ? 'bg-primary-50 dark:bg-primary-500/15 text-[var(--cf-ink)]' : 'text-[var(--cf-ink-soft)]'
                        }`}
                      >
                        <span className="truncate font-medium">{item.title}</span>
                        <span className="text-[11px] text-[var(--cf-ink-mute)] shrink-0">{item.sub}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
