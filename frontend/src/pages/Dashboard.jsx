// Dashboard: routes each role to its command center. No metric-card grid.
import { Navigate } from 'react-router-dom';
import { useAuth } from '../store/useAuth';
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
      return <Navigate to="/login" replace />;
  }
}

export default Dashboard;
