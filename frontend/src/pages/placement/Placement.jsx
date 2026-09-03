import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../store/useAuth';
import {
  badge,
  btnClass,
  cardClass,
  emptyState,
  loadingState,
  pageHeading,
  pageSubheading,
  statusColors,
  tableCell,
  tableCellHead,
  tableClass,
  tableHeadClass,
  tableRowHover
} from '../../styles/common';

function Placement() {
  const { user } = useAuth();
  const role = user?.role;
  const isStudent = role === 'student';
  const isStaff = ['placement_officer', 'college_admin', 'super_admin'].includes(role);
  const [tab, setTab] = useState(isStudent ? 'drives' : 'applications');
  const [drives, setDrives] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(null);

  const fetchAll = useCallback(async () => {
    const endpoints = ['/job-drives', '/companies', '/job-applications'];
    const [drivesRes, companiesRes, appsRes] = await Promise.allSettled(
      endpoints.map((ep) => api.get(ep))
    );
    if (drivesRes.status === 'fulfilled') setDrives(drivesRes.value.data.data || []);
    if (companiesRes.status === 'fulfilled') setCompanies(companiesRes.value.data.data || []);
    if (appsRes.status === 'fulfilled') setApplications(appsRes.value.data.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const applyToDrive = async (driveId) => {
    setApplying(driveId);
    try {
      await api.post('/job-applications', { drive: driveId });
      toast.success('Application submitted');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply');
    } finally {
      setApplying(null);
    }
  };

  const alreadyApplied = (driveId) =>
    applications.some((a) => String(a.drive?._id || a.drive) === String(driveId));

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const tabs = [
    { id: 'drives', label: `Job Drives (${drives.length})` },
    ...(isStudent ? [{ id: 'applications', label: `My Applications (${applications.length})` }] : []),
    { id: 'companies', label: `Companies (${companies.length})` }
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className={pageHeading}>Placement</h1>
        <p className={pageSubheading}>Manage drives, companies and applications</p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition shrink-0 ${
              tab === t.id
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className={loadingState}>Loading...</p>
      ) : tab === 'drives' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {drives.map((d) => (
            <div key={d._id} className={`${cardClass} p-5 flex flex-col`}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{d.role}</h3>
                <span className={badge(statusColors[d.status] || 'bg-gray-100 text-gray-700')}>
                  {d.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-1">{d.company?.name || '—'}</p>
              <p className="text-sm text-gray-500 mb-3">
                {d.location || '—'} · {d.jobType}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                <span>
                  Package: {d.packageLPA != null ? `₹${d.packageLPA} LPA` : '—'}
                </span>
                <span>Min CGPA: {d.eligibility?.minCGPA || '—'}</span>
                <span>Due: {formatDate(d.applicationDeadline)}</span>
              </div>
              {isStudent &&
                (alreadyApplied(d._id) ? (
                  <span className="mt-auto w-full text-center px-3 py-2 rounded-full text-sm font-medium bg-green-50 text-green-700">
                    ✓ Applied
                  </span>
                ) : (
                  <button
                    onClick={() => applyToDrive(d._id)}
                    disabled={applying === d._id || d.status !== 'active'}
                    className={`${btnClass('primary')} mt-auto disabled:opacity-50`}
                  >
                    {applying === d._id ? 'Applying...' : 'Apply Now'}
                  </button>
                ))}
            </div>
          ))}
          {drives.length === 0 && (
            <p className={`${emptyState} col-span-full`}>No job drives found.</p>
          )}
        </div>
      ) : tab === 'applications' ? (
        <div className={`${cardClass} overflow-hidden`}>
          <table className={tableClass}>
            <thead className={tableHeadClass}>
              <tr>
                <th className={tableCellHead}>Role / Company</th>
                <th className={tableCellHead}>Applied On</th>
                <th className={tableCellHead}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {applications.map((a) => (
                <tr key={a._id} className={tableRowHover}>
                  <td className={`${tableCell} font-medium`}>
                    {a.drive?.role || '—'}
                    <span className="block text-xs text-gray-400 font-normal">
                      {a.drive?.company?.name || ''}
                    </span>
                  </td>
                  <td className={tableCell}>{formatDate(a.createdAt)}</td>
                  <td className={tableCell}>
                    <span className={badge(statusColors[a.stage] || 'bg-gray-100 text-gray-700')}>
                      {String(a.stage || 'applied').replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {applications.length === 0 && (
            <p className={emptyState}>No applications yet.</p>
          )}
        </div>
      ) : (
        <div className={`${cardClass} overflow-hidden`}>
          <table className={tableClass}>
            <thead className={tableHeadClass}>
              <tr>
                <th className={tableCellHead}>Company</th>
                <th className={tableCellHead}>Industry</th>
                <th className={tableCellHead}>Website</th>
                <th className={tableCellHead}>HR Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {companies.map((c) => (
                <tr key={c._id} className={tableRowHover}>
                  <td className={`${tableCell} font-medium`}>{c.name}</td>
                  <td className={`${tableCell} text-gray-600`}>{c.industry || '—'}</td>
                  <td className={`${tableCell} text-primary-600`}>{c.website || '—'}</td>
                  <td className={`${tableCell} text-gray-600`}>{c.hrContact || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {companies.length === 0 && (
            <p className={emptyState}>No companies found.</p>
          )}
        </div>
      )}
      {isStaff && (
        <p className="text-xs text-gray-400 mt-4">
          Company and drive management for placement staff is available in the
          admin workspace.
        </p>
      )}
    </div>
  );
}

export default Placement;
