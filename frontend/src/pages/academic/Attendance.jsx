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

function Attendance() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const { data } = await api.get('/attendance');
        setSessions(data.data || []);
      } catch {
        /* handled */
      }
      setLoading(false);
    };
    fetchSessions();
  }, []);

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
      : '—';

  const getStats = (records) => {
    if (!records?.length) return { present: 0, absent: 0, late: 0, total: 0 };
    return {
      present: records.filter((r) => r.status === 'present').length,
      absent: records.filter((r) => r.status === 'absent').length,
      late: records.filter((r) => r.status === 'late').length,
      total: records.length
    };
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className={pageHeading}>Attendance</h1>
        <p className={pageSubheading}>{sessions.length} sessions recorded</p>
      </div>

      {loading ? (
        <p className={loadingState}>Loading...</p>
      ) : (
        <div className={`${cardClass} overflow-hidden`}>
          <table className={tableClass}>
            <thead className={tableHeadClass}>
              <tr>
                <th className={tableCellHead}>Date</th>
                <th className={tableCellHead}>Subject</th>
                <th className={tableCellHead}>Period</th>
                <th className={tableCellHead}>Present</th>
                <th className={tableCellHead}>Absent</th>
                <th className={tableCellHead}>Late</th>
                <th className={tableCellHead}>Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions.map((s) => {
                const stats = getStats(s.records);
                return (
                  <tr key={s._id} className={tableRowHover}>
                    <td className={tableCell}>{formatDate(s.date)}</td>
                    <td className={`${tableCell} font-medium`}>
                      {s.subject?.name || s.subject || '—'}
                    </td>
                    <td className={tableCell}>Period {s.period}</td>
                    <td className={tableCell}>
                      <span className="text-green-600 font-medium">
                        {stats.present}
                      </span>
                    </td>
                    <td className={tableCell}>
                      <span className="text-red-600 font-medium">
                        {stats.absent}
                      </span>
                    </td>
                    <td className={tableCell}>
                      <span className="text-amber-600 font-medium">
                        {stats.late}
                      </span>
                    </td>
                    <td className={tableCell}>{stats.total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {sessions.length === 0 && (
            <p className={emptyState}>No attendance sessions found.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default Attendance;
