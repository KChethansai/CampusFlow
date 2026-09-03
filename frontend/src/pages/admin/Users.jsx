import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data.data || []);
    } catch { /* handled */ }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', form);
      setShowForm(false);
      setForm({ name: '', email: '', password: '', role: 'student' });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create user');
    }
  };

  const roleColors = {
    super_admin: 'bg-red-100 text-red-800',
    college_admin: 'bg-purple-100 text-purple-800',
    faculty: 'bg-blue-100 text-blue-800',
    student: 'bg-green-100 text-green-800',
    placement_officer: 'bg-yellow-100 text-yellow-800'
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500">{users.length} total users</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
        >
          {showForm ? 'Cancel' : '+ Add User'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-gray-50 rounded-lg p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
          <input placeholder="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="px-3 py-2 border rounded-lg text-sm" />
          <input placeholder="Email" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="px-3 py-2 border rounded-lg text-sm" />
          <input placeholder="Password" required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="px-3 py-2 border rounded-lg text-sm" />
          <div className="flex space-x-2">
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="flex-1 px-3 py-2 border rounded-lg text-sm">
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="college_admin">College Admin</option>
              <option value="placement_officer">Placement Officer</option>
            </select>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Create</button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-left font-medium">Role</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="px-4 py-3 text-gray-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${roleColors[user.role] || 'bg-gray-100'}`}>
                      {user.role?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <p className="text-center text-gray-400 py-8">No users found.</p>
          )}
        </div>
      )}
    </div>
  );
}