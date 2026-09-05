// Dashboard: routes each role to its command center. No metric-card grid.
import { useAuth } from '../store/useAuth';
import { Forbidden } from '../components/routing/ProtectedRoute';
import StudentHome from './dashboards/StudentHome';
import FacultyHome from './dashboards/FacultyHome';
import AdminHome from './dashboards/AdminHome';
import PlacementHome from './dashboards/PlacementHome';

function Dashboard() {
  const { user } = useAuth();
  switch (user?.role) {
    case 'student':
      return <StudentHome />;
    case 'faculty':
      return <FacultyHome />;
    case 'placement_officer':
      return <PlacementHome />;
    case 'super_admin':
    case 'college_admin':
      return <AdminHome />;
    default:
      // Authenticated but role unknown — real 403, never a login loop.
      return <Forbidden />;
  }
}

export default Dashboard;
