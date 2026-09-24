// Departments: glass card grid + modal create form.
// Endpoints preserved: GET /departments, POST /departments.
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { EmptyState, LoadingState, PageHeader, Card } from '../../components/ui/primitives';
import { Modal } from '../../components/ui/Modal';
import { btnClass, inputClass, labelClass } from '../../system/tokens';
import { usePager, PagerControls } from '../../hooks/usePager';

function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { page, pagination, readPage, prev, next } = usePager();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({ defaultValues: { name: '', code: '', description: '' } });

  useEffect(() => {
    fetchDepartments();
  }, [page]);

  const fetchDepartments = async () => {
    try {
      const { data } = await api.get('/departments', { params: { page } });
      setDepartments(readPage(data));
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
      <PageHeader
        title="Departments"
        subtitle={`${pagination.total || departments.length} departments`}
        actions={
          <button onClick={() => setShowForm(true)} className={btnClass('primary', 'medium')}>
            + Add Department
          </button>
        }
      />

      {loading ? (
        <LoadingState label="Loading departments…" />
      ) : departments.length === 0 ? (
        <Card><EmptyState title="No departments found" hint="Add the first one to activate this view." /></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <article key={dept._id} className="rounded-3xl border border-[var(--cf-line)] bg-[var(--cf-surface)]/80 backdrop-blur-xl p-5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="font-display font-semibold text-[var(--cf-ink)]">{dept.name}</h3>
                <span className="rounded-full border border-[var(--cf-line)] bg-[var(--cf-surface-2)]/60 px-2 py-0.5 font-mono text-[11px] font-semibold text-[var(--cf-ink-soft)]">{dept.code}</span>
              </div>
              <p className="text-sm text-[var(--cf-ink-mute)]">
                {dept.description || 'No description'}
              </p>
              {dept.hod && (
                <p className="mt-2 border-t border-[var(--cf-line)] pt-2 text-xs text-[var(--cf-ink-mute)]">
                  HOD: {dept.hod?.name || dept.hod}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
      {!loading && departments.length > 0 && (
        <PagerControls pagination={pagination} onPrev={prev} onNext={next} />
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add department">
        <form onSubmit={handleSubmit(onCreate)} className="space-y-3">
          <div>
            <label className={labelClass} htmlFor="dept-name">Department name</label>
            <input id="dept-name" placeholder="Computer Science" className={`${inputClass} rounded-[14px]`} {...register('name', { required: 'Name is required' })} />
          </div>
          <div>
            <label className={labelClass} htmlFor="dept-code">Code</label>
            <input id="dept-code" placeholder="CSE" className={`${inputClass} rounded-[14px]`} {...register('code', { required: 'Code is required' })} />
          </div>
          <div>
            <label className={labelClass} htmlFor="dept-desc">Description</label>
            <input id="dept-desc" placeholder="What this department owns…" className={`${inputClass} rounded-[14px]`} {...register('description')} />
          </div>
          {(errors.name || errors.code) && (
            <p className="text-xs text-red-600 dark:text-red-400" role="alert">
              {errors.name?.message || errors.code?.message}
            </p>
          )}
          <button type="submit" className={`${btnClass('primary', 'medium')} w-full`}>Create department</button>
        </form>
      </Modal>
    </div>
  );
}

export default Departments;
