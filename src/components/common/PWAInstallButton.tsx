import React, { useState } from 'react';
import { Download, Smartphone, X, Share2, PlusSquare, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'primary' | 'subtle' | 'compact' | 'pill';
  showLabel?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'subtle',
  showLabel = true,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already running as an installed PWA on home screen, hide the install button
  if (isInstalled) {
    return null;
  }

  // Handle click for Chromium / Android / Desktop Chrome/Edge
  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      try {
        await install();
      } finally {
        setIsInstalling(false);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  // Only render if installable on Android/desktop, or on iOS
  if (!isInstallable && !isIOS) {
    return null;
  }

  // Styles based on variant
  let buttonStyle = 'inline-flex items-center gap-2 font-medium transition-all shadow-xs';
  if (variant === 'primary') {
    buttonStyle +=
      ' px-3.5 py-1.5 text-xs sm:text-sm rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-emerald-500/20';
  } else if (variant === 'compact') {
    buttonStyle +=
      ' px-2.5 py-1 text-xs rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
  } else if (variant === 'pill') {
    buttonStyle +=
      ' px-3 py-1 text-xs rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20 animate-pulse';
  } else {
    // subtle
    buttonStyle +=
      ' px-3 py-1.5 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700';
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        disabled={isInstalling}
        title="Install MarketMate App on Home Screen"
        className={`${buttonStyle} ${className}`}
      >
        <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        {showLabel && (
          <span className="truncate">
            {isInstalling ? 'Installing...' : 'Install App'}
          </span>
        )}
      </button>

      {/* iOS Safari Installation Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Install on iPhone / iPad
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Run MarketMate full-screen like a native app
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">
                  1
                </span>
                <p>
                  Tap the <strong className="text-slate-900 dark:text-white">Share</strong> button at the bottom of Safari (<Share2 className="w-3.5 h-3.5 inline mx-0.5 text-blue-500" /> icon).
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">
                  2
                </span>
                <p>
                  Scroll down the share sheet and tap <strong className="text-slate-900 dark:text-white">Add to Home Screen</strong> (<PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-emerald-500" />).
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">
                  3
                </span>
                <p>
                  Tap <strong className="text-slate-900 dark:text-white">Add</strong> in the top right corner. MarketMate will appear on your home screen!
                </p>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-semibold text-xs sm:text-sm hover:bg-emerald-700 transition"
              >
                Got It!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
