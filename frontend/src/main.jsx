import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import './index.css';
import { ThemeProvider } from './system/theme';

// Fail loud, not blank: dynamic imports so a config-time throw (bad
// VITE_API_URL, e.g. missing /api/v1) is caught and rendered as an
// actionable message instead of a black screen.
const renderConfigError = () => {
  document.getElementById('root').innerHTML =
    '<main style="max-width:32rem;margin:20vh auto;padding:2rem;font-family:system-ui;text-align:center">'
    + '<h1 style="font-size:1.25rem">Service misconfigured</h1>'
    + '<p style="opacity:.7">The app cannot reach its API. Contact your administrator.</p></main>';
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

mount().catch(renderConfigError);
