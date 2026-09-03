import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', durationYears: 4, totalSemesters: 8, department: '' });
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetchCourses();
    fetchDepartments();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data } = await api.get('/courses');
      setCourses(data.data || []);
    } catch { /* handled */ }
    setLoading(false);
  };

  const fetchDepartments = async () => {
    try {
      const { data } = await api.get('/departments');
      setDepartments(data.data || []);
    } catch { /* handled */ }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/courses', form);
      setShowForm(false);
      setForm({ name: '', code: '', durationYears: 4, totalSemesters: 8, department: '' });
      fetchCourses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create course');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
          <p className="text-sm text-gray-500">{courses.length} courses</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium">
          {showForm ? 'Cancel' : '+ Add Course'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-gray-50 rounded-lg p-4 mb-6 grid grid-cols-1 md:grid-cols-5 gap-3">
          <input placeholder="Course Name" required value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
          <input placeholder="Code" required value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
          <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
            required className="px-3 py-2 border rounded-lg text-sm">
            <option value="">Select Department</option>
            {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
          <input type="number" placeholder="Years" required value={form.durationYears} min={1} max={5}
            onChange={(e) => setForm({ ...form, durationYears: parseInt(e.target.value) })} className="px-3 py-2 border rounded-lg text-sm" />
          <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Create</button>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Course</th>
                <th className="px-4 py-3 text-left font-medium">Code</th>
                <th className="px-4 py-3 text-left font-medium">Department</th>
                <th className="px-4 py-3 text-left font-medium">Duration</th>
                <th className="px-4 py-3 text-left font-medium">Semesters</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {courses.map((course) => (
                <tr key={course._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{course.name}</td>
                  <td className="px-4 py-3"><span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{course.code}</span></td>
                  <td className="px-4 py-3 text-gray-600">{course.department?.name || '—'}</td>
                  <td className="px-4 py-3">{course.durationYears} yrs</td>
                  <td className="px-4 py-3">{course.totalSemesters}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {courses.length === 0 && <p className="text-center text-gray-400 py-8">No courses found.</p>}
        </div>
      )}
    </div>
  );
}