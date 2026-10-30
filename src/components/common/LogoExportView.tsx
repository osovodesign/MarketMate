import React, { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  FileCode,
  Sparkles,
  Sun,
  Moon,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { MarketMateLogo } from './MarketMateLogo';

interface LogoExportViewProps {
  onBack: () => void;
}

export const LogoExportView: React.FC<LogoExportViewProps> = ({ onBack }) => {
  const [copiedVariant, setCopiedVariant] = useState<'light' | 'dark' | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<'light' | 'dark'>('light');

  const handleCopySvg = async (variant: 'light' | 'dark') => {
    try {
      const response = await fetch(variant === 'dark' ? '/logo-dark.svg' : '/logo-light.svg');
      const svgText = await response.text();
      await navigator.clipboard.writeText(svgText);
      setCopiedVariant(variant);
      setTimeout(() => setCopiedVariant(null), 2500);
    } catch {
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
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Top Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 shadow-2xs"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Official Brand Assets &amp; Logo Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              MarketMate registered trademark vector emblems, PWA icons &amp; press kit
            </p>
          </div>
        </div>
      </div>

      <Card padding="lg" className="space-y-6">
        {/* Variant Switcher */}
        <div className="flex items-center justify-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setActivePreviewTab('light')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activePreviewTab === 'light'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sun className="w-4 h-4 text-amber-500" />
            <span>Official Light Mode</span>
          </button>
          <button
            type="button"
            onClick={() => setActivePreviewTab('dark')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activePreviewTab === 'dark'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Moon className="w-4 h-4 text-indigo-400" />
            <span>Official Dark Mode</span>
          </button>
        </div>

        {/* Logo Showcase Preview Canvas */}
        <div
          className={`rounded-2xl p-10 flex flex-col items-center justify-center border shadow-inner transition-colors ${
            activePreviewTab === 'dark'
              ? 'bg-[#05172C] border-slate-800 text-white'
              : 'bg-slate-50 border-slate-200/80 text-slate-900'
          }`}
        >
          <div className="relative max-w-md w-full flex items-center justify-center py-6">
            <MarketMateLogo size="2xl" variant={activePreviewTab} showSubtitle={true} />
          </div>
          <div className="mt-4 flex items-center gap-2 flex-wrap justify-center text-xs text-slate-500 dark:text-slate-400 font-mono">
            <span>
              {activePreviewTab === 'dark'
                ? 'Navy Background · White Bars'
                : 'White Background · Navy Bars'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              Emerald Trendline Arrow
            </span>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => handleCopySvg(activePreviewTab)}
            className="w-full flex items-center justify-center gap-2 py-3"
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
            onClick={() =>
              handleDownload(activePreviewTab === 'dark' ? 'logo-dark.svg' : 'logo-light.svg')
            }
            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white"
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
              Raster &amp; PWA Formats
            </span>
            <span className="text-[11px] text-slate-400">High Resolution PNG &amp; Vector</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => handleDownload('pwa-512x512.png')}
              className="p-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-emerald-500 hover:text-emerald-600 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>512×512 PNG</span>
            </button>
            <button
              type="button"
              onClick={() => handleDownload('pwa-192x192.png')}
              className="p-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-emerald-500 hover:text-emerald-600 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>192×192 PNG</span>
            </button>
            <button
              type="button"
              onClick={() => handleDownload('favicon.svg')}
              className="p-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-emerald-500 hover:text-emerald-600 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Favicon SVG</span>
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>Official trademark of MarketMate Technologies (CAC Reg: 9931755)</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onBack}>
            Done
          </Button>
        </div>
      </Card>
    </div>
  );
};
