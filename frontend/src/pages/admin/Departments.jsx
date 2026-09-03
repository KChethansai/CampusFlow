import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', description: '' });

  useEffect(() => { fetchDepartments(); }, []);

  const fetchDepartments = async () => {
    try {
      const { data } = await api.get('/departments');
      setDepartments(data.data || []);
    } catch { /* handled */ }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/departments', form);
      setShowForm(false);
      setForm({ name: '', code: '', description: '' });
      fetchDepartments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create department');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
          <p className="text-sm text-gray-500">{departments.length} departments</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium">
          {showForm ? 'Cancel' : '+ Add Department'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-gray-50 rounded-lg p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input placeholder="Department Name" required value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
          <input placeholder="Code (e.g. CSE)" required value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
          <div className="flex space-x-2">
            <input placeholder="Description" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} className="flex-1 px-3 py-2 border rounded-lg text-sm" />
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Create</button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <div key={dept._id} className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                <span className="bg-primary-100 text-primary-800 px-2 py-0.5 rounded text-xs font-medium">{dept.code}</span>
              </div>
              <p className="text-sm text-gray-500">{dept.description || 'No description'}</p>
              {dept.hod && (
                <p className="text-xs text-gray-400 mt-2">HOD: {dept.hod?.name || dept.hod}</p>
              )}
            </div>
          ))}
          {departments.length === 0 && (
            <p className="col-span-full text-center text-gray-400 py-8">No departments found.</p>
          )}
        </div>
      )}
    </div>
  );
}