// SpatialCanvas: lazy 3D host. Never blocks paint; static atmosphere fallback
// on mobile, reduced-motion, WebGL failure, or GPU context loss.
import { Suspense, lazy, useState } from 'react';
import { useReducedMotion } from '../../system/motion';
import { DOMAINS } from './domains';

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

export default function SpatialCanvas({ className, style, compact }) {
  const reduced = useReducedMotion();
  const [failed, setFailed] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const [sceneKey, setSceneKey] = useState(0);
  const [hovered, setHovered] = useState(null);
  const [started, setStarted] = useState(false);

  // ponytail: IntersectionObserver-gated lazy 3D — offscreen canvases never init WebGL.
  const lite =
    reduced ||
    failed ||
    contextLost ||
    (typeof window !== 'undefined' && window.innerWidth < 768 && compact !== false);

  return (
    <div
      className={className}
      style={style}
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
          className="cf-atmosphere w-full h-full rounded-3xl border border-[var(--cf-line)] relative overflow-hidden"
          aria-hidden
        >
          <div className="absolute inset-0 flex items-end p-4">
            <div className="flex flex-wrap gap-1.5">
              {DOMAINS.map((d) => (
                <span
                  key={d.key}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-full border border-[var(--cf-line)] bg-[var(--cf-surface)]"
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
              <div className="cf-atmosphere w-full h-full rounded-3xl border border-[var(--cf-line)] animate-pulse" aria-hidden />
            }
          >
            <div className="relative w-full h-full">
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
              <div className="absolute left-3 bottom-3 right-3 cf-glass rounded-2xl border border-[var(--cf-line)] px-3 py-2 pointer-events-none">
                <DomainHint domain={hovered} />
              </div>
            </div>
          </Suspense>
        </ErrorBoundary>
      )}
    </div>
  );
}

import { Component } from 'react';
class ErrorBoundary extends Component {
  constructor(p) { super(p); this.state = { bad: false }; }
  static getDerivedStateFromError() { return { bad: true }; }
  componentDidCatch() { this.props.onError?.(); }
  render() { return this.state.bad ? null : this.props.children; }
}
