import React, { useState } from 'react';
import {
  Calculator,
  Percent,
  TrendingUp,
  Plus,
  CheckCircle2,
  HelpCircle,
  Package,
  Truck,
  CreditCard,
  Building,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBusinessData } from '../../context/BusinessDataContext';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { formatCurrency, formatPercent } from '../../lib/formatters';
import { ProFeatureGate } from '../subscription/ProFeatureGate';

interface PricingCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
}

export const PricingCalculatorModal: React.FC<PricingCalculatorModalProps> = ({
  isOpen,
  onClose,
  onUpgrade,
}) => {
  const { business, user, isSuperAdmin, isDemoMode, isSubscribed } = useAuth();
  const { addProduct } = useBusinessData();
  const currency = business?.currency || 'NGN';

  // Calculator inputs
  const [productName, setProductName] = useState('');
  const [costPrice, setCostPrice] = useState<string>('15000');
  const [targetMargin, setTargetMargin] = useState<string>('35'); // 35% margin
  const [packagingCost, setPackagingCost] = useState<string>('500');
  const [logisticsCost, setLogisticsCost] = useState<string>('1500');
  const [paymentFeePercent, setPaymentFeePercent] = useState<string>('1.5'); // e.g., POS / Paystack fee
  const [saveToCatalog, setSaveToCatalog] = useState(false);
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
  // Formula: SellingPrice = TotalDirectCost / (1 - (marginPct/100) - (feePct/100))
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
        onClose();
      }, 1500);
    } catch (e) {
      console.error(e);
    }
  };

  if (!isSubscribed) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
        <ProFeatureGate
          mode="modal"
          title="Pricing & Margin Calculator"
          subtitle="Calculate mathematically precise retail prices that guarantee your target margins after factoring packaging, dispatch, and POS transaction fees."
          icon={Calculator}
          benefits={[
            'Calculate exact selling prices based on target margin %',
            'Account for packaging, dispatch, and POS payment fees',
            '1-click export of calculated items directly to your store catalog',
            'Markup vs profit margin real-time sensitivity comparison',
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
      title="Interactive Pricing & Margin Calculator"
      description="Calculate exactly what to charge to hit your profit targets after factoring packaging, dispatch, and POS fees."
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6 pt-2">
        {/* Input Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={`Item Base Cost (${currency})`}
            type="number"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
            placeholder="e.g. 15000"
            helperText="What you buy or make the item for"
            leftAddon={<Calculator className="w-4 h-4" />}
          />

          <Input
            label="Target Profit Margin (%)"
            type="number"
            value={targetMargin}
            onChange={(e) => setTargetMargin(e.target.value)}
            placeholder="e.g. 35"
            helperText="Typical Nigerian retail margin: 30% - 50%"
            leftAddon={<Percent className="w-4 h-4" />}
          />
        </div>

        {/* Operational Overhead Inputs */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
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

        {/* Calculated Result Card */}
        <div className="p-5 rounded-2xl bg-emerald-900 text-white shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-800 pb-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-emerald-300 font-bold">
                Recommended Selling Price
              </p>
              <p className="text-3xl font-black tracking-tight text-white mt-0.5">
                {formatCurrency(suggestedSellingPrice, currency)}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-emerald-800 text-emerald-200 rounded-full text-xs font-bold">
                Effective Margin: {formatPercent(effectiveMargin)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <p className="text-emerald-300">Base Cost</p>
              <p className="font-bold text-white mt-0.5">{formatCurrency(cp, currency)}</p>
            </div>
            <div>
              <p className="text-emerald-300">Overheads</p>
              <p className="font-bold text-white mt-0.5">{formatCurrency(pack + log, currency)}</p>
            </div>
            <div>
              <p className="text-emerald-300">Net Profit</p>
              <p className="font-bold text-emerald-300 mt-0.5">+{formatCurrency(grossProfit, currency)}</p>
            </div>
            <div>
              <p className="text-emerald-300">Cost Markup</p>
              <p className="font-bold text-white mt-0.5">+{formatPercent(markupOnCost)}</p>
            </div>
          </div>
        </div>

        {/* Save to Catalog option */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">Add directly to your Catalog?</span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter product name (e.g. Premium Linen Shirt)"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
            <Button
              type="button"
              size="sm"
              disabled={!productName.trim() || suggestedSellingPrice <= 0}
              onClick={handleSaveToCatalog}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
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
      </div>
    </Modal>
  );
};
