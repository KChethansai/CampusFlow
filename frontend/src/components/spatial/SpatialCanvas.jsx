// SpatialCanvas: lazy 3D host in a tilt-card widget. Never blocks paint;
// static atmosphere fallback + low-GPU modal on mobile, reduced-motion,
// WebGL failure, or GPU context loss.
import { Suspense, lazy, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Info, RotateCcw, X } from 'lucide-react';
import { useReducedMotion } from '../../system/motion';
import { TiltCard } from '../ui/editorial';
import { DOMAINS } from './domains';
import ErrorBoundary from './ErrorBoundary';

const Scene = lazy(() => import('./CampusScene'));

export function DomainHint({ domain }) {
  if (!domain) {
    return (
      <p className="text-xs text-[var(--cf-ink-mute)]">
        Hover the campus — each tower is a living system.
      </p>
    );
  }
  return (
    <div className="text-xs">
      <p className="font-semibold text-[var(--cf-ink)]">{domain.label}</p>
      <p className="text-[var(--cf-ink-mute)]">{domain.hint}</p>
    </div>
  );
}

export default function SpatialCanvas({ className, style, compact, tilt = false }) {
  const reduced = useReducedMotion();
  const [failed, setFailed] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const [sceneKey, setSceneKey] = useState(0);
  const [hovered, setHovered] = useState(null);
  const [started, setStarted] = useState(false);
  const [lowGpuInfo, setLowGpuInfo] = useState(false);

  // ponytail: IntersectionObserver-gated lazy 3D — offscreen canvases never init WebGL.
  const lite =
    reduced ||
    failed ||
    contextLost ||
    (typeof window !== 'undefined' && window.innerWidth < 768 && compact !== false);

  const inner = (
    <div
      className="w-full h-full"
      ref={(el) => {
        if (!el || started) return;
        const io = new IntersectionObserver(
          (entries) => {
            if (entries[0]?.isIntersecting) {
              setStarted(true);
              io.disconnect();
            }
          },
          { rootMargin: '200px' }
        );
        io.observe(el);
      }}
    >
      {!started || lite ? (
        <div
          className="cf-atmosphere w-full h-full rounded-[24px] border border-black/10 dark:border-white/10 relative overflow-hidden"
        >
          <div className="absolute top-3 right-3 flex gap-1.5">
            <button
              onClick={() => setLowGpuInfo(true)}
              aria-label="Why am I seeing a static preview?"
              className="p-1.5 rounded-full cf-glass border border-black/10 dark:border-white/10 text-[var(--cf-ink-mute)] hover:text-[var(--cf-ink)] transition"
            >
              <Info size={14} />
            </button>
            {(failed || contextLost) && (
              <button
                onClick={() => { setFailed(false); setContextLost(false); setSceneKey((k) => k + 1); }}
                aria-label="Retry 3D scene"
                className="p-1.5 rounded-full cf-glass border border-black/10 dark:border-white/10 text-[var(--cf-ink-mute)] hover:text-[var(--cf-ink)] transition"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>
          <div className="absolute inset-0 flex items-end p-4">
            <div className="flex flex-wrap gap-1.5">
              {DOMAINS.map((d) => (
                <span
                  key={d.key}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-full border border-black/10 dark:border-white/10 cf-glass"
                >
                  <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5" style={{ background: d.color }} />
                  {d.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <ErrorBoundary onError={() => setFailed(true)}>
          <Suspense
            fallback={
              <div className="cf-atmosphere w-full h-full rounded-[24px] border border-black/10 dark:border-white/10 animate-pulse" aria-hidden />
            }
          >
            <div className="relative w-full h-full rounded-[24px] border border-black/10 dark:border-white/10 overflow-hidden">
              <Scene
                key={sceneKey}
                onHover={setHovered}
                autoRotate={!reduced}
                className="w-full h-full"
                onContextLost={() => setContextLost(true)}
                onContextRestored={() => {
                  setContextLost(false);
                  setSceneKey((k) => k + 1); // fresh renderer on restore
                }}
              />
              <div className="absolute left-3 bottom-3 right-3 cf-glass rounded-2xl border border-black/10 dark:border-white/10 px-3 py-2 pointer-events-none">
                <DomainHint domain={hovered} />
              </div>
            </div>
          </Suspense>
        </ErrorBoundary>
      )}
    </div>
  );

  return (
    <>
      {tilt ? <TiltCard className={className} style={style}>{inner}</TiltCard> : <div className={className} style={style}>{inner}</div>}
      <AnimatePresence>
        {lowGpuInfo && (
          <motion.div className="fixed inset-0 z-[90] grid place-items-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label="Static preview info">
            <button aria-label="Close" onClick={() => setLowGpuInfo(false)} className="absolute inset-0 bg-obsidian-950/70 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.97, y: 8 }} transition={{ type: 'spring', stiffness: 350, damping: 25 }} className="relative max-w-sm w-full cf-glass backdrop-blur-xl bg-[var(--cf-surface)]/90 border border-white/10 rounded-2xl p-5 shadow-4">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-semibold">Static campus preview</h2>
                <button onClick={() => setLowGpuInfo(false)} aria-label="Dismiss" className="p-1.5 rounded-full hover:bg-black/[.05] dark:hover:bg-white/10"><X size={16} /></button>
              </div>
              <p className="mt-2 text-sm text-[var(--cf-ink-mute)]">You are seeing a lightweight preview because reduced motion is on, this is a small screen, or the GPU context was lost. All campus systems are listed below and every page remains fully usable.</p>
              <button onClick={() => { setLowGpuInfo(false); setFailed(false); setContextLost(false); setSceneKey((k) => k + 1); }} className="mt-4 w-full px-4 py-2 rounded-full bg-primary-600 text-white text-sm font-medium hover:bg-primary-500 transition">Retry 3D scene</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
