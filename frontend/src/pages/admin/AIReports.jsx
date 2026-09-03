// AIReports: admin view for AI-generated performance summaries.
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import {
  badge,
  btnClass,
  cardClass,
  emptyState,
  inputClass,
  labelClass,
  loadingState,
  pageHeader,
  pageHeading,
  pageSubheading,
  selectClass,
  tableCell,
  tableCellHead,
  tableClass,
  tableHeadClass,
  tableRowHover
} from '../../styles/common';

function AIReports() {
  const [reports, setReports] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { register, handleSubmit } = useForm();

  useEffect(() => {
    fetchReports();
    fetchStudents();
  }, []);

  const fetchReports = async () => {
    try {
      const { data } = await api.get('/ai-reports');
      setReports(data.data || []);
    } catch {
      /* handled */
    }
    setLoading(false);
  };

  const fetchStudents = async () => {
    try {
      const { data } = await api.get('/users');
      setStudents((data.data || []).filter((u) => u.role === 'student'));
    } catch {
      /* handled */
    }
  };

  const onGenerate = async ({ studentId }) => {
    if (!studentId) {
      toast.error('Select a student first');
      return;
    }
    setGenerating(true);
    try {
      await api.post('/ai-reports/generate', { studentId });
      toast.success('Report generated');
      fetchReports();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : '—';

  return (
    <div>
      <div className={pageHeader}>
        <div>
          <h1 className={pageHeading}>AI Reports</h1>
          <p className={pageSubheading}>
            Performance summaries generated for students
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onGenerate)}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 max-w-xl"
      >
        <label htmlFor="studentId" className={labelClass}>
          Generate report for student
        </label>
        <div className="flex gap-2">
          <select id="studentId" className={selectClass} {...register('studentId')}>
            <option value="">Select student</option>
            {students.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} {s.profile?.rollNumber ? `(${s.profile.rollNumber})` : ''}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={generating}
            className={`${btnClass('primary')} shrink-0`}
          >
            {generating ? 'Generating...' : 'Generate'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Requires an OPENAI_API_KEY on the server; otherwise a placeholder
          summary is stored so the flow stays visible.
        </p>
      </form>

      {loading ? (
        <p className={loadingState}>Loading...</p>
      ) : (
        <div className={`${cardClass} overflow-hidden`}>
          <table className={tableClass}>
            <thead className={tableHeadClass}>
              <tr>
                <th className={tableCellHead}>Student</th>
                <th className={tableCellHead}>Generated</th>
                <th className={tableCellHead}>Provider</th>
                <th className={tableCellHead}>Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reports.map((r) => (
                <tr key={r._id} className={tableRowHover}>
                  <td className={`${tableCell} font-medium`}>
                    {r.student?.name || '—'}
                  </td>
                  <td className={`${tableCell} text-gray-600`}>
                    {formatDate(r.createdAt)}
                  </td>
                  <td className={tableCell}>
                    <span
                      className={badge(
                        r.provider && r.provider !== 'none'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-600'
                      )}
                    >
                      {r.provider || 'none'}
                    </span>
                  </td>
                  <td className={`${tableCell} max-w-md`}>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {r.output?.summary || '—'}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {reports.length === 0 && (
            <p className={emptyState}>No reports generated yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default AIReports;
