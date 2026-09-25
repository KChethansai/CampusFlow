import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Moon, Sun, ArrowLeft } from 'lucide-react';
import { motionVariants } from '../../system/motion';
import { useTheme } from '../../system/theme';
import AuthVisual from '../../components/visual/AuthVisual';

function BrandMark({ size = 'md' }) {
  const box = size === 'md' ? 'w-9 h-9 text-base' : 'w-8 h-8 text-sm';
  return (
    <span className="flex items-center gap-2.5">
      <span className={`${box} grid place-items-center font-display font-bold bg-[#D86D3E] text-white rounded-xl shadow-md shadow-[#D86D3E]/30`} aria-hidden>
        C
      </span>
      <span className="font-display font-bold tracking-tight text-lg text-[var(--cf-ink)]">CampusFlow</span>
    </span>
  );
}

/**
 * AuthLayout
 * Premium product portal layout following Obsidian Ember design tokens.
 * Asymmetrical split on desktop (cinematic left panel + focused authentication surface).
 */
export default function AuthLayout({ title, subtitle, children, footer }) {
  const { theme, toggle } = useTheme();

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr] bg-[var(--cf-bg)] text-[var(--cf-ink)]">
      {/* Left Cinematic Visual System (Desktop) */}
      <div className="hidden lg:block relative border-r border-[var(--cf-line)] overflow-hidden">
        <AuthVisual />
      </div>

      {/* Right Form Surface */}
      <div className="relative flex flex-col justify-between p-4 sm:p-8 lg:p-12 overflow-y-auto">
        {/* Background ambient radial glow */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background:
              'radial-gradient(520px 320px at 85% -5%, rgba(216,109,62,.10), transparent 65%), radial-gradient(420px 300px at 10% 105%, rgba(121,184,166,.08), transparent 65%)'
          }}
        />

        {/* Top Controls: Return to Home & Theme Toggle */}
        <div className="relative z-10 flex items-center justify-between mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--cf-ink-mute)] hover:text-[var(--cf-ink)] transition"
            aria-label="Return to CampusFlow home"
          >
            <ArrowLeft size={15} aria-hidden />
            <span>Home</span>
          </Link>

          <button
            type="button"
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2.5 rounded-full bg-[var(--cf-surface)]/80 backdrop-blur border border-[var(--cf-line)] text-[var(--cf-ink-soft)] hover:text-[var(--cf-ink)] hover:border-black/20 dark:hover:border-white/20 transition"
          >
            {theme === 'dark' ? <Sun size={17} aria-hidden /> : <Moon size={17} aria-hidden />}
          </button>
        </div>

        {/* Form Container */}
        <div className="relative z-10 my-auto flex justify-center">
          <motion.div {...motionVariants.page} className="w-full max-w-md">
            {/* Mobile Brand Mark */}
            <div className="lg:hidden mb-6 flex justify-center">
              <Link to="/" aria-label="CampusFlow home">
                <BrandMark size="md" />
              </Link>
            </div>

            {/* Auth Card Surface */}
            <div className="rounded-3xl border border-[var(--cf-line)] bg-[var(--cf-surface)]/80 backdrop-blur-2xl p-6 sm:p-8 shadow-xl shadow-black/5 dark:shadow-black/40">
              <div className="mb-6">
                <p className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--cf-accent)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#E7A66D]" aria-hidden />
                  Institutional Access
                </p>
                <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--cf-ink)]">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-1.5 text-sm text-[var(--cf-ink-mute)] leading-relaxed">
                    {subtitle}
                  </p>
                )}
              </div>

              <div>{children}</div>

              {footer && (
                <div className="mt-6 pt-5 border-t border-[var(--cf-line)] text-xs text-center text-[var(--cf-ink-mute)] leading-relaxed">
                  {footer}
                </div>
              )}
            </div>

            <p className="mt-4 text-center text-[11px] text-[var(--cf-ink-mute)]">
              Your role decides what you can see.
            </p>
          </motion.div>
        </div>

        {/* Bottom Spacer for balance */}
        <div className="relative z-10 hidden sm:block h-6" aria-hidden />
      </div>
    </div>
  );
}
