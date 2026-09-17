// Dashboard: routes each role to its command center. No metric-card grid.
// Role transition is a plain fade/slide keyed by role — no state, no gates.
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useAuth } from '../store/useAuth';
import { Forbidden } from '../components/routing/ProtectedRoute';
import StudentHome from './dashboards/StudentHome';
import FacultyHome from './dashboards/FacultyHome';
import AdminHome from './dashboards/AdminHome';
import PlacementHome from './dashboards/PlacementHome';

function Dashboard() {
  const { user } = useAuth();
  const reduced = useReducedMotion();
  const role = user?.role || 'unknown';

  let home;
  switch (role) {
    case 'student':
      home = <StudentHome />;
      break;
    case 'faculty':
      home = <FacultyHome />;
      break;
    case 'placement_officer':
      home = <PlacementHome />;
      break;
    case 'super_admin':
    case 'college_admin':
      home = <AdminHome />;
      break;
    default:
      // Authenticated but role unknown — real 403, never a login loop.
      return <Forbidden />;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={role}
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
        transition={{ duration: 0.22 }}
      >
        {home}
      </motion.div>
    </AnimatePresence>
  );
}

export default Dashboard;
