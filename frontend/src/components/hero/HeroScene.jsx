import { Component, Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useReducedMotion } from '../../system/motion';
import HeroSceneFallback from './HeroSceneFallback';

// Lazy load the 3D scene graph so initial paint is instantaneous
const SceneRoot = lazy(() => import('./heroScene/SceneRoot'));

class CanvasErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('HeroScene 3D Canvas error, switching to fallback:', error, errorInfo);
    this.props.onError?.();
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function checkWebGLSupport() {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

/**
 * HeroScene
 * The primary centerpiece visualization of CampusFlow.
 * Replaces the obsolete tower system with a unified, connected campus architecture.
 *
 * GPU-safe lifecycle:
 * - IntersectionObserver pauses frameloop when scrolled out of view.
 * - Tab visibility listener halts GPU work when the tab is hidden.
 * - WebGL context loss recovery.
 * - Automatic fallback for reduced motion, mobile low-power, or WebGL absence.
 */
export default function HeroScene({ className = '' }) {
  const reducedMotion = useReducedMotion();
  const containerRef = useRef(null);

  const [inView, setInView] = useState(false);
  const [tabVisible, setTabVisible] = useState(
    typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
  );
  const [webglSupported, setWebglSupported] = useState(true);
  const [contextLost, setContextLost] = useState(false);
  const [sceneError, setSceneError] = useState(false);

  // Check WebGL support on mount
  useEffect(() => {
    setWebglSupported(checkWebGLSupport());
  }, []);

  // Listen to tab visibility to completely halt WebGL execution in the background
  useEffect(() => {
    const handleVisibilityChange = () => {
      setTabVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // IntersectionObserver to only render when scrolled into view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { rootMargin: '120px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Use fallback if reduced motion, no WebGL, context lost, or scene error
  const shouldUseFallback =
    reducedMotion || !webglSupported || contextLost || sceneError;

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[360px] sm:h-[460px] lg:h-[520px] rounded-[32px] overflow-hidden select-none bg-[#100D0B] border border-black/10 dark:border-white/10 shadow-2xl shadow-[#D86D3E]/[0.06] dark:shadow-black/60 ${className}`}
      aria-label="Connected campus system visualization"
    >
      {shouldUseFallback ? (
        <HeroSceneFallback />
      ) : (
        <CanvasErrorBoundary
          fallback={<HeroSceneFallback />}
          onError={() => setSceneError(true)}
        >
          <Suspense fallback={<HeroSceneFallback />}>
            {inView && (
              <Canvas
                gl={{
                  antialias: true,
                  alpha: true,
                  powerPreference: 'high-performance'
                }}
                dpr={[1, 2]}
                camera={{ position: [0, 1.4, 6.2], fov: 42 }}
                frameloop={inView && tabVisible ? 'always' : 'never'}
                onCreated={({ gl }) => {
                  const canvasEl = gl.domElement;
                  const handleContextLost = (e) => {
                    e.preventDefault();
                    setContextLost(true);
                  };
                  const handleContextRestored = () => {
                    setContextLost(false);
                  };
                  canvasEl.addEventListener('webglcontextlost', handleContextLost, false);
                  canvasEl.addEventListener('webglcontextrestored', handleContextRestored, false);
                }}
              >
                <SceneRoot />
              </Canvas>
            )}
          </Suspense>
        </CanvasErrorBoundary>
      )}

      {/* Subtle radial ambient atmosphere overlay on top of 3D canvas */}
      <div
        className="absolute inset-0 pointer-events-none [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,transparent_40%,black_100%)] bg-[#100D0B]/40"
        aria-hidden
      />
    </div>
  );
}
