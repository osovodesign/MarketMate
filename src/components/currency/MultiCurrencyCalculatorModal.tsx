import React, { useState, useEffect } from 'react';
import {
  X,
  Calculator,
  RefreshCw,
  Ship,
  TrendingUp,
  DollarSign,
  ArrowRight,
  Info,
  CheckCircle2,
  Sliders,
  Percent,
} from 'lucide-react';
import { CurrencyCode, ExchangeRateConfig } from '../../types';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useAuth } from '../../context/AuthContext';
import { ProFeatureGate } from '../subscription/ProFeatureGate';
import {
  CURRENCIES,
  calculateLandedCost,
  DEFAULT_EXCHANGE_RATES_PARALLEL,
  DEFAULT_EXCHANGE_RATES_OFFICIAL,
} from '../../lib/currencies';
import { formatMoney } from '../../lib/calculations';

interface MultiCurrencyCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
}

export const MultiCurrencyCalculatorModal: React.FC<MultiCurrencyCalculatorModalProps> = ({
  isOpen,
  onClose,
  onUpgrade,
}) => {
  const { fxConfig, updateFxRates, syncLiveFxRates, isSyncingFx, fxSource } = useBusinessData();
  const { business, user, isSuperAdmin, isDemoMode, isSubscribed } = useAuth();
  const [activeTab, setActiveTab] = useState<'landed_cost' | 'rates_manager'>('landed_cost');

  // Landed Cost State
  const [foreignCurrency, setForeignCurrency] = useState<CurrencyCode>('USD');
  const [foreignPurchasePrice, setForeignPurchasePrice] = useState<string>('500'); // e.g. $500 batch
  const [customExchangeRate, setCustomExchangeRate] = useState<string>(
    String(fxConfig.rates[foreignCurrency] || 1520)
  );
  const [freightShippingCost, setFreightShippingCost] = useState<string>('80000'); // in NGN or foreign
  const [freightInForeign, setFreightInForeign] = useState<boolean>(false);
  const [customsClearingCost, setCustomsClearingCost] = useState<string>('45000'); // in NGN
  const [localHandlingCost, setLocalHandlingCost] = useState<string>('15000'); // in NGN
  const [unitsQuantity, setUnitsQuantity] = useState<string>('20'); // 20 units imported
  const [targetMarginPercent, setTargetMarginPercent] = useState<string>('35'); // 35% profit margin

  // Exchange Rates Edit State
  const [editableRates, setEditableRates] = useState<Record<CurrencyCode, number>>({
    ...fxConfig.rates,
  });
  const [marketType, setMarketType] = useState<'parallel' | 'official'>(fxConfig.marketType || 'parallel');
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  useEffect(() => {
    setEditableRates(fxConfig.rates);
    setCustomExchangeRate(String(fxConfig.rates[foreignCurrency] || 1));
  }, [fxConfig, foreignCurrency]);

  const handleSyncLive = async (forceType?: 'parallel' | 'official') => {
    const targetType = forceType || marketType;
    const res = await syncLiveFxRates(true, targetType);
    if (res.success) {
      setSyncNotice(`✓ Live market rates updated via ${res.source}`);
      setMarketType(targetType);
      setTimeout(() => setSyncNotice(null), 3500);
    }
  };

  if (!isOpen) return null;

  if (!isSubscribed) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
          <ProFeatureGate
            mode="modal"
            title="FX & Landed Cost Import Calculator"
            subtitle="Calculate authentic landed costs for imported goods (USD, EUR, GBP, CNY) factoring freight, customs duties, clearing, and parallel vs. official exchange rates."
            icon={Ship}
            benefits={[
              'Foreign currency conversions (USD, RMB/CNY, EUR, GBP)',
              'Accurate freight, clearing, and port demurrage absorption',
              'Per-unit true landed cost and breakeven selling price',
              'Parallel (Black Market) vs. CBN Official exchange rate manager',
            ]}
            onUpgrade={() => {
              onClose();
              onUpgrade?.();
            }}
            onBack={onClose}
          />
        </div>
      </div>
    );
  }

  // Calculate landed cost results
  const qty = Math.max(1, Number(unitsQuantity) || 1);
  const fPrice = Number(foreignPurchasePrice) || 0;
  const rate = Number(customExchangeRate) || fxConfig.rates[foreignCurrency] || 1;
  const freight = Number(freightShippingCost) || 0;
  const freightNgn = freightInForeign ? freight * rate : freight;
  const customs = Number(customsClearingCost) || 0;
  const local = Number(localHandlingCost) || 0;
  const marginPct = Number(targetMarginPercent) || 30;

  const landedResult = calculateLandedCost({
    foreignPurchasePrice: fPrice,
    foreignCurrency,
    exchangeRate: rate,
    freightShippingCost: freightNgn,
    customsClearingCost: customs,
    localHandlingCost: local,
    unitsQuantity: qty,
    targetMarginPercent: marginPct,
  });

  const handleForeignCurrencyChange = (c: CurrencyCode) => {
    setForeignCurrency(c);
    setCustomExchangeRate(String(fxConfig.rates[c] || 1));
  };

  const handleSaveRates = () => {
    updateFxRates(editableRates, marketType);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2500);
  };

  const handleResetToPreset = (type: 'parallel' | 'official') => {
    const preset = type === 'parallel' ? DEFAULT_EXCHANGE_RATES_PARALLEL : DEFAULT_EXCHANGE_RATES_OFFICIAL;
    setEditableRates(preset);
    setMarketType(type);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Ship className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Multi-Currency & Cross-Border Trade
              </h2>
              <p className="text-xs text-slate-500">
                Import landed cost calculator & Nigerian FX exchange rate tracker
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('landed_cost')}
            className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'landed_cost'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Landed Cost Import Calculator</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rates_manager')}
            className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'rates_manager'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Exchange Rates & FX Market</span>
          </button>
        </div>

        {/* Live Rates Auto-Sync Status Bar */}
        <div className="px-6 py-2.5 bg-emerald-50/90 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900/60 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-emerald-900 dark:text-emerald-200">
              Live Real-Time Market Rates Active
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              • {fxSource || 'Global Interbank Feed'}
            </span>
            {fxConfig.lastUpdated && (
              <span className="text-[10px] text-slate-400 hidden sm:inline">
                (Updated {new Date(fxConfig.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleSyncLive()}
            disabled={isSyncingFx}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncingFx ? 'animate-spin' : ''}`} />
            <span>{isSyncingFx ? 'Syncing...' : 'Sync Live Rates'}</span>
          </button>
        </div>

        {syncNotice && (
          <div className="px-6 py-2 bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{syncNotice}</span>
          </div>
        )}

        {/* Tab 1: Landed Cost Import Calculator */}
        {activeTab === 'landed_cost' && (
          <div className="p-6 overflow-y-auto space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Foreign Supplier Purchase */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Source Currency:</label>
                <div className="grid grid-cols-4 gap-1">
                  {(['USD', 'CNY', 'EUR', 'GBP'] as CurrencyCode[]).map((cur) => (
                    <button
                      key={cur}
                      type="button"
                      onClick={() => handleForeignCurrencyChange(cur)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                        foreignCurrency === cur
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {cur}
                    </button>
                  ))}
                </div>
              </div>

              {/* Foreign Purchase Price */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Total Foreign Invoice ({foreignCurrency}):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    {CURRENCIES[foreignCurrency]?.symbol || '$'}
                  </span>
                  <input
                    type="number"
                    value={foreignPurchasePrice}
                    onChange={(e) => setForeignPurchasePrice(e.target.value)}
                    placeholder="500"
                    className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 font-semibold"
                  />
                </div>
              </div>

              {/* Custom Exchange Rate */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Exchange Rate (₦ per 1 {foreignCurrency}):
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustomExchangeRate(String(fxConfig.rates[foreignCurrency] || 1))}
                    className="text-[10px] text-emerald-600 font-bold hover:underline cursor-pointer"
                  >
                    Use Live (₦{fxConfig.rates[foreignCurrency]?.toLocaleString()})
                  </button>
                </div>
                <input
                  type="number"
                  value={customExchangeRate}
                  onChange={(e) => setCustomExchangeRate(e.target.value)}
                  placeholder="1520"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 font-semibold"
                />
              </div>

              {/* Units Quantity */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Total Units in Batch:</label>
                <input
                  type="number"
                  value={unitsQuantity}
                  onChange={(e) => setUnitsQuantity(e.target.value)}
                  placeholder="20"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 font-semibold"
                />
              </div>

              {/* Freight & Shipping */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Freight / Air Cargo Fee (₦):
                </label>
                <input
                  type="number"
                  value={freightShippingCost}
                  onChange={(e) => setFreightShippingCost(e.target.value)}
                  placeholder="80000"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 font-semibold"
                />
              </div>

              {/* Customs Clearing & Port Terminal */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Customs Clearing / Agent Fee (₦):
                </label>
                <input
                  type="number"
                  value={customsClearingCost}
                  onChange={(e) => setCustomsClearingCost(e.target.value)}
                  placeholder="45000"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 font-semibold"
                />
              </div>

              {/* Local Logistics */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Local Waybill & Handling (₦):
                </label>
                <input
                  type="number"
                  value={localHandlingCost}
                  onChange={(e) => setLocalHandlingCost(e.target.value)}
                  placeholder="15000"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 font-semibold"
                />
              </div>

              {/* Target Profit Margin */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Target Profit Margin (%):</label>
                <div className="relative">
                  <input
                    type="number"
                    value={targetMarginPercent}
                    onChange={(e) => setTargetMarginPercent(e.target.value)}
                    placeholder="35"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 font-semibold"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    %
                  </span>
                </div>
              </div>
            </div>

            {/* Landed Cost Breakdown Card */}
            <div className="bg-emerald-900 text-white rounded-2xl p-5 space-y-4 shadow-md">
              <div className="flex items-center justify-between border-b border-emerald-800 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-300" />
                  <h3 className="text-sm font-bold">Total Landed Import Summary</h3>
                </div>
                <span className="text-xs bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                  {qty} Units Batch
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-emerald-800/60 p-2.5 rounded-xl">
                  <span className="text-[10px] text-emerald-300 block uppercase font-bold">
                    Item Cost (NGN)
                  </span>
                  <span className="text-sm font-bold mt-0.5 block">
                    {formatMoney(landedResult.purchasePriceNgn)}
                  </span>
                </div>
                <div className="bg-emerald-800/60 p-2.5 rounded-xl">
                  <span className="text-[10px] text-emerald-300 block uppercase font-bold">
                    Freight & Clearing
                  </span>
                  <span className="text-sm font-bold mt-0.5 block">
                    {formatMoney(freightNgn + customs + local)}
                  </span>
                </div>
                <div className="bg-emerald-800/60 p-2.5 rounded-xl">
                  <span className="text-[10px] text-emerald-300 block uppercase font-bold">
                    Total Landed Cost
                  </span>
                  <span className="text-sm font-bold mt-0.5 block text-amber-300">
                    {formatMoney(landedResult.totalLandedCostNgn)}
                  </span>
                </div>
                <div className="bg-emerald-800/60 p-2.5 rounded-xl">
                  <span className="text-[10px] text-emerald-300 block uppercase font-bold">
                    True Cost / Unit
                  </span>
                  <span className="text-sm font-bold mt-0.5 block text-white">
                    {formatMoney(landedResult.unitLandedCostNgn)}
                  </span>
                </div>
              </div>

              {/* Recommended Selling Price with Target Margin */}
              <div className="bg-emerald-950/80 p-4 rounded-xl border border-emerald-700/60 flex items-center justify-between">
                <div>
                  <span className="text-xs text-emerald-300 font-semibold block">
                    Recommended Selling Price (at {marginPct}% margin):
                  </span>
                  <span className="text-lg font-extrabold text-white">
                    {formatMoney(landedResult.suggestedSellingPriceNgn)} <span className="text-xs font-normal text-emerald-300">/ unit</span>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-emerald-300 font-semibold block">
                    Profit Per Unit:
                  </span>
                  <span className="text-base font-bold text-emerald-400">
                    +{formatMoney(landedResult.profitPerUnitNgn)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Exchange Rates & FX Market Manager */}
        {activeTab === 'rates_manager' && (
          <div className="p-6 overflow-y-auto space-y-5">
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-800 block">Nigerian FX Benchmarks:</span>
                <span className="text-[11px] text-slate-500">
                  Switch between Parallel Market (Black Market) or CBN Official rate presets.
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSyncLive('parallel')}
                  disabled={isSyncingFx}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    marketType === 'parallel'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Parallel Market (Street)
                </button>
                <button
                  type="button"
                  onClick={() => handleSyncLive('official')}
                  disabled={isSyncingFx}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    marketType === 'official'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Official (CBN/NAFEM)
                </button>
              </div>
            </div>

            {/* Currency Rates Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.keys(editableRates) as CurrencyCode[]).map((cur) => {
                if (cur === 'NGN') return null;
                const meta = CURRENCIES[cur];
                return (
                  <div
                    key={cur}
                    className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 font-bold text-xs flex items-center justify-center text-slate-700">
                        {cur}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900">{meta?.name || cur}</span>
                        <span className="text-[11px] text-slate-400 block font-mono">1 {cur}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 w-32">
                      <span className="text-xs font-bold text-slate-500">₦</span>
                      <input
                        type="number"
                        value={editableRates[cur] || ''}
                        onChange={(e) =>
                          setEditableRates({
                            ...editableRates,
                            [cur]: Number(e.target.value) || 0,
                          })
                        }
                        className="w-full text-right p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {isSavedNotice && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Exchange rates updated successfully and synced across POS terminal!</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={handleSaveRates}
                className="py-2.5 px-5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors"
              >
                Save Exchange Rates
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
