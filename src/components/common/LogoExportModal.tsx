import React, { useState } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  Eye,
  FileCode,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { MarketMateLogo } from './MarketMateLogo';

interface LogoExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogoExportModal: React.FC<LogoExportModalProps> = ({ isOpen, onClose }) => {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopySvg = () => {
    const svgCode = `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="mmPrimaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#059669" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="24" fill="url(#mmPrimaryGrad)" />
  <path d="M26 68V34L42 52L58 34V68" stroke="white" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M58 68V42L74 58" stroke="#34D399" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" />
  <circle cx="74" cy="36" r="4.5" fill="#FBBF24" />
</svg>`;

    navigator.clipboard.writeText(svgCode);
    setCopiedText('svg');
    setTimeout(() => setCopiedText(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shadow-2xs">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Official Brand Assets</h2>
              <p className="text-xs text-slate-500">
                MarketMate first original vector brand emblem & mark
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Logo Interactive Showcase Preview Canvas */}
          <div className="rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-50 border border-slate-200/80 shadow-inner">
            <div className="relative max-w-md w-full flex items-center justify-center py-6">
              <MarketMateLogo size="2xl" showSubtitle={true} />
            </div>
            <div className="mt-2 text-center">
              <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-white text-slate-600 border border-slate-200">
                SVG Vector • Scalable Lossless Emblem
              </span>
            </div>
          </div>

          {/* Copy SVG Action */}
          <div className="space-y-3">
            <Button
              variant="primary"
              onClick={handleCopySvg}
              className="w-full flex items-center justify-center gap-2 py-3"
            >
              {copiedText === 'svg' ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied Vector SVG Code!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Official SVG Code</span>
                </>
              )}
            </Button>
          </div>

          {/* Code Snippet Tag */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-emerald-600" />
                Emblem Spec
              </span>
              <span className="text-[11px] text-slate-400">Emerald Green #059669 • Mint #34D399</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              The original MarketMate vector badge features the stylized geometric "M" mark, upward growth gradient, and emerald badge for all screens, receipts, and invoices.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            Official brand trademark of MarketMate
          </div>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
