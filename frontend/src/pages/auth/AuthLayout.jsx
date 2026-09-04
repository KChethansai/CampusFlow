// AuthLayout: spatial split — immersive campus visual + minimal auth surface.
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import SpatialCanvas from '../../components/spatial/SpatialCanvas';
import { motionVariants } from '../../system/motion';

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 cf-atmosphere">
      <div className="hidden lg:flex flex-col justify-between p-10 relative overflow-hidden">
        <Link to="/" className="flex items-center gap-2.5" aria-label="CampusFlow home">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-violet grid place-items-center text-white font-bold shadow-2" aria-hidden>C</span>
          <span className="font-bold tracking-tight text-lg">CampusFlow</span>
        </Link>
        <div className="h-[46vh] min-h-[320px]">
          <SpatialCanvas className="w-full h-full" compact={false} />
        </div>
        <div>
          <p className="text-xl font-bold tracking-tight">The operating system for your campus.</p>
          <p className="mt-1 text-sm text-[var(--cf-ink-mute)]">One identity across academics, placements and campus life.</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-4 sm:p-8">
        <motion.div {...motionVariants.page} className="w-full max-w-md">
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-6" aria-label="CampusFlow home">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-accent-violet grid place-items-center text-white font-bold text-sm" aria-hidden>C</span>
            <span className="font-bold tracking-tight">CampusFlow</span>
          </Link>
          <div className="bg-[var(--cf-surface)] rounded-3xl shadow-3 border border-[var(--cf-line)] p-6 sm:p-8">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-[var(--cf-ink-mute)]">{subtitle}</p>}
            <div className="mt-6">{children}</div>
            {footer && <div className="mt-6 pt-5 border-t border-[var(--cf-line)] text-sm text-center text-[var(--cf-ink-mute)]">{footer}</div>}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
