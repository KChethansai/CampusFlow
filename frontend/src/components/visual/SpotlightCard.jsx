import { useRef } from 'react';
import { useReducedMotion } from '../../system/motion';
import { cn } from '../../system/tokens';

/**
 * SpotlightCard (21st.dev inspired pattern)
 * Interactive card with pointer-tracking radial spotlight border and surface glow.
 * Updates CSS variables directly without triggering React re-renders.
 */
export default function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(216, 109, 62, 0.15)',
  borderColor = 'rgba(216, 109, 62, 0.4)',
  ...props
}) {
  const containerRef = useRef(null);
  const reduced = useReducedMotion();

  const handleMouseMove = (e) => {
    if (reduced || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    containerRef.current.style.setProperty('--mouse-x', `${x}px`);
    containerRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={cn(
        'group relative rounded-3xl border border-[var(--cf-line)] bg-[var(--cf-surface)] p-6 transition-all duration-300',
        'hover:border-black/20 dark:hover:border-white/20',
        className
      )}
      style={{
        '--mouse-x': '50%',
        '--mouse-y': '50%'
      }}
      {...props}
    >
      {/* Dynamic spotlight gradient layer */}
      {!reduced && (
        <div
          className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(400px circle at var(--mouse-x) var(--mouse-y), ${spotlightColor}, transparent 70%)`
          }}
          aria-hidden
        />
      )}

      {/* Subtle border highlight under cursor */}
      {!reduced && (
        <div
          className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(280px circle at var(--mouse-x) var(--mouse-y), ${borderColor}, transparent 80%)`,
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'exclude',
            WebkitMaskComposite: 'xor',
            padding: '1px'
          }}
          aria-hidden
        />
      )}

      <div className="relative z-10">{children}</div>
    </div>
  );
}
