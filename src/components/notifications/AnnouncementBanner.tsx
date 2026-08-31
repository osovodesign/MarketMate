import React from 'react';
import { AlertCircle, Bell, Sparkles, X, ChevronRight, Mail, ExternalLink } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { AppView } from '../../types';

interface AnnouncementBannerProps {
  onNavigate?: (view: AppView) => void;
}

export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({ onNavigate }) => {
  const { activeBanner, dismissBanner, markAsRead } = useNotifications();

  if (!activeBanner) return null;

  const isUrgent = activeBanner.priority === 'urgent';

  const handleActionClick = () => {
    if (activeBanner.actionUrl) {
      if (activeBanner.actionUrl.startsWith('http')) {
        window.open(activeBanner.actionUrl, '_blank', 'noopener,noreferrer');
      } else if (onNavigate) {
        onNavigate(activeBanner.actionUrl as AppView);
      }
    }
    markAsRead(activeBanner.id);
  };

  return (
    <div
      className={`w-full transition-all duration-300 relative z-30 ${
        isUrgent
          ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-md'
          : 'bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-800 text-white shadow-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-3 text-xs">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
          <div className="shrink-0 p-1 rounded-md bg-white/15 backdrop-blur-xs">
            {isUrgent ? (
              <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white animate-pulse" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-200" />
            )}
          </div>

          <div className="truncate flex-1 min-w-0 text-[11px] sm:text-xs">
            <span className="font-bold mr-1 inline-flex items-center gap-1">
              <span className="uppercase text-[9px] tracking-wider px-1.5 py-0.5 rounded bg-black/25 font-black">
                {isUrgent ? 'Alert' : 'Notice'}
              </span>
              <span className="hidden xs:inline">{activeBanner.title}:</span>
            </span>
            <span className="opacity-90 font-normal">{activeBanner.content}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {activeBanner.actionLabel && (
            <button
              onClick={handleActionClick}
              className="px-2.5 sm:px-3 py-1 rounded-md bg-white text-slate-900 font-bold text-[10px] sm:text-[11px] hover:bg-white/90 transition-colors shadow-2xs cursor-pointer flex items-center gap-1 shrink-0"
            >
              <span className="max-w-[70px] sm:max-w-none truncate">{activeBanner.actionLabel}</span>
              <ChevronRight className="w-3 h-3 shrink-0" />
            </button>
          )}

          <button
            onClick={() => dismissBanner(activeBanner.id)}
            className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer shrink-0"
            title="Dismiss notice"
            aria-label="Dismiss notice"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
