// Editorial motion primitives — NOTA-grade reveals, scrub, carousels, loader.
// All Motion.dev, all reduced-motion safe. Normalized to CampusFlow tokens.
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
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
