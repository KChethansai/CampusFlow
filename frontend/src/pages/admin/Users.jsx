import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../api/axios';
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
  roleColors,
  selectClass,
  statusColors,
  tableCell,
  tableCellHead,
  tableClass,
  tableHeadClass,
  tableRowHover
} from '../../styles/common';

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: { name: '', email: '', password: '', role: 'student' }
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data.data || []);
    } catch {
      toast.error('Failed to load users');
    }
    setLoading(false);
  };

  const onCreate = async (form) => {
    try {
      await api.post('/users', form);
      toast.success('User created');
      setShowForm(false);
      reset();
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    }
  };

  return (
    <div>
      <div className={pageHeader}>
        <div>
          <h1 className={pageHeading}>Users</h1>
          <p className={pageSubheading}>{users.length} total users</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className={btnClass(showForm ? 'secondary' : 'primary')}
        >
          {showForm ? 'Cancel' : '+ Add User'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit(onCreate)}
          className="bg-[var(--cf-surface)] rounded-2xl border border-[var(--cf-line)] shadow-sm p-5 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3"
        >
          <input
            placeholder="Name"
            className={inputClass}
            {...register('name', { required: 'Name is required' })}
          />
          <input
            placeholder="Email"
            type="email"
            className={inputClass}
            {...register('email', { required: 'Email is required' })}
          />
          <input
            placeholder="Password"
            type="password"
            className={inputClass}
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'Minimum 8 characters' }
            })}
          />
          <div className="flex gap-2 items-start">
            <select className={selectClass} {...register('role')}>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="college_admin">College Admin</option>
              <option value="placement_officer">Placement Officer</option>
            </select>
            <button type="submit" className={`${btnClass('success')} shrink-0`}>
              Create
            </button>
          </div>
          {(errors.name || errors.email || errors.password) && (
            <p className="text-xs text-red-600 md:col-span-4">
              {errors.name?.message || errors.email?.message || errors.password?.message}
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
                <th className={tableCellHead}>Name</th>
                <th className={tableCellHead}>Email</th>
                <th className={tableCellHead}>Role</th>
                <th className={tableCellHead}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--cf-line)]">
              {users.map((user) => (
                <tr key={user._id} className={tableRowHover}>
                  <td className={`${tableCell} font-medium`}>{user.name}</td>
                  <td className={`${tableCell} text-[var(--cf-ink-soft)]`}>{user.email}</td>
                  <td className={tableCell}>
                    <span
                      className={badge(roleColors[user.role] || 'bg-gray-100 text-gray-700')}
                    >
                      {user.role?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className={tableCell}>
                    <span
                      className={badge(
                        user.isActive ? statusColors.active : statusColors.inactive
                      )}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <p className={emptyState}>No users found.</p>}
        </div>
      )}
    </div>
  );
}

export default Users;
