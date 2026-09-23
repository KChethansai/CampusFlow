import { useRef } from 'react';
import { Link } from 'react-router';
import { motion, useMotionValue, useSpring } from 'motion/react';
import { useReducedMotion } from '../../system/motion';
import { ArrowRight } from 'lucide-react';

/**
 * LiquidGlassButton
 * 21st.dev-caliber fluid glass button with an animated moving border sheen,
 * spring-physics magnetic micro-pull, and subtle radial ember bloom.
 */
export default function LiquidGlassButton({
  to,
  onClick,
  children,
  icon: Icon = ArrowRight,
  variant = 'primary', // 'primary' | 'secondary' | 'ghost'
  className = '',
  size = 'md'
}) {
  const ref = useRef(null);
  const reduced = useReducedMotion();

  const x = useSpring(useMotionValue(0), { stiffness: 280, damping: 22 });
  const y = useSpring(useMotionValue(0), { stiffness: 280, damping: 22 });

  const handlePointerMove = (e) => {
    if (reduced || window.innerWidth < 768 || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * 0.12);
    y.set((e.clientY - centerY) * 0.16);
  };

  const handlePointerLeave = () => {
    x.set(0);
    y.set(0);
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-xs gap-1.5',
    md: 'px-6 py-3 text-sm gap-2',
    lg: 'px-8 py-4 text-base gap-2.5 font-semibold'
  }[size] || 'px-6 py-3 text-sm gap-2';

  const variants = {
    primary:
      'bg-gradient-to-r from-[#D86D3E] via-[#E7A66D] to-[#D86D3E] bg-[length:200%_auto] text-[#100D0B] font-semibold shadow-lg shadow-[#D86D3E]/25 hover:shadow-xl hover:shadow-[#D86D3E]/40 border border-white/25 hover:brightness-105 active:scale-[0.98]',
    secondary:
      'bg-[#1C1512]/80 backdrop-blur-xl text-white font-medium border border-white/10 hover:border-[#D86D3E]/50 hover:bg-[#251C17] shadow-lg shadow-black/30 active:scale-[0.98]',
    ghost:
      'bg-transparent text-[var(--cf-ink-soft)] hover:text-[var(--cf-ink)] border border-transparent hover:border-[var(--cf-line)] active:scale-[0.98]'
  }[variant] || 'bg-[#E7A66D] text-[#100D0B]';

  const content = (
    <motion.span
      ref={ref}
      style={reduced ? undefined : { x, y }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`group relative inline-flex items-center justify-center rounded-full transition-all duration-300 overflow-hidden cursor-pointer select-none ${sizeClasses} ${variants} ${className}`}
    >
      {/* Moving glass sheen highlight for primary */}
      {variant === 'primary' && !reduced && (
        <span
          className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none"
          aria-hidden
        />
      )}

      {/* Button label */}
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>

      {/* Trailing Icon with micro-motion */}
      {Icon && (
        <span className="relative z-10 transition-transform duration-200 group-hover:translate-x-1" aria-hidden>
          <Icon size={size === 'lg' ? 18 : 15} />
        </span>
      )}
    </motion.span>
  );

  if (to) {
    return (
      <Link to={to} onClick={onClick} className="inline-block">
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className="inline-block">
      {content}
    </button>
  );
}
