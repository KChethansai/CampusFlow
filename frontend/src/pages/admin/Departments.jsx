import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import {
  btnClass,
  cardClass,
  emptyState,
  inputClass,
  loadingState,
  pageHeader,
  pageHeading,
  pageSubheading
} from '../../styles/common';

function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({ defaultValues: { name: '', code: '', description: '' } });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const { data } = await api.get('/departments');
      setDepartments(data.data || []);
    } catch {
      toast.error('Failed to load departments');
    }
    setLoading(false);
  };

  const onCreate = async (form) => {
    try {
      await api.post('/departments', form);
      toast.success('Department created');
      setShowForm(false);
      reset();
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create department');
    }
  };

  return (
    <div>
      <div className={pageHeader}>
        <div>
          <h1 className={pageHeading}>Departments</h1>
          <p className={pageSubheading}>{departments.length} departments</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className={btnClass(showForm ? 'secondary' : 'primary')}
        >
          {showForm ? 'Cancel' : '+ Add Department'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit(onCreate)}
          className="bg-[var(--cf-surface)] rounded-2xl border border-[var(--cf-line)] shadow-sm p-5 mb-6 grid grid-cols-1 md:grid-cols-3 gap-3"
        >
          <input
            placeholder="Department Name"
            className={inputClass}
            {...register('name', { required: 'Name is required' })}
          />
          <input
            placeholder="Code (e.g. CSE)"
            className={inputClass}
            {...register('code', { required: 'Code is required' })}
          />
          <div className="flex gap-2 items-start">
            <input
              placeholder="Description"
              className={inputClass}
              {...register('description')}
            />
            <button type="submit" className={`${btnClass('success')} shrink-0`}>
              Create
            </button>
          </div>
          {(errors.name || errors.code) && (
            <p className="text-xs text-red-600 md:col-span-3">
              {errors.name?.message || errors.code?.message}
            </p>
          )}
        </form>
      )}

      {loading ? (
        <p className={loadingState}>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <div key={dept._id} className={`${cardClass} p-5`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-[var(--cf-ink)]">{dept.name}</h3>
                <span className="bg-primary-50 dark:bg-primary-500/15 text-primary-600 dark:text-primary-300 px-2 py-0.5 rounded-full text-xs font-medium">
                  {dept.code}
                </span>
              </div>
              <p className="text-sm text-[var(--cf-ink-mute)]">
                {dept.description || 'No description'}
              </p>
              {dept.hod && (
                <p className="text-xs text-[var(--cf-ink-mute)] mt-2">
                  HOD: {dept.hod?.name || dept.hod}
                </p>
              )}
            </div>
          ))}
          {departments.length === 0 && (
            <p className={`${emptyState} col-span-full`}>No departments found.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default Departments;
