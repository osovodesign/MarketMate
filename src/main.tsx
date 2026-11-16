import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker with immediate cache precaching
try {
  registerSW({
    immediate: true,
    onRegisterError() {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/pwa-sw.js', { scope: '/' }).catch(() => {});
      }
    },
  });
} catch {
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('/pwa-sw.js', { scope: '/' }).catch(() => {});
  }
}

// Ensure fallback service worker is active if virtual registration did not attach in middleware mode
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      if (!regs || regs.length === 0) {
        navigator.serviceWorker.register('/pwa-sw.js', { scope: '/' }).catch(() => {});
      }
    }).catch(() => {});
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
