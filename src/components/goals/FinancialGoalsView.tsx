import React, { useState } from 'react';
import {
  ArrowLeft,
  Target,
  TrendingUp,
  Award,
  Calendar,
  CheckCircle2,
  Sparkles,
  Flame,
  Zap,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatPercent } from '../../lib/formatters';
import { ProFeatureGate } from '../subscription/ProFeatureGate';

interface FinancialGoalsViewProps {
  onBack: () => void;
  onUpgrade?: () => void;
}

export const FinancialGoalsView: React.FC<FinancialGoalsViewProps> = ({
  onBack,
  onUpgrade,
}) => {
  const { targets, updateTargets, metrics } = useBusinessData();
  const { business, isSubscribed } = useAuth();
  const currency = business?.currency || 'NGN';

  const [revenueTarget, setRevenueTarget] = useState(
    targets.monthlyRevenueTarget.toString()
  );
  const [profitTarget, setProfitTarget] = useState(
    targets.monthlyProfitTarget.toString()
  );
  const [isSaved, setIsSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Time & Pacing calculation
  const now = new Date();
  const currentDay = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(1, daysInMonth - currentDay);
  const monthElapsedPercent = Math.round((currentDay / daysInMonth) * 100);

  // Month performance vs targets
  const currentRevenue = metrics.thisMonth.revenue;
  const currentProfit = metrics.thisMonth.operatingProfit;

  const revTargetNum = parseFloat(revenueTarget) || 1;
  const profTargetNum = parseFloat(profitTarget) || 1;

  const revProgressPercent = Math.min(100, Math.round((currentRevenue / revTargetNum) * 100));
  const profProgressPercent = Math.min(100, Math.round((currentProfit / profTargetNum) * 100));

  // Required Daily Run Rate to hit target
  const remainingRevNeeded = Math.max(0, revTargetNum - currentRevenue);
  const remainingProfNeeded = Math.max(0, profTargetNum - currentProfit);

  const dailyRevNeeded = Math.round(remainingRevNeeded / daysRemaining);
  const dailyProfNeeded = Math.round(remainingProfNeeded / daysRemaining);

  const isProfitOnTrack = profProgressPercent >= monthElapsedPercent;
  const isRevenueOnTrack = revProgressPercent >= monthElapsedPercent;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = parseFloat(revenueTarget) || 0;
    const p = parseFloat(profitTarget) || 0;
    setIsSubmitting(true);
    await updateTargets({
      monthlyRevenueTarget: r,
      monthlyProfitTarget: p,
    });
    setIsSubmitting(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  if (!isSubscribed) {
    return (
      <ProFeatureGate
        title="Financial Goals & Daily Run-Rates"
        subtitle="Set monthly revenue & net profit benchmarks with live day-by-day pacing, required daily run-rates, and performance milestones."
        icon={Target}
        benefits={[
          'Define monthly revenue and take-home net profit benchmarks',
          'Live day-by-day progress tracking against days remaining',
          'Calculates required daily sales run-rates to hit targets',
          'Milestone achievement badges and pacing indicators',
        ]}
        onUpgrade={onUpgrade}
        onBack={onBack}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header with Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-2xs shrink-0"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Financial Goals & Daily Targets
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 rounded-md">
                Pacing Engine
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Set monthly revenue & net profit benchmarks with live pacing and required daily run-rates
            </p>
          </div>
        </div>
      </div>

      {/* Pacing Overview Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Month Progress: Day {currentDay} of {daysInMonth} ({monthElapsedPercent}% elapsed)
            </span>
          </div>
          <p className="text-base sm:text-lg font-extrabold text-white">
            {daysRemaining} trading day{daysRemaining === 1 ? '' : 's'} remaining this month
          </p>
          <p className="text-xs text-emerald-200/80">
            Current Month Margin: {formatPercent(metrics.thisMonth.profitMargin)} across {metrics.thisMonth.salesCount} recorded sales
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={isProfitOnTrack ? 'emerald' : 'amber'}
            size="md"
            className="font-extrabold px-3 py-1.5"
          >
            {isProfitOnTrack ? '🔥 Ahead of Monthly Pace' : '⚡ Daily Boost Needed'}
          </Badge>
        </div>
      </div>

      {/* Live Progress Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Net Profit Target Card */}
        <Card padding="lg" className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Monthly Net Profit Target
            </span>
            <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
              {profProgressPercent}% Achieved
            </span>
          </div>

          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {formatCurrency(currentProfit, currency)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              of {formatCurrency(profTargetNum, currency)} monthly take-home goal
            </p>
          </div>

          {/* Visual Bar */}
          <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/60 dark:border-slate-700">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isProfitOnTrack ? 'bg-emerald-600' : 'bg-amber-500'
              }`}
              style={{ width: `${profProgressPercent}%` }}
            />
          </div>

          {/* Run Rate Tip */}
          <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 text-xs text-slate-700 dark:text-slate-200">
            {remainingProfNeeded <= 0 ? (
              <span className="text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Monthly Profit Target Achieved! 🎉
              </span>
            ) : (
              <span>
                Needed daily profit run-rate:{' '}
                <strong className="text-emerald-800 dark:text-emerald-300 font-extrabold">
                  {formatCurrency(dailyProfNeeded, currency)}/day
                </strong>{' '}
                over the next {daysRemaining} days.
              </span>
            )}
          </div>
        </Card>

        {/* Revenue Target Card */}
        <Card padding="lg" className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Monthly Revenue Target
            </span>
            <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
              {revProgressPercent}% Achieved
            </span>
          </div>

          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {formatCurrency(currentRevenue, currency)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              of {formatCurrency(revTargetNum, currency)} gross sales goal
            </p>
          </div>

          {/* Visual Bar */}
          <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/60 dark:border-slate-700">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isRevenueOnTrack ? 'bg-emerald-600' : 'bg-amber-500'
              }`}
              style={{ width: `${revProgressPercent}%` }}
            />
          </div>

          {/* Run Rate Tip */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200">
            {remainingRevNeeded <= 0 ? (
              <span className="text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Monthly Revenue Target Met! 🎉
              </span>
            ) : (
              <span>
                Needed daily sales volume:{' '}
                <strong className="text-slate-900 dark:text-white font-extrabold">
                  {formatCurrency(dailyRevNeeded, currency)}/day
                </strong>{' '}
                over the next {daysRemaining} days.
              </span>
            )}
          </div>
        </Card>
      </div>

      {/* Adjust Target Settings Form */}
      <Card padding="lg">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-600" />
                Configure Monthly Financial Benchmarks
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Update your store goals anytime to recalculate required daily sales and profit pacing
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Monthly Net Profit Target ({currency})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={profitTarget}
                onChange={(e) => setProfitTarget(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-emerald-600 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none transition-all"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Recommended: Set to cover your personal salary + business reinvestment goal
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Monthly Gross Revenue Target ({currency})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={revenueTarget}
                onChange={(e) => setRevenueTarget(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-emerald-600 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none transition-all"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Total expected customer sales turnover for the calendar month
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div>
              {isSaved && (
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Financial benchmarks saved and synced!
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <Button type="button" onClick={onBack} variant="outline">
                Back
              </Button>
              <Button type="submit" isLoading={isSubmitting} variant="primary">
                Save Monthly Targets
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
};
