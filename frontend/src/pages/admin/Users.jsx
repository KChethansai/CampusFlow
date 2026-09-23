// Users: glass table + modal create form + bulk import modal.
// Bulk endpoint: POST /users/bulk (JSON { users } or multipart FormData with `file`).
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { Badge, EmptyState, LoadingState, PageHeader } from '../../components/ui/primitives';
import { Modal } from '../../components/ui/Modal';
import { btnClass, inputClass, labelClass, selectClass } from '../../styles/common';
import { useAuth } from '../../store/useAuth';

// quote-aware CSV split → row objects keyed by lowercased header
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  const source = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (char === '"' && quoted && source[i + 1] === '"') { cell += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(cell.trim()); cell = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && source[i + 1] === '\n') i += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = '';
    } else cell += char;
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  if (rows.length < 2) return [];
  const headers = rows.shift().map((header) => header.trim().toLowerCase());
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ''])));
}

// map flat CSV row → bulk payload (rollNumber nests under profile)
function csvRowsToUsers(rows) {
  return rows.map((row) => ({
    name: (row.name || '').trim(),
    email: (row.email || '').trim(),
    role: (row.role || '').trim().toLowerCase(),
    ...(row.department?.trim() ? { department: row.department.trim() } : {}),
    ...(row.institution?.trim() ? { institution: row.institution.trim() } : {}),
    ...(row.rollnumber?.trim() ? { profile: { rollNumber: row.rollnumber.trim() } } : {})
  }));
}

const validRoles = new Set(['super_admin', 'college_admin', 'faculty', 'student', 'placement_officer']);
const rowIssues = (u, requireInstitution) => [
  !u.name && 'Name is required',
  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u.email) && 'Valid email is required',
  !validRoles.has(u.role) && 'Role is not supported',
  requireInstitution && !u.institution && 'Institution ID is required for super-admin imports',
  u.institution && !/^[a-f\d]{24}$/i.test(u.institution) && 'Institution must be a 24-character ID',
  u.department && !/^[a-f\d]{24}$/i.test(u.department) && 'Department must be a 24-character ID'
].filter(Boolean);
const isRowValid = (u, requireInstitution) => rowIssues(u, requireInstitution).length === 0;

// bulk import dialog: file upload or pasted CSV → preview → results
function BulkImportModal({ open, onClose, onImported }) {
  const actorRole = useAuth((state) => state.user?.role);
  const requireInstitution = actorRole === 'super_admin';
  const [file, setFile] = useState(null);
  const [csvText, setCsvText] = useState('');
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // preview counts update live from pasted text
  const previewUsers = useMemo(() => csvRowsToUsers(parseCsv(csvText)), [csvText]);
  const preview = csvText.trim() ? { total: previewUsers.length, valid: previewUsers.filter((u) => isRowValid(u, requireInstitution)).length, invalid: previewUsers.filter((u) => !isRowValid(u, requireInstitution)).length } : null;

  const readFile = async (nextFile) => {
    if (!nextFile) return;
    if (!/\.csv$/i.test(nextFile.name) && nextFile.type !== 'text/csv') {
      toast.error('Choose a CSV file');
      return;
    }
    setFile(nextFile);
    setCsvText(await nextFile.text());
  };

  const close = () => {
    setFile(null);
    setCsvText('');
    setDragging(false);
    setResult(null);
    onClose();
  };

  const copyPassword = async (password) => {
    try {
      await navigator.clipboard.writeText(password);
      toast.success('Temporary password copied');
    } catch {
      toast.error('Copy failed — select it manually');
    }
  };

  const onSubmit = async () => {
    setSubmitting(true);
    try {
      const users = csvRowsToUsers(parseCsv(csvText)).filter((row) => isRowValid(row, requireInstitution));
      if (!users.length) {
        toast.error('Add at least one valid row before importing');
        return;
      }
      const { data } = await api.post('/users/bulk', { users });
      const body = data.data ?? data;
      // backend returns { succeeded, failed: count, results: [{ index, success, data?, email?, message }] }
      const results = body.results || [];
      const created = results.filter((r) => r.success).map((r) => ({ email: r.data?.email, tempPassword: r.data?.tempPassword }));
      const failed = results.filter((r) => !r.success).map((r) => ({ row: (r.index ?? 0) + 1, email: r.email, error: r.message }));
      setResult({ created, failed });
      toast.success(`Bulk import: ${created.length} created, ${failed.length} failed`);
      onImported?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk import failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={close} title="Bulk import users" wide>
      {!result ? (
        <div className="space-y-3">
          <div
            onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false); }}
            onDrop={(event) => { event.preventDefault(); setDragging(false); readFile(event.dataTransfer.files?.[0]); }}
            className={`rounded-2xl border border-dashed p-4 transition ${dragging ? 'border-[#D86D3E] bg-[#D86D3E]/10' : 'border-[var(--cf-line)]'}`}
          >
            <label className={labelClass} htmlFor="bulk-file">Drop CSV here or choose a file</label>
            <input
              id="bulk-file"
              type="file"
              accept=".csv,text/csv"
              className={inputClass}
              onChange={(e) => readFile(e.target.files?.[0])}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="bulk-text">Or paste CSV</label>
            <textarea
              id="bulk-text"
              rows={6}
              disabled={Boolean(file)}
              placeholder="name,email,role,department,institution,rollNumber&#10;Aarav,aarav@campus.edu,student,,24-character-institution-id,CS001"
              className={`${inputClass} font-mono`}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
            />
          </div>
          {/* live preview so bad CSV is caught before submit */}
          <p className="text-xs text-[var(--cf-ink-mute)]" aria-live="polite">
            {file ? `Selected: ${file.name} · ${preview?.total || 0} rows — ${preview?.valid || 0} valid, ${preview?.invalid || 0} invalid` : preview ? `${preview.total} rows — ${preview.valid} valid, ${preview.invalid} invalid` : 'Header row: name,email,role,department,institution,rollNumber. Department and institution use their 24-character IDs.'}
          </p>
          {file && <button type="button" onClick={() => { setFile(null); setCsvText(''); }} className="text-xs font-semibold text-[#D86D3E] underline underline-offset-2">Remove selected file</button>}
          {preview && preview.total > 0 && <div className="max-h-56 overflow-auto rounded-xl border border-[var(--cf-line)]">
            <table className="w-full min-w-[42rem] text-xs">
              <thead className="sticky top-0 bg-[var(--cf-surface)] text-left"><tr><th scope="col" className="p-2">Row</th><th scope="col" className="p-2">Name</th><th scope="col" className="p-2">Email</th><th scope="col" className="p-2">Role</th><th scope="col" className="p-2">Institution</th><th scope="col" className="p-2">Validation</th></tr></thead>
              <tbody className="divide-y divide-[var(--cf-line)]">{previewUsers.map((row, index) => { const issues = rowIssues(row, requireInstitution); return <tr key={`${row.email}-${index}`} className={issues.length ? 'text-red-600 dark:text-red-400' : ''}>
                <td className="p-2">{index + 1}</td><td className="p-2">{row.name || '—'}</td><td className="p-2">{row.email || '—'}</td><td className="p-2">{row.role || '—'}</td><td className="p-2 font-mono">{row.institution || '—'}</td><td className="p-2">{issues.length ? issues.join(', ') : 'Ready'}</td>
              </tr>; })}</tbody>
            </table>
          </div>}
          <button type="button" disabled={submitting || !preview?.valid || preview.invalid > 0} onClick={onSubmit} className={`${btnClass('primary', 'medium')} w-full`}>
            {submitting ? 'Importing…' : 'Import'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* created accounts with copyable temp passwords */}
          <section aria-label="Created accounts">
            <h3 className="mb-2 text-sm font-semibold text-[var(--cf-ink)]">Created ({result.created.length})</h3>
            {result.created.length === 0 ? (
              <p className="text-xs text-[var(--cf-ink-mute)]">No accounts created.</p>
            ) : (
              <ul className="max-h-48 space-y-2 overflow-auto text-xs">
                {result.created.map((item) => (
                  <li key={item.email} className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--cf-line)] pt-2">
                    <span className="break-all text-[var(--cf-ink-soft)]">{item.email}</span>
                    <span className="flex items-center gap-2 font-mono text-[var(--cf-ink-mute)]">
                      <strong className="text-[var(--cf-ink)]">{item.tempPassword}</strong>
                      <button type="button" onClick={() => copyPassword(item.tempPassword)} className={btnClass('outline', 'small')}>Copy</button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          {/* per-row failures */}
          <section aria-label="Failed rows">
            <h3 className="mb-2 text-sm font-semibold text-[var(--cf-ink)]">Failed ({result.failed.length})</h3>
            {result.failed.length === 0 ? (
              <p className="text-xs text-[var(--cf-ink-mute)]">No failures.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="border-b border-[var(--cf-line)]">
                    <tr>
                      <th scope="col" className="px-2 py-2 text-left font-semibold text-[var(--cf-ink-mute)]">Row</th>
                      <th scope="col" className="px-2 py-2 text-left font-semibold text-[var(--cf-ink-mute)]">Email</th>
                      <th scope="col" className="px-2 py-2 text-left font-semibold text-[var(--cf-ink-mute)]">Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--cf-line)]">
                    {result.failed.map((item, i) => (
                      <tr key={`${item.row ?? i}-${item.email ?? ''}`}>
                        <td className="px-2 py-2">{item.row ?? '—'}</td>
                        <td className="break-all px-2 py-2">{item.email || '—'}</td>
                        <td className="px-2 py-2 text-red-600 dark:text-red-400">{item.error || 'Unknown error'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          <button type="button" onClick={close} className={`${btnClass('outline', 'medium')} w-full`}>Done</button>
        </div>
      )}
    </Modal>
  );
}

function Users() {
  const user = useAuth((state) => state.user);
  const [users, setUsers] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [query, setQuery] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: { name: '', email: '', password: '', role: 'student', institution: user?.institution || '' }
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (user?.role !== 'super_admin') return;
    api.get('/institutions')
      .then(({ data }) => setInstitutions(data.data || []))
      .catch(() => toast.error('Failed to load institutions'));
  }, [user?.role]);

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
      await api.post('/auth/register', form);
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
              className={`${inputClass} !w-56 !rounded-[14px]`}
            />
            <button type="button" onClick={() => setShowBulk(true)} className={btnClass('outline', 'medium')}>Bulk import</button>
            <button type="button" onClick={() => setShowForm(true)} className={btnClass('primary', 'medium')}>+ Add User</button>
          </>
        }
      />

      <p className="mb-4 text-xs text-[var(--cf-ink-mute)]">Bulk CSV columns: <code className="font-mono">name,email,role,department,institution,rollNumber</code>. Department and institution use 24-character IDs; super-admin imports require an institution ID. Bulk-created accounts receive a temporary password in the import results.</p>

      {loading ? (
        <LoadingState label="Loading users…" />
      ) : visible.length === 0 ? (
        <div className="rounded-3xl border border-[var(--cf-line)] bg-[var(--cf-surface)]/70 p-5"><EmptyState title={users.length ? 'No matches' : 'No users found'} hint={users.length ? 'Try another search.' : undefined} /></div>
      ) : (
        <div className="rounded-3xl border border-[var(--cf-line)] bg-[var(--cf-surface)]/70 backdrop-blur-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Users in this institution</caption>
              <thead className="border-b border-[var(--cf-line)] bg-[var(--cf-surface-2)]/60">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-mono text-[11px] font-semibold uppercase tracking-widest text-[var(--cf-ink-mute)]">Name</th>
                  <th scope="col" className="px-4 py-3 text-left font-mono text-[11px] font-semibold uppercase tracking-widest text-[var(--cf-ink-mute)]">Email</th>
                  <th scope="col" className="px-4 py-3 text-left font-mono text-[11px] font-semibold uppercase tracking-widest text-[var(--cf-ink-mute)]">Role</th>
                  <th scope="col" className="px-4 py-3 text-left font-mono text-[11px] font-semibold uppercase tracking-widest text-[var(--cf-ink-mute)]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--cf-line)]">
                {visible.map((u) => (
                  <tr key={u._id} className="cf-row-lift">
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

      <BulkImportModal open={showBulk} onClose={() => setShowBulk(false)} onImported={fetchUsers} />

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add user">
        <form onSubmit={handleSubmit(onCreate)} className="space-y-3">
          <div>
            <label className={labelClass} htmlFor="user-name">Name</label>
            <input id="user-name" placeholder="Aarav Sharma" className={`${inputClass} rounded-[14px]`} {...register('name', { required: 'Name is required' })} />
          </div>
          <div>
            <label className={labelClass} htmlFor="user-email">Email</label>
            <input id="user-email" placeholder="aarav@campus.edu" type="email" className={`${inputClass} rounded-[14px]`} {...register('email', { required: 'Email is required' })} />
          </div>
          <div>
            <label className={labelClass} htmlFor="user-password">Password</label>
            <input
              id="user-password"
              placeholder="Minimum 8 characters"
              type="password"
              className={`${inputClass} rounded-[14px]`}
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'Minimum 8 characters' }
              })}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="user-role">Role</label>
            <select id="user-role" className={`${selectClass} rounded-[14px]`} {...register('role')}>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="college_admin">College Admin</option>
              <option value="placement_officer">Placement Officer</option>
            </select>
          </div>
          {user?.role === 'super_admin' && (
            <div>
              <label className={labelClass} htmlFor="user-institution">Institution</label>
              <select id="user-institution" className={`${selectClass} rounded-[14px]`} {...register('institution', { required: 'Select an institution' })}>
                <option value="">Select institution</option>
                {institutions.map((institution) => <option key={institution._id} value={institution._id}>{institution.name} ({institution.code})</option>)}
              </select>
            </div>
          )}
          {(errors.name || errors.email || errors.password || errors.institution) && (
            <p className="text-xs text-red-600 dark:text-red-400" role="alert">
              {errors.name?.message || errors.email?.message || errors.password?.message || errors.institution?.message}
            </p>
          )}
          <button type="submit" className={`${btnClass('primary', 'medium')} w-full`}>Create user</button>
        </form>
      </Modal>
    </div>
  );
}

export default Users;
