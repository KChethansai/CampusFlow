import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../store/useAuth';
import { cardClass, cardTitle, pageHeading, pageSubheading } from '../styles/common';

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    users: 0,
    departments: 0,
    courses: 0,
    assignments: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      const endpoints = ['/users', '/departments', '/courses', '/assignments'];
      const results = await Promise.allSettled(endpoints.map((ep) => api.get(ep)));
      setStats({
        users: results[0].status === 'fulfilled' ? results[0].value.data.data?.length || 0 : 0,
        departments: results[1].status === 'fulfilled' ? results[1].value.data.data?.length || 0 : 0,
        courses: results[2].status === 'fulfilled' ? results[2].value.data.data?.length || 0 : 0,
        assignments: results[3].status === 'fulfilled' ? results[3].value.data.data?.length || 0 : 0
      });
    };
    fetchStats();
  }, []);

  const cards = [
    { label: 'Users', value: stats.users, icon: '👥', color: 'bg-primary-500' },
    { label: 'Departments', value: stats.departments, icon: '🏢', color: 'bg-green-500' },
    { label: 'Courses', value: stats.courses, icon: '📚', color: 'bg-purple-500' },
    { label: 'Assignments', value: stats.assignments, icon: '📝', color: 'bg-orange-500' }
  ];

  const quickActions = [];
  if (user?.role === 'faculty') {
    quickActions.push(
      { label: 'Mark Attendance', to: '/attendance', icon: '📋' },
      { label: 'Create Assignment', to: '/assignments', icon: '📝' }
    );
  } else if (user?.role === 'student') {
    quickActions.push(
      { label: 'View Attendance', to: '/attendance', icon: '📋' },
      { label: 'Submit Assignment', to: '/assignments', icon: '📝' },
      { label: 'View Placements', to: '/placement', icon: '💼' }
    );
  } else if (['super_admin', 'college_admin'].includes(user?.role)) {
    quickActions.push(
      { label: 'Manage Users', to: '/users', icon: '👥' },
      { label: 'Manage Departments', to: '/departments', icon: '🏢' }
    );
  } else if (user?.role === 'placement_officer') {
    quickActions.push(
      { label: 'Manage Placements', to: '/placement', icon: '💼' },
      { label: 'View Companies', to: '/placement', icon: '🏭' }
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className={pageHeading}>Welcome back, {user?.name}!</h1>
        <p className={pageSubheading}>Here's an overview of your institution.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className={`${cardClass} p-5`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <div className={`${card.color} text-white rounded-xl p-3 text-2xl`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${cardClass} p-6`}>
          <h2 className={`${cardTitle} mb-4`}>Quick Actions</h2>
          <div className="space-y-3">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                to={action.to}
                className="flex items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
              >
                <span className="text-xl mr-3">{action.icon}</span>
                <span className="font-medium text-gray-700">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className={`${cardClass} p-6`}>
          <h2 className={`${cardTitle} mb-4`}>Your Profile</h2>
          <div className="space-y-2 text-sm">
            <ProfileRow label="Name" value={user?.name} />
            <ProfileRow label="Email" value={user?.email} />
            <ProfileRow label="Role" value={user?.role?.replace('_', ' ')} />
            <ProfileRow label="Roll Number" value={user?.profile?.rollNumber} />
            <ProfileRow label="CGPA" value={user?.profile?.cgpa} />
            <ProfileRow label="Designation" value={user?.profile?.designation} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileRow({ label, value }) {
  if (value == null || value === '') return null;
  return (
    <div className="flex justify-between py-1.5 border-b border-gray-50">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900 capitalize">{String(value)}</span>
    </div>
  );
}

export default Dashboard;
