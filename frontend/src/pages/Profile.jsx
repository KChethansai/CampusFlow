import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../store/useAuth';
import {
  btnClass,
  cardClass,
  cardTitle,
  inputClass,
  labelClass,
  pageHeading
} from '../styles/common';

function Profile() {
  const { user, changePassword } = useAuth();
  const [showPwForm, setShowPwForm] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm();

  const onSubmit = async ({ currentPassword, newPassword }) => {
    try {
      await changePassword(currentPassword, newPassword);
      toast.success('Password changed. Please log in again.');
      reset();
      setShowPwForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    }
  };

  const roleLabel = user?.role?.replace('_', ' ');
  const rows = [
    ['Email', user?.email],
    ['Role', roleLabel],
    ['Roll Number', user?.profile?.rollNumber],
    ['Course', user?.profile?.course],
    ['Semester', user?.profile?.semester],
    ['Section', user?.profile?.section],
    ['Batch Year', user?.profile?.batchYear],
    ['CGPA', user?.profile?.cgpa],
    ['Backlogs', user?.profile?.backlogs],
    ['Designation', user?.profile?.designation],
    ['Qualification', user?.profile?.qualification],
    ['Phone', user?.profile?.phone]
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className={`${pageHeading} mb-6`}>My Profile</h1>

      <div className={`${cardClass} p-6 mb-6`}>
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center text-2xl font-bold">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{user?.name}</h2>
            <p className="text-sm text-gray-500 capitalize">{roleLabel}</p>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          {rows.map(
            ([label, value]) =>
              value != null && value !== '' && (
                <div
                  key={label}
                  className="flex justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-900 capitalize">
                    {String(value)}
                  </span>
                </div>
              )
          )}
        </div>
      </div>

      <div className={`${cardClass} p-6`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={cardTitle}>Security</h2>
          <button
            onClick={() => setShowPwForm((v) => !v)}
            className={btnClass('secondary', 'small')}
          >
            {showPwForm ? 'Cancel' : 'Change Password'}
          </button>
        </div>

        {showPwForm && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className={labelClass}>
                Current Password
              </label>
              <input
                id="currentPassword"
                type="password"
                className={inputClass}
                {...register('currentPassword', { required: 'Current password is required' })}
              />
              {errors.currentPassword && (
                <p className="mt-1 text-xs text-red-600">{errors.currentPassword.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="newPassword" className={labelClass}>
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                className={inputClass}
                {...register('newPassword', {
                  required: 'New password is required',
                  minLength: { value: 8, message: 'Minimum 8 characters' }
                })}
              />
              {errors.newPassword && (
                <p className="mt-1 text-xs text-red-600">{errors.newPassword.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="confirmPassword" className={labelClass}>
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                className={inputClass}
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value, formValues) =>
                    value === formValues.newPassword || 'Passwords do not match'
                })}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>
            <button type="submit" className={btnClass('primary')}>
              Update Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Profile;
