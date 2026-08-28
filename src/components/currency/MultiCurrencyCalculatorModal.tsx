import React, { useState } from 'react';
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
}

export const MultiCurrencyCalculatorModal: React.FC<MultiCurrencyCalculatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { fxConfig, updateFxRates } = useBusinessData();
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

  if (!isOpen) return null;

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
                <label className="text-xs font-bold text-slate-700">
                  Exchange Rate (₦ per 1 {foreignCurrency}):
                </label>
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
                  onClick={() => handleResetToPreset('parallel')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    marketType === 'parallel'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Parallel Market (Street)
                </button>
                <button
                  type="button"
                  onClick={() => handleResetToPreset('official')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    marketType === 'official'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Official (CBN)
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
