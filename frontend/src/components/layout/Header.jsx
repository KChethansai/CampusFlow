// Header: top navigation bar with brand, role-aware links, user menu.
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/useAuth';
import NotificationsBell from './NotificationsBell';

export const menuItems = [
  { label: 'Dashboard', to: '/dashboard', icon: '📊' },
  {
    label: 'Users',
    to: '/users',
    roles: ['super_admin', 'college_admin'],
    icon: '👥'
  },
  {
    label: 'Departments',
    to: '/departments',
    roles: ['super_admin', 'college_admin'],
    icon: '🏢'
  },
  {
    label: 'Courses',
    to: '/courses',
    roles: ['super_admin', 'college_admin'],
    icon: '📚'
  },
  {
    label: 'Subjects',
    to: '/subjects',
    roles: ['super_admin', 'college_admin', 'faculty'],
    icon: '📖'
  },
  {
    label: 'Assignments',
    to: '/assignments',
    roles: ['super_admin', 'college_admin', 'faculty', 'student'],
    icon: '📝'
  },
  {
    label: 'Attendance',
    to: '/attendance',
    roles: ['super_admin', 'college_admin', 'faculty', 'student'],
    icon: '📋'
  },
  {
    label: 'Placement',
    to: '/placement',
    roles: ['super_admin', 'college_admin', 'placement_officer', 'student'],
    icon: '💼'
  },
  {
    label: 'Requests',
    to: '/requests',
    roles: ['super_admin', 'college_admin', 'faculty', 'student'],
    icon: '📨'
  },
  {
    label: 'My Courses',
    to: '/enrollments',
    roles: ['student'],
    icon: '🎓'
  },
  {
    label: 'AI Reports',
    to: '/ai-reports',
    roles: ['super_admin', 'college_admin'],
    icon: '🤖'
  }
];

function Header() {
  const navigate = useNavigate();
  const { user, logoutUser } = useAuth();

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  };

  const visibleItems = menuItems.filter(
    (item) => !item.roles || item.roles.includes(user?.role)
  );

  const navLinkClass = ({ isActive }) =>
    `px-3 py-2 rounded-full text-sm font-medium transition ${
      isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-100'
    }`;

  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
              <span className="text-xl font-bold tracking-tight text-gray-900">
                🎓 CampusFlow
              </span>
            </Link>
            <nav className="hidden lg:flex items-center gap-1">
              {visibleItems.map((item) => (
                <NavLink key={item.to} to={item.to} className={navLinkClass}>
                  <span className="mr-1">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <NotificationsBell />
            <Link
              to="/profile"
              className="text-sm font-medium text-gray-700 hover:text-primary-600 capitalize"
            >
              {user?.name}
            </Link>
            <span className="hidden sm:inline text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full capitalize">
              {user?.role?.replace('_', ' ')}
            </span>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-full text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
