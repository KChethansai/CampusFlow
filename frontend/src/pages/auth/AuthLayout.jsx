// AuthLayout: neo-brutalist split — paper + dot-grid, brand panel with
// Space Grotesk statement + racing stripe, brutal form card, theme toggle.
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Moon, Sun } from 'lucide-react';
import { motionVariants } from '../../system/motion';
import { useTheme } from '../../system/theme';

function BrandMark({ size = 'md' }) {
  const box = size === 'md' ? 'w-9 h-9 text-base' : 'w-8 h-8 text-sm';
  return (
    <span className="flex items-center gap-2.5" aria-hidden={false}>
      <span className={`${box} grid place-items-center font-display font-bold bg-volt text-coal border-2 border-[var(--cf-ink)] shadow-brutal-sm rounded-[8px]`} aria-hidden>C</span>
      <span className="font-display font-bold tracking-tight text-lg">CampusFlow</span>
    </span>
  );
}

export default function AuthLayout({ title, subtitle, children, footer }) {
  const { theme, toggle } = useTheme();

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr] bg-[var(--cf-bg)]">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col border-r-2 border-[var(--cf-ink)] bg-royal text-white relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          aria-hidden
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.9) 1px, transparent 1px)', backgroundSize: '22px 22px' }}
        />
        <div className="relative flex items-center justify-between p-8">
          <Link to="/" aria-label="CampusFlow home" className="text-white [&_span:last-child]:text-white">
            <BrandMark />
          </Link>
          <span className="brutal-tag bg-volt text-coal text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
            Est. campus OS
          </span>
        </div>
        <div className="relative flex-1 flex flex-col justify-center px-10">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-white/70">
            Academics · Placements · Campus life
          </p>
          <p className="mt-4 font-display text-5xl font-bold leading-[1.02] tracking-tight">
            The operating system for <span className="bg-volt text-coal px-2 rounded-[6px] border-2 border-frame">your campus.</span>
          </p>
          <p className="mt-4 text-sm text-white/80 max-w-md">
            One identity across academics, placements and campus life.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {['Assignments', 'Attendance', 'Placements', 'Events'].map((t) => (
              <span key={t} className="brutal-tag bg-[var(--cf-surface)] text-[var(--cf-ink)] text-xs font-semibold px-3 py-1.5 rounded-full">
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="racing-stripe h-4 border-t-2 border-frame" aria-hidden />
      </div>

      {/* Form side */}
      <div className="relative flex items-center justify-center p-4 sm:p-8">
        <button
          type="button"
          onClick={toggle}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2.5 rounded-[10px] bg-[var(--cf-surface)] border-2 border-[var(--cf-ink)] shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
        >
          {theme === 'dark' ? <Sun size={17} aria-hidden /> : <Moon size={17} aria-hidden />}
        </button>
        <motion.div {...motionVariants.page} className="w-full max-w-md">
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-6" aria-label="CampusFlow home">
            <BrandMark size="sm" />
          </Link>
          <div className="card-brutal rounded-2xl p-6 sm:p-8">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--cf-ink-mute)]">
              CampusFlow
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-[var(--cf-ink-mute)]">{subtitle}</p>}
            <div className="racing-stripe h-2 rounded-full border-2 border-[var(--cf-ink)] mt-4" aria-hidden />
            <div className="mt-6">{children}</div>
            {footer && <div className="mt-6 pt-5 border-t-2 border-[var(--cf-ink)] text-sm text-center text-[var(--cf-ink-mute)]">{footer}</div>}
          </div>
          <p className="mt-4 text-center text-[11px] text-[var(--cf-ink-mute)]">
            Protected by your institution · Never share your password
          </p>
        </motion.div>
      </div>
    </div>
  );
}
