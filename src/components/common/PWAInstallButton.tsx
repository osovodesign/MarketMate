import React, { useState } from 'react';
import {
  Smartphone,
  X,
  Share2,
  PlusSquare,
  Sparkles,
  Download,
  Laptop,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
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
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'pc'>('android');
  const [isInstalling, setIsInstalling] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // If already running inside an installed PWA on the home screen, hide
  if (isInstalled) {
    return null;
  }

  // Handle click
  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      try {
        const success = await install();
        if (!success) {
          setShowGuideModal(true);
        }
      } catch {
        setShowGuideModal(true);
      } finally {
        setIsInstalling(false);
      }
    } else {
      // If native prompt is suppressed (e.g. iframe, iOS, or non-prompted browser), open the guide
      if (isIOS) {
        setActiveTab('ios');
      } else {
        const ua = navigator.userAgent.toLowerCase();
        if (/android/.test(ua)) {
          setActiveTab('android');
        } else {
          setActiveTab('pc');
        }
      }
      setShowGuideModal(true);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText('https://getmarketmate.online');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Styles based on variant
  let buttonStyle = 'inline-flex items-center gap-1.5 font-medium transition-all cursor-pointer shadow-xs';
  if (variant === 'primary') {
    buttonStyle +=
      ' px-3.5 py-1.5 text-xs sm:text-sm rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-emerald-500/20';
  } else if (variant === 'compact') {
    buttonStyle +=
      ' px-2.5 py-1 text-xs rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
  } else if (variant === 'pill') {
    buttonStyle +=
      ' px-3 py-1 text-xs rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20';
  } else if (variant === 'outline') {
    buttonStyle +=
      ' px-3 py-1.5 text-xs rounded-xl bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700';
  } else if (variant === 'icon') {
    buttonStyle =
      'p-1.5 sm:p-2 text-slate-500 hover:text-[#059669] dark:text-slate-400 dark:hover:text-[#34D399] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0 flex items-center justify-center';
  } else {
    // subtle
    buttonStyle +=
      ' px-3 py-1.5 text-xs rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700';
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        disabled={isInstalling}
        title="Download / Install MarketMate App"
        aria-label="Install MarketMate App"
        className={`${buttonStyle} ${className}`}
      >
        {variant === 'icon' ? (
          <Download className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        ) : (
          <>
            <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            {showLabel && (
              <span className="truncate">
                {isInstalling ? 'Installing...' : label}
              </span>
            )}
          </>
        )}
      </button>

      {/* Complete Multi-Device PWA Installation Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            {/* Close button */}
            <button
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/25">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" />
                  Instant Offline App
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                  Install MarketMate
                </h3>
              </div>
            </div>

            {/* App Advantages Highlight */}
            <div className="p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                Why Install the App?
              </p>
              <ul className="text-[11px] text-emerald-800 dark:text-emerald-300 space-y-0.5 pl-5 list-disc">
                <li>Works 100% offline without internet or NEPA light</li>
                <li>Instant 1-tap launch from your phone home screen</li>
                <li>Zero download size (no 50MB Play Store / App Store data)</li>
                <li>Fast barcode scanner &amp; bluetooth POS receipts</li>
              </ul>
            </div>

            {/* Device Switcher Tabs */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('android')}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'android'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                🤖 Android Phone
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ios')}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'ios'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                🍎 iPhone / iPad
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('pc')}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'pc'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                💻 Computer / PC
              </button>
            </div>

            {/* Step-by-Step Instructions Per Device */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-3">
              {activeTab === 'android' && (
                <>
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">
                      1
                    </span>
                    <p>
                      Open <strong>Chrome</strong> or <strong>Samsung Internet</strong> on your Android phone and visit <strong>getmarketmate.online</strong>.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">
                      2
                    </span>
                    <p>
                      Tap the <strong>three dots (⋮)</strong> menu icon at the top right of the browser.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">
                      3
                    </span>
                    <p>
                      Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>. MarketMate will be added to your apps menu!
                    </p>
                  </div>
                </>
              )}

              {activeTab === 'ios' && (
                <>
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">
                      1
                    </span>
                    <p>
                      Open MarketMate in <strong>Safari</strong> on your iPhone or iPad.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">
                      2
                    </span>
                    <p>
                      Tap the <strong>Share</strong> button at the bottom toolbar (<Share2 className="w-3.5 h-3.5 inline mx-0.5 text-blue-500" /> icon).
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">
                      3
                    </span>
                    <p>
                      Scroll down and tap <strong>"Add to Home Screen"</strong> (<PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-emerald-500" />), then tap <strong>Add</strong> in the top right.
                    </p>
                  </div>
                </>
              )}

              {activeTab === 'pc' && (
                <>
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">
                      1
                    </span>
                    <p>
                      Open MarketMate in <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong> on your laptop or desktop.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">
                      2
                    </span>
                    <p>
                      Look at the right end of the address bar for the <strong>Install</strong> icon (<Download className="w-3.5 h-3.5 inline mx-0.5 text-emerald-600" /> / 🖥️).
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">
                      3
                    </span>
                    <p>
                      Click <strong>Install</strong>. MarketMate will run in its own clean desktop window with a desktop shortcut!
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Link Copy Box */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs">
              <div className="truncate mr-2">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold">
                  Official Web Link
                </span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  https://getmarketmate.online
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 cursor-pointer shrink-0 shadow-2xs"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition cursor-pointer shadow-md shadow-emerald-600/25"
              >
                Got It, Thanks!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
