// Subjects: glass table. Endpoint preserved: GET /subjects.
import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { EmptyState, LoadingState, PageHeader, Card } from '../../components/ui/primitives';

function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const { data } = await api.get('/subjects');
        setSubjects(data.data || []);
      } catch {
        /* handled */
      }
      setLoading(false);
    };
    fetchSubjects();
  }, []);

  return (
    <div>
      <PageHeader title="Subjects" subtitle={`${subjects.length} subjects`} />

      {loading ? (
        <LoadingState label="Loading subjects…" />
      ) : subjects.length === 0 ? (
        <Card><EmptyState title="No subjects found" hint="Subjects appear here once the catalog is built." /></Card>
      ) : (
        <div className="rounded-3xl border border-[var(--cf-line)] bg-[var(--cf-surface)]/70 backdrop-blur-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-[var(--cf-line)] bg-[var(--cf-surface-2)]/60">
                <tr>
                  <th className="px-4 py-3 text-left font-mono text-[11px] font-semibold uppercase tracking-widest text-[var(--cf-ink-mute)]">Subject</th>
                  <th className="px-4 py-3 text-left font-mono text-[11px] font-semibold uppercase tracking-widest text-[var(--cf-ink-mute)]">Code</th>
                  <th className="px-4 py-3 text-left font-mono text-[11px] font-semibold uppercase tracking-widest text-[var(--cf-ink-mute)]">Course</th>
                  <th className="px-4 py-3 text-left font-mono text-[11px] font-semibold uppercase tracking-widest text-[var(--cf-ink-mute)]">Semester</th>
                  <th className="px-4 py-3 text-left font-mono text-[11px] font-semibold uppercase tracking-widest text-[var(--cf-ink-mute)]">Credits</th>
                  <th className="px-4 py-3 text-left font-mono text-[11px] font-semibold uppercase tracking-widest text-[var(--cf-ink-mute)]">Faculty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--cf-line)]">
                {subjects.map((s) => (
                  <tr key={s._id} className="hover:bg-black/[.02] dark:hover:bg-white/[.04] transition-colors">
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full border border-[var(--cf-line)] bg-[var(--cf-surface-2)]/60 px-2 py-0.5 font-mono text-[11px] font-semibold text-[var(--cf-ink-soft)]">
                        {s.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--cf-ink-soft)]">
                      {s.course?.name || '—'}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{s.semester}</td>
                    <td className="px-4 py-3 tabular-nums">{s.credits}</td>
                    <td className="px-4 py-3 text-[var(--cf-ink-soft)]">
                      {s.faculty?.name || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Subjects;
