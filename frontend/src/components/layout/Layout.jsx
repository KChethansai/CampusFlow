import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../../features/auth/authActions';

const menuItems = [
  { label: 'Dashboard', to: '/dashboard', icon: '📊' },
  { label: 'Users', to: '/users', roles: ['super_admin', 'college_admin'], icon: '👥' },
  { label: 'Departments', to: '/departments', roles: ['super_admin', 'college_admin'], icon: '🏢' },
  { label: 'Courses', to: '/courses', roles: ['super_admin', 'college_admin'], icon: '📚' },
  { label: 'Subjects', to: '/subjects', roles: ['super_admin', 'college_admin', 'faculty'], icon: '📖' },
  { label: 'Assignments', to: '/assignments', roles: ['super_admin', 'college_admin', 'faculty', 'student'], icon: '📝' },
  { label: 'Attendance', to: '/attendance', roles: ['super_admin', 'college_admin', 'faculty', 'student'], icon: '📋' },
  { label: 'Placement', to: '/placement', roles: ['super_admin', 'college_admin', 'placement_officer', 'student'], icon: '💼' },
  { label: 'Requests', to: '/requests', roles: ['super_admin', 'college_admin', 'faculty', 'student'], icon: '📨' },
];

export default function Layout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };

  const visibleItems = menuItems.filter(
    (item) => !item.roles || item.roles.includes(user?.role)
  );

  const roleLabel = user?.role?.replace('_', ' ');

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-primary-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/dashboard" className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold tracking-tight">🎓 CampusFlow</span>
              </Link>
              <div className="hidden md:ml-6 md:flex md:space-x-1">
                {visibleItems.map((item) => {
                  const isActive = location.pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                        isActive
                          ? 'bg-primary-800 text-white'
                          : 'hover:bg-primary-700 text-primary-100'
                      }`}
                    >
                      <span className="mr-1">{item.icon}</span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Link to="/profile" className="text-sm hover:underline capitalize">
                {user?.name}
              </Link>
              <span className="text-xs bg-primary-800 px-2 py-1 rounded capitalize">
                {roleLabel}
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded bg-primary-700 hover:bg-primary-800 text-sm transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}