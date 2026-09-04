import { useEffect, useState } from 'react';
import api from '../../api/axios';
import {
  cardClass,
  emptyState,
  loadingState,
  pageHeading,
  pageSubheading,
  tableCell,
  tableCellHead,
  tableClass,
  tableHeadClass,
  tableRowHover
} from '../../styles/common';

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
      <div className="mb-6">
        <h1 className={pageHeading}>Subjects</h1>
        <p className={pageSubheading}>{subjects.length} subjects</p>
      </div>

      {loading ? (
        <p className={loadingState}>Loading...</p>
      ) : (
        <div className={`${cardClass} overflow-hidden`}>
          <table className={tableClass}>
            <thead className={tableHeadClass}>
              <tr>
                <th className={tableCellHead}>Subject</th>
                <th className={tableCellHead}>Code</th>
                <th className={tableCellHead}>Course</th>
                <th className={tableCellHead}>Semester</th>
                <th className={tableCellHead}>Credits</th>
                <th className={tableCellHead}>Faculty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--cf-line)]">
              {subjects.map((s) => (
                <tr key={s._id} className={tableRowHover}>
                  <td className={`${tableCell} font-medium`}>{s.name}</td>
                  <td className={tableCell}>
                    <span className="bg-black/[.05] dark:bg-white/10 px-2 py-0.5 rounded-full text-xs">
                      {s.code}
                    </span>
                  </td>
                  <td className={`${tableCell} text-[var(--cf-ink-soft)]`}>
                    {s.course?.name || '—'}
                  </td>
                  <td className={tableCell}>{s.semester}</td>
                  <td className={tableCell}>{s.credits}</td>
                  <td className={`${tableCell} text-[var(--cf-ink-soft)]`}>
                    {s.faculty?.name || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {subjects.length === 0 && (
            <p className={emptyState}>No subjects found.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default Subjects;
