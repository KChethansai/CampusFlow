import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function Dashboard() {
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState({ users: 0, departments: 0, courses: 0, assignments: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const endpoints = ['/users', '/departments', '/courses', '/assignments'];
        const results = await Promise.allSettled(
          endpoints.map((ep) => api.get(ep))
        );
        setStats({
          users: results[0].status === 'fulfilled' ? results[0].value.data.data?.length || 0 : 0,
          departments: results[1].status === 'fulfilled' ? results[1].value.data.data?.length || 0 : 0,
          courses: results[2].status === 'fulfilled' ? results[2].value.data.data?.length || 0 : 0,
          assignments: results[3].status === 'fulfilled' ? results[3].value.data.data?.length || 0 : 0,
        });
      } catch {
        // Fallback to zeros
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { label: 'Users', value: stats.users, icon: '👥', color: 'bg-blue-500' },
    { label: 'Departments', value: stats.departments, icon: '🏢', color: 'bg-green-500' },
    { label: 'Courses', value: stats.courses, icon: '📚', color: 'bg-purple-500' },
    { label: 'Assignments', value: stats.assignments, icon: '📝', color: 'bg-orange-500' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Here's an overview of your institution.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <div className={`${card.color} text-white rounded-lg p-3 text-2xl`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {user?.role === 'faculty' && (
              <>
                <QuickAction label="Mark Attendance" to="/attendance" icon="📋" />
                <QuickAction label="Create Assignment" to="/assignments" icon="📝" />
              </>
            )}
            {user?.role === 'student' && (
              <>
                <QuickAction label="View Attendance" to="/attendance" icon="📋" />
                <QuickAction label="Submit Assignment" to="/assignments" icon="📝" />
                <QuickAction label="View Placements" to="/placement" icon="💼" />
              </>
            )}
            {['super_admin', 'college_admin'].includes(user?.role) && (
              <>
                <QuickAction label="Manage Users" to="/users" icon="👥" />
                <QuickAction label="Manage Departments" to="/departments" icon="🏢" />
                <QuickAction label="View Reports" to="/dashboard" icon="📊" />
              </>
            )}
            {user?.role === 'placement_officer' && (
              <>
                <QuickAction label="Manage Placements" to="/placement" icon="💼" />
                <QuickAction label="View Companies" to="/placement" icon="🏭" />
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4">Your Profile</h2>
          <div className="space-y-2 text-sm">
            <ProfileRow label="Name" value={user?.name} />
            <ProfileRow label="Email" value={user?.email} />
            <ProfileRow label="Role" value={user?.role?.replace('_', ' ')} />
            {user?.profile?.rollNumber && (
              <ProfileRow label="Roll Number" value={user.profile.rollNumber} />
            )}
            {user?.profile?.cgpa != null && (
              <ProfileRow label="CGPA" value={user.profile.cgpa} />
            )}
            {user?.profile?.designation && (
              <ProfileRow label="Designation" value={user.profile.designation} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ label, to, icon }) {
  return (
    <a
      href={to}
      className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
    >
      <span className="text-xl mr-3">{icon}</span>
      <span className="font-medium text-gray-700">{label}</span>
    </a>
  );
}

function ProfileRow({ label, value }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-gray-50">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900 capitalize">{value}</span>
    </div>
  );
}