import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../api/axios';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_review: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'leave', title: '', description: '' });
  const { user } = useSelector((state) => state.auth);
  const isStudent = user?.role === 'student';

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    try {
      const { data } = await api.get('/requests');
      setRequests(data.data || []);
    } catch { /* handled */ }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/requests', form);
      setShowForm(false);
      setForm({ type: 'leave', title: '', description: '' });
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create request');
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.patch(`/requests/${id}/status`, { status });
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Requests</h1>
          <p className="text-sm text-gray-500">{requests.length} requests</p>
        </div>
        {isStudent && (
          <button onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium">
            {showForm ? 'Cancel' : '+ New Request'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-gray-50 rounded-lg p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="px-3 py-2 border rounded-lg text-sm">
            <option value="leave">Leave</option>
            <option value="bonafide">Bonafide</option>
            <option value="revaluation">Revaluation</option>
            <option value="other">Other</option>
          </select>
          <input placeholder="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
          <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
          <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Submit</button>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r._id} className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{r.title}</h3>
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs capitalize">{r.type}</span>
                  </div>
                  <p className="text-sm text-gray-500">{r.description || 'No description'}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    By: {r.student?.name || '—'} · {formatDate(r.createdAt)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[r.status] || 'bg-gray-100'}`}>
                    {r.status?.replace('_', ' ')}
                  </span>
                  {!isStudent && r.status !== 'approved' && r.status !== 'rejected' && (
                    <div className="flex space-x-1">
                      <button onClick={() => handleStatusUpdate(r._id, r.status === 'pending' ? 'in_review' : 'approved')}
                        className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200">
                        {r.status === 'pending' ? 'Review' : 'Approve'}
                      </button>
                      <button onClick={() => handleStatusUpdate(r._id, 'rejected')}
                        className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200">
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {requests.length === 0 && <p className="text-center text-gray-400 py-8">No requests found.</p>}
        </div>
      )}
    </div>
  );
}