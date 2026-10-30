import React, { useState } from 'react';
import { Headphones, X } from 'lucide-react';
import { AppView } from '../../types';

interface FloatingSupportButtonProps {
  onOpen: () => void;
  currentView?: AppView;
}

const FORM_AND_CHECKOUT_VIEWS: AppView[] = [
  'pos',
  'record-sale',
  'record-expense',
  'create-product',
  'create-invoice',
  'record-debt',
  'create-contact',
  'help-support',
];

export const FloatingSupportButton: React.FC<FloatingSupportButtonProps> = ({
  onOpen,
  currentView,
}) => {
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  // Never cover forms, checkout, or mobile bottom navigation (Section 7.22)
  if (currentView && FORM_AND_CHECKOUT_VIEWS.includes(currentView)) {
    return null;
  }

  if (isDismissed) {
    return null;
  }

  return (
    <div className="hidden lg:flex fixed bottom-5 right-5 z-30 items-center gap-1 select-none bg-white dark:bg-[#001A35] border border-slate-200 dark:border-slate-700 rounded-full shadow-md pl-3.5 pr-1.5 py-1.5">
      <button
        onClick={onOpen}
        className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:text-[#059669] dark:hover:text-[#34D399] transition-colors cursor-pointer pr-1"
        aria-label="Open Help and Support"
      >
        <Headphones className="w-4 h-4 text-[#059669] dark:text-[#34D399] shrink-0" />
        <span>Help & Support</span>
      </button>
      <button
        onClick={() => setIsDismissed(true)}
        className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        aria-label="Dismiss support button"
        title="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
