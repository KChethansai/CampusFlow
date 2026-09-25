import { motion, useReducedMotion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../system/tokens';

export const kicker = 'font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--cf-ink-mute)]';
export const sub = 'mt-3 text-[15px] leading-relaxed text-[var(--cf-ink-soft)] max-w-xl';
// Landing-soft surface: intentionally lighter than app cards (single glassCard owner; tokens.js duplicate removed).
export const glassCard = 'bg-[var(--cf-surface)] rounded-[24px] border border-[var(--cf-line)] shadow-sm';

/* Word-stagger blur reveal. wordClassName (optional) is applied to each word
   span — required when words carry their own background-clip:text gradient,
   since a filtered child breaks the parent's bg-clip:text. */
export function BlurText({ text, className, wordClassName }) {
  const reduced = useReducedMotion();
  if (reduced) return <span className={className}>{text}</span>;
  const words = String(text).split(' ');
  return (
    <span className={className} aria-label={text}>
      {words.map((w, i) => (
        <motion.span
          key={i}
          aria-hidden
          className={cn('inline-block will-change-transform', wordClassName)}
          style={{ marginRight: i < words.length - 1 ? '0.26em' : 0 }}
          initial={{ opacity: 0, filter: 'blur(10px)', y: 10 }}
          whileInView={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          viewport={{ once: true, margin: '-10% 0px' }}
          transition={{ duration: 0.55, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
        >
          {w}
        </motion.span>
      ))}
    </span>
  );
}

/* Scene entrance: single fade-rise per section */
export function Reveal({ children, className, delay = 0 }) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-12% 0px' }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* Section head: clean editorial hierarchy without decorative section numbers or badge chips */
export function SectionHead({ title, body, kickerText }) {
  return (
    <Reveal>
      {kickerText && (
        <p className="font-mono text-xs font-semibold tracking-wider text-[#D86D3E] dark:text-[#F5B08A] uppercase mb-2">
          {kickerText}
        </p>
      )}
      <h2
        className="font-display font-bold tracking-tight text-balance text-[#100D0B] dark:text-[#F5F7FA]"
        style={{ fontSize: 'clamp(2rem,4.6vw,3.6rem)', lineHeight: 1.05 }}
      >
        {title}
      </h2>
      {body && <p className={sub}>{body}</p>}
    </Reveal>
  );
}


export function SectionConnector() {
  return (
    <div className="w-full flex flex-col items-center justify-center py-4 pointer-events-none" aria-hidden>
      <div className="w-px h-8 bg-gradient-to-b from-[#D86D3E]/30 to-transparent" />
      <div className="w-1.5 h-1.5 rounded-full bg-[#E7A66D]/40 my-1 animate-pulse" />
      <div className="w-20 h-px bg-gradient-to-r from-transparent via-[#D86D3E]/20 to-transparent" />
    </div>
  );
}
