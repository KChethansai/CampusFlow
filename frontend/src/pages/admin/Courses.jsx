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
  pageSubheading,
  selectClass,
  tableCell,
  tableCellHead,
  tableClass,
  tableHeadClass,
  tableRowHover
} from '../../styles/common';

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
      <div className={pageHeader}>
        <div>
          <h1 className={pageHeading}>Courses</h1>
          <p className={pageSubheading}>{courses.length} courses</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className={btnClass(showForm ? 'secondary' : 'primary')}
        >
          {showForm ? 'Cancel' : '+ Add Course'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit(onCreate)}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 grid grid-cols-1 md:grid-cols-5 gap-3"
        >
          <input
            placeholder="Course Name"
            className={inputClass}
            {...register('name', { required: 'Name is required' })}
          />
          <input
            placeholder="Code"
            className={inputClass}
            {...register('code', { required: 'Code is required' })}
          />
          <select
            className={selectClass}
            {...register('department', { required: 'Select a department' })}
          >
            <option value="">Select Department</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Years"
            min={1}
            max={5}
            className={inputClass}
            {...register('durationYears', { valueAsNumber: true })}
          />
          <button type="submit" className={`${btnClass('success')} self-start`}>
            Create
          </button>
          {(errors.name || errors.code || errors.department) && (
            <p className="text-xs text-red-600 md:col-span-5">
              {errors.name?.message ||
                errors.code?.message ||
                errors.department?.message}
            </p>
          )}
        </form>
      )}

      {loading ? (
        <p className={loadingState}>Loading...</p>
      ) : (
        <div className={`${cardClass} overflow-hidden`}>
          <table className={tableClass}>
            <thead className={tableHeadClass}>
              <tr>
                <th className={tableCellHead}>Course</th>
                <th className={tableCellHead}>Code</th>
                <th className={tableCellHead}>Department</th>
                <th className={tableCellHead}>Duration</th>
                <th className={tableCellHead}>Semesters</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {courses.map((course) => (
                <tr key={course._id} className={tableRowHover}>
                  <td className={`${tableCell} font-medium`}>{course.name}</td>
                  <td className={tableCell}>
                    <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs">
                      {course.code}
                    </span>
                  </td>
                  <td className={`${tableCell} text-gray-600`}>
                    {course.department?.name || '—'}
                  </td>
                  <td className={tableCell}>{course.durationYears} yrs</td>
                  <td className={tableCell}>{course.totalSemesters}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {courses.length === 0 && (
            <p className={emptyState}>No courses found.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default Courses;
