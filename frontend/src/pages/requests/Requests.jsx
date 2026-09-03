import { useEffect, useState } from 'react';
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
  loadingState,
  pageHeader,
  pageHeading,
  pageSubheading,
  selectClass,
  statusColors
} from '../../styles/common';

const REQUEST_TYPES = ['leave', 'bonafide', 'revaluation', 'other'];

function Requests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const isStudent = user?.role === 'student';
  const canReview = !isStudent;
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { type: 'leave', title: '', description: '' }
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data } = await api.get('/requests');
      setRequests(data.data || []);
    } catch {
      toast.error('Failed to load requests');
    }
    setLoading(false);
  };

  const onCreate = async (form) => {
    try {
      await api.post('/requests', form);
      toast.success('Request submitted');
      setShowForm(false);
      reset();
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create request');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/requests/${id}/status`, { status });
      toast.success(`Request ${status.replace('_', ' ')}`);
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      : '';

  return (
    <div>
      <div className={pageHeader}>
        <div>
          <h1 className={pageHeading}>Requests</h1>
          <p className={pageSubheading}>{requests.length} requests</p>
        </div>
        {isStudent && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className={btnClass(showForm ? 'secondary' : 'primary')}
          >
            {showForm ? 'Cancel' : '+ New Request'}
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit(onCreate)}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3"
        >
          <select className={selectClass} {...register('type')}>
            {REQUEST_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
          <input
            placeholder="Title"
            className={inputClass}
            {...register('title', { required: 'Title is required' })}
          />
          <input
            placeholder="Description"
            className={inputClass}
            {...register('description')}
          />
          <button type="submit" className={`${btnClass('success')} self-start`}>
            Submit
          </button>
        </form>
      )}

      {loading ? (
        <p className={loadingState}>Loading...</p>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r._id} className={`${cardClass} p-5`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{r.title}</h3>
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs capitalize">
                      {r.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {r.description || 'No description'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    By: {r.student?.name || '—'} · {formatDate(r.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={badge(statusColors[r.status] || 'bg-gray-100 text-gray-700')}>
                    {r.status?.replace('_', ' ')}
                  </span>
                  {canReview && r.status !== 'approved' && r.status !== 'rejected' && (
                    <div className="flex gap-1">
                      <button
                        onClick={() =>
                          updateStatus(
                            r._id,
                            r.status === 'pending' ? 'in_review' : 'approved'
                          )
                        }
                        className={`${btnClass('success', 'small')} !rounded-full`}
                      >
                        {r.status === 'pending' ? 'Review' : 'Approve'}
                      </button>
                      <button
                        onClick={() => updateStatus(r._id, 'rejected')}
                        className={`${btnClass('danger', 'small')} !rounded-full`}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {requests.length === 0 && (
            <p className={emptyState}>No requests found.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default Requests;
