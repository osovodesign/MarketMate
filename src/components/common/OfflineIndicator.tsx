import React from 'react';
import { WifiOff, AlertTriangle } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white shadow-xl shadow-amber-950/20 border border-amber-400 animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      <span className="flex h-2.5 w-2.5 rounded-full bg-white animate-ping" />
      <WifiOff className="w-4 h-4 shrink-0 text-white" />
      <div>
        <span>Offline Mode</span>
        <span className="hidden sm:inline font-normal opacity-90 ml-1.5">
          — Sales & data are saved locally. Will sync when back online.
        </span>
      </div>
    </div>
  );
};
