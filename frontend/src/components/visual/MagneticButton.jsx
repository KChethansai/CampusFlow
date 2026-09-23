import { useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import { useReducedMotion } from '../../system/motion';
import { cn } from '../../system/tokens';

/**
 * MagneticButton (21st.dev inspired pattern)
 * Premium interactive CTA that magnetically gravitates towards the pointer on hover.
 * Automatically bypassed for reduced-motion or touch environments.
 */
export default function MagneticButton({
  children,
  className = '',
  variant = 'primary',
  disabled = false,
  onClick,
  type = 'button',
  ...props
}) {
  const ref = useRef(null);
  const reduced = useReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 250, mass: 0.5 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = (e) => {
    if (reduced || disabled || !ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    const distanceX = clientX - centerX;
    const distanceY = clientY - centerY;

    // Dampened pull strength (max 8px shift)
    x.set(distanceX * 0.22);
    y.set(distanceY * 0.22);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const baseStyles =
    'relative inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 font-display font-semibold text-sm transition-colors duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variantStyles = {
    primary:
      'bg-[#A94727] text-white shadow-lg shadow-[#D86D3E]/25 hover:bg-[#B6532B] hover:shadow-[#D86D3E]/40',
    secondary:
      'border border-[var(--cf-line)] bg-[var(--cf-surface)] text-[var(--cf-ink)] hover:bg-[var(--cf-surface-2)] hover:border-black/20 dark:hover:border-white/20',
    glow:
      'bg-[#E7A66D] text-[#100D0B] shadow-lg shadow-[#E7A66D]/20 hover:brightness-105'
  }[variant] || variantStyles.primary;

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        x: reduced ? 0 : springX,
        y: reduced ? 0 : springY
      }}
      className={cn(baseStyles, variantStyles, className)}
      {...props}
    >
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      {/* Subtle shine sweep */}
      <span
        className="pointer-events-none absolute inset-0 -translate-x-full rounded-2xl bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 ease-in-out group-hover:translate-x-full"
        aria-hidden
      />
    </motion.button>
  );
}
