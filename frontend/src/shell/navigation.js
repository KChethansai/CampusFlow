// Single navigation definition. Roles mirror App.jsx guards — keep in sync.
import {
  LayoutDashboard,
  Users,
  Building2,
  BookOpen,
  BookMarked,
  ClipboardList,
  CalendarCheck,
  Briefcase,
  Inbox,
  GraduationCap,
  Sparkles,
  User,
  FolderSearch,
  CalendarDays,
  CalendarClock,
  Brain
} from 'lucide-react';

const ADMIN = ['super_admin', 'college_admin'];
const STAFF = [...ADMIN, 'faculty'];
const LEARN = [...ADMIN, 'faculty', 'student'];
const HOD_LEARN = [...LEARN, 'hod'];

export const NAV = [
  { label: 'Dashboard', to: '/dashboard', Icon: LayoutDashboard },
  { label: 'Users', to: '/users', roles: ADMIN, Icon: Users },
  { label: 'Departments', to: '/departments', roles: ADMIN, Icon: Building2 },
  { label: 'Institutions', to: '/institutions', roles: ['super_admin'], Icon: Building2 },
  { label: 'Courses', to: '/courses', roles: ADMIN, Icon: BookOpen },
  { label: 'Subjects', to: '/subjects', roles: [...ADMIN, 'hod', 'faculty'], Icon: BookMarked },
  { label: 'Schedule', to: '/schedule', roles: HOD_LEARN, Icon: CalendarClock },
  { label: 'Assignments', to: '/assignments', roles: HOD_LEARN, Icon: ClipboardList },
  { label: 'Attendance', to: '/attendance', roles: HOD_LEARN, Icon: CalendarCheck },
  { label: 'Placement', to: '/placement', roles: [...ADMIN, 'placement_officer', 'student'], Icon: Briefcase },
  { label: 'Requests', to: '/requests', roles: HOD_LEARN, Icon: Inbox },
  { label: 'Events', to: '/events', Icon: CalendarDays },
  { label: 'Study', to: '/study', roles: LEARN, Icon: Brain },
  { label: 'My Courses', to: '/enrollments', roles: ['student'], Icon: GraduationCap },
  { label: 'Directory', to: '/directory', Icon: FolderSearch },
  { label: 'Intelligence', to: '/ai-reports', roles: ADMIN, Icon: Sparkles },
  { label: 'Profile', to: '/profile', Icon: User }
];

export const MOBILE_NAV = [
  { label: 'Home', to: '/dashboard', Icon: LayoutDashboard },
  { label: 'Academics', to: '/assignments', roles: HOD_LEARN, Icon: ClipboardList },
  { label: 'Placements', to: '/placement', roles: [...ADMIN, 'placement_officer', 'student'], Icon: Briefcase },
  { label: 'Events', to: '/events', Icon: CalendarDays },
  { label: 'Profile', to: '/profile', Icon: User }
];

export const visibleNav = (role) => NAV.filter((i) => !i.roles || i.roles.includes(role));
export const visibleMobileNav = (role) => {
  const items = MOBILE_NAV.filter((i) => !i.roles || i.roles.includes(role));
  // Always 5 slots: pad with Requests for roles that lose a tab.
  if (items.length < 5 && !items.some((i) => i.to === '/requests') && HOD_LEARN.includes(role)) {
    items.splice(3, 0, { label: 'Requests', to: '/requests', roles: HOD_LEARN, Icon: Inbox });
  }
  return items.slice(0, 5);
};
