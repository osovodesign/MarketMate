import React, { useState } from 'react';
import { Headphones, MessageCircle, X, Sparkles, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SUPPORT_CONFIG } from '../../lib/adminConfig';

interface FloatingSupportButtonProps {
  onOpen: () => void;
}

export const FloatingSupportButton: React.FC<FloatingSupportButtonProps> = ({ onOpen }) => {
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  if (isDismissed) {
    // Show a mini revival chip on the side so user can restore it if needed
    return (
      <button
        onClick={() => setIsDismissed(false)}
        className="fixed bottom-20 right-2 lg:bottom-6 lg:right-3 z-40 p-2 rounded-full bg-emerald-600/80 hover:bg-emerald-600 text-white shadow-md text-[10px] font-bold backdrop-blur-xs transition-transform active:scale-95 cursor-pointer opacity-75 hover:opacity-100"
        title="Show Support Button"
      >
        <Headphones className="w-3.5 h-3.5" />
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40 flex items-center gap-2 select-none"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Tooltip on Desktop */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.95 }}
            className="hidden sm:flex items-center gap-2 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-xl shadow-xl border border-slate-700 pointer-events-none whitespace-nowrap"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Need Help? Chat with Admin on WhatsApp ({SUPPORT_CONFIG.whatsappDisplay})</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Trigger Button */}
      <div className="relative group flex items-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onOpen}
          className="flex items-center gap-2 px-3 sm:px-3.5 py-2.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg hover:shadow-emerald-500/25 border border-emerald-400/40 font-bold text-xs transition-all cursor-pointer backdrop-blur-xs group"
          aria-label="Contact Admin & Support"
        >
          <div className="relative">
            <Headphones className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 border border-emerald-900 animate-pulse" />
          </div>

          <span className="hidden sm:inline font-semibold">Contact Admin</span>
          <span className="sm:hidden font-semibold">Support</span>

          <span className="hidden md:inline-block text-[9px] bg-emerald-900/60 text-emerald-200 px-1.5 py-0.5 rounded-full border border-emerald-400/30">
            WhatsApp
          </span>
        </motion.button>

        {/* Dismiss / Minimize button on hover */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsDismissed(true);
          }}
          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[9px] shadow-xs cursor-pointer"
          title="Dismiss support widget"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  );
};
