import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../api/axios';

export default function Placement() {
  const [drives, setDrives] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('drives');
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [drivesRes, companiesRes] = await Promise.allSettled([
          api.get('/job-drives'),
          api.get('/companies')
        ]);
        if (drivesRes.status === 'fulfilled') setDrives(drivesRes.value.data.data || []);
        if (companiesRes.status === 'fulfilled') setCompanies(companiesRes.value.data.data || []);
      } catch { /* handled */ }
      setLoading(false);
    };
    fetch();
  }, []);

  const formatLPA = (val) => val != null ? `₹${val} LPA` : '—';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Placement</h1>
        <p className="text-sm text-gray-500">Manage drives + companies</p>
      </div>

      <div className="flex space-x-2 mb-6">
        <button onClick={() => setTab('drives')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'drives' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          Job Drives ({drives.length})
        </button>
        <button onClick={() => setTab('companies')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'companies' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          Companies ({companies.length})
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : tab === 'drives' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {drives.map((d) => (
            <div key={d._id} className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{d.role}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {d.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-1">{d.company?.name || '—'}</p>
              <p className="text-sm text-gray-500 mb-3">{d.location || '—'} · {d.jobType}</p>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Package: {formatLPA(d.packageLPA)}</span>
                <span>Min CGPA: {d.eligibility?.minCGPA || '—'}</span>
              </div>
              {user?.role === 'student' && d.status === 'active' && (
                <button className="mt-3 w-full py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition">
                  Apply Now
                </button>
              )}
            </div>
          ))}
          {drives.length === 0 && <p className="col-span-full text-center text-gray-400 py-8">No job drives found.</p>}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Company</th>
                <th className="px-4 py-3 text-left font-medium">Industry</th>
                <th className="px-4 py-3 text-left font-medium">Website</th>
                <th className="px-4 py-3 text-left font-medium">HR Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {companies.map((c) => (
                <tr key={c._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-gray-600">{c.industry || '—'}</td>
                  <td className="px-4 py-3 text-blue-600">{c.website || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{c.hrContact || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {companies.length === 0 && <p className="text-center text-gray-400 py-8">No companies found.</p>}
        </div>
      )}
    </div>
  );
}