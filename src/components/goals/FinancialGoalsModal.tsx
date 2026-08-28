import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatPercent } from '../../lib/formatters';
import {
  Target,
  TrendingUp,
  Award,
  Calendar,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Flame,
} from 'lucide-react';

interface FinancialGoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FinancialGoalsModal: React.FC<FinancialGoalsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { targets, updateTargets, metrics } = useBusinessData();
  const { business } = useAuth();
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
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Monthly Financial Goals & Daily Targets"
      description="Set monthly revenue & net profit benchmarks with live pacing and required daily run-rates"
      size="lg"
    >
      <div className="space-y-6 pt-2">
        {/* Pacing Overview Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-900 to-slate-900 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Month Progress: Day {currentDay} of {daysInMonth} ({monthElapsedPercent}% elapsed)
              </span>
            </div>
            <p className="text-sm font-bold text-white">
              {daysRemaining} day{daysRemaining === 1 ? '' : 's'} remaining this month
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={isProfitOnTrack ? 'emerald' : 'amber'}
              size="md"
              className="font-extrabold"
            >
              {isProfitOnTrack ? '🔥 Ahead of Pace' : '⚡ Boost Needed'}
            </Badge>
          </div>
        </div>

        {/* Live Progress Gauges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Net Profit Target Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-600" />
                Monthly Net Profit Target
              </span>
              <span className="text-xs font-extrabold text-emerald-700">
                {profProgressPercent}% Achieved
              </span>
            </div>

            {/* Visual Bar */}
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  isProfitOnTrack ? 'bg-emerald-600' : 'bg-amber-500'
                }`}
                style={{ width: `${profProgressPercent}%` }}
              />
            </div>

            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-900">
                Current: {formatCurrency(currentProfit, currency)}
              </span>
              <span className="text-slate-500">
                Target: {formatCurrency(profTargetNum, currency)}
              </span>
            </div>

            {/* Run Rate Tip */}
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-600">
              {remainingProfNeeded <= 0 ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Target Achieved for this month! 🎉
                </span>
              ) : (
                <span>
                  Needed daily profit run-rate:{' '}
                  <strong className="text-emerald-800 font-extrabold">
                    {formatCurrency(dailyProfNeeded, currency)}/day
                  </strong>{' '}
                  for next {daysRemaining} days.
                </span>
              )}
            </div>
          </div>

          {/* Revenue Target Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Monthly Revenue Target
              </span>
              <span className="text-xs font-extrabold text-emerald-700">
                {revProgressPercent}% Achieved
              </span>
            </div>

            {/* Visual Bar */}
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  isRevenueOnTrack ? 'bg-emerald-600' : 'bg-amber-500'
                }`}
                style={{ width: `${revProgressPercent}%` }}
              />
            </div>

            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-900">
                Current: {formatCurrency(currentRevenue, currency)}
              </span>
              <span className="text-slate-500">
                Target: {formatCurrency(revTargetNum, currency)}
              </span>
            </div>

            {/* Run Rate Tip */}
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-600">
              {remainingRevNeeded <= 0 ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Revenue Target Met! 🎉
                </span>
              ) : (
                <span>
                  Needed daily sales volume:{' '}
                  <strong className="text-slate-900 font-extrabold">
                    {formatCurrency(dailyRevNeeded, currency)}/day
                  </strong>{' '}
                  for next {daysRemaining} days.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Adjust Target Settings Form */}
        <form onSubmit={handleSave} className="p-4 rounded-2xl bg-white border border-slate-200 space-y-4">
          <p className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Target className="w-4 h-4 text-emerald-700" />
            Adjust Your Monthly Benchmarks
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Monthly Net Profit Target ({currency})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={profitTarget}
                onChange={(e) => setProfitTarget(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-600 rounded-xl text-sm font-bold text-slate-900 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Monthly Gross Revenue Target ({currency})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={revenueTarget}
                onChange={(e) => setRevenueTarget(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-600 rounded-xl text-sm font-bold text-slate-900 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {isSaved ? (
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Goals Saved Successfully!
              </span>
            ) : (
              <span />
            )}

            <Button type="submit" isLoading={isSubmitting} size="sm" variant="primary">
              Save Targets
            </Button>
          </div>
        </form>

        {/* Close */}
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <Button onClick={onClose} variant="outline">
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
