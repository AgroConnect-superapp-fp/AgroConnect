import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found. Check your index.html.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  if (import.meta.env.DEV) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        setInterval(
          () => {
            registration.update();
          },
          60 * 60 * 1000
        );
      })
      .catch(() => {
        // El registro del service worker no debe bloquear la aplicación.
      });
  });
}

registerServiceWorker();
