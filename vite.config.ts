import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'suppress-vite-hmr-ws',
        transformIndexHtml: {
          order: 'pre',
          handler() {
            return [
              {
                tag: 'script',
                attrs: { type: 'text/javascript' },
                injectTo: 'head-prepend',
                children: `
(function() {
  if (typeof window !== 'undefined' && window.WebSocket) {
    var NativeWS = window.WebSocket;
    var MockWS = function(url, protocols) {
      var isHmr = (protocols === 'vite-hmr') ||
                  (Array.isArray(protocols) && protocols.indexOf('vite-hmr') !== -1) ||
                  (typeof url === 'string' && (url.indexOf('token=') !== -1 || url.indexOf('24678') !== -1));
      if (isHmr) {
        var listeners = {};
        return {
          readyState: 1,
          OPEN: 1,
          CLOSED: 3,
          CONNECTING: 0,
          CLOSING: 2,
          url: url,
          protocol: 'vite-hmr',
          send: function() {},
          close: function() {},
          addEventListener: function(evt, cb) {
            listeners[evt] = listeners[evt] || [];
            listeners[evt].push(cb);
            if (evt === 'open') {
              setTimeout(function() { cb({ type: 'open' }); }, 0);
            }
          },
          removeEventListener: function(evt, cb) {
            if (listeners[evt]) {
              listeners[evt] = listeners[evt].filter(function(fn) { return fn !== cb; });
            }
          },
          dispatchEvent: function() { return true; }
        };
      }
      return new NativeWS(url, protocols);
    };
    MockWS.prototype = NativeWS.prototype;
    MockWS.OPEN = 1;
    MockWS.CLOSED = 3;
    MockWS.CONNECTING = 0;
    MockWS.CLOSING = 2;
    window.WebSocket = MockWS;
  }
  var origErr = console.error;
  console.error = function() {
    for (var i = 0; i < arguments.length; i++) {
      var arg = arguments[i];
      var str = (arg && arg.stack) ? String(arg.stack) : String(arg);
      if (
        str.indexOf('WebSocket closed without opened') !== -1 ||
        str.indexOf('failed to connect to websocket') !== -1 ||
        (str.toLowerCase().indexOf('websocket') !== -1 && str.toLowerCase().indexOf('vite') !== -1)
      ) {
        return;
      }
    }
    return origErr.apply(console, arguments);
  };
  window.addEventListener('error', function(e) {
    var msg = (e && (e.message || (e.error && e.error.message))) || '';
    if (msg.indexOf('WebSocket') !== -1 || msg.indexOf('websocket') !== -1 || msg.indexOf('@vite/client') !== -1) {
      e.stopImmediatePropagation();
      if (e.preventDefault) e.preventDefault();
    }
  }, true);
  window.addEventListener('unhandledrejection', function(e) {
    var reason = (e && (e.reason ? (e.reason.message || String(e.reason)) : '')) || '';
    if (reason.indexOf('WebSocket') !== -1 || reason.indexOf('websocket') !== -1 || reason.indexOf('@vite/client') !== -1) {
      e.stopImmediatePropagation();
      if (e.preventDefault) e.preventDefault();
    }
  }, true);
})();
`,
              },
            ];
          },
        },
      },
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.ico',
          'favicon.svg',
          'apple-touch-icon.png',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-512x512.png',
        ],
        manifest: {
          id: '/',
          name: 'MarketMate™ - Know Your Numbers, Grow Your Business',
          short_name: 'MarketMate',
          description:
            'AI-assisted business management, POS register, and financial intelligence application for Nigerian merchants.',
          theme_color: '#059669',
          background_color: '#042f2e',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MiB to allow bundle precaching
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
