// AppShell: 21st.dev-caliber floating shell — Aceternity FloatingNav topbar
// (hide-on-scroll-down / reveal-on-scroll-up) + React Bits staggered mobile drawer.
// Logic preserved: visibleNav, collapse, palette/tour/CSV wiring, logout, tour ids, skip link.
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react';
import {
  ChevronsLeft, ChevronsRight, Command, LifeBuoy, LogOut, Menu,
  Moon, Search, Settings, Sun, X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Toaster, toast, useToasterStore } from 'react-hot-toast';
import { useAuth } from '../store/useAuth';
import { useSocket } from '../store/useSocket';
import { useTheme } from '../system/theme';
import { visibleMobileNav, visibleNav } from './navigation';
import CommandPalette, { useCommandPalette } from './CommandPalette';
import NotificationsCenter from './NotificationsCenter';
import QuickAction from './QuickAction';
import { Tour } from '../components/Tour';
import api from '../api/axios';
import { downloadCsv, rowsToCsv } from '../utils/exportCsv';
import { cn, roleLabel } from '../system/tokens';
import {
  EASE_OUT, motionVariants, staggerChild, staggerParent, useReducedMotion
} from '../system/motion';

// NOTE: components/ui/{buttons,cards,overlays}/ do not exist in this repo
// (only components/ui/{editorial,Modal,primitives}.jsx). Composed locally instead.

const EASE = 'ease-[cubic-bezier(0.16,1,0.3,1)]';
const SOFT = 'shadow-[0_16px_48px_-20px_rgba(16,24,40,0.3)]';

// Subtle per-role Obsidian Ember accent pairs. Applied as soft gradient washes only.
const ROLE_ACCENT = {
  student: ['#D86D3E', '#B4806A'],
  faculty: ['#D86D3E', '#C87D4B'],
  placement_officer: ['#B4806A', '#D86D3E'],
  college_admin: ['#D86D3E', '#64748b'],
  super_admin: ['#D86D3E', '#94a3b8']
};

const tourStepsFor = (role) => {
  const focus = role === 'student' ? 'assignments, attendance, study plans and placements'
    : role === 'faculty' ? 'your courses, assignments, attendance and student requests'
      : role === 'placement_officer' ? 'drives, applicants and placement activity'
        : 'institution users, courses, reports and operational requests';
  return [
    { target: '#cf-search-trigger', title: 'Command center', body: 'Press Ctrl/⌘+K to jump to the sections and actions available to you.' },
    { target: '#cf-notifications', title: 'Notifications', body: 'Updates for your role land here. Open the preferences in Profile to choose channels.' },
    { target: '#cf-primary-nav', title: 'Your workspace', body: `Your role gives you access to ${focus}.` },
    { target: '#main-content', title: 'Get started', body: 'Your dashboard brings together live campus information and the next useful actions.' },
  ];
};

function Brand({ compact }) {
  return (
    <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0" aria-label="CampusFlow home">
      <span className="w-9 h-9 rounded-xl bg-[#D86D3E] grid place-items-center font-display font-bold text-base text-white shrink-0 shadow-md shadow-[#D86D3E]/30" aria-hidden>
        C
      </span>
      {!compact && (
        <span className="hidden sm:block leading-none">
          <span className="block font-display text-[15px] font-bold tracking-tight text-[var(--cf-ink)]">
            CampusFlow
          </span>
        </span>
      )}
    </Link>
  );
}

const iconBtn = `min-w-11 min-h-11 grid place-items-center rounded-full text-[var(--cf-ink-soft)] transition-all duration-200 ${EASE} hover:bg-black/[0.05] hover:text-[var(--cf-ink)] dark:hover:bg-white/10`;

const railLinkClass = ({ isActive }, compact) => cn(
  `group relative flex items-center gap-2.5 rounded-xl px-3 min-h-11 py-2 text-sm font-medium transition-all duration-200 ${EASE} hover:translate-x-1`,
  compact && 'justify-center px-0',
  isActive
    ? 'text-[#D86D3E] dark:text-[#F5B08A] font-semibold'
    : 'text-[var(--cf-ink-soft)] hover:bg-black/[0.04] hover:text-[var(--cf-ink)] dark:hover:bg-white/[0.06]'
);

// Animated active line: shared layoutId glides between rail items (Motion active indicator).
const railLinkInner = ({ isActive }, { label, Icon }, compact, accent, reduced) => (
  <>
    {isActive && (
      compact ? (
        <span
          className="absolute left-1/2 -translate-x-1/2 -bottom-0.5 h-1 w-6 rounded-full"
          style={{ background: `linear-gradient(90deg, ${accent[0]}, ${accent[1]})` }}
          aria-hidden
        />
      ) : reduced ? (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full"
          style={{ background: accent[0] }}
          aria-hidden
        />
      ) : (
        <motion.span
          layoutId="cf-rail-line"
          transition={{ duration: 0.3, ease: EASE_OUT }}
          className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full"
          style={{ background: `linear-gradient(180deg, ${accent[0]}, ${accent[1]})`, boxShadow: '0 0 12px rgba(216,109,62,0.55)' }}
          aria-hidden
        />
      )
    )}
    <span className={cn('grid place-items-center rounded-lg transition-colors', isActive && 'bg-[#D86D3E]/10 p-0')}>
      <Icon size={18} aria-hidden className="shrink-0" />
    </span>
    {!compact && <span className="truncate">{label}</span>}
  </>
);

// Screen-reader mirror of the latest toast (react-hot-toast renders
// outside the live tree, so announce its message explicitly).
function ToastAnnouncer() {
  const { toasts } = useToasterStore();
  const visible = toasts.filter((t) => t.visible);
  const latest = visible[visible.length - 1];
  const message = typeof latest?.message === 'string' ? latest.message : '';
  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only" role="status">
      {message}
    </div>
  );
}

export default function AppShell() {
  const navigate = useNavigate();
  const { user, logoutUser, completeOnboardingTour } = useAuth();
  const { theme, toggle } = useTheme();
  const [paletteOpen, setPaletteOpen] = useCommandPalette();
  const [tourSignal, setTourSignal] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  const downloadNotificationsCsv = async () => {
    try {
      const { data } = await api.get('/notifications');
      const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      downloadCsv(
        'campusflow-notifications.csv',
        rowsToCsv(rows, ['title', 'message', 'type', 'read', 'createdAt'])
      );
      toast.success('Notifications exported');
    } catch {
      toast.error('Export failed — try again');
    }
  };
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('cf_sidebar') === 'collapsed'; } catch { return false; }
  });
  const location = useLocation();
  const reduced = useReducedMotion();
  const items = visibleNav(user?.role);
  const centerLinks = items.slice(0, 4);
  const semester = user?.profile?.semester;
  const accent = ROLE_ACCENT[user?.role] || ROLE_ACCENT.student;

  // Aceternity FloatingNav pattern: hide topbar on scroll down, reveal on scroll up.
  const { scrollY } = useScroll();
  const [barHidden, setBarHidden] = useState(false);
  useMotionValueEvent(scrollY, 'change', (y) => {
    if (reduced) { setBarHidden(false); return; }
    const prev = scrollY.getPrevious() ?? 0;
    if (y < 80) setBarHidden(false);
    else setBarHidden(y > prev);
  });

  // Staggered drawer: Escape closes, focus lands on close.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setMobileOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  // Realtime: connect socket on auth, toast live events (no full refetch).
  const socketConnect = useSocket((s) => s.connect);
  const socketDisconnect = useSocket((s) => s.disconnect);
  const lastEvent = useSocket((s) => s.lastEvent);
  const bumpUnread = useSocket((s) => s.bumpUnread);
  const refreshUnread = useSocket((s) => s.refreshUnread);
  useEffect(() => {
    if (!user) {
      socketDisconnect();
      return;
    }
    socketConnect();
    refreshUnread();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);
  useEffect(() => {
    if (!lastEvent) return;
    const { channel, payload } = lastEvent;
    if (channel === 'notification:new' && payload?.notification) {
      bumpUnread();
      toast.success(payload.notification.title || 'New notification');
    } else if (channel === 'announcement:posted') {
      toast.success(`New announcement: ${payload?.announcement?.title || ''}`.trim());
    } else if (channel === 'announcement:updated') {
      toast.success(`Announcement updated: ${payload?.announcement?.title || ''}`.trim());
    } else if (channel === 'request:updated') {
      toast.success(`Request ${payload?.request?.status || 'updated'}`);
    } else if (channel === 'attendance:marked') {
      toast.success('Attendance updated');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastEvent]);

  const logout = async () => {
    await logoutUser();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setCollapsed((c) => {
      try { localStorage.setItem('cf_sidebar', c ? 'expanded' : 'collapsed'); } catch {}
      return !c;
    });
  };

  return (
    <div className="min-h-screen cf-atmosphere text-[var(--cf-ink)]">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-full focus:bg-[#D86D3E] focus:text-white focus:text-sm focus:font-medium">
        Skip to content
      </a>

      <div className="max-w-[1400px] mx-auto px-3 sm:px-5 flex items-start gap-4">
        {/* Left navigation rail */}
        <aside
          className={cn(
            `hidden lg:block shrink-0 sticky top-3 h-[calc(100vh-1.5rem)] transition-all duration-300 ${EASE}`,
            collapsed ? 'w-20' : 'w-60'
          )}
          aria-label="Primary"
        >
          <nav
            id="cf-primary-nav"
            aria-label="Primary"
            className={`cf-depth-2 bg-[var(--cf-surface)]/85 backdrop-blur-2xl flex h-full flex-col gap-1 rounded-3xl border border-[var(--cf-line)] p-3 ${SOFT}`}
          >
            <div className={cn('flex items-center px-1 pb-2', collapsed && 'justify-center px-0')}>
              <Brand compact={collapsed} />
            </div>
            <button
              id="cf-search-trigger"
              onClick={() => setPaletteOpen(true)}
              aria-label="Open command center"
              title={collapsed ? 'Search (Ctrl/⌘+K)' : undefined}
              className={cn(
                `flex items-center gap-2 min-h-11 rounded-[14px] border border-[var(--cf-line)] bg-[var(--cf-surface-2)]/60 text-[var(--cf-ink-mute)] transition-all duration-200 ${EASE} hover:border-[#D86D3E]/40 hover:text-[var(--cf-ink)]`,
                collapsed ? 'justify-center px-0' : 'px-3'
              )}
            >
              <Search size={16} aria-hidden className="shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left text-sm">Search campus…</span>
                  <kbd className="flex items-center gap-0.5 rounded-md border border-[var(--cf-line)] bg-[var(--cf-surface)] px-1.5 py-0.5 font-mono text-[10px] font-semibold">
                    <Command size={10} />K
                  </kbd>
                </>
              )}
            </button>
            <div className="mt-1 flex flex-1 flex-col gap-0.5 overflow-y-auto" role="list">
              {items.map((item) => (
                <NavLink
                  key={item.to + item.label}
                  to={item.to}
                  title={collapsed ? item.label : undefined}
                  className={(state) => railLinkClass(state, collapsed)}
                >
                  {(state) => railLinkInner(state, item, collapsed, accent, reduced)}
                </NavLink>
              ))}
            </div>
            <div className="flex flex-col gap-0.5 border-t border-[var(--cf-line)] pt-2">
              <button
                onClick={() => setTourSignal((s) => s + 1)}
                title={collapsed ? 'Support' : undefined}
                className={cn(
                  `flex items-center gap-2.5 rounded-xl px-3 min-h-11 text-sm text-[var(--cf-ink-soft)] transition-all duration-200 ${EASE} hover:translate-x-1 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]`,
                  collapsed && 'justify-center px-0'
                )}
              >
                <LifeBuoy size={18} aria-hidden className="shrink-0" />
                {!collapsed && <span>Support</span>}
              </button>
              <Link
                to="/profile"
                title={collapsed ? 'Settings' : undefined}
                className={cn(
                  `flex items-center gap-2.5 rounded-xl px-3 min-h-11 text-sm text-[var(--cf-ink-soft)] transition-all duration-200 ${EASE} hover:translate-x-1 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]`,
                  collapsed && 'justify-center px-0'
                )}
              >
                <Settings size={18} aria-hidden className="shrink-0" />
                {!collapsed && <span>Settings</span>}
              </Link>
              <button
                onClick={toggleSidebar}
                aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
                aria-expanded={!collapsed}
                className={cn(
                  `mt-1 flex items-center gap-2 rounded-xl px-3 min-h-11 font-mono text-[11px] font-medium uppercase tracking-widest text-[var(--cf-ink-mute)] transition-all duration-200 ${EASE} hover:bg-black/[0.04] dark:hover:bg-white/[0.06]`,
                  collapsed ? 'justify-center px-0' : 'justify-center'
                )}
              >
                {collapsed ? <ChevronsRight size={17} /> : <><ChevronsLeft size={17} /> Collapse</>}
              </button>
            </div>
          </nav>
        </aside>

        {/* Main column: floating topbar + workspace */}
        <div className="flex-1 min-w-0">
          <motion.header
            animate={reduced ? {} : { y: barHidden ? '-130%' : '0%', opacity: barHidden ? 0 : 1 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
            className={`cf-glass sticky top-3 z-40 mt-3 rounded-2xl border border-[var(--cf-line)] ${SOFT} print-hide`}
          >
            <div className="flex h-16 items-center gap-1.5 px-3 sm:gap-2 sm:px-4">
              <button
                className={cn(iconBtn, 'lg:hidden')}
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
                aria-expanded={mobileOpen}
              >
                <Menu size={20} />
              </button>
              <span className="hidden md:inline-flex items-center gap-1.5 min-h-11 rounded-full border border-[var(--cf-line)] bg-[var(--cf-surface-2)]/60 px-3 text-xs font-semibold text-[var(--cf-ink-soft)]">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#E7A66D' }} aria-hidden />
                {semester ? `Sem ${semester}` : 'Campus'}
              </span>
              <nav aria-label="Sections" className="hidden xl:flex flex-1 items-center justify-center gap-1">
                {centerLinks.map(({ label, to }) => (
                  <NavLink
                    key={to + label}
                    to={to}
                    className={({ isActive }) => cn(
                      `relative rounded-full px-3.5 min-h-11 inline-flex items-center text-sm font-medium transition-all duration-200 ${EASE}`,
                      isActive
                        ? 'text-[#D86D3E] dark:text-[#F5B08A]'
                        : 'text-[var(--cf-ink-soft)] hover:text-[var(--cf-ink)] dark:hover:bg-white/[0.06]'
                    )}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (reduced ? (
                          <span className="absolute inset-0 rounded-full bg-[#D86D3E]/10" aria-hidden />
                        ) : (
                          <motion.span
                            layoutId="cf-topbar-pill"
                            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                            className="absolute inset-0 rounded-full"
                            style={{ background: `linear-gradient(90deg, ${accent[0]}1a, ${accent[1]}1a)`, boxShadow: `inset 0 0 0 1px ${accent[0]}33` }}
                            aria-hidden
                          />
                        ))}
                        <span className="relative">{label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>
              <div className="flex-1 xl:hidden" />
              <span className="hidden lg:inline-flex items-center gap-2 min-h-11 rounded-full border border-[var(--cf-line)] px-3 text-xs font-semibold capitalize text-[var(--cf-ink-soft)]">
                <span className="w-2 h-2 rounded-full bg-[#E7A66D] animate-pulse-dot" aria-hidden />
                {roleLabel(user?.role)}
              </span>
              <button onClick={() => setPaletteOpen(true)} aria-label="Search" className={iconBtn}>
                <Search size={19} />
              </button>
              <button
                onClick={toggle}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                className={iconBtn}
              >
                {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
              </button>
              <span id="cf-notifications" className="inline-flex">
                <NotificationsCenter />
              </span>
              <Link
                to="/profile"
                aria-label="Settings"
                className={cn(iconBtn, 'hidden md:grid')}
              >
                <Settings size={19} />
              </Link>
              <Link
                to="/profile"
                className={`hidden sm:flex items-center gap-2 min-h-11 rounded-full border border-[var(--cf-line)] bg-[var(--cf-surface-2)]/60 py-1 pl-1 pr-3 transition-all duration-200 ${EASE} hover:border-[#D86D3E]/40`}
              >
                <span className="w-8 h-8 rounded-full grid place-items-center text-white text-xs font-bold shrink-0" style={{ background: `linear-gradient(135deg, ${accent[0]}, ${accent[1]})` }} aria-hidden>
                  {(user?.name?.[0] || 'U').toUpperCase()}
                </span>
                <span className="leading-tight">
                  <span className="block text-xs font-semibold max-w-[7rem] truncate">{user?.name}</span>
                  <span className="block text-[10px] text-[var(--cf-ink-mute)] max-w-[7rem] truncate">{user?.email}</span>
                </span>
              </Link>
              <button onClick={logout} aria-label="Log out" className={iconBtn}>
                <LogOut size={18} />
              </button>
            </div>
          </motion.header>

          <main id="main-content" tabIndex={-1} className="min-w-0 py-6 pb-28 lg:pb-12 focus:outline-none">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                initial={reduced ? { opacity: 0 } : motionVariants.page.initial}
                animate={reduced ? { opacity: 1 } : motionVariants.page.animate}
                exit={reduced ? { opacity: 0 } : motionVariants.page.exit}
                transition={reduced ? { duration: 0.01 } : motionVariants.page.transition}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Mobile staggered-menu drawer (React Bits pattern, Motion-powered) */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
          >
            <button aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            {/* Staggered underlay layers */}
            <motion.span
              aria-hidden
              initial={{ x: '-104%' }} animate={{ x: 0 }} exit={{ x: '-104%' }}
              transition={reduced ? { duration: 0.01 } : { duration: 0.4, ease: EASE_OUT }}
              className="absolute left-0 top-0 bottom-0 w-[17.5rem] rounded-r-3xl bg-[#D86D3E]/15"
            />
            <motion.span
              aria-hidden
              initial={{ x: '-104%' }} animate={{ x: 0 }} exit={{ x: '-104%' }}
              transition={reduced ? { duration: 0.01 } : { duration: 0.4, ease: EASE_OUT, delay: 0.06 }}
              className="absolute left-0 top-0 bottom-0 w-[17.25rem] rounded-r-3xl bg-[#E7A66D]/10"
            />
            <motion.nav
              aria-label="Mobile"
              initial={reduced ? { opacity: 0 } : { x: '-104%' }}
              animate={reduced ? { opacity: 1 } : { x: 0 }}
              exit={reduced ? { opacity: 0 } : { x: '-104%' }}
              transition={reduced ? { duration: 0.01 } : { duration: 0.45, ease: EASE_OUT, delay: 0.1 }}
              className="cf-glass absolute left-0 top-0 bottom-0 w-[17rem] rounded-r-3xl border-r border-[var(--cf-line)] p-4 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <Brand />
                <button onClick={() => setMobileOpen(false)} aria-label="Close" autoFocus className={iconBtn}>
                  <X size={18} />
                </button>
              </div>
              <motion.div
                variants={reduced ? undefined : staggerParent(0.055, 0.15)}
                initial="initial"
                animate="animate"
                exit={reduced ? { opacity: 0 } : { opacity: 0, transition: { duration: 0.1 } }}
              >
                {items.map((item, i) => (
                  <motion.div key={item.to + item.label} variants={reduced ? undefined : staggerChild}>
                    <NavLink to={item.to} onClick={() => setMobileOpen(false)}>
                      {(state) => (
                        <span className={cn(
                          `relative flex items-center gap-2.5 rounded-xl px-3 min-h-11 py-2 text-sm font-medium transition-all mb-0.5 ${EASE} overflow-hidden`,
                          state.isActive
                            ? 'text-[#D86D3E] dark:text-[#F5B08A]'
                            : 'text-[var(--cf-ink-soft)] hover:translate-x-1'
                        )}>
                          {state.isActive && (
                            <span
                              className="absolute inset-0 rounded-xl"
                              style={{ background: `linear-gradient(90deg, ${accent[0]}1f, ${accent[1]}14)` }}
                              aria-hidden
                            />
                          )}
                          {state.isActive && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-[#D86D3E] shadow-[0_0_12px_rgba(216,109,62,0.8)]" aria-hidden />
                          )}
                          <item.Icon size={18} aria-hidden className="relative shrink-0" />
                          <span className="relative">{item.label}</span>
                        </span>
                      )}
                    </NavLink>
                  </motion.div>
                ))}
              </motion.div>
              <button
                onClick={logout}
                className="mt-4 w-full flex items-center justify-center gap-2 min-h-11 rounded-full bg-[#A94727] text-white text-sm font-semibold transition-all"
              >
                <LogOut size={17} /> Log out
              </button>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile bottom nav */}
      <nav aria-label="Mobile sections" className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[var(--cf-surface)]/90 backdrop-blur-2xl border-t border-[var(--cf-line)] shadow-2xl">
        <div className="grid grid-cols-5 max-w-lg mx-auto">
          {visibleMobileNav(user?.role).map(({ label, to, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `relative flex flex-col items-center gap-0.5 py-2.5 min-h-11 justify-center text-[10px] font-semibold transition ${
                  isActive ? 'text-[#D86D3E] dark:text-[#F5B08A]' : 'text-[var(--cf-ink-mute)]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (reduced ? (
                    <span className="absolute top-0 inset-x-6 h-1 rounded-full bg-[#D86D3E]" aria-hidden />
                  ) : (
                    <motion.span
                      layoutId="cf-bottom-tab"
                      transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                      className="absolute top-0 inset-x-6 h-1 rounded-full"
                      style={{ background: `linear-gradient(90deg, ${accent[0]}, ${accent[1]})`, boxShadow: '0 0 12px rgba(216,109,62,0.8)' }}
                      aria-hidden
                    />
                  ))}
                  <Icon size={19} aria-hidden />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <QuickAction role={user?.role} />
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onDownloadCsv={downloadNotificationsCsv}
        onStartTour={() => setTourSignal((s) => s + 1)}
      />
      <Tour steps={tourStepsFor(user?.role)} storageKey={`cf_tour_app:${user?._id || 'account'}`} autoOpen={!user?.onboardingTourCompleted} startSignal={tourSignal}
        onDone={() => completeOnboardingTour().catch(() => toast.error('Tour completion could not be saved to your account.'))} />
      <ToastAnnouncer />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: 'var(--cf-surface)',
            color: 'var(--cf-ink)',
            border: '1px solid var(--cf-line)',
            borderRadius: '0.75rem',
            fontSize: '0.875rem',
          },
        }}
      />
    </div>
  );
}
