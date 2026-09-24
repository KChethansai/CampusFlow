import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import './index.css';
import { ThemeProvider } from './system/theme';

// Fail loud, not blank: dynamic imports so a config-time throw (bad
// VITE_API_URL, e.g. missing /api/v1) is caught and rendered as an
// actionable message instead of a black screen. The probe can fail on a
// transient cold start, so the card offers a retry (re-runs boot).
const renderConfigError = () => {
  document.getElementById('root').innerHTML =
    '<main style="max-width:32rem;margin:20vh auto;padding:2rem;font-family:system-ui;text-align:center">'
    + '<h1 style="font-size:1.25rem">Service misconfigured</h1>'
    + '<p style="opacity:.7">The app cannot reach its API. This is often temporary (server waking up) — retry before contacting your administrator.</p>'
    + '<button id="cf-retry" style="margin-top:1rem;padding:.6rem 1.2rem;font-size:.9rem;font-weight:600;border-radius:999px;border:0;background:#D86D3E;color:#fff;cursor:pointer">Retry connection</button></main>';
  document.getElementById('cf-retry').addEventListener('click', () => {
    document.getElementById('root').innerHTML = '';
    mount().catch(renderBootError);
  });
};

// Stale precached shell + rotated chunk hashes make the boot import() reject.
// Offer a one-tap recovery (unregister stale service worker, reload latest)
// instead of the static message; non-chunk errors keep the config message.
const CHUNK_ERROR_RE = /ChunkLoadError|Loading chunk|Loading CSS chunk|Failed to fetch dynamically imported module|Importing a module script failed/i;

const renderStaleShellError = () => {
  document.getElementById('root').innerHTML =
    '<main style="max-width:32rem;margin:20vh auto;padding:2rem;font-family:system-ui;text-align:center">'
    + '<h1 style="font-size:1.25rem">A new version is available</h1>'
    + '<p style="opacity:.7">Your saved copy is out of date and could not start.</p>'
    + '<button id="cf-reload" style="margin-top:1rem;padding:.6rem 1.2rem;font-size:.9rem;font-weight:600;border-radius:999px;border:0;background:#D86D3E;color:#fff;cursor:pointer">Reload latest version</button></main>';
  document.getElementById('cf-reload').addEventListener('click', async () => {
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
    } finally {
      window.location.reload();
    }
  });
};

const renderBootError = (err) => {
  if (CHUNK_ERROR_RE.test(err?.message || '')) renderStaleShellError();
  else renderConfigError();
};

const mount = async () => {
  const { assertApiBaseUsable } = await import('./config/api.js');
  await assertApiBaseUsable();
  const { default: App } = await import('./App.jsx');
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ThemeProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </React.StrictMode>
  );
};

mount().catch(renderBootError);
