// Users: brutal table + modal create form.
// Endpoints preserved: GET /users, POST /users. Role options + gates unchanged.
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { Badge, EmptyState, LoadingState, PageHeader } from '../../components/ui/primitives';
import { Modal } from '../../components/ui/Modal';
import { btnClass, inputClass, labelClass, selectClass } from '../../system/tokens';

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState('');
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

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.name, u.email, u.role].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [users, query]);

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle={`${users.length} total users`}
        actions={
          <>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, role…"
              aria-label="Search users"
              className={`${inputClass} !w-56`}
            />
            <button onClick={() => setShowForm(true)} className={btnClass('primary', 'medium')}>
              + Add User
            </button>
          </>
        }
      />

      {loading ? (
        <LoadingState label="Loading users…" />
      ) : visible.length === 0 ? (
        <div className="card-brutal p-5"><EmptyState title={users.length ? 'No matches' : 'No users found'} hint={users.length ? 'Try another search.' : undefined} /></div>
      ) : (
        <div className="card-brutal overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gold text-coal border-b-2 border-[var(--cf-ink)]">
                <tr>
                  <th className="px-4 py-3 text-left font-mono text-[11px] font-bold uppercase tracking-widest">Name</th>
                  <th className="px-4 py-3 text-left font-mono text-[11px] font-bold uppercase tracking-widest">Email</th>
                  <th className="px-4 py-3 text-left font-mono text-[11px] font-bold uppercase tracking-widest">Role</th>
                  <th className="px-4 py-3 text-left font-mono text-[11px] font-bold uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--cf-line)]">
                {visible.map((u) => (
                  <tr key={u._id} className="hover:bg-black/[.02] dark:hover:bg-white/[.04] transition-colors">
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-[var(--cf-ink-soft)]">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge role={u.role}>{u.role?.replace(/_/g, ' ')}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge status={u.isActive ? 'active' : 'inactive'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add user">
        <form onSubmit={handleSubmit(onCreate)} className="space-y-3">
          <div>
            <label className={labelClass} htmlFor="user-name">Name</label>
            <input id="user-name" placeholder="Aarav Sharma" className={inputClass} {...register('name', { required: 'Name is required' })} />
          </div>
          <div>
            <label className={labelClass} htmlFor="user-email">Email</label>
            <input id="user-email" placeholder="aarav@campus.edu" type="email" className={inputClass} {...register('email', { required: 'Email is required' })} />
          </div>
          <div>
            <label className={labelClass} htmlFor="user-password">Password</label>
            <input
              id="user-password"
              placeholder="Minimum 8 characters"
              type="password"
              className={inputClass}
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'Minimum 8 characters' }
              })}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="user-role">Role</label>
            <select id="user-role" className={selectClass} {...register('role')}>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="college_admin">College Admin</option>
              <option value="placement_officer">Placement Officer</option>
            </select>
          </div>
          {(errors.name || errors.email || errors.password) && (
            <p className="text-xs text-red-600" role="alert">
              {errors.name?.message || errors.email?.message || errors.password?.message}
            </p>
          )}
          <button type="submit" className={`${btnClass('success', 'medium')} w-full`}>Create user</button>
        </form>
      </Modal>
    </div>
  );
}

export default Users;
