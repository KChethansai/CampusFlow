import { useSelector, useDispatch } from 'react-redux';
import { useState } from 'react';
import { changePassword } from '../features/auth/authActions';

export default function Profile() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [showPwForm, setShowPwForm] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }
    try {
      await dispatch(changePassword(pwForm.currentPassword, pwForm.newPassword));
      setMessage('Password changed successfully. Please log in again.');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPwForm(false);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to change password');
    }
  };

  const roleLabel = user?.role?.replace('_', ' ');

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-2xl font-bold">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{user?.name}</h2>
            <p className="text-sm text-gray-500 capitalize">{roleLabel}</p>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <Row label="Email" value={user?.email} />
          <Row label="Role" value={roleLabel} />
          {user?.profile?.rollNumber && <Row label="Roll Number" value={user.profile.rollNumber} />}
          {user?.profile?.course && <Row label="Course" value={user.profile.course} />}
          {user?.profile?.semester && <Row label="Semester" value={user.profile.semester} />}
          {user?.profile?.section && <Row label="Section" value={user.profile.section} />}
          {user?.profile?.batchYear && <Row label="Batch Year" value={user.profile.batchYear} />}
          {user?.profile?.cgpa != null && <Row label="CGPA" value={user.profile.cgpa} />}
          {user?.profile?.backlogs != null && <Row label="Backlogs" value={user.profile.backlogs} />}
          {user?.profile?.designation && <Row label="Designation" value={user.profile.designation} />}
          {user?.profile?.qualification && <Row label="Qualification" value={user.profile.qualification} />}
          {user?.profile?.phone && <Row label="Phone" value={user.profile.phone} />}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Security</h2>
          <button onClick={() => setShowPwForm(!showPwForm)}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition">
            {showPwForm ? 'Cancel' : 'Change Password'}
          </button>
        </div>

        {message && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm mb-4">
            {message}
          </div>
        )}

        {showPwForm && (
          <form onSubmit={handleChangePassword} className="space-y-3">
            <input type="password" placeholder="Current Password" required value={pwForm.currentPassword}
              onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm" />
            <input type="password" placeholder="New Password" required value={pwForm.newPassword}
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm" />
            <input type="password" placeholder="Confirm New Password" required value={pwForm.confirmPassword}
              onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm" />
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">
              Update Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-50">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900 capitalize">{String(value)}</span>
    </div>
  );
}