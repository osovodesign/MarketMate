import React, { useState } from 'react';
import {
  Smartphone,
  X,
  Share2,
  PlusSquare,
  Download,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'primary' | 'subtle' | 'compact' | 'pill' | 'outline' | 'icon';
  showLabel?: boolean;
  label?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'subtle',
  showLabel = true,
  label = 'Install App',
}) => {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isAndroid,
    isIframe,
    isInAppWebView,
    install,
    topLevelInstallUrl,
    androidChromeIntentUrl,
  } = usePWAInstall();

  const [activeSheet, setActiveSheet] = useState<'iframe' | 'ios' | 'direct-fallback' | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Hide when already running inside an installed standalone PWA
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    // 1. If native prompt is already captured, trigger native OS installation dialog immediately
    if (isInstallable) {
      setIsInstalling(true);
      try {
        const result = await install(0);
        if (result === 'unavailable') {
          if (isIframe) {
            setActiveSheet('iframe');
          } else if (isIOS) {
            setActiveSheet('ios');
          } else {
            setActiveSheet('direct-fallback');
          }
        }
      } finally {
        setIsInstalling(false);
      }
      return;
    }

    // 2. iOS Safari does not support beforeinstallprompt — show visual Add to Home Screen sheet
    if (isIOS) {
      setActiveSheet('ios');
      return;
    }

    // 3. Embedded preview iframe blocks beforeinstallprompt — show one-tap launcher for installable view
    if (isIframe) {
      setActiveSheet('iframe');
      return;
    }

    // 4. On Android / Desktop top-level browser, wait briefly in case Service Worker is finishing activation
    setIsInstalling(true);
    try {
      const result = await install(1600);
      if (result === 'unavailable') {
        setActiveSheet('direct-fallback');
      }
    } finally {
      setIsInstalling(false);
    }
  };

  const handleCopyLink = () => {
    const linkToCopy =
      typeof window !== 'undefined' &&
      !window.location.hostname.includes('localhost') &&
      !window.location.hostname.includes('127.0.0.1')
        ? window.location.origin
        : 'https://getmarketmate.online';
    navigator.clipboard.writeText(linkToCopy);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  let buttonStyle =
    'inline-flex items-center gap-1.5 font-medium transition-all cursor-pointer shadow-xs whitespace-nowrap shrink-0';
  if (variant === 'primary') {
    buttonStyle +=
      ' px-3.5 py-2 min-h-[40px] text-xs sm:text-sm rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-emerald-500/20';
  } else if (variant === 'compact') {
    buttonStyle +=
      ' px-2.5 py-1.5 min-h-[36px] text-xs rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
  } else if (variant === 'pill') {
    buttonStyle +=
      ' px-3 py-1.5 min-h-[36px] text-xs rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm';
  } else if (variant === 'outline') {
    buttonStyle +=
      ' px-3 py-1.5 min-h-[38px] text-xs rounded-xl bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700';
  } else if (variant === 'icon') {
    buttonStyle =
      'p-2 min-h-[40px] min-w-[40px] text-slate-500 hover:text-[#059669] dark:text-slate-400 dark:hover:text-[#34D399] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0 flex items-center justify-center';
  } else {
    buttonStyle +=
      ' px-3 py-1.5 min-h-[38px] text-xs rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700';
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        disabled={isInstalling}
        title="Download & Install MarketMate App to Your Phone"
        aria-label="Install MarketMate App"
        className={`${buttonStyle} ${className}`}
      >
        {variant === 'icon' ? (
          <Download className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${isInstalling ? 'animate-bounce' : ''}`} />
        ) : (
          <>
            <Download
              className={`w-4 h-4 ${
                variant === 'primary' || variant === 'pill'
                  ? 'text-white'
                  : 'text-emerald-600 dark:text-emerald-400'
              } shrink-0 ${isInstalling ? 'animate-bounce' : ''}`}
            />
            {showLabel && (
              <span className="truncate">{isInstalling ? 'Installing...' : label}</span>
            )}
          </>
        )}
      </button>

      {/* 1. Embedded Preview Window -> One-Tap Open Installable View Modal */}
      {activeSheet === 'iframe' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <button
              type="button"
              onClick={() => setActiveSheet(null)}
              className="absolute top-4 right-4 p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3.5 pr-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shrink-0">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Direct Phone Installer
                </p>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Open Installable App View
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Your browser blocks direct phone downloads while viewing inside an embedded preview frame. Tap the button below to launch the installable view and trigger automatic installation in one tap.
            </p>

            <a
              href={topLevelInstallUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setActiveSheet(null)}
              className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition shadow-sm cursor-pointer whitespace-nowrap"
            >
              <ExternalLink className="w-4 h-4 shrink-0" />
              <span>Open Installable View &amp; Download</span>
            </a>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
              <div className="truncate mr-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                  Or copy link to open on your phone
                </span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  https://getmarketmate.online
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-2 min-h-[38px] rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-50 cursor-pointer shrink-0"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. iPhone / iPad Safari Visual Add to Home Screen Sheet */}
      {activeSheet === 'ios' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border-t sm:border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto -mt-2 mb-2 sm:hidden" />

            <button
              type="button"
              onClick={() => setActiveSheet(null)}
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
                  <strong>2.</strong> Select <strong>Add to Home Screen</strong> and tap <strong>Add</strong> in the top corner.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveSheet(null)}
              className="w-full min-h-[46px] py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-bold text-xs sm:text-sm hover:bg-emerald-700 transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* 3. Android / Desktop Direct Install Launcher when browser withholds prompt (e.g., In-App WebView or Already Installed) */}
      {activeSheet === 'direct-fallback' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border-t sm:border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto -mt-2 mb-2 sm:hidden" />

            <button
              type="button"
              onClick={() => setActiveSheet(null)}
              className="absolute top-4 right-4 p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3.5 pr-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shrink-0">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Direct Phone Download
                </p>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Install MarketMate App
                </h3>
              </div>
            </div>

            {isAndroid && isInAppWebView ? (
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                You are currently viewing MarketMate inside an in-app chat browser. Tap the button below to launch Google Chrome and start the automatic phone download immediately.
              </p>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-2">
                <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  Ready for Direct Phone Installation
                </p>
                <p className="leading-relaxed">
                  If MarketMate is already installed on your phone, check your home screen or app drawer for the <strong>MarketMate</strong> icon. Otherwise, tap below to launch the direct installer.
                </p>
              </div>
            )}

            <div className="space-y-2.5">
              {isAndroid ? (
                <a
                  href={androidChromeIntentUrl}
                  onClick={() => setActiveSheet(null)}
                  className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition shadow-sm cursor-pointer whitespace-nowrap"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span>Download Directly to Phone</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    setIsInstalling(true);
                    const res = await install(1800);
                    setIsInstalling(false);
                    if (res === 'accepted') {
                      setActiveSheet(null);
                    } else if (res === 'unavailable') {
                      window.location.href = topLevelInstallUrl;
                    }
                  }}
                  className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition shadow-sm cursor-pointer whitespace-nowrap"
                >
                  <RefreshCw className={`w-4 h-4 shrink-0 ${isInstalling ? 'animate-spin' : ''}`} />
                  <span>{isInstalling ? 'Starting Installer...' : 'Launch Direct App Installer'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveSheet(null)}
                className="w-full min-h-[42px] py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
