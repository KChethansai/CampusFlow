// Directory: unified campus search — people, departments, courses, companies.
import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import api from '../api/axios';
import { Badge, Card, EmptyState, LoadingState, PageHeader } from '../components/ui/primitives';

const SOURCES = [
  { key: 'users', ep: '/users', label: 'People', kind: (r) => r.role?.replace(/_/g, ' ') },
  { key: 'departments', ep: '/departments', label: 'Departments', kind: () => 'Department' },
  { key: 'courses', ep: '/courses', label: 'Courses', kind: () => 'Course' },
  { key: 'subjects', ep: '/subjects', label: 'Subjects', kind: () => 'Subject' },
  { key: 'companies', ep: '/companies', label: 'Companies', kind: () => 'Company' }
];

const titleOf = (row) => row.name || row.title || row.email || 'Untitled';

export default function Directory() {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('All');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    Promise.allSettled(SOURCES.map((s) => api.get(s.ep))).then((results) => {
      if (!live) return;
      const next = {};
      results.forEach((r, i) => {
        next[SOURCES[i].key] = r.status === 'fulfilled' ? r.value.data.data || [] : [];
      });
      setData(next);
      setLoading(false);
    });
    return () => { live = false; };
  }, []);

  const tabs = ['All', ...SOURCES.map((s) => s.label)];

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = [];
    SOURCES.forEach((s) => {
      if (tab !== 'All' && tab !== s.label) return;
      (data[s.key] || []).forEach((row) => {
        const t = `${titleOf(row)} ${row.email || ''} ${row.code || ''}`.toLowerCase();
        if (!q || t.includes(q)) out.push({ source: s, row });
      });
    });
    return out.slice(0, 120);
  }, [data, query, tab]);

  return (
    <div>
      <PageHeader title="Directory" subtitle="Everyone and everything on campus, in one search." />
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <label className="flex items-center gap-2 flex-1 px-3.5 py-2.5 rounded-xl border border-[var(--cf-line)] bg-[var(--cf-surface)] text-sm">
          <Search size={15} className="text-[var(--cf-ink-mute)]" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people, departments, courses, companies…"
            className="w-full bg-transparent focus:outline-none placeholder:text-[var(--cf-ink-mute)]"
            aria-label="Search directory"
          />
        </label>
        <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Directory sections">
          {tabs.map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
              className={`px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition ${tab === t ? 'bg-primary-600 text-white' : 'bg-black/[.04] dark:bg-white/10 text-[var(--cf-ink-soft)]'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>
      {loading ? <LoadingState label="Loading directory…" /> : rows.length === 0 ? (
        <Card><EmptyState title="No matches" hint="Try a different search, or another section." /></Card>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {rows.map(({ source, row }) => (
            <Card key={source.key + (row._id || titleOf(row))} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{titleOf(row)}</p>
                  {row.email && <p className="text-xs text-[var(--cf-ink-mute)] truncate">{row.email}</p>}
                  {row.code && <p className="text-xs text-[var(--cf-ink-mute)]">{row.code}</p>}
                </div>
                <Badge tone="bg-black/[.05] dark:bg-white/10 text-[var(--cf-ink-soft)]">{source.label.slice(0, -1)}</Badge>
              </div>
              <p className="mt-2 text-xs text-[var(--cf-ink-mute)]">{source.kind(row)}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
