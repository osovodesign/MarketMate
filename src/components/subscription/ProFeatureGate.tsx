import React from 'react';
import { Lock, Sparkles, CheckCircle2, ArrowRight, ShieldCheck, Building2 } from 'lucide-react';
import { Button } from '../ui/Button';

export interface ProFeatureGateProps {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  benefits: string[];
  onUpgrade: () => void;
  onBack?: () => void;
  mode?: 'page' | 'modal';
}

export const ProFeatureGate: React.FC<ProFeatureGateProps> = ({
  title,
  subtitle,
  icon: Icon,
  benefits,
  onUpgrade,
  onBack,
  mode = 'page',
}) => {
  if (mode === 'modal') {
    return (
      <div className="p-6 text-center space-y-6">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 relative">
          <Icon className="w-7 h-7" />
          <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-sm">
            <Lock className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="space-y-1.5 max-w-md mx-auto">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Sparkles className="w-3 h-3" />
            MarketMate Pro Feature
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {title}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {subtitle}
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 text-left max-w-md mx-auto space-y-2">
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Included with MarketMate Pro:
          </p>
          <ul className="space-y-2">
            {benefits.map((benefit, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-medium max-w-md mx-auto flex items-center justify-between">
          <span>Starting at <strong>₦5,000 / month</strong></span>
          <span className="text-[11px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
            ₦50,000 / yr (2 mos free)
          </span>
        </div>

        <div className="flex items-center justify-center gap-3 pt-1">
          {onBack && (
            <Button variant="outline" size="md" onClick={onBack} className="text-xs font-semibold">
              Cancel
            </Button>
          )}
          <Button
            variant="primary"
            size="md"
            onClick={onUpgrade}
            className="text-xs font-bold shadow-md bg-emerald-600 hover:bg-emerald-700"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Upgrade to Pro Now
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl relative overflow-hidden text-center space-y-8">
        {/* Glow effect background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent blur-2xl pointer-events-none" />

        {/* Feature Icon + Pro Lock Badge */}
        <div className="relative inline-block">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xl shadow-emerald-600/25 border-2 border-white dark:border-slate-800">
            <Icon className="w-10 h-10" />
          </div>
          <div className="absolute -bottom-1.5 -right-1.5 px-2.5 py-1 rounded-full bg-slate-900 text-amber-300 dark:bg-white dark:text-slate-950 font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-md border border-amber-400/50">
            <Lock className="w-3 h-3 text-amber-400 dark:text-amber-500" />
            <span>PRO</span>
          </div>
        </div>

        {/* Heading & description */}
        <div className="space-y-3 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            MarketMate Pro Subscription
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {title} is a Pro Feature
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Key Feature Benefits Box */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 text-left max-w-xl mx-auto space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              What You Unlock With Pro:
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> Full Access
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-snug">
                  {benefit}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Callout Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-slate-800/60 border border-emerald-200 dark:border-emerald-800/80 max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 block">
              Transparent Merchant Pricing
            </span>
            <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-0.5">
              ₦5,000 <span className="text-xs font-normal text-slate-500">/ month</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              or <strong>₦50,000 / year</strong> (get 2 full months free)
            </p>
          </div>

          <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l border-emerald-200 dark:border-emerald-800/80 pt-2 sm:pt-0 sm:pl-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Payment Method</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" /> Direct OPay Transfer
            </span>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium block">
              Instant Admin Activation
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {onBack && (
            <Button
              variant="outline"
              size="lg"
              onClick={onBack}
              className="w-full sm:w-auto font-semibold text-xs"
            >
              Back to Dashboard
            </Button>
          )}
          <Button
            variant="primary"
            size="lg"
            onClick={onUpgrade}
            className="w-full sm:w-auto font-bold text-sm bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/25 px-8"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Activate MarketMate Pro (₦5,000)
          </Button>
        </div>
      </div>
    </div>
  );
};
