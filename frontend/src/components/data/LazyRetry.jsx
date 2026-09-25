// Chunk-resilient lazy loading: stale precached shell + rotated chunk hashes
// make bare import() reject, which would otherwise propagate to the route
// AppErrorBoundary as "This page hit a snag". lazyRetry re-attempts the
// dynamic import a few times with backoff, then throws for the boundary.
import { Component, lazy } from 'react';

const RETRIES = 3;
const BASE_DELAY_MS = 500;

export function lazyRetry(importFn, retries = RETRIES, baseDelayMs = BASE_DELAY_MS) {
  return lazy(
    () =>
      new Promise((resolve, reject) => {
        const attempt = (n) => {
          importFn().then(resolve, (err) => {
            if (n >= retries) reject(err);
            else setTimeout(() => attempt(n + 1), baseDelayMs * n);
          });
        };
        attempt(1);
      })
  );
}

export function ChunkFallback({ onRetry, label = 'Loading chart…' }) {
  return (
    <div className="grid place-items-center gap-2 py-4 text-sm text-[var(--cf-ink-mute)]" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
      <p>{label}</p>
      <button
        type="button"
        onClick={onRetry ?? (() => window.location.reload())}
        className="rounded-full border border-[var(--cf-line)] px-3 py-1 text-xs font-semibold text-[var(--cf-ink)] hover:border-[var(--cf-accent)]/60"
      >
        Retry
      </button>
    </div>
  );
}

// Local boundary so a chunk failure shows ChunkFallback (with Retry → full
// reload for shell mismatch) instead of bubbling to the route error page.
// Note: Retry reloads rather than resetting state because React caches the
// rejected lazy import — a re-render would re-throw the same stale URL.
export class ChunkErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return this.props.fallback ?? <ChunkFallback label="Chart failed to load." />;
    }
    return this.props.children;
  }
}
