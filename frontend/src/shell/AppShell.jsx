// AppShell: unified spatial shell — brand, contextual nav, search, bell, theme, profile.
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Command, LogOut, Menu, Moon, Search, Sun, X } from 'lucide-react';
import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '../store/useAuth';
import { useTheme } from '../system/theme';
import { MOBILE_NAV, visibleNav } from './navigation';
import CommandPalette, { useCommandPalette } from './CommandPalette';
import NotificationsCenter from './NotificationsCenter';
import QuickAction from './QuickAction';
import { roleBadge } from '../system/tokens';
import { motionVariants, useReducedMotion } from '../system/motion';

function Brand() {
  return (
    <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0" aria-label="CampusFlow home">
      <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-accent-violet grid place-items-center text-white font-bold text-sm shadow-2" aria-hidden>
        C
      </span>
      <span className="text-[15px] font-bold tracking-tight text-[var(--cf-ink)] hidden sm:block">
        CampusFlow
      </span>
    </Link>
  );
}

export default function AppShell() {
  const navigate = useNavigate();
  const { user, logoutUser } = useAuth();
  const { theme, toggle } = useTheme();
  const [paletteOpen, setPaletteOpen] = useCommandPalette();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const reduced = useReducedMotion();
  const items = visibleNav(user?.role);

  const logout = async () => {
    await logoutUser();
    navigate('/login');
  };

  const linkCls = ({ isActive }) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition ${
      isActive
        ? 'bg-primary-50 dark:bg-primary-500/15 text-primary-700 dark:text-primary-300'
        : 'text-[var(--cf-ink-soft)] hover:bg-black/[.04] dark:hover:bg-white/[.07]'
    }`;

  return (
    <div className="min-h-screen cf-atmosphere text-[var(--cf-ink)]">
      {/* Top bar */}
      <header className="sticky top-0 z-40 cf-glass border-b border-[var(--cf-line)]">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-5 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              className="lg:hidden p-2 rounded-xl hover:bg-black/[.05] dark:hover:bg-white/10"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>
            <Brand />
          </div>
          <button
            onClick={() => setPaletteOpen(true)}
            className="hidden md:flex items-center gap-2 flex-1 max-w-md mx-4 px-3.5 py-2 rounded-xl border border-[var(--cf-line)] bg-[var(--cf-surface)] text-sm text-[var(--cf-ink-mute)] hover:border-primary-300 transition"
            aria-label="Open command center"
          >
            <Search size={15} aria-hidden />
            <span className="flex-1 text-left">Search campus…</span>
            <kbd className="text-[10px] px-1.5 py-0.5 rounded-md border border-[var(--cf-line)] flex items-center gap-0.5">
              <Command size={10} />K
            </kbd>
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPaletteOpen(true)}
              className="md:hidden p-2 rounded-full hover:bg-black/[.05] dark:hover:bg-white/10"
              aria-label="Search"
            >
              <Search size={19} />
            </button>
            <button
              onClick={toggle}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-full text-[var(--cf-ink-soft)] hover:bg-black/[.05] dark:hover:bg-white/10 transition"
            >
              {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <NotificationsCenter />
            <Link to="/profile" className="hidden sm:flex items-center gap-2 ml-1 pl-1 pr-2 py-1 rounded-full hover:bg-black/[.04] dark:hover:bg-white/[.07] transition">
              <span className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-accent-violet grid place-items-center text-white text-xs font-bold" aria-hidden>
                {(user?.name?.[0] || 'U').toUpperCase()}
              </span>
              <span className="text-sm font-medium max-w-[7rem] truncate">{user?.name}</span>
            </Link>
            <span className={roleBadge(user?.role) + ' hidden xl:inline-flex'}>{user?.role?.replace(/_/g, ' ')}</span>
            <button
              onClick={logout}
              aria-label="Log out"
              className="p-2 rounded-full text-[var(--cf-ink-mute)] hover:bg-black/[.05] dark:hover:bg-white/10 transition"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-3 sm:px-5 flex gap-5">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-60 shrink-0 py-6" aria-label="Primary">
          <nav className="sticky top-24 flex flex-col gap-0.5">
            {items.map(({ label, to, Icon }) => (
              <NavLink key={to + label} to={to} className={linkCls}>
                <Icon size={17} aria-hidden />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 py-6 pb-28 lg:pb-12">
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
              className="absolute left-0 top-0 bottom-0 w-[17rem] bg-[var(--cf-surface)] border-r border-[var(--cf-line)] p-4 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <Brand />
                <button onClick={() => setMobileOpen(false)} aria-label="Close" className="p-2 rounded-full hover:bg-black/[.05] dark:hover:bg-white/10">
                  <X size={18} />
                </button>
              </div>
              {items.map(({ label, to, Icon }) => (
                <NavLink key={to + label} to={to} onClick={() => setMobileOpen(false)} className={linkCls}>
                  <Icon size={17} aria-hidden />
                  {label}
                </NavLink>
              ))}
              <button
                onClick={logout}
                className="mt-4 w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
              >
                <LogOut size={17} /> Log out
              </button>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile bottom nav */}
      <nav aria-label="Mobile sections" className="lg:hidden fixed bottom-0 inset-x-0 z-40 cf-glass border-t border-[var(--cf-line)]">
        <div className="grid grid-cols-5 max-w-lg mx-auto">
          {MOBILE_NAV.map(({ label, to, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition ${
                  isActive ? 'text-primary-600 dark:text-primary-300' : 'text-[var(--cf-ink-mute)]'
                }`
              }
            >
              <Icon size={19} aria-hidden />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      <QuickAction role={user?.role} />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
    </div>
  );
}
