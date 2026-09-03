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

function Assignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const isFaculty = user?.role === 'faculty';
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { subject: '', title: '', description: '', maxScore: 100, dueDate: '' }
  });

  useEffect(() => {
    fetchAssignments();
    if (isFaculty) fetchSubjects();
  }, [isFaculty]);

  const fetchAssignments = async () => {
    try {
      const { data } = await api.get('/assignments');
      setAssignments(data.data || []);
    } catch {
      toast.error('Failed to load assignments');
    }
    setLoading(false);
  };

  const fetchSubjects = async () => {
    try {
      const { data } = await api.get('/subjects');
      setSubjects(data.data || []);
    } catch {
      /* handled */
    }
  };

  const onCreate = async (form) => {
    try {
      await api.post('/assignments', form);
      toast.success('Assignment created');
      setShowForm(false);
      reset();
      fetchAssignments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create assignment');
    }
  };

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
      : '—';

  return (
    <div>
      <div className={pageHeader}>
        <div>
          <h1 className={pageHeading}>Assignments</h1>
          <p className={pageSubheading}>{assignments.length} assignments</p>
        </div>
        {isFaculty && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className={btnClass(showForm ? 'secondary' : 'primary')}
          >
            {showForm ? 'Cancel' : '+ Create Assignment'}
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit(onCreate)}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          <select className={selectClass} {...register('subject', { required: true })}>
            <option value="">Select Subject</option>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
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
          <input
            type="number"
            placeholder="Max Score"
            className={inputClass}
            {...register('maxScore', { valueAsNumber: true })}
          />
          <input
            type="date"
            className={inputClass}
            {...register('dueDate', { required: 'Due date is required' })}
          />
          <button type="submit" className={`${btnClass('success')} self-end justify-self-start`}>
            Create
          </button>
        </form>
      )}

      {loading ? (
        <p className={loadingState}>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map((a) => (
            <div key={a._id} className={`${cardClass} p-5`}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{a.title}</h3>
                <span className={badge(statusColors[a.status] || 'bg-gray-100 text-gray-700')}>
                  {a.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-3">
                {a.description || 'No description'}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Max: {a.maxScore} pts</span>
                <span>Due: {formatDate(a.dueDate)}</span>
              </div>
            </div>
          ))}
          {assignments.length === 0 && (
            <p className={`${emptyState} col-span-full`}>No assignments found.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default Assignments;
