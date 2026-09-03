import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../api/axios';

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  published: 'bg-blue-100 text-blue-800',
  open: 'bg-green-100 text-green-800',
  closed: 'bg-yellow-100 text-yellow-800',
  graded: 'bg-purple-100 text-purple-800',
  archived: 'bg-red-100 text-red-800',
};

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState({ subject: '', title: '', description: '', maxScore: 100, dueDate: '' });
  const { user } = useSelector((state) => state.auth);
  const isFaculty = user?.role === 'faculty';

  useEffect(() => {
    fetchAssignments();
    if (isFaculty) fetchSubjects();
  }, []);

  const fetchAssignments = async () => {
    try {
      const { data } = await api.get('/assignments');
      setAssignments(data.data || []);
    } catch { /* handled */ }
    setLoading(false);
  };

  const fetchSubjects = async () => {
    try {
      const { data } = await api.get('/subjects');
      setSubjects(data.data || []);
    } catch { /* handled */ }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/assignments', form);
      setShowForm(false);
      setForm({ subject: '', title: '', description: '', maxScore: 100, dueDate: '' });
      fetchAssignments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create assignment');
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
          <p className="text-sm text-gray-500">{assignments.length} assignments</p>
        </div>
        {isFaculty && (
          <button onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium">
            {showForm ? 'Cancel' : '+ Create Assignment'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-gray-50 rounded-lg p-4 mb-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required className="px-3 py-2 border rounded-lg text-sm">
            <option value="">Select Subject</option>
            {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
          <input placeholder="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
          <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
          <input type="number" placeholder="Max Score" value={form.maxScore} onChange={(e) => setForm({ ...form, maxScore: parseInt(e.target.value) })} className="px-3 py-2 border rounded-lg text-sm" />
          <input type="date" required value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
          <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Create</button>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map((a) => (
            <div key={a._id} className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{a.title}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[a.status] || 'bg-gray-100'}`}>
                  {a.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-3">{a.description || 'No description'}</p>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Max: {a.maxScore} pts</span>
                <span>Due: {formatDate(a.dueDate)}</span>
              </div>
            </div>
          ))}
          {assignments.length === 0 && <p className="col-span-full text-center text-gray-400 py-8">No assignments found.</p>}
        </div>
      )}
    </div>
  );
}