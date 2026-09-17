// AuthLayout: glass split — ambient radial glows on brand panel,
// glass form card (24px, 1px var(--cf-line)), theme toggle.
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Moon, Sun } from 'lucide-react';
import { motionVariants } from '../../system/motion';
import { useTheme } from '../../system/theme';
import { SplitReveal } from '../../components/ui/editorial';

function BrandMark({ size = 'md' }) {
  const box = size === 'md' ? 'w-9 h-9 text-base' : 'w-8 h-8 text-sm';
  return (
    <span className="flex items-center gap-2.5" aria-hidden={false}>
      <span className={`${box} grid place-items-center font-display font-bold bg-[#2563FF] text-white rounded-[10px]`} aria-hidden>C</span>
      <span className="font-display font-bold tracking-tight text-lg">CampusFlow</span>
    </span>
  );
}

export default function AuthLayout({ title, subtitle, children, footer }) {
  const { theme, toggle } = useTheme();

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr] bg-[var(--cf-bg)]">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col border-r border-[var(--cf-line)] bg-[var(--cf-surface-2)] text-[var(--cf-ink)] relative overflow-hidden">
        <div
          className="absolute inset-0"
          aria-hidden
          style={{
            background:
              'radial-gradient(560px 340px at 18% 8%, rgba(37,99,255,.16), transparent 65%), radial-gradient(480px 320px at 85% 20%, rgba(139,92,246,.12), transparent 65%), radial-gradient(600px 420px at 50% 110%, rgba(34,211,238,.10), transparent 65%)'
          }}
        />
        <div className="relative flex items-center justify-between p-8">
          <Link to="/" aria-label="CampusFlow home">
            <BrandMark />
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--cf-line)] bg-[var(--cf-surface)]/70 backdrop-blur px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-widest text-[var(--cf-ink-mute)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#A7D700]" aria-hidden />
            Est. campus OS
          </span>
        </div>
        <div className="relative flex-1 flex flex-col justify-center px-10">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-[var(--cf-ink-mute)]">
            Academics · Placements · Campus life
          </p>
          <SplitReveal
            as="p"
            lines={['The operating system', 'for your campus.']}
            className="mt-4 font-display text-5xl font-bold leading-[1.02] tracking-tight"
          />
          <p className="mt-4 text-sm text-[var(--cf-ink-mute)] max-w-md">
            One identity across academics, placements and campus life.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {['Assignments', 'Attendance', 'Placements', 'Events'].map((t) => (
              <span key={t} className="rounded-full border border-[var(--cf-line)] bg-[var(--cf-surface)]/70 backdrop-blur px-3 py-1.5 text-xs font-medium text-[var(--cf-ink-soft)]">
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="relative h-px bg-[var(--cf-line)]" aria-hidden />
      </div>

      {/* Form side */}
      <div className="relative flex items-center justify-center p-4 sm:p-8">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background:
              'radial-gradient(520px 320px at 85% -5%, rgba(37,99,255,.10), transparent 65%), radial-gradient(420px 300px at 10% 105%, rgba(139,92,246,.08), transparent 65%)'
          }}
        />
        <button
          type="button"
          onClick={toggle}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2.5 rounded-full bg-[var(--cf-surface)]/80 backdrop-blur border border-[var(--cf-line)] text-[var(--cf-ink-soft)] hover:text-[var(--cf-ink)] transition"
        >
          {theme === 'dark' ? <Sun size={17} aria-hidden /> : <Moon size={17} aria-hidden />}
        </button>
        <motion.div {...motionVariants.page} className="relative w-full max-w-md">
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-6" aria-label="CampusFlow home">
            <BrandMark size="sm" />
          </Link>
          <div className="rounded-3xl border border-[var(--cf-line)] bg-[var(--cf-surface)]/80 backdrop-blur-xl p-6 sm:p-8">
            <p className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--cf-ink-mute)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#A7D700]" aria-hidden />
              CampusFlow
            </p>
            <SplitReveal
              as="h1"
              lines={[title]}
              className="mt-1 font-display text-2xl font-bold tracking-tight"
            />
            {subtitle && <p className="mt-1 text-sm text-[var(--cf-ink-mute)]">{subtitle}</p>}
            <div className="mt-6">{children}</div>
            {footer && <div className="mt-6 pt-5 border-t border-[var(--cf-line)] text-sm text-center text-[var(--cf-ink-mute)]">{footer}</div>}
          </div>
          <p className="mt-4 text-center text-[11px] text-[var(--cf-ink-mute)]">
            Protected by your institution · Never share your password
          </p>
        </motion.div>
      </div>
    </div>
  );
}
