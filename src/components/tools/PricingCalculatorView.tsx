import React, { useState } from 'react';
import {
  ArrowLeft,
  Calculator,
  Percent,
  TrendingUp,
  Plus,
  CheckCircle2,
  Package,
  Truck,
  CreditCard,
  Building,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBusinessData } from '../../context/BusinessDataContext';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { formatCurrency, formatPercent } from '../../lib/formatters';
import { ProFeatureGate } from '../subscription/ProFeatureGate';

interface PricingCalculatorViewProps {
  onBack: () => void;
  onUpgrade?: () => void;
}

export const PricingCalculatorView: React.FC<PricingCalculatorViewProps> = ({
  onBack,
  onUpgrade,
}) => {
  const { business, isSubscribed } = useAuth();
  const { addProduct } = useBusinessData();
  const currency = business?.currency || 'NGN';

  // Calculator inputs
  const [productName, setProductName] = useState('');
  const [costPrice, setCostPrice] = useState<string>('15000');
  const [targetMargin, setTargetMargin] = useState<string>('35'); // 35% margin
  const [packagingCost, setPackagingCost] = useState<string>('500');
  const [logisticsCost, setLogisticsCost] = useState<string>('1500');
  const [paymentFeePercent, setPaymentFeePercent] = useState<string>('1.5');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Calculations
  const cp = parseFloat(costPrice) || 0;
  const marginPct = parseFloat(targetMargin) || 0;
  const pack = parseFloat(packagingCost) || 0;
  const log = parseFloat(logisticsCost) || 0;
  const feePct = parseFloat(paymentFeePercent) || 0;

  // Direct Total Unit Cost
  const totalDirectCost = cp + pack + log;

  // Selling price needed to achieve target margin while covering percentage fees
  const divisor = 1 - marginPct / 100 - feePct / 100;
  const suggestedSellingPrice = divisor > 0.05 ? Math.ceil(totalDirectCost / divisor) : 0;

  const paymentFeeAmount = (suggestedSellingPrice * feePct) / 100;
  const grossProfit = suggestedSellingPrice - totalDirectCost - paymentFeeAmount;
  const effectiveMargin = suggestedSellingPrice > 0 ? (grossProfit / suggestedSellingPrice) * 100 : 0;
  const markupOnCost = totalDirectCost > 0 ? ((suggestedSellingPrice - totalDirectCost) / totalDirectCost) * 100 : 0;

  const handleSaveToCatalog = async () => {
    if (!productName.trim() || suggestedSellingPrice <= 0) return;
    try {
      await addProduct({
        name: productName.trim(),
        defaultCostPrice: cp,
        defaultSellingPrice: suggestedSellingPrice,
        category: 'Calculated Price',
      });
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
      }, 2500);
    } catch (e) {
      console.error(e);
    }
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
                Pricing & Margin Calculator
              </h1>
              <p className="text-xs text-slate-500">
                Calculate unit pricing, markup, and profit margins.
              </p>
            </div>
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6">
          <ProFeatureGate
            title="Pricing & Margin Calculator"
            subtitle="Calculate mathematically precise retail prices that guarantee your target margins after factoring packaging, dispatch, and POS transaction fees."
            icon={Calculator}
            benefits={[
              'Calculate exact selling prices based on target margin %',
              'Account for packaging, dispatch, and POS payment fees',
              '1-click export of calculated items directly to your store catalog',
              'Markup vs profit margin real-time sensitivity comparison',
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
              Pricing & Margin Calculator
            </h1>
            <p className="text-xs text-slate-500">
              Calculate exactly what to charge to hit your profit targets after factoring packaging, dispatch, and POS fees.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Form */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-8 space-y-6">
          {/* Base Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={`Item Base Cost (${currency})`}
              type="number"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              placeholder="e.g. 15000"
              helperText="What you buy or make the item for"
              leftAddon={<Calculator className="w-4 h-4 text-slate-500" />}
            />

            <Input
              label="Target Profit Margin (%)"
              type="number"
              value={targetMargin}
              onChange={(e) => setTargetMargin(e.target.value)}
              placeholder="e.g. 35"
              helperText="Typical Nigerian retail margin: 30% - 50%"
              leftAddon={<Percent className="w-4 h-4 text-slate-500" />}
            />
          </div>

          {/* Operational Overhead Inputs */}
          <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-3">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Add Hidden Operational Overheads
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label={`Packaging / Box (${currency})`}
                type="number"
                value={packagingCost}
                onChange={(e) => setPackagingCost(e.target.value)}
                placeholder="0"
                leftAddon={<Package className="w-3.5 h-3.5 text-slate-400" />}
              />

              <Input
                label={`Dispatch / Waybill (${currency})`}
                type="number"
                value={logisticsCost}
                onChange={(e) => setLogisticsCost(e.target.value)}
                placeholder="0"
                leftAddon={<Truck className="w-3.5 h-3.5 text-slate-400" />}
              />

              <Input
                label="POS / Bank Fee (%)"
                type="number"
                value={paymentFeePercent}
                onChange={(e) => setPaymentFeePercent(e.target.value)}
                placeholder="1.5"
                leftAddon={<CreditCard className="w-3.5 h-3.5 text-slate-400" />}
              />
            </div>
          </div>

          {/* Calculated Output Summary Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-emerald-900 text-white shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-800 pb-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-emerald-300 font-bold">
                  Recommended Selling Price
                </p>
                <p className="text-3xl font-black tracking-tight text-white mt-0.5 font-mono tabular-nums">
                  {formatCurrency(suggestedSellingPrice, currency)}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-emerald-800 text-emerald-200 rounded-full text-xs font-bold font-mono tabular-nums">
                  Effective Margin: {formatPercent(effectiveMargin)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-emerald-950/60 p-2.5 rounded-xl border border-emerald-800/80">
                <p className="text-emerald-300">Base Cost</p>
                <p className="font-bold text-white mt-0.5 font-mono tabular-nums">
                  {formatCurrency(cp, currency)}
                </p>
              </div>
              <div className="bg-emerald-950/60 p-2.5 rounded-xl border border-emerald-800/80">
                <p className="text-emerald-300">Overheads</p>
                <p className="font-bold text-white mt-0.5 font-mono tabular-nums">
                  {formatCurrency(pack + log, currency)}
                </p>
              </div>
              <div className="bg-emerald-950/60 p-2.5 rounded-xl border border-emerald-800/80">
                <p className="text-emerald-300">Net Profit</p>
                <p className="font-bold text-emerald-300 mt-0.5 font-mono tabular-nums">
                  +{formatCurrency(grossProfit, currency)}
                </p>
              </div>
              <div className="bg-emerald-950/60 p-2.5 rounded-xl border border-emerald-800/80">
                <p className="text-emerald-300">Cost Markup</p>
                <p className="font-bold text-white mt-0.5 font-mono tabular-nums">
                  +{formatPercent(markupOnCost)}
                </p>
              </div>
            </div>
          </div>

          {/* Save to Catalog Section */}
          <div className="p-4 sm:p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Add directly to your Catalog?
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Enter product name (e.g. Premium Linen Shirt)"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
              <Button
                type="button"
                size="md"
                disabled={!productName.trim() || suggestedSellingPrice <= 0}
                onClick={handleSaveToCatalog}
                leftIcon={<Plus className="w-4 h-4" />}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
              >
                Save to Catalog
              </Button>
            </div>

            {savedSuccess && (
              <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5 mt-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Saved successfully to inventory catalog!
              </p>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={onBack}>
              Cancel
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
