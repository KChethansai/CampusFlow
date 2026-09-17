// Courses: brutal table + modal create form.
// Endpoints preserved: GET /courses, GET /departments, POST /courses.
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { EmptyState, LoadingState, PageHeader } from '../../components/ui/primitives';
import { Modal } from '../../components/ui/Modal';
import { btnClass, inputClass, labelClass, selectClass } from '../../system/tokens';

function Courses() {
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: { name: '', code: '', durationYears: 4, department: '' }
  });

  useEffect(() => {
    fetchCourses();
    fetchDepartments();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data } = await api.get('/courses');
      setCourses(data.data || []);
    } catch {
      toast.error('Failed to load courses');
    }
    setLoading(false);
  };

  const fetchDepartments = async () => {
    try {
      const { data } = await api.get('/departments');
      setDepartments(data.data || []);
    } catch {
      /* handled */
    }
  };

  const onCreate = async (form) => {
    try {
      await api.post('/courses', form);
      toast.success('Course created');
      setShowForm(false);
      reset();
      fetchCourses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create course');
    }
  };

  return (
    <div>
      <PageHeader
        title="Courses"
        subtitle={`${courses.length} courses`}
        actions={
          <button onClick={() => setShowForm(true)} className={btnClass('primary', 'medium')}>
            + Add Course
          </button>
        }
      />

      {loading ? (
        <LoadingState label="Loading courses…" />
      ) : courses.length === 0 ? (
        <div className="card-brutal p-5"><EmptyState title="No courses found" hint="Add the first course to build the catalog." /></div>
      ) : (
        <div className="card-brutal overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gold border-b-2 border-[var(--cf-ink)]">
                <tr>
                  <th className="px-4 py-3 text-left font-mono text-[11px] font-bold uppercase tracking-widest">Course</th>
                  <th className="px-4 py-3 text-left font-mono text-[11px] font-bold uppercase tracking-widest">Code</th>
                  <th className="px-4 py-3 text-left font-mono text-[11px] font-bold uppercase tracking-widest">Department</th>
                  <th className="px-4 py-3 text-left font-mono text-[11px] font-bold uppercase tracking-widest">Duration</th>
                  <th className="px-4 py-3 text-left font-mono text-[11px] font-bold uppercase tracking-widest">Semesters</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--cf-line)]">
                {courses.map((course) => (
                  <tr key={course._id} className="hover:bg-black/[.02] dark:hover:bg-white/[.04] transition-colors">
                    <td className="px-4 py-3 font-medium">{course.name}</td>
                    <td className="px-4 py-3">
                      <span className="brutal-tag bg-[var(--cf-surface-2)] px-2 py-0.5 text-[11px] font-bold">
                        {course.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--cf-ink-soft)]">
                      {course.department?.name || '—'}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{course.durationYears} yrs</td>
                    <td className="px-4 py-3 tabular-nums">{course.totalSemesters}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add course">
        <form onSubmit={handleSubmit(onCreate)} className="space-y-3">
          <div>
            <label className={labelClass} htmlFor="course-name">Course name</label>
            <input id="course-name" placeholder="B.Tech Computer Science" className={inputClass} {...register('name', { required: 'Name is required' })} />
          </div>
          <div>
            <label className={labelClass} htmlFor="course-code">Code</label>
            <input id="course-code" placeholder="BTCS" className={inputClass} {...register('code', { required: 'Code is required' })} />
          </div>
          <div>
            <label className={labelClass} htmlFor="course-dept">Department</label>
            <select id="course-dept" className={selectClass} {...register('department', { required: 'Select a department' })}>
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="course-years">Duration (years)</label>
            <input id="course-years" type="number" min={1} max={5} className={inputClass} {...register('durationYears', { valueAsNumber: true })} />
          </div>
          {(errors.name || errors.code || errors.department) && (
            <p className="text-xs text-red-600" role="alert">
              {errors.name?.message || errors.code?.message || errors.department?.message}
            </p>
          )}
          <button type="submit" className={`${btnClass('success', 'medium')} w-full`}>Create course</button>
        </form>
      </Modal>
    </div>
  );
}

export default Courses;
