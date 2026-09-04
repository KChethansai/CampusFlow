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
  FolderSearch
} from 'lucide-react';

const ADMIN = ['super_admin', 'college_admin'];

export const NAV = [
  { label: 'Dashboard', to: '/dashboard', Icon: LayoutDashboard },
  { label: 'Users', to: '/users', roles: ADMIN, Icon: Users },
  { label: 'Departments', to: '/departments', roles: ADMIN, Icon: Building2 },
  { label: 'Courses', to: '/courses', roles: ADMIN, Icon: BookOpen },
  { label: 'Subjects', to: '/subjects', roles: [...ADMIN, 'faculty'], Icon: BookMarked },
  { label: 'Assignments', to: '/assignments', roles: [...ADMIN, 'faculty', 'student'], Icon: ClipboardList },
  { label: 'Attendance', to: '/attendance', roles: [...ADMIN, 'faculty', 'student'], Icon: CalendarCheck },
  { label: 'Placement', to: '/placement', roles: [...ADMIN, 'placement_officer', 'student'], Icon: Briefcase },
  { label: 'Requests', to: '/requests', roles: [...ADMIN, 'faculty', 'student'], Icon: Inbox },
  { label: 'My Courses', to: '/enrollments', roles: ['student'], Icon: GraduationCap },
  { label: 'Directory', to: '/directory', Icon: FolderSearch },
  { label: 'Intelligence', to: '/ai-reports', roles: ADMIN, Icon: Sparkles },
  { label: 'Profile', to: '/profile', Icon: User }
];

export const MOBILE_NAV = [
  { label: 'Home', to: '/dashboard', Icon: LayoutDashboard },
  { label: 'Academics', to: '/assignments', Icon: ClipboardList },
  { label: 'Placements', to: '/placement', Icon: Briefcase },
  { label: 'Requests', to: '/requests', Icon: Inbox },
  { label: 'Profile', to: '/profile', Icon: User }
];

export const visibleNav = (role) => NAV.filter((i) => !i.roles || i.roles.includes(role));
