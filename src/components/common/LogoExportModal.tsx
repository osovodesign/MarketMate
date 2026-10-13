import React, { useState } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  FileCode,
  Image as ImageIcon,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { MarketMateLogo, MarketMateEmblem } from './MarketMateLogo';

interface LogoExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogoExportModal: React.FC<LogoExportModalProps> = ({ isOpen, onClose }) => {
  const [copiedVariant, setCopiedVariant] = useState<'light' | 'dark' | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<'light' | 'dark'>('light');

  if (!isOpen) return null;

  const handleCopySvg = async (variant: 'light' | 'dark') => {
    try {
      const response = await fetch(variant === 'dark' ? '/logo-dark.svg' : '/logo-light.svg');
      const svgText = await response.text();
      await navigator.clipboard.writeText(svgText);
      setCopiedVariant(variant);
      setTimeout(() => setCopiedVariant(null), 2500);
    } catch {
      // Fallback
      setCopiedVariant(variant);
      setTimeout(() => setCopiedVariant(null), 2000);
    }
  };

  const handleDownload = (fileName: string) => {
    const link = document.createElement('a');
    link.href = `/${fileName}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-colors">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-2xs">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Official Brand Assets</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                MarketMate registered trademark vector emblems & icons
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Variant Switcher */}
          <div className="flex items-center justify-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setActivePreviewTab('light')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                activePreviewTab === 'light'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Official Light Mode</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePreviewTab('dark')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                activePreviewTab === 'dark'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Official Dark Mode</span>
            </button>
          </div>

          {/* Logo Showcase Preview Canvas */}
          <div
            className={`rounded-2xl p-8 flex flex-col items-center justify-center border shadow-inner transition-colors ${
              activePreviewTab === 'dark'
                ? 'bg-[#05172C] border-slate-800 text-white'
                : 'bg-slate-50 border-slate-200/80 text-slate-900'
            }`}
          >
            <div className="relative max-w-md w-full flex items-center justify-center py-4">
              <MarketMateLogo
                size="2xl"
                variant={activePreviewTab}
                showSubtitle={true}
              />
            </div>
            <div className="mt-3 flex items-center gap-2 flex-wrap justify-center">
              <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/90 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {activePreviewTab === 'dark' ? 'Navy Background • White Bars' : 'White Background • Navy Bars'}
              </span>
              <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Emerald Trendline Arrow
              </span>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => handleCopySvg(activePreviewTab)}
              className="w-full flex items-center justify-center gap-2 py-2.5"
            >
              {copiedVariant === activePreviewTab ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Copied {activePreviewTab} SVG!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy {activePreviewTab === 'light' ? 'Light' : 'Dark'} SVG</span>
                </>
              )}
            </Button>

            <Button
              variant="primary"
              onClick={() => handleDownload(activePreviewTab === 'dark' ? 'logo-dark.svg' : 'logo-light.svg')}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Download className="w-4 h-4" />
              <span>Download {activePreviewTab === 'light' ? 'Light' : 'Dark'} SVG</span>
            </Button>
          </div>

          {/* High-Resolution PNG Downloads */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-emerald-600" />
                Raster & PWA Formats
              </span>
              <span className="text-[11px] text-slate-400">High Resolution PNG</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDownload('pwa-512x512.png')}
                className="p-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:border-emerald-500 hover:text-emerald-600 transition-colors flex items-center justify-center gap-1"
              >
                <Download className="w-3 h-3 text-slate-400" />
                <span>512×512 PNG</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownload('pwa-192x192.png')}
                className="p-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:border-emerald-500 hover:text-emerald-600 transition-colors flex items-center justify-center gap-1"
              >
                <Download className="w-3 h-3 text-slate-400" />
                <span>192×192 PNG</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownload('favicon.svg')}
                className="p-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:border-emerald-500 hover:text-emerald-600 transition-colors flex items-center justify-center gap-1"
              >
                <Download className="w-3 h-3 text-slate-400" />
                <span>Favicon SVG</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            Official trademark of MarketMate Technologies (CAC Reg: 9931755)
          </div>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
