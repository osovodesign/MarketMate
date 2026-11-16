import { useEffect, useState, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms?: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface Window {
    __deferredPWAInstallPrompt?: BeforeInstallPromptEvent | null;
    __pwaIsInstalled?: boolean;
  }
}

export type InstallResult = 'accepted' | 'dismissed' | 'unavailable';

// Module-level singleton state so all PWAInstallButton instances and MobileInstallBanner
// share the exact same captured BeforeInstallPromptEvent even if they mount after page load.
let sharedDeferredPrompt: BeforeInstallPromptEvent | null =
  typeof window !== 'undefined' && window.__deferredPWAInstallPrompt
    ? window.__deferredPWAInstallPrompt
    : null;

let sharedIsInstalled: boolean =
  typeof window !== 'undefined' ? Boolean(window.__pwaIsInstalled) : false;

const subscribers = new Set<() => void>();
const pendingPromptResolvers = new Set<(promptEvt: BeforeInstallPromptEvent | null) => void>();

function notifySubscribers() {
  subscribers.forEach((cb) => {
    try {
      cb();
    } catch {}
  });
}

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return (
      Boolean(window.__pwaIsInstalled) ||
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://')
    );
  } catch {
    return false;
  }
}

function detectInIframe(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function detectDeviceFlags() {
  if (typeof window === 'undefined') {
    return { isIOS: false, isAndroid: false, isMobile: false, isInAppWebView: false };
  }
  const ua = window.navigator.userAgent || '';
  const lower = ua.toLowerCase();
  const isIOS =
    /iphone|ipad|ipod/.test(lower) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /android/.test(lower);
  const isMobile = isIOS || isAndroid || /mobile|phone|tablet/.test(lower);
  // Detect common mobile in-app WebViews (WhatsApp, Instagram, Facebook, X/Twitter, TikTok)
  // that suppress native `beforeinstallprompt` until opened in Chrome/Safari
  const isInAppWebView =
    /whatsapp|fban|fbav|instagram|line\/|twitter|tiktok|wv\)|webview/.test(lower);

  return { isIOS, isAndroid, isMobile, isInAppWebView };
}

let globalListenersInitialized = false;

function initGlobalPWAListeners() {
  if (globalListenersInitialized || typeof window === 'undefined') return;
  globalListenersInitialized = true;

  if (window.__deferredPWAInstallPrompt && !sharedDeferredPrompt) {
    sharedDeferredPrompt = window.__deferredPWAInstallPrompt;
  }
  sharedIsInstalled = detectStandalone();

  const capturePrompt = (e: Event) => {
    const promptEvt = (e as CustomEvent<BeforeInstallPromptEvent>).detail || (e as BeforeInstallPromptEvent);
    if (!promptEvt || typeof promptEvt.prompt !== 'function') return;
    if (typeof e.preventDefault === 'function' && e.type === 'beforeinstallprompt') {
      e.preventDefault();
    }
    sharedDeferredPrompt = promptEvt;
    window.__deferredPWAInstallPrompt = promptEvt;
    if (pendingPromptResolvers.size > 0) {
      pendingPromptResolvers.forEach((resolve) => resolve(promptEvt));
      pendingPromptResolvers.clear();
    }
    notifySubscribers();
  };

  const handleInstalled = () => {
    sharedDeferredPrompt = null;
    window.__deferredPWAInstallPrompt = null;
    sharedIsInstalled = true;
    window.__pwaIsInstalled = true;
    notifySubscribers();
  };

  window.addEventListener('beforeinstallprompt', capturePrompt);
  window.addEventListener('marketmate:pwa-installable', capturePrompt as EventListener);
  window.addEventListener('appinstalled', handleInstalled);
  window.addEventListener('marketmate:pwa-installed', handleInstalled);

  try {
    const mq = window.matchMedia('(display-mode: standalone)');
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', (evt) => {
        if (evt.matches) {
          handleInstalled();
        }
      });
    }
  } catch {}
}

/**
 * Wait briefly (up to timeoutMs) if the user tapped Install while the browser/Service Worker
 * is still finishing initial installability evaluation.
 */
function waitForDeferredPrompt(timeoutMs = 1800): Promise<BeforeInstallPromptEvent | null> {
  if (sharedDeferredPrompt) {
    return Promise.resolve(sharedDeferredPrompt);
  }
  if (typeof window !== 'undefined' && window.__deferredPWAInstallPrompt) {
    sharedDeferredPrompt = window.__deferredPWAInstallPrompt;
    return Promise.resolve(sharedDeferredPrompt);
  }
  return new Promise((resolve) => {
    let settled = false;
    const resolver = (evt: BeforeInstallPromptEvent | null) => {
      if (settled) return;
      settled = true;
      pendingPromptResolvers.delete(resolver);
      resolve(evt);
    };
    pendingPromptResolvers.add(resolver);

    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then(() => {
          if (window.__deferredPWAInstallPrompt && !settled) {
            sharedDeferredPrompt = window.__deferredPWAInstallPrompt;
            resolver(sharedDeferredPrompt);
          }
        })
        .catch(() => {});
    }

    setTimeout(() => {
      resolver(sharedDeferredPrompt || window.__deferredPWAInstallPrompt || null);
    }, timeoutMs);
  });
}

export function getTopLevelInstallUrl(): string {
  if (typeof window === 'undefined') return 'https://getmarketmate.online/?install=1';
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('install', '1');
    return url.toString();
  } catch {
    return 'https://getmarketmate.online/?install=1';
  }
}

/**
 * Build an Android Chrome Intent URL that breaks out of in-app WebViews
 * (e.g., WhatsApp, Facebook, Instagram) and opens Chrome directly to `?install=1`.
 */
export function getAndroidChromeIntentUrl(): string {
  const targetUrl = getTopLevelInstallUrl();
  try {
    const parsed = new URL(targetUrl);
    const hostAndPath = `${parsed.host}${parsed.pathname}${parsed.search}`;
    return `intent://${hostAndPath}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(
      targetUrl
    )};end`;
  } catch {
    return targetUrl;
  }
}

export function usePWAInstall() {
  initGlobalPWAListeners();

  const [, setTick] = useState(0);

  useEffect(() => {
    initGlobalPWAListeners();
    const rerender = () => setTick((t) => t + 1);
    subscribers.add(rerender);

    // Sync immediately in case prompt arrived between render and effect
    if (window.__deferredPWAInstallPrompt && !sharedDeferredPrompt) {
      sharedDeferredPrompt = window.__deferredPWAInstallPrompt;
      rerender();
    }

    return () => {
      subscribers.delete(rerender);
    };
  }, []);

  const install = useCallback(async (waitMs = 0): Promise<InstallResult> => {
    let promptEvent =
      sharedDeferredPrompt ||
      (typeof window !== 'undefined' ? window.__deferredPWAInstallPrompt || null : null);

    if (!promptEvent && waitMs > 0) {
      promptEvent = await waitForDeferredPrompt(waitMs);
    }

    if (!promptEvent) {
      return 'unavailable';
    }

    try {
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') {
        sharedDeferredPrompt = null;
        if (typeof window !== 'undefined') {
          window.__deferredPWAInstallPrompt = null;
          window.__pwaIsInstalled = true;
        }
        sharedIsInstalled = true;
        notifySubscribers();
        return 'accepted';
      }
      // Browser consumes a prompt once shown; clear until browser fires a fresh beforeinstallprompt
      sharedDeferredPrompt = null;
      if (typeof window !== 'undefined') {
        window.__deferredPWAInstallPrompt = null;
      }
      notifySubscribers();
      return 'dismissed';
    } catch (err) {
      console.warn('PWA native install prompt error:', err);
      return 'unavailable';
    }
  }, []);

  const { isIOS, isAndroid, isMobile, isInAppWebView } = detectDeviceFlags();
  const isIframe = detectInIframe();
  const isInstalled = sharedIsInstalled || detectStandalone();
  const isInstallable = Boolean(sharedDeferredPrompt || (typeof window !== 'undefined' && window.__deferredPWAInstallPrompt));

  return {
    isInstallable,
    isInstalled,
    isIOS,
    isAndroid,
    isMobile,
    isIframe,
    isInAppWebView,
    install,
    topLevelInstallUrl: getTopLevelInstallUrl(),
    androidChromeIntentUrl: getAndroidChromeIntentUrl(),
  };
}
