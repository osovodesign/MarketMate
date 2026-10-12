import React, { useState, useMemo } from 'react';
import {
  Sliders,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Zap,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBusinessData } from '../../context/BusinessDataContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { formatCurrency, formatPercent } from '../../lib/formatters';
import { ProFeatureGate } from '../subscription/ProFeatureGate';

interface ProfitSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
}

export const ProfitSimulatorModal: React.FC<ProfitSimulatorModalProps> = ({
  isOpen,
  onClose,
  onUpgrade,
}) => {
  const { business, user, isSuperAdmin, isDemoMode, isSubscribed } = useAuth();
  const { metrics } = useBusinessData();
  const currency = business?.currency || 'NGN';

  // Base monthly numbers
  const baseRevenue = metrics.thisMonth.revenue;
  const baseCOGS = metrics.thisMonth.costOfGoodsSold;
  const baseOpEx = metrics.thisMonth.operatingExpenses;
  const baseProfit = metrics.thisMonth.operatingProfit;
  const baseMargin = metrics.thisMonth.profitMargin;

  // Simulation Sliders (Percentage adjustments)
  const [priceAdjustment, setPriceAdjustment] = useState<number>(0); // e.g. +10%
  const [cogsAdjustment, setCogsAdjustment] = useState<number>(0); // e.g. +15% inflation
  const [fuelOpExAdjustment, setFuelOpExAdjustment] = useState<number>(0); // e.g. +25% fuel hike
  const [volumeAdjustment, setVolumeAdjustment] = useState<number>(0); // e.g. -5% sales drop

  // Computed Simulations
  const sim = useMemo(() => {
    // 1. Adjusted Revenue = BaseRevenue * (1 + priceAdj/100) * (1 + volAdj/100)
    const effectiveRevMultiplier = (1 + priceAdjustment / 100) * (1 + volumeAdjustment / 100);
    const projectedRevenue = Math.max(0, baseRevenue * effectiveRevMultiplier);

    // 2. Adjusted COGS = BaseCOGS * (1 + cogsAdj/100) * (1 + volAdj/100)
    const projectedCOGS = Math.max(0, baseCOGS * (1 + cogsAdjustment / 100) * (1 + volumeAdjustment / 100));

    // 3. Adjusted OpEx = BaseOpEx * (1 + fuelOpExAdj/100)
    const projectedOpEx = Math.max(0, baseOpEx * (1 + fuelOpExAdjustment / 100));

    // 4. Projected Profit
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
      <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
        <ProFeatureGate
          mode="modal"
          title="Profit Stress-Test Simulator"
          subtitle="Simulate the real-world impact of inflation, petrol price hikes, price adjustments, and sales volume changes on your monthly take-home profit."
          icon={Sliders}
          benefits={[
            'Simulate supplier inflation & fuel price shocks',
            'Model the effect of price increases vs. sales volume dips',
            'Interactive profit margin and net income forecasting',
            'Automated warning flags when profit margins drop below safe thresholds',
          ]}
          onUpgrade={() => {
            onClose();
            onUpgrade?.();
          }}
          onBack={onClose}
        />
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Profit Stress-Test & Scenario Simulator"
      description="Simulate the impact of inflation, fuel price hikes, price increases, or sales changes on your take-home profit."
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6 pt-2">
        {/* Simulator Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
          {/* Selling Price Adjustment */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Product Price Change:</span>
              <span className={priceAdjustment >= 0 ? 'text-emerald-700 font-black' : 'text-rose-600 font-black'}>
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
              className="w-full accent-emerald-600"
            />
            <p className="text-[10px] text-slate-400">If you raise or discount all customer prices</p>
          </div>

          {/* Supplier Cost / COGS Adjustment */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Inventory / Wholesale Cost Change:</span>
              <span className={cogsAdjustment <= 0 ? 'text-emerald-700 font-black' : 'text-rose-600 font-black'}>
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
              className="w-full accent-amber-600"
            />
            <p className="text-[10px] text-slate-400">If supplier prices or import costs rise</p>
          </div>

          {/* Fuel / Transport / Power Adjustment */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Fuel, Dispatch & Electricity Cost:</span>
              <span className={fuelOpExAdjustment <= 0 ? 'text-emerald-700 font-black' : 'text-rose-600 font-black'}>
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
              className="w-full accent-amber-600"
            />
            <p className="text-[10px] text-slate-400">Generator fuel, logistics & electricity rate changes</p>
          </div>

          {/* Sales Volume Adjustment */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Sales Order Volume Change:</span>
              <span className={volumeAdjustment >= 0 ? 'text-emerald-700 font-black' : 'text-rose-600 font-black'}>
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
              className="w-full accent-emerald-600"
            />
            <p className="text-[10px] text-slate-400">If more or fewer customers buy this month</p>
          </div>
        </div>

        {/* Comparison Board */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Current Baseline Card */}
          <Card padding="md" className="bg-white border-slate-200">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Current Baseline (Month to Date)
            </p>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Revenue:</span>
                <span className="font-bold text-slate-800">{formatCurrency(baseRevenue, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cost of Goods:</span>
                <span className="font-medium text-slate-700">-{formatCurrency(baseCOGS, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Operating Expenses:</span>
                <span className="font-medium text-slate-700">-{formatCurrency(baseOpEx, currency)}</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between font-black text-sm">
                <span className="text-slate-900">Take-Home Profit:</span>
                <span className="text-emerald-700">{formatCurrency(baseProfit, currency)}</span>
              </div>
              <div className="text-right text-[11px] text-slate-400">
                Margin: {formatPercent(baseMargin)}
              </div>
            </div>
          </Card>

          {/* Simulated Outcome Card */}
          <Card
            padding="md"
            className={
              sim.profitDiff >= 0
                ? 'bg-emerald-950 text-white border-emerald-800'
                : 'bg-rose-950 text-white border-rose-800'
            }
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                Simulated Projection
              </p>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-white/10">
                {sim.profitDiff >= 0 ? '+' : ''}
                {formatCurrency(sim.profitDiff, currency)} net impact
              </span>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-300">Projected Revenue:</span>
                <span className="font-bold text-white">{formatCurrency(sim.projectedRevenue, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Projected COGS:</span>
                <span className="font-medium text-slate-200">-{formatCurrency(sim.projectedCOGS, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Projected OpEx:</span>
                <span className="font-medium text-slate-200">-{formatCurrency(sim.projectedOpEx, currency)}</span>
              </div>
              <div className="pt-2 border-t border-white/10 flex justify-between font-black text-base">
                <span>Projected Profit:</span>
                <span className={sim.projectedProfit >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                  {formatCurrency(sim.projectedProfit, currency)}
                </span>
              </div>
              <div className="text-right text-[11px] text-slate-300 font-semibold">
                New Margin: {formatPercent(sim.projectedMargin)} ({sim.marginDiff >= 0 ? '+' : ''}
                {formatPercent(sim.marginDiff)})
              </div>
            </div>
          </Card>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset Simulator
          </Button>

          <Button type="button" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
