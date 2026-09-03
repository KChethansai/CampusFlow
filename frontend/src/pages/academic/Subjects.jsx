import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/subjects');
        setSubjects(data.data || []);
      } catch { /* handled */ }
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Subjects</h1>
        <p className="text-sm text-gray-500">{subjects.length} subjects</p>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Subject</th>
                <th className="px-4 py-3 text-left font-medium">Code</th>
                <th className="px-4 py-3 text-left font-medium">Course</th>
                <th className="px-4 py-3 text-left font-medium">Semester</th>
                <th className="px-4 py-3 text-left font-medium">Credits</th>
                <th className="px-4 py-3 text-left font-medium">Faculty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {subjects.map((s) => (
                <tr key={s._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3"><span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{s.code}</span></td>
                  <td className="px-4 py-3 text-gray-600">{s.course?.name || '—'}</td>
                  <td className="px-4 py-3">{s.semester}</td>
                  <td className="px-4 py-3">{s.credits}</td>
                  <td className="px-4 py-3 text-gray-600">{s.faculty?.name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {subjects.length === 0 && <p className="text-center text-gray-400 py-8">No subjects found.</p>}
        </div>
      )}
    </div>
  );
}