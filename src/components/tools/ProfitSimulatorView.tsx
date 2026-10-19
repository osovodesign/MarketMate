import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Sliders,
  TrendingUp,
  TrendingDown,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBusinessData } from '../../context/BusinessDataContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { formatCurrency, formatPercent } from '../../lib/formatters';
import { ProFeatureGate } from '../subscription/ProFeatureGate';

interface ProfitSimulatorViewProps {
  onBack: () => void;
  onUpgrade?: () => void;
}

export const ProfitSimulatorView: React.FC<ProfitSimulatorViewProps> = ({
  onBack,
  onUpgrade,
}) => {
  const { business, isSubscribed } = useAuth();
  const { metrics } = useBusinessData();
  const currency = business?.currency || 'NGN';

  // Base monthly numbers
  const baseRevenue = metrics.thisMonth.revenue;
  const baseCOGS = metrics.thisMonth.costOfGoodsSold;
  const baseOpEx = metrics.thisMonth.operatingExpenses;
  const baseProfit = metrics.thisMonth.operatingProfit;
  const baseMargin = metrics.thisMonth.profitMargin;

  // Simulation Sliders (Percentage adjustments)
  const [priceAdjustment, setPriceAdjustment] = useState<number>(0);
  const [cogsAdjustment, setCogsAdjustment] = useState<number>(0);
  const [fuelOpExAdjustment, setFuelOpExAdjustment] = useState<number>(0);
  const [volumeAdjustment, setVolumeAdjustment] = useState<number>(0);

  // Computed Simulations
  const sim = useMemo(() => {
    const effectiveRevMultiplier = (1 + priceAdjustment / 100) * (1 + volumeAdjustment / 100);
    const projectedRevenue = Math.max(0, baseRevenue * effectiveRevMultiplier);
    const projectedCOGS = Math.max(0, baseCOGS * (1 + cogsAdjustment / 100) * (1 + volumeAdjustment / 100));
    const projectedOpEx = Math.max(0, baseOpEx * (1 + fuelOpExAdjustment / 100));

    const projectedGrossProfit = projectedRevenue - projectedCOGS;
    const projectedProfit = projectedGrossProfit - projectedOpEx;
    const projectedMargin = projectedRevenue > 0 ? (projectedProfit / projectedRevenue) * 100 : 0;

    const profitDiff = projectedProfit - baseProfit;
    const marginDiff = projectedMargin - baseMargin;

    return {
      projectedRevenue,
      projectedCOGS,
      projectedGrossProfit,
      projectedOpEx,
      projectedProfit,
      projectedMargin,
      profitDiff,
      marginDiff,
    };
  }, [baseRevenue, baseCOGS, baseOpEx, baseProfit, baseMargin, priceAdjustment, cogsAdjustment, fuelOpExAdjustment, volumeAdjustment]);

  const handleReset = () => {
    setPriceAdjustment(0);
    setCogsAdjustment(0);
    setFuelOpExAdjustment(0);
    setVolumeAdjustment(0);
  };

  if (!isSubscribed) {
    return (
      <div className="min-h-full pb-12">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-slate-500"
              title="Go back"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Profit Stress-Test Simulator
              </h1>
              <p className="text-xs text-slate-500">
                Model real-world scenarios and forecast take-home profit.
              </p>
            </div>
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6">
          <ProFeatureGate
            title="Profit Stress-Test Simulator"
            subtitle="Simulate the real-world impact of inflation, petrol price hikes, price adjustments, and sales volume changes on your monthly take-home profit."
            icon={Sliders}
            benefits={[
              'Simulate supplier inflation & fuel price shocks',
              'Model the effect of price increases vs. sales volume dips',
              'Interactive profit margin and net income forecasting',
              'Automated warning flags when profit margins drop below safe thresholds',
            ]}
            onUpgrade={onUpgrade || onBack}
            onBack={onBack}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full pb-12">
      {/* Top Header Bar */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-slate-500"
            title="Go back"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              Profit Stress-Test & Scenario Simulator
            </h1>
            <p className="text-xs text-slate-500">
              Simulate the impact of inflation, fuel price hikes, price increases, or sales changes on your take-home profit.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleReset}
          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          className="text-xs hidden sm:flex"
        >
          Reset Sliders
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Simulator Controls Grid */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-7 space-y-5">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Interactive Scenario Controls
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
            {/* Selling Price Adjustment */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Product Price Change:</span>
                <span className={priceAdjustment >= 0 ? 'text-emerald-700 font-mono font-black' : 'text-rose-600 font-mono font-black'}>
                  {priceAdjustment > 0 ? `+${priceAdjustment}%` : `${priceAdjustment}%`}
                </span>
              </div>
              <input
                type="range"
                min="-30"
                max="50"
                step="5"
                value={priceAdjustment}
                onChange={(e) => setPriceAdjustment(parseInt(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <p className="text-[10px] text-slate-400">If you raise or discount all customer prices</p>
            </div>

            {/* Supplier Cost / COGS Adjustment */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Inventory / Wholesale Cost Change:</span>
                <span className={cogsAdjustment <= 0 ? 'text-emerald-700 font-mono font-black' : 'text-rose-600 font-mono font-black'}>
                  {cogsAdjustment > 0 ? `+${cogsAdjustment}%` : `${cogsAdjustment}%`}
                </span>
              </div>
              <input
                type="range"
                min="-20"
                max="50"
                step="5"
                value={cogsAdjustment}
                onChange={(e) => setCogsAdjustment(parseInt(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
              <p className="text-[10px] text-slate-400">If supplier prices or import costs rise</p>
            </div>

            {/* Fuel / Transport / Power Adjustment */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Fuel, Dispatch & Electricity Cost:</span>
                <span className={fuelOpExAdjustment <= 0 ? 'text-emerald-700 font-mono font-black' : 'text-rose-600 font-mono font-black'}>
                  {fuelOpExAdjustment > 0 ? `+${fuelOpExAdjustment}%` : `${fuelOpExAdjustment}%`}
                </span>
              </div>
              <input
                type="range"
                min="-30"
                max="60"
                step="5"
                value={fuelOpExAdjustment}
                onChange={(e) => setFuelOpExAdjustment(parseInt(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
              <p className="text-[10px] text-slate-400">Generator fuel, logistics & electricity rate changes</p>
            </div>

            {/* Sales Volume Adjustment */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Sales Order Volume Change:</span>
                <span className={volumeAdjustment >= 0 ? 'text-emerald-700 font-mono font-black' : 'text-rose-600 font-mono font-black'}>
                  {volumeAdjustment > 0 ? `+${volumeAdjustment}%` : `${volumeAdjustment}%`}
                </span>
              </div>
              <input
                type="range"
                min="-40"
                max="60"
                step="5"
                value={volumeAdjustment}
                onChange={(e) => setVolumeAdjustment(parseInt(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <p className="text-[10px] text-slate-400">If more or fewer customers buy this month</p>
            </div>
          </div>

          {/* Comparison Board */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Current Baseline Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Current Baseline (Month to Date)
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Revenue:</span>
                  <span className="font-bold text-slate-900 font-mono tabular-nums">{formatCurrency(baseRevenue, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cost of Goods:</span>
                  <span className="font-medium text-slate-700 font-mono tabular-nums">-{formatCurrency(baseCOGS, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Operating Expenses:</span>
                  <span className="font-medium text-slate-700 font-mono tabular-nums">-{formatCurrency(baseOpEx, currency)}</span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between font-black text-sm">
                  <span className="text-slate-900">Take-Home Profit:</span>
                  <span className="text-emerald-700 font-mono tabular-nums">{formatCurrency(baseProfit, currency)}</span>
                </div>
                <div className="text-right text-[11px] text-slate-400 font-mono tabular-nums">
                  Margin: {formatPercent(baseMargin)}
                </div>
              </div>
            </div>

            {/* Simulated Outcome Card */}
            <div
              className={`p-4 sm:p-5 rounded-2xl space-y-3 ${
                sim.profitDiff >= 0
                  ? 'bg-emerald-950 text-white border border-emerald-800'
                  : 'bg-rose-950 text-white border border-rose-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                  Simulated Projection
                </p>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-white/10 font-mono tabular-nums">
                  {sim.profitDiff >= 0 ? '+' : ''}
                  {formatCurrency(sim.profitDiff, currency)} net impact
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-300">Projected Revenue:</span>
                  <span className="font-bold text-white font-mono tabular-nums">{formatCurrency(sim.projectedRevenue, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Projected COGS:</span>
                  <span className="font-medium text-slate-200 font-mono tabular-nums">-{formatCurrency(sim.projectedCOGS, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Projected OpEx:</span>
                  <span className="font-medium text-slate-200 font-mono tabular-nums">-{formatCurrency(sim.projectedOpEx, currency)}</span>
                </div>
                <div className="pt-2 border-t border-white/10 flex justify-between font-black text-sm sm:text-base">
                  <span>Projected Profit:</span>
                  <span className={`${sim.projectedProfit >= 0 ? 'text-emerald-300' : 'text-rose-300'} font-mono tabular-nums`}>
                    {formatCurrency(sim.projectedProfit, currency)}
                  </span>
                </div>
                <div className="text-right text-[11px] text-slate-300 font-semibold font-mono tabular-nums">
                  New Margin: {formatPercent(sim.projectedMargin)} ({sim.marginDiff >= 0 ? '+' : ''}
                  {formatPercent(sim.marginDiff)})
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Reset All
            </Button>

            <Button
              type="button"
              onClick={onBack}
              size="md"
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6"
            >
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
