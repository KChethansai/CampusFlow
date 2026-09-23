import { useState } from 'react';
import { Link } from 'react-router';
import { motion, useMotionValueEvent, useReducedMotion, useScroll } from 'motion/react';
import LiquidGlassButton from '../visual/LiquidGlassButton';
import { cn } from '../../system/tokens';

const NAV = [
  { label: 'Platform', to: '/dashboard' },
  { label: 'Academics', to: '/attendance' },
  { label: 'Placements', to: '/placement' },
  { label: 'Intelligence', to: '/ai-reports' }
];

export default function LandingHeader() {
  const reduced = useReducedMotion();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [hoveredNav, setHoveredNav] = useState(null);

  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 24));

  return (
    <header className="fixed top-3 sm:top-5 inset-x-0 z-50 px-3 sm:px-4">
      <motion.div
        animate={reduced ? {} : { y: scrolled ? 0 : 4, opacity: 1 }}
        initial={{ y: -16, opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          'max-w-5xl mx-auto rounded-full border pl-4 pr-2 py-2 flex items-center justify-between gap-2 transition-all duration-300',
          scrolled
            ? 'cf-glass border-black/10 dark:border-white/15 shadow-lg shadow-black/[0.06] dark:shadow-black/40'
            : 'bg-transparent border-transparent'
        )}
      >
        <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="CampusFlow home">
          <span className="w-8 h-8 rounded-full bg-[#A94727] text-white grid place-items-center font-display font-bold text-sm" aria-hidden>
            C
          </span>
          <span className="font-display font-semibold tracking-tight text-[17px]">CampusFlow</span>
        </Link>
        <nav
          className="hidden md:flex items-center gap-1"
          aria-label="Product"
          onMouseLeave={() => setHoveredNav(null)}
        >
          {NAV.map((n) => (
            <Link
              key={n.label}
              to={n.to}
              onMouseEnter={() => setHoveredNav(n.label)}
              className="relative px-3.5 py-2 rounded-full text-sm font-medium text-[#4B5563] dark:text-[#A7B0BF] hover:text-[#100D0B] dark:hover:text-white transition-colors"
            >
              {hoveredNav === n.label && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-full bg-black/[0.05] dark:bg-white/[0.09] -z-10"
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                />
              )}
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/login"
            className="hidden sm:block px-3 py-2 rounded-full text-sm font-semibold text-[#4B5563] dark:text-[#A7B0BF] hover:text-[#100D0B] dark:hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <LiquidGlassButton to="/login" size="sm">
            Get Started
          </LiquidGlassButton>
        </div>
      </motion.div>
    </header>
  );
}
