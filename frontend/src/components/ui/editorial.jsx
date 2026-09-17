// Editorial motion primitives — NOTA-grade reveals, scrub, carousels, loader.
// All Motion.dev, all reduced-motion safe. Normalized to CampusFlow tokens.
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '../../system/tokens';

/** SplitReveal: line-mask reveal for statement lines (React-Bits pattern, tokenized). */
export function SplitReveal({ lines = [], className, as: Tag = 'div', delay = 0 }) {
  const reduced = useReducedMotion();
  return (
    <Tag className={className} aria-label={lines.join(' ')}>
      {lines.map((line, i) => (
        <span key={i} className="cf-mask" aria-hidden>
          <motion.span
            initial={reduced ? { opacity: 0 } : { y: '110%' }}
            whileInView={reduced ? { opacity: 1 } : { y: '0%' }}
            viewport={{ once: true, margin: '-12% 0px' }}
            transition={{ duration: 0.7, delay: delay + i * 0.09, ease: [0.22, 1, 0.36, 1] }}
            dangerouslySetInnerHTML={{ __html: line }}
          />
        </span>
      ))}
    </Tag>
  );
}

/** ScrollScrub: maps scroll progress of a tall section to a 0..1 value. */
export function useScrubProgress(ref, offset = ['start end', 'end start']) {
  const { scrollYProgress } = useScroll({ target: ref, offset });
  return useSpring(scrollYProgress, { stiffness: 90, damping: 26, mass: 0.6 });
}

/** ScrubBand: sticky stage + scrolling copy (NOTA spec-pen pattern). */
export function ScrubBand({ stage, children, className, id }) {
  return (
    <section id={id} className={cn('relative', className)}>
      <div className="lg:sticky lg:top-0 lg:min-h-screen flex items-center">{stage}</div>
      <div className="relative">{children}</div>
    </section>
  );
}

/** Preloader: % counter overlay, first-visit only (sessionStorage). */
export function Preloader({ label = 'CampusFlow' }) {
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(() => {
    try {
      return sessionStorage.getItem('cf_preloaded') === '1';
    } catch {
      return false;
    }
  });
  const reduced = useReducedMotion();

  useEffect(() => {
    if (done) return;
    if (reduced) {
      setCount(100);
      setDone(true);
      try { sessionStorage.setItem('cf_preloaded', '1'); } catch { /* ignore */ }
      return;
    }
    let v = 0;
    const id = setInterval(() => {
      v = Math.min(100, v + Math.ceil(Math.random() * 14));
      setCount(v);
      if (v >= 100) {
        clearInterval(id);
        setTimeout(() => {
          setDone(true);
          try { sessionStorage.setItem('cf_preloaded', '1'); } catch { /* ignore */ }
        }, 250);
      }
    }, 90);
    return () => clearInterval(id);
  }, [done, reduced]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="fixed inset-0 z-[100] bg-[var(--cf-bg)] flex flex-col items-center justify-center"
          exit={{ opacity: 0, transition: { duration: 0.4 } }}
          role="status"
          aria-label="Loading"
        >
          <p className="cf-display italic text-2xl">{label}</p>
          <p className="mt-3 text-6xl font-light tabular-nums" aria-hidden>{count}<span className="text-2xl align-top"> %</span></p>
          <div className="mt-6 h-px w-40 bg-black/10 dark:bg-white/10 overflow-hidden" aria-hidden>
            <div className="h-full bg-primary-500 transition-all" style={{ width: `${count}%` }} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** CounterCarousel: swipe/drag slides with `i / n` counter + keyboard (NOTA 1/3, 1/5 pattern). */
export function CounterCarousel({ slides = [], label, className, id }) {
  const [[index, dir], setIndex] = useState([0, 0]);
  const reduced = useReducedMotion();
  const go = (d) => setIndex(([i]) => [(i + d + slides.length) % slides.length, d]);
  const total = slides.length;
  if (!total) return null;

  return (
    <div className={className} id={id}>
      <div className="flex items-end justify-between mb-4">
        {label && <p className="cf-kicker">{label}</p>}
        <p className="text-sm tabular-nums text-[var(--cf-ink-mute)]" aria-live="polite">
          {index + 1} / {total}
        </p>
      </div>
      <div
        className="relative overflow-hidden rounded-3xl"
        role="region"
        aria-roledescription="carousel"
        aria-label={label || 'Highlights'}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') go(1);
          if (e.key === 'ArrowLeft') go(-1);
        }}
      >
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.div
            key={index}
            custom={dir}
            initial={reduced ? { opacity: 0 } : { opacity: 0, x: dir >= 0 ? 80 : -80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, x: dir >= 0 ? -80 : 80 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            drag={reduced ? false : 'x'}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.6}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) go(1);
              else if (info.offset.x > 60) go(-1);
            }}
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${total}`}
          >
            {slides[index]}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="flex items-center gap-2 mt-4">
        <button onClick={() => go(-1)} aria-label="Previous slide" className="p-2.5 rounded-full border border-[var(--cf-line)] hover:bg-black/[.04] dark:hover:bg-white/10 transition">
          <ArrowLeft size={16} />
        </button>
        <button onClick={() => go(1)} aria-label="Next slide" className="p-2.5 rounded-full border border-[var(--cf-line)] hover:bg-black/[.04] dark:hover:bg-white/10 transition">
          <ArrowRight size={16} />
        </button>
        <div className="flex gap-1.5 ml-2" aria-hidden>
          {slides.map((_, i) => (
            <button key={i} tabIndex={-1} onClick={() => setIndex([i, i > index ? 1 : -1])}
              className={cn('h-1.5 rounded-full transition-all', i === index ? 'w-6 bg-primary-500' : 'w-1.5 bg-black/15 dark:bg-white/20')} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Marquee: infinite strip (Magic-UI pattern, CSS-only). */
export function Marquee({ children, className, label }) {
  const reduced = useReducedMotion();
  if (reduced) {
    return <div className={cn('flex gap-3 overflow-hidden', className)} aria-label={label}>{children}</div>;
  }
  return (
    <div className={cn('overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]', className)} aria-label={label}>
      <div className="cf-marquee-track gap-3 pr-3">
        {children}
        {children}
      </div>
    </div>
  );
}

/** MagneticButton: subtle pointer pull on desktop (React-Bits pattern). */
export function MagneticButton({ children, className, ...props }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  if (reduced) {
    return <button ref={ref} className={className} {...props}>{children}</button>;
  }
  return (
    <motion.button
      ref={ref}
      className={className}
      animate={{ x: offset.x, y: offset.y }}
      transition={{ type: 'spring', stiffness: 300, damping: 18 }}
      onMouseMove={(e) => {
        if (window.innerWidth < 1024) return;
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        setOffset({ x: (e.clientX - (r.left + r.width / 2)) * 0.18, y: (e.clientY - (r.top + r.height / 2)) * 0.28 });
      }}
      onMouseLeave={() => setOffset({ x: 0, y: 0 })}
      {...props}
    >
      {children}
    </motion.button>
  );
}

/** useParallax: scroll-linked y translation for floating product visuals. */
export function useParallax(ref, distance = 60) {
  const progress = useScrubProgress(ref);
  return useTransform(progress, [0, 1], [distance, -distance]);
}

// --- Luxury primitives (Stitch Loop Step 3: kinetic physics + tokens) ---

/** AnimatedCounter: rAF count-up, reduced-motion safe. No fake precision — pass real values only. */
export function AnimatedCounter({ value = 0, decimals = 0, suffix = '', prefix = '', className, duration = 1200 }) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(reduced ? value : 0);
  useEffect(() => {
    if (reduced) { setDisplay(value); return; }
    let raf; const start = performance.now(); const from = 0;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (value - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, reduced]);
  return (
    <span className={cn('tabular-nums', className)}>
      {prefix}{Number(display).toFixed(decimals)}{suffix}
    </span>
  );
}

/** SpotCard: mouse-tracked radial spotlight via CSS vars (no re-render). */
export function SpotCard({ className, children, ...props }) {
  const ref = useRef(null);
  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        const el = ref.current; if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - r.left}px`);
        el.style.setProperty('--my', `${e.clientY - r.top}px`);
      }}
      className={cn('cf-card-spot', className)}
      {...props}
    >
      {children}
    </div>
  );
}

/** TiltCard: 3D tilt with motion values (no useState on pointer path). */
export function TiltCard({ className, children, max = 7, ...props }) {
  const reduced = useReducedMotion();
  const ref = useRef(null);
  const rx = useMotionValue(0); const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 350, damping: 25 });
  const sry = useSpring(ry, { stiffness: 350, damping: 25 });
  if (reduced) return <div className={className} {...props}>{children}</div>;
  return (
    <motion.div
      ref={ref}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 900 }}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect(); if (!r) return;
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        rx.set(-py * max * 2); ry.set(px * max * 2);
      }}
      onMouseLeave={() => { rx.set(0); ry.set(0); }}
      className={cn('cf-tilt', className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** BentoGrid / BentoCell: rhythm-first grid helpers (exact cell count = content count). */
export function BentoGrid({ className, children }) {
  return <div className={cn('grid gap-4 md:grid-cols-6', className)}>{children}</div>;
}
export function BentoCell({ span = 'md:col-span-2', className, children, spot = true }) {
  return (
    <SpotCard className={cn('bg-[var(--cf-surface)] rounded-2xl border border-[var(--cf-line)] p-5 sm:p-6 shadow-brutal-sm', span, className)}>
      {children}
    </SpotCard>
  );
}

/** HeroBackdrop: ambient beams + grid + meteors (CSS-only, zero deps). */
export function HeroBackdrop({ meteors = 3, className }) {
  const reduced = useReducedMotion();
  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <div className="absolute inset-0 bg-grid-black/[0.04] dark:bg-grid-white/[0.02]" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[420px] w-[720px] rounded-full bg-primary-500/15 dark:bg-primary-500/25 blur-[110px]" />
      <div className="absolute top-20 -left-24 h-72 w-72 rounded-full bg-accent-violet/15 blur-[100px]" />
      <div className="absolute bottom-0 right-0 h-72 w-96 rounded-full bg-accent-cyan/10 blur-[100px]" />
      {!reduced && Array.from({ length: meteors }).map((_, i) => (
        <span
          key={i}
          className="absolute top-10 h-px w-40 rotate-[215deg] bg-gradient-to-r from-primary-400 to-transparent animate-meteor"
          style={{ left: `${18 + i * 28}%`, animationDelay: `${i * 1.6}s`, opacity: .7 }}
        />
      ))}
    </div>
  );
}

/** BeamCard: animated gradient border wrapper (Magic-UI beam, tokenized). */
export function BeamCard({ className, children, ...props }) {
  return (
    <div className={cn('cf-beam rounded-2xl', className)} {...props}>
      <div className="rounded-[calc(1rem-1px)] bg-[var(--cf-surface)] h-full">{children}</div>
    </div>
  );
}

/** SectionHeader: numbered brutal section heading — `01 / Kicker` + display title. */
export function SectionHeader({ number, kicker, title, body, actions, className, id }) {
  return (
    <div id={id} className={cn('flex flex-wrap items-end justify-between gap-3 mb-5', className)}>
      <div className="min-w-0">
        {(number || kicker) && (
          <p className="cf-kicker mb-1.5 flex items-center gap-2">
            {number && (
              <span className="inline-flex items-center justify-center min-w-7 px-1.5 py-0.5 bg-frame text-volt border-2 border-[var(--cf-ink)] rounded-md shadow-brutal-sm font-mono text-[11px] font-bold">
                {number}
              </span>
            )}
            {kicker}
          </p>
        )}
        {title && (
          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[var(--cf-ink)]">
            {title}
          </h2>
        )}
        {body && <p className="mt-1 text-sm text-[var(--cf-ink-mute)] max-w-prose">{body}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
