// Directory: unified campus search — people, departments, courses, companies.
import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import api from '../api/axios';
import { Badge, Card, EmptyState, LoadingState, PageHeader } from '../components/ui/primitives';
import { btnClass, cn } from '../system/tokens';

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
      <PageHeader
        title="Directory"
        subtitle="Everyone and everything on campus, in one search."
        actions={rows.length > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--cf-line)] bg-[var(--cf-surface)]/70 px-3 py-1.5 text-xs font-semibold tabular-nums text-[var(--cf-ink-soft)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#E7A66D]" aria-hidden />
            {rows.length} result{rows.length === 1 ? '' : 's'}
          </span>
        )}
      />
      <div className="rounded-3xl border border-[var(--cf-line)] bg-[var(--cf-surface)]/70 backdrop-blur-xl p-2 mb-4 flex flex-col sm:flex-row gap-2">
        <label className="flex items-center gap-2 flex-1 px-3.5 py-2.5 rounded-2xl border border-[var(--cf-line)] bg-[var(--cf-surface-2)]/50 text-sm focus-within:border-[#D86D3E]/50 transition">
          <Search size={15} className="text-[var(--cf-ink-mute)] shrink-0" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people, departments, courses, companies…"
            className="w-full bg-transparent focus:outline-none placeholder:text-[var(--cf-ink-mute)]"
            aria-label="Search directory"
          />
        </label>
        <div className="flex gap-1 overflow-x-auto items-center" role="tablist" aria-label="Directory sections">
          {tabs.map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
              className={cn('px-3 py-2 rounded-xl text-xs font-display font-semibold whitespace-nowrap transition',
                tab === t ? 'bg-[#A94727] text-white' : 'text-[var(--cf-ink-soft)] hover:text-[var(--cf-ink)]')}>
              {t}
            </button>
          ))}
        </div>
      </div>
      {loading ? <LoadingState label="Loading directory…" /> : rows.length === 0 ? (
        <Card><EmptyState editorial title="No matches" hint="Try a different search, or another section." /></Card>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {rows.map(({ source, row }) => (
            <Card key={source.key + (row._id || titleOf(row))} className="p-4 group">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-display font-semibold truncate">{titleOf(row)}</p>
                  {row.email && <p className="text-xs text-[var(--cf-ink-mute)] truncate">{row.email}</p>}
                  {row.code && (
                    <span className="inline-block mt-1 font-mono text-[11px] font-semibold border border-[var(--cf-line)] bg-[var(--cf-surface-2)]/60 rounded-full px-2 py-0.5">{row.code}</span>
                  )}
                </div>
                <Badge tone="bg-black/[.05] dark:bg-white/10 text-[var(--cf-ink-soft)]">{source.label.slice(0, -1)}</Badge>
              </div>
              <p className="mt-2 text-xs text-[var(--cf-ink-mute)] capitalize">{source.kind(row)}</p>
              {row.email && (
                <div className="mt-3 flex gap-2">
                  <a href={`mailto:${row.email}`} className={btnClass('secondary', 'small')}>Email</a>
                  <button onClick={() => navigator.clipboard?.writeText(row.email).catch(() => {})} className={btnClass('outline', 'small')}>Copy</button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
