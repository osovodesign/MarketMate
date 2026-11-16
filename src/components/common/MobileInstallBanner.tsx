import React, { useEffect, useState } from 'react';
import { Download, X, Share2, PlusSquare, ExternalLink, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

const SESSION_DISMISS_KEY = 'marketmate_mobile_install_banner_dismissed';

export const MobileInstallBanner: React.FC = () => {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isAndroid,
    isMobile,
    isIframe,
    isInAppWebView,
    install,
    topLevelInstallUrl,
    androidChromeIntentUrl,
  } = usePWAInstall();

  const [visible, setVisible] = useState(false);
  const [forceInstallParam, setForceInstallParam] = useState(false);
  const [showIOSSheet, setShowIOSSheet] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect if user arrived via `?install=1` direct launcher
    const params = new URLSearchParams(window.location.search);
    const hasInstallFlag = params.get('install') === '1' || params.get('install') === 'true';

    if (hasInstallFlag) {
      setForceInstallParam(true);
      setVisible(true);
      return;
    }

    // Check if user dismissed the banner during this browser session
    try {
      if (sessionStorage.getItem(SESSION_DISMISS_KEY) === 'true') {
        return;
      }
    } catch {}

    // Show automatically on mobile devices or whenever native install prompt is ready on mobile viewports
    if (isMobile || isInstallable) {
      const timer = setTimeout(() => {
        setVisible(true);
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [isMobile, isInstallable]);

  if (isInstalled || !visible) {
    return null;
  }

  const clearInstallQueryParam = () => {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has('install')) {
        url.searchParams.delete('install');
        window.history.replaceState({}, '', url.pathname + url.search + url.hash);
      }
    } catch {}
  };

  const handleDismiss = () => {
    setVisible(false);
    setForceInstallParam(false);
    clearInstallQueryParam();
    try {
      sessionStorage.setItem(SESSION_DISMISS_KEY, 'true');
    } catch {}
  };

  const handleDirectInstall = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      try {
        const outcome = await install(0);
        if (outcome === 'accepted') {
          clearInstallQueryParam();
          setVisible(false);
        }
      } finally {
        setIsInstalling(false);
      }
      return;
    }

    if (isIOS) {
      setShowIOSSheet(true);
      return;
    }

    if (isIframe) {
      window.open(topLevelInstallUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    setIsInstalling(true);
    try {
      const outcome = await install(1600);
      if (outcome === 'accepted') {
        clearInstallQueryParam();
        setVisible(false);
      } else if (outcome === 'unavailable' && isAndroid && isInAppWebView) {
        window.location.href = androidChromeIntentUrl;
      }
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <>
      {/* Compact Bottom Auto-Popup Install Banner (Respects 15% Mobile Sticky Cap) */}
      <div
        role="region"
        aria-label="Install MarketMate Mobile Application"
        className={`fixed bottom-3 left-3 right-3 z-40 mx-auto max-w-md rounded-2xl bg-slate-900/95 dark:bg-slate-900/95 text-white border border-slate-700/80 shadow-xl backdrop-blur-md px-3.5 py-2.5 transition-all duration-150 ${
          forceInstallParam ? 'ring-2 ring-emerald-500' : 'sm:hidden'
        }`}
      >
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/pwa-192x192.png"
              alt="MarketMate App Icon"
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-xl shrink-0 border border-emerald-500/30 bg-emerald-950 object-cover"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {forceInstallParam ? 'Ready to Download MarketMate' : 'Install MarketMate App'}
              </p>
              <p className="text-[11px] text-slate-300 truncate">
                {isIOS
                  ? 'Add to iPhone Home Screen · Works offline'
                  : 'Direct 1-tap phone download · Works offline'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isIframe && !isInstallable ? (
              <a
                href={topLevelInstallUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                <span>Open Installer</span>
              </a>
            ) : (
              <button
                type="button"
                onClick={handleDirectInstall}
                disabled={isInstalling}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
              >
                <Download className={`w-3.5 h-3.5 shrink-0 ${isInstalling ? 'animate-bounce' : ''}`} />
                <span>{isInstalling ? 'Installing...' : 'Install'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss install banner"
              className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Safari Visual Sheet when triggered from the mobile banner */}
      {showIOSSheet && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border-t sm:border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto -mt-2 mb-2 sm:hidden" />

            <button
              type="button"
              onClick={() => setShowIOSSheet(false)}
              className="absolute top-4 right-4 p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3.5 pr-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  iPhone &amp; iPad Home Screen App
                </p>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Add MarketMate to Home Screen
                </h3>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-3.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <Share2 className="w-4 h-4" />
                </div>
                <p>
                  <strong>1.</strong> Tap the <strong>Share</strong> icon on the bottom Safari bar.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <p>
                  <strong>2.</strong> Select <strong>Add to Home Screen</strong> and tap <strong>Add</strong>.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSSheet(false)}
              className="w-full min-h-[46px] py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-bold text-xs sm:text-sm hover:bg-emerald-700 transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};
