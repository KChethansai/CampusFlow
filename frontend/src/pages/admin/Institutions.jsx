// Institutions: super_admin table list + modal create/edit form.
// Endpoints: GET/POST/PATCH /institutions (+ GET /institutions/:id).
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { Badge, EmptyState, LoadingState, PageHeader } from '../../components/ui/primitives';
import { Modal } from '../../components/ui/Modal';
import { btnClass, inputClass, labelClass } from '../../styles/common';

const blankInstitution = {
  name: '',
  code: '',
  contactEmail: '',
  logoUrl: '',
  settings: '',
  emailDomainPattern: '',
  address: { city: '', state: '', country: '' }
};

function Institutions() {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ defaultValues: blankInstitution });

  useEffect(() => {
    loadInstitutions();
  }, []);

  const loadInstitutions = async () => {
    try {
      const { data } = await api.get('/institutions');
      setInstitutions(data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load institutions');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    reset(blankInstitution);
    setShowForm(true);
  };

  const openEdit = (institution) => {
    setEditing(institution);
    reset({
      ...blankInstitution,
      ...institution,
      // settings stored as object — edit it as JSON text
      settings: institution.settings ? JSON.stringify(institution.settings, null, 2) : '',
      address: { ...blankInstitution.address, ...(institution.address || {}) }
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const saveInstitution = async (form) => {
    // settings input is optional JSON — reject invalid JSON early
    let settings;
    if (form.settings?.trim()) {
      try {
        settings = JSON.parse(form.settings);
      } catch {
        toast.error('Settings must be valid JSON (or left empty)');
        return;
      }
    }
    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      contactEmail: form.contactEmail?.trim() || undefined,
      logoUrl: form.logoUrl?.trim() || undefined,
      emailDomainPattern: form.emailDomainPattern.trim(),
      address: form.address,
      ...(settings !== undefined ? { settings } : {})
    };
    try {
      if (editing) {
        await api.patch(`/institutions/${editing._id}`, payload);
        toast.success('Institution updated');
      } else {
        await api.post('/institutions', payload);
        toast.success('Institution created');
      }
      closeForm();
      await loadInstitutions();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${editing ? 'update' : 'create'} institution`);
    }
  };

  return (
    <section>
      <PageHeader
        title="Institutions"
        subtitle={`${institutions.length} institutions`}
        actions={<button type="button" onClick={openCreate} className={btnClass('primary', 'medium')}>+ Add Institution</button>}
      />

      {loading ? <LoadingState label="Loading institutions…" /> : institutions.length === 0 ? (
        <div className="rounded-3xl border border-[var(--cf-line)] bg-[var(--cf-surface)]/70 p-5">
          <EmptyState title="No institutions yet" hint="Add an institution to configure account email rules." />
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-[var(--cf-line)] bg-[var(--cf-surface)]/70">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Institutions and their account email rules</caption>
              <thead className="border-b border-[var(--cf-line)] bg-[var(--cf-surface-2)]/60">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-mono text-[11px] font-semibold uppercase tracking-widest text-[var(--cf-ink-mute)]">Institution</th>
                  <th scope="col" className="px-4 py-3 text-left font-mono text-[11px] font-semibold uppercase tracking-widest text-[var(--cf-ink-mute)]">Email rule</th>
                  <th scope="col" className="px-4 py-3 text-left font-mono text-[11px] font-semibold uppercase tracking-widest text-[var(--cf-ink-mute)]">Status</th>
                  <th scope="col" className="px-4 py-3 text-right font-mono text-[11px] font-semibold uppercase tracking-widest text-[var(--cf-ink-mute)]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--cf-line)]">
                {institutions.map((institution) => (
                  <tr key={institution._id} className="cf-row-lift">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--cf-ink)]">{institution.name}</p>
                      <p className="mt-0.5 text-xs text-[var(--cf-ink-mute)]">{institution.code}{institution.contactEmail ? ` · ${institution.contactEmail}` : ''}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--cf-ink-soft)]">{institution.emailDomainPattern || 'Not configured'}</td>
                    <td className="px-4 py-3"><Badge status={institution.isActive === false ? 'inactive' : 'active'}>{institution.isActive === false ? 'Inactive' : 'Active'}</Badge></td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={() => openEdit(institution)} className={btnClass('outline', 'small')}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={showForm} onClose={closeForm} title={editing ? 'Edit institution' : 'Add institution'}>
        <form onSubmit={handleSubmit(saveInstitution)} className="space-y-3">
          <div>
            <label className={labelClass} htmlFor="institution-name">Institution name</label>
            <input id="institution-name" autoComplete="organization" className={inputClass} {...register('name', { required: 'Name is required' })} />
            {errors.name && <p className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">{errors.name.message}</p>}
          </div>
          <div>
            <label className={labelClass} htmlFor="institution-code">Institution code</label>
            <input id="institution-code" placeholder="AU" className={inputClass} {...register('code', { required: 'Code is required' })} />
            {errors.code && <p className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">{errors.code.message}</p>}
          </div>
          <div>
            <label className={labelClass} htmlFor="institution-email-pattern">Email domain pattern</label>
            <input
              id="institution-email-pattern"
              aria-describedby="institution-email-pattern-help"
              placeholder="anurag.edu.in"
              className={inputClass}
              {...register('emailDomainPattern', {
                required: 'Email domain pattern is required',
                validate: (value) => {
                  const pattern = value.trim();
                  if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(pattern)) return true;
                  try { new RegExp(pattern); return true; } catch { return 'Enter a domain suffix or valid regular expression'; }
                }
              })}
            />
            {/* inline hint for the expected pattern shape */}
            <p id="institution-email-pattern-help" className="mt-1.5 text-xs leading-relaxed text-[var(--cf-ink-mute)]">
              e.g. anurag.edu.in or a custom regex
            </p>
            {errors.emailDomainPattern && <p className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">{errors.emailDomainPattern.message}</p>}
          </div>
          <div>
            <label className={labelClass} htmlFor="institution-contact-email">Contact email <span className="font-normal text-[var(--cf-ink-mute)]">(optional)</span></label>
            <input id="institution-contact-email" type="email" autoComplete="email" className={inputClass} {...register('contactEmail')} />
          </div>
          <div>
            <label className={labelClass} htmlFor="institution-logo">Logo URL <span className="font-normal text-[var(--cf-ink-mute)]">(optional)</span></label>
            <input id="institution-logo" type="url" placeholder="https://…" className={inputClass} {...register('logoUrl')} />
          </div>
          <fieldset className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <legend className={`${labelClass} mb-2`}>Address <span className="font-normal text-[var(--cf-ink-mute)]">(optional)</span></legend>
            {['city', 'state', 'country'].map((field) => (
              <div key={field}>
                <label className="sr-only" htmlFor={`institution-${field}`}>{field[0].toUpperCase() + field.slice(1)}</label>
                <input id={`institution-${field}`} placeholder={field[0].toUpperCase() + field.slice(1)} className={inputClass} {...register(`address.${field}`)} />
              </div>
            ))}
          </fieldset>
          <div>
            <label className={labelClass} htmlFor="institution-settings">Settings (JSON) <span className="font-normal text-[var(--cf-ink-mute)]">(optional)</span></label>
            <textarea id="institution-settings" rows={3} placeholder='{"key": "value"}' className={`${inputClass} font-mono`} {...register('settings')} />
          </div>
          <button type="submit" disabled={isSubmitting} className={`${btnClass('primary', 'medium')} w-full`}>
            {isSubmitting ? 'Saving…' : editing ? 'Save changes' : 'Create institution'}
          </button>
        </form>
      </Modal>
    </section>
  );
}

export default Institutions;
