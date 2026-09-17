// Subjects: brutal table. Endpoint preserved: GET /subjects.
import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { EmptyState, LoadingState, PageHeader } from '../../components/ui/primitives';

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
        <div className="card-brutal p-5"><EmptyState title="No subjects found" hint="Subjects appear here once the catalog is built." /></div>
      ) : (
        <div className="card-brutal overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gold border-b-2 border-[var(--cf-ink)]">
                <tr>
                  <th className="px-4 py-3 text-left font-mono text-[11px] font-bold uppercase tracking-widest">Subject</th>
                  <th className="px-4 py-3 text-left font-mono text-[11px] font-bold uppercase tracking-widest">Code</th>
                  <th className="px-4 py-3 text-left font-mono text-[11px] font-bold uppercase tracking-widest">Course</th>
                  <th className="px-4 py-3 text-left font-mono text-[11px] font-bold uppercase tracking-widest">Semester</th>
                  <th className="px-4 py-3 text-left font-mono text-[11px] font-bold uppercase tracking-widest">Credits</th>
                  <th className="px-4 py-3 text-left font-mono text-[11px] font-bold uppercase tracking-widest">Faculty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--cf-line)]">
                {subjects.map((s) => (
                  <tr key={s._id} className="hover:bg-black/[.02] dark:hover:bg-white/[.04] transition-colors">
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3">
                      <span className="brutal-tag bg-[var(--cf-surface-2)] px-2 py-0.5 text-[11px] font-bold">
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
