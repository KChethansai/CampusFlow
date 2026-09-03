import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../store/useAuth';
import {
  badge,
  btnClass,
  cardClass,
  emptyState,
  inputClass,
  labelClass,
  loadingState,
  pageHeading,
  pageSubheading,
  selectClass,
  statusColors,
  tableCell,
  tableCellHead,
  tableClass,
  tableHeadClass,
  tableRowHover
} from '../../styles/common';

const DRIVE_STATUSES = ['active', 'closed', 'archived'];
const JOB_TYPES = ['full-time', 'part-time', 'internship', 'contract'];
const APPLICATION_STAGES = [
  'applied',
  'shortlisted',
  'assessment',
  'interview_1',
  'interview_2',
  'hr_round',
  'offer',
  'placed',
  'rejected'
];

function Placement() {
  const { user } = useAuth();
  const role = user?.role;
  const isStudent = role === 'student';
  const isStaff = ['placement_officer', 'college_admin', 'super_admin'].includes(role);

  const [tab, setTab] = useState('drives');
  const [drives, setDrives] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  // staff create-forms
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [showDriveForm, setShowDriveForm] = useState(false);
  const companyForm = useForm({ defaultValues: { name: '', website: '', industry: '', hrContact: '' } });
  const driveForm = useForm({
    defaultValues: {
      company: '',
      role: '',
      jobType: 'full-time',
      packageLPA: '',
      location: '',
      minCGPA: '',
      maxBacklogs: '',
      graduationYear: '',
      applicationDeadline: '',
      status: 'active'
    }
  });

  const fetchAll = useCallback(async () => {
    const endpoints = ['/job-drives', '/companies', '/job-applications'];
    const [d, c, a] = await Promise.allSettled(endpoints.map((ep) => api.get(ep)));
    if (d.status === 'fulfilled') setDrives(d.value.data.data || []);
    if (c.status === 'fulfilled') setCompanies(c.value.data.data || []);
    if (a.status === 'fulfilled') setApplications(a.value.data.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // --- student actions ---
  const applyToDrive = async (driveId) => {
    setBusy(`apply-${driveId}`);
    try {
      await api.post(`/job-applications/drives/${driveId}/apply`);
      toast.success('Application submitted');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply');
    } finally {
      setBusy(null);
    }
  };

  // --- staff actions ---
  const onCreateCompany = async (form) => {
    try {
      await api.post('/companies', form);
      toast.success('Company added');
      setShowCompanyForm(false);
      companyForm.reset();
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add company');
    }
  };

  const onDeleteCompany = async (companyId) => {
    setBusy(`delcompany-${companyId}`);
    try {
      await api.delete(`/companies/${companyId}`);
      toast.success('Company deleted');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete company');
    } finally {
      setBusy(null);
    }
  };

  const onCreateDrive = async (form) => {
    try {
      const payload = {
        company: form.company,
        role: form.role,
        jobType: form.jobType,
        packageLPA: form.packageLPA ? Number(form.packageLPA) : undefined,
        location: form.location,
        applicationDeadline: form.applicationDeadline || undefined,
        status: form.status,
        eligibility: {
          minCGPA: form.minCGPA ? Number(form.minCGPA) : undefined,
          maxBacklogs: form.maxBacklogs ? Number(form.maxBacklogs) : undefined,
          graduationYear: form.graduationYear ? Number(form.graduationYear) : undefined
        }
      };
      await api.post('/job-drives', payload);
      toast.success('Job drive created');
      setShowDriveForm(false);
      driveForm.reset();
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create drive');
    }
  };

  const onDeleteDrive = async (driveId) => {
    setBusy(`deldrive-${driveId}`);
    try {
      await api.delete(`/job-drives/${driveId}`);
      toast.success('Job drive deleted');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete drive');
    } finally {
      setBusy(null);
    }
  };

  const updateStage = async (applicationId, driveId, stage) => {
    setBusy(`stage-${applicationId}`);
    try {
      await api.patch(`/job-applications/drives/${driveId}/applications/${applicationId}`, {
        stage
      });
      toast.success(`Stage set to ${stage.replace('_', ' ')}`);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update stage');
    } finally {
      setBusy(null);
    }
  };

  const alreadyApplied = (driveId) =>
    applications.some((a) => String(a.drive?._id || a.drive) === String(driveId));

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
      : '—';

  const studentTabs = [
    { id: 'drives', label: `Job Drives (${drives.length})` },
    { id: 'applications', label: `My Applications (${applications.length})` },
    { id: 'companies', label: `Companies (${companies.length})` }
  ];
  const staffTabs = [
    { id: 'drives', label: `Job Drives (${drives.length})` },
    { id: 'companies', label: `Companies (${companies.length})` },
    { id: 'applications', label: `Applications (${applications.length})` }
  ];
  const tabs = isStudent ? studentTabs : staffTabs;

  return (
    <div>
      <div className="mb-6">
        <h1 className={pageHeading}>Placement</h1>
        <p className={pageSubheading}>Job drives, companies and applications</p>
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
        <>
          {isStaff && (
            <div className="mb-5">
              <button
                onClick={() => setShowDriveForm((v) => !v)}
                className={btnClass(showDriveForm ? 'secondary' : 'primary')}
              >
                {showDriveForm ? 'Cancel' : '+ Add Job Drive'}
              </button>
              {showDriveForm && (
                <form
                  onSubmit={driveForm.handleSubmit(onCreateDrive)}
                  className="mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 grid grid-cols-1 md:grid-cols-3 gap-3"
                >
                  <div>
                    <label className={labelClass}>Company</label>
                    <select
                      className={selectClass}
                      {...driveForm.register('company', { required: true })}
                    >
                      <option value="">Select company</option>
                      {companies.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Role</label>
                    <input
                      className={inputClass}
                      {...driveForm.register('role', { required: true })}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Job Type</label>
                    <select className={selectClass} {...driveForm.register('jobType')}>
                      {JOB_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Package (LPA)</label>
                    <input
                      type="number"
                      step="0.1"
                      className={inputClass}
                      {...driveForm.register('packageLPA')}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Location</label>
                    <input className={inputClass} {...driveForm.register('location')} />
                  </div>
                  <div>
                    <label className={labelClass}>Min CGPA</label>
                    <input
                      type="number"
                      step="0.1"
                      className={inputClass}
                      {...driveForm.register('minCGPA')}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Max Backlogs</label>
                    <input
                      type="number"
                      className={inputClass}
                      {...driveForm.register('maxBacklogs')}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Graduation Year</label>
                    <input
                      type="number"
                      className={inputClass}
                      {...driveForm.register('graduationYear')}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Application Deadline</label>
                    <input
                      type="date"
                      className={inputClass}
                      {...driveForm.register('applicationDeadline')}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Status</label>
                    <select className={selectClass} {...driveForm.register('status')}>
                      {DRIVE_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button type="submit" className={`${btnClass('success')} w-full`}>
                      Create Drive
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

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
                <div className="text-xs text-gray-400 mb-4 space-y-1">
                  <p>
                    Package: {d.packageLPA != null ? `₹${d.packageLPA} LPA` : '—'} · Min
                    CGPA: {d.eligibility?.minCGPA || '—'} · Max backlogs:{' '}
                    {d.eligibility?.maxBacklogs ?? '—'} · Batch:{' '}
                    {d.eligibility?.graduationYear || '—'}
                  </p>
                  <p>Deadline: {formatDate(d.applicationDeadline)}</p>
                </div>
                <div className="mt-auto flex gap-2">
                  {isStudent ? (
                    alreadyApplied(d._id) ? (
                      <span className="flex-1 text-center px-3 py-2 rounded-full text-sm font-medium bg-green-50 text-green-700">
                        ✓ Applied
                      </span>
                    ) : (
                      <button
                        onClick={() => applyToDrive(d._id)}
                        disabled={busy === `apply-${d._id}` || d.status !== 'active'}
                        className={`${btnClass('primary')} flex-1 disabled:opacity-50`}
                      >
                        {busy === `apply-${d._id}` ? 'Applying...' : 'Apply Now'}
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => onDeleteDrive(d._id)}
                      disabled={busy === `deldrive-${d._id}`}
                      className={`${btnClass('danger', 'small')} ml-auto`}
                    >
                      {busy === `deldrive-${d._id}` ? 'Deleting...' : 'Delete'}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {drives.length === 0 && (
              <p className={`${emptyState} col-span-full`}>No job drives found.</p>
            )}
          </div>
        </>
      ) : tab === 'companies' ? (
        <>
          {isStaff && (
            <div className="mb-5">
              <button
                onClick={() => setShowCompanyForm((v) => !v)}
                className={btnClass(showCompanyForm ? 'secondary' : 'primary')}
              >
                {showCompanyForm ? 'Cancel' : '+ Add Company'}
              </button>
              {showCompanyForm && (
                <form
                  onSubmit={companyForm.handleSubmit(onCreateCompany)}
                  className="mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 grid grid-cols-1 md:grid-cols-4 gap-3"
                >
                  <input
                    placeholder="Company Name"
                    className={inputClass}
                    {...companyForm.register('name', { required: true })}
                  />
                  <input
                    placeholder="Website"
                    className={inputClass}
                    {...companyForm.register('website')}
                  />
                  <input
                    placeholder="Industry"
                    className={inputClass}
                    {...companyForm.register('industry')}
                  />
                  <input
                    placeholder="HR Email"
                    className={inputClass}
                    {...companyForm.register('hrContact')}
                  />
                  <button type="submit" className={`${btnClass('success')} justify-self-start`}>
                    Add Company
                  </button>
                </form>
              )}
            </div>
          )}

          <div className={`${cardClass} overflow-hidden`}>
            <table className={tableClass}>
              <thead className={tableHeadClass}>
                <tr>
                  <th className={tableCellHead}>Company</th>
                  <th className={tableCellHead}>Industry</th>
                  <th className={tableCellHead}>Website</th>
                  <th className={tableCellHead}>HR Contact</th>
                  {isStaff && <th className={tableCellHead} />}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {companies.map((c) => (
                  <tr key={c._id} className={tableRowHover}>
                    <td className={`${tableCell} font-medium`}>{c.name}</td>
                    <td className={`${tableCell} text-gray-600`}>{c.industry || '—'}</td>
                    <td className={`${tableCell} text-primary-600`}>
                      {c.website || '—'}
                    </td>
                    <td className={`${tableCell} text-gray-600`}>{c.hrContact || '—'}</td>
                    {isStaff && (
                      <td className={`${tableCell} text-right`}>
                        <button
                          onClick={() => onDeleteCompany(c._id)}
                          disabled={busy === `delcompany-${c._id}`}
                          className={btnClass('danger', 'small')}
                        >
                          {busy === `delcompany-${c._id}` ? '...' : 'Delete'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {companies.length === 0 && (
              <p className={emptyState}>No companies found.</p>
            )}
          </div>
        </>
      ) : (
        <div className={`${cardClass} overflow-hidden`}>
          <table className={tableClass}>
            <thead className={tableHeadClass}>
              <tr>
                {isStaff && <th className={tableCellHead}>Student</th>}
                <th className={tableCellHead}>Role / Company</th>
                <th className={tableCellHead}>Applied On</th>
                <th className={tableCellHead}>Stage</th>
                {isStaff && <th className={tableCellHead}>Update Stage</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {applications.map((a) => {
                const driveId = a.drive?._id || a.drive;
                return (
                  <tr key={a._id} className={tableRowHover}>
                    {isStaff && (
                      <td className={`${tableCell} font-medium`}>
                        {a.student?.name || '—'}
                        <span className="block text-xs text-gray-400 font-normal">
                          {a.student?.profile?.rollNumber || ''}
                        </span>
                      </td>
                    )}
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
                    {isStaff && (
                      <td className={`${tableCell} text-right`}>
                        <select
                          value={a.stage || 'applied'}
                          disabled={!driveId || busy === `stage-${a._id}`}
                          onChange={(e) => updateStage(a._id, driveId, e.target.value)}
                          className="px-2.5 py-1.5 border border-gray-200 rounded-xl text-xs"
                        >
                          {APPLICATION_STAGES.map((s) => (
                            <option key={s} value={s}>
                              {s.replace('_', ' ')}
                            </option>
                          ))}
                        </select>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {applications.length === 0 && (
            <p className={emptyState}>
              {isStudent ? 'You have not applied to any drives yet.' : 'No applications yet.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default Placement;
