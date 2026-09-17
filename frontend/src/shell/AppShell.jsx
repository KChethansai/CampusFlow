// AppShell: neo-brutalist authenticated shell — paper topbar, numbered rail, drawer + bottom nav.
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronsLeft, ChevronsRight, Command, LogOut, Menu, Moon, Search, Sun, X } from 'lucide-react';
import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '../store/useAuth';
import { useTheme } from '../system/theme';
import { visibleMobileNav, visibleNav } from './navigation';
import CommandPalette, { useCommandPalette } from './CommandPalette';
import NotificationsCenter from './NotificationsCenter';
import QuickAction from './QuickAction';
import { Tour } from '../components/Tour';
import api from '../api/axios';
import { downloadCsv, rowsToCsv } from '../utils/exportCsv';
import { toast } from 'react-hot-toast';
import { cn, roleBadge } from '../system/tokens';
import { motionVariants, useReducedMotion } from '../system/motion';

const APP_TOUR_STEPS = [
  { target: '#cf-search-trigger', title: 'Command center', body: 'Press Ctrl/⌘+K to jump anywhere — courses, drives, people, requests.' },
  { target: '#cf-notifications', title: 'Notifications', body: 'Announcements, events and mentions land here. Mark them read as you go.' },
  { target: '#cf-primary-nav', title: 'Sections', body: 'Your role decides what appears here. Everything else stays hidden, not just disabled.' },
  { target: '#main-content', title: 'Workspace', body: 'Dashboards, queues and reports live here — real data, exportable anywhere.' },
];

function Brand() {
  return (
    <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0 group" aria-label="CampusFlow home">
      <span className="w-9 h-9 bg-gold border-2 border-[var(--cf-ink)] shadow-brutal-sm grid place-items-center font-display font-black text-base text-[#111111] group-hover:bg-volt group-hover:rotate-3 transition-all" aria-hidden>
        C
      </span>
      <span className="hidden sm:block leading-none">
        <span className="block font-display text-[15px] font-black tracking-tight uppercase text-[var(--cf-ink)]">
          CampusFlow
        </span>
        <span className="block font-mono text-[9px] font-bold tracking-[0.2em] uppercase text-[var(--cf-ink-mute)] mt-0.5">
          Academic OS
        </span>
      </span>
    </Link>
  );
}

const num = (i) => String(i + 1).padStart(2, '0');

export default function AppShell() {
  const navigate = useNavigate();
  const { user, logoutUser } = useAuth();
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

  const linkInner = ({ isActive }, { label, Icon }, compact, i) => (
    <span className={cn(
      'relative flex items-center gap-2.5 px-3 min-h-11 py-2 border-2 text-sm font-display font-bold uppercase tracking-wide transition-all w-full',
      isActive
        ? 'bg-[var(--cf-ink)] text-[var(--cf-surface)] border-[var(--cf-ink)] shadow-brutal-sm'
        : 'text-[var(--cf-ink-soft)] border-transparent hover:border-[var(--cf-ink)] hover:bg-[var(--cf-surface)] hover:shadow-brutal-sm'
    )}>
      {isActive && <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-volt" aria-hidden />}
      <span className="font-mono text-[10px] font-bold opacity-60" aria-hidden>{num(i)}</span>
      <Icon size={17} aria-hidden />
      {!compact && <span className="truncate">{label}</span>}
      {isActive && !compact && (
        <span className="ml-auto font-mono text-[9px] font-bold tracking-widest bg-volt text-[#111111] px-1.5 py-0.5 border border-[var(--cf-surface)]/40">
          ACTIVE
        </span>
      )}
    </span>
  );

  return (
    <div className="min-h-screen cf-atmosphere text-[var(--cf-ink)]">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-volt focus:text-[#111111] focus:border-2 focus:border-[var(--cf-ink)] focus:font-display focus:font-bold focus:text-sm">
        Skip to content
      </a>
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-[var(--cf-surface)] border-b-2 border-[var(--cf-ink)]">
        <div className="racing-stripe h-1.5 w-full border-b-2 border-[var(--cf-ink)]" aria-hidden />
        <div className="max-w-[1400px] mx-auto px-3 sm:px-5 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              className="lg:hidden min-w-11 min-h-11 grid place-items-center border-2 border-transparent hover:border-[var(--cf-ink)] hover:shadow-brutal-sm transition-all"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>
            <Brand />
          </div>
          <button
            id="cf-search-trigger"
            onClick={() => setPaletteOpen(true)}
            className="hidden md:flex items-center gap-2 flex-1 max-w-md mx-4 px-3.5 min-h-11 border-2 border-[var(--cf-ink)] bg-[var(--cf-surface)] shadow-brutal-sm hover:shadow-brutal hover:-translate-y-px transition-all text-sm text-[var(--cf-ink-mute)]"
            aria-label="Open command center"
          >
            <Search size={15} aria-hidden />
            <span className="flex-1 text-left font-medium">Search campus…</span>
            <kbd className="brutal-tag font-mono text-[10px] font-bold px-1.5 py-0.5 bg-volt text-[#111111] flex items-center gap-0.5">
              <Command size={10} />K
            </kbd>
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPaletteOpen(true)}
              className="md:hidden min-w-11 min-h-11 grid place-items-center hover:bg-black/[.05] dark:hover:bg-white/10"
              aria-label="Search"
            >
              <Search size={19} />
            </button>
            <button
              onClick={toggle}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="min-w-11 min-h-11 grid place-items-center border-2 border-transparent hover:border-[var(--cf-ink)] hover:shadow-brutal-sm text-[var(--cf-ink-soft)] transition-all"
            >
              {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <span id="cf-notifications" className="inline-flex">
              <NotificationsCenter />
            </span>
            <Link to="/profile" className="hidden sm:flex items-center gap-2 ml-1 pl-1 pr-2 py-1 min-h-11 border-2 border-transparent hover:border-[var(--cf-ink)] hover:shadow-brutal-sm transition-all">
              <span className="w-8 h-8 bg-gold border-2 border-[var(--cf-ink)] grid place-items-center text-[#111111] text-xs font-black" aria-hidden>
                {(user?.name?.[0] || 'U').toUpperCase()}
              </span>
              <span className="text-sm font-medium max-w-[7rem] truncate">{user?.name}</span>
            </Link>
            <span className={roleBadge(user?.role) + ' hidden xl:inline-flex'}>{user?.role?.replace(/_/g, ' ')}</span>
            <button
              onClick={logout}
              aria-label="Log out"
              className="min-w-11 min-h-11 grid place-items-center border-2 border-transparent hover:border-[var(--cf-ink)] hover:shadow-brutal-sm text-[var(--cf-ink-mute)] transition-all"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-3 sm:px-5 flex gap-5">
        {/* Desktop sidebar — collapsible numbered rail */}
        <aside className={cn('hidden lg:block shrink-0 py-6 transition-all duration-300', collapsed ? 'w-[4.5rem]' : 'w-64')} aria-label="Primary">
          <nav id="cf-primary-nav" className="sticky top-24 flex flex-col gap-1.5 border-2 border-[var(--cf-ink)] bg-[var(--cf-surface)] shadow-brutal-sm p-2" aria-label="Primary">
            {items.map((item, i) => (
              <NavLink key={item.to + item.label} to={item.to} title={collapsed ? item.label : undefined}>
                {(state) => linkInner(state, item, collapsed, i)}
              </NavLink>
            ))}
            <button
              onClick={toggleSidebar}
              aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
              aria-expanded={!collapsed}
              className="mt-2 flex items-center justify-center gap-2 min-h-11 px-3 font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--cf-ink-mute)] border-2 border-dashed border-[var(--cf-ink)]/30 hover:border-solid hover:border-[var(--cf-ink)] transition-all"
            >
              {collapsed ? <ChevronsRight size={17} /> : <><ChevronsLeft size={17} /> Collapse</>}
            </button>
          </nav>
        </aside>

        {/* Content */}
        <main id="main-content" tabIndex={-1} className="flex-1 min-w-0 py-6 pb-28 lg:pb-12 focus:outline-none">
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

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm" />
            <motion.nav
              aria-label="Mobile"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 340, damping: 32 }}
              className="absolute left-0 top-0 bottom-0 w-[17rem] bg-[var(--cf-surface)] border-r-2 border-[var(--cf-ink)] p-4 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <Brand />
                <button onClick={() => setMobileOpen(false)} aria-label="Close" className="min-w-11 min-h-11 grid place-items-center border-2 border-transparent hover:border-[var(--cf-ink)]">
                  <X size={18} />
                </button>
              </div>
              {items.map(({ label, to, Icon }, i) => (
                <NavLink key={to + label} to={to} onClick={() => setMobileOpen(false)}>
                  {(state) => (
                    <span className={cn(
                      'flex items-center gap-2.5 px-3 min-h-11 py-2 border-2 text-sm font-display font-bold uppercase tracking-wide transition-all mb-1',
                      state.isActive
                        ? 'bg-[var(--cf-ink)] text-[var(--cf-surface)] border-[var(--cf-ink)] shadow-brutal-sm'
                        : 'text-[var(--cf-ink-soft)] border-transparent'
                    )}>
                      <span className="font-mono text-[10px] font-bold opacity-60" aria-hidden>{num(i)}</span>
                      <Icon size={17} aria-hidden />{label}
                    </span>
                  )}
                </NavLink>
              ))}
              <button
                onClick={logout}
                className="mt-4 w-full flex items-center gap-2.5 px-3 min-h-11 py-2 border-2 border-[var(--cf-ink)] bg-flag text-white text-sm font-display font-bold uppercase tracking-wide shadow-brutal-sm transition-all"
              >
                <LogOut size={17} /> Log out
              </button>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile bottom nav */}
      <nav aria-label="Mobile sections" className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[var(--cf-surface)] border-t-2 border-[var(--cf-ink)]">
        <div className="grid grid-cols-5 max-w-lg mx-auto">
          {visibleMobileNav(user?.role).map(({ label, to, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `relative flex flex-col items-center gap-0.5 py-2.5 min-h-11 justify-center text-[10px] font-display font-bold uppercase tracking-wide transition ${
                  isActive ? 'text-[var(--cf-ink)]' : 'text-[var(--cf-ink-mute)]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute top-0 inset-x-4 h-1 bg-volt border-b border-x border-[var(--cf-ink)]" aria-hidden />}
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
      <Tour steps={APP_TOUR_STEPS} storageKey="cf_tour_app" startSignal={tourSignal} />
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
    </div>
  );
}
