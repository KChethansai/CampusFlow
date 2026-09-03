import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../api/axios';

export default function Attendance() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/attendance');
        setSessions(data.data || []);
      } catch { /* handled */ }
      setLoading(false);
    };
    fetch();
  }, []);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const getStats = (records) => {
    if (!records?.length) return { present: 0, absent: 0, late: 0, total: 0 };
    const present = records.filter((r) => r.status === 'present').length;
    const absent = records.filter((r) => r.status === 'absent').length;
    const late = records.filter((r) => r.status === 'late').length;
    return { present, absent, late, total: records.length };
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        <p className="text-sm text-gray-500">{sessions.length} sessions recorded</p>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Subject</th>
                <th className="px-4 py-3 text-left font-medium">Period</th>
                <th className="px-4 py-3 text-left font-medium">Present</th>
                <th className="px-4 py-3 text-left font-medium">Absent</th>
                <th className="px-4 py-3 text-left font-medium">Late</th>
                <th className="px-4 py-3 text-left font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions.map((s) => {
                const stats = getStats(s.records);
                return (
                  <tr key={s._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{formatDate(s.date)}</td>
                    <td className="px-4 py-3 font-medium">{s.subject?.name || s.subject || '—'}</td>
                    <td className="px-4 py-3">Period {s.period}</td>
                    <td className="px-4 py-3"><span className="text-green-600 font-medium">{stats.present}</span></td>
                    <td className="px-4 py-3"><span className="text-red-600 font-medium">{stats.absent}</span></td>
                    <td className="px-4 py-3"><span className="text-yellow-600 font-medium">{stats.late}</span></td>
                    <td className="px-4 py-3">{stats.total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {sessions.length === 0 && <p className="text-center text-gray-400 py-8">No attendance sessions found.</p>}
        </div>
      )}
    </div>
  );
}