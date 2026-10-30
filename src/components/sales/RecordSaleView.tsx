import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Scan,
  Calculator,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
} from 'lucide-react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { PaymentMethod, Product } from '../../types';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, getTodayDateString } from '../../lib/formatters';
import { calculateSaleMetrics } from '../../lib/math';
import { BarcodeScannerModal } from '../pos/BarcodeScannerModal';
import { hasPermission } from '../../lib/staffPermissions';

interface RecordSaleViewProps {
  onBack: () => void;
  onSuccess?: () => void;
  prefillCustomer?: string;
  prefillProduct?: Product;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'Transfer', label: 'Bank Transfer' },
  { value: 'Cash', label: 'Cash' },
  { value: 'POS', label: 'POS Card Terminal' },
  { value: 'Other', label: 'Other' },
];

export const RecordSaleView: React.FC<RecordSaleViewProps> = ({
  onBack,
  onSuccess,
  prefillCustomer,
  prefillProduct,
}) => {
  const { addSale, products, currentSession } = useBusinessData();
  const { business } = useAuth();
  const currency = business?.currency || 'NGN';
  const canViewProfit = hasPermission(currentSession, 'showProfitAndMargins');

  const [productName, setProductName] = useState(prefillProduct?.name || '');
  const [quantity, setQuantity] = useState<number | string>(1);
  const [sellingPrice, setSellingPrice] = useState<number | string>(
    prefillProduct?.defaultSellingPrice ?? ''
  );
  const [costPrice, setCostPrice] = useState<number | string>(
    prefillProduct?.defaultCostPrice ?? ''
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Transfer');
  const [customerName, setCustomerName] = useState(prefillCustomer || '');
  const [saleDate, setSaleDate] = useState(getTodayDateString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedSaleSummary, setSavedSaleSummary] = useState<{
    productName: string;
    quantity: number;
    revenue: number;
    profit: number;
    paymentMethod: PaymentMethod;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    if (prefillProduct) {
      setProductName(prefillProduct.name);
      setSellingPrice(prefillProduct.defaultSellingPrice);
      setCostPrice(prefillProduct.defaultCostPrice);
    }
  }, [prefillProduct]);

  useEffect(() => {
    if (prefillCustomer) {
      setCustomerName(prefillCustomer);
    }
  }, [prefillCustomer]);

  // Auto-fill saved selling price and cost price if user selects an existing product
  const handleProductSelect = (selectedName: string) => {
    setProductName(selectedName);
    setError(null);
    const existing = products.find(
      (p) => p.name.trim().toLowerCase() === selectedName.trim().toLowerCase()
    );
    if (existing) {
      setSellingPrice(existing.defaultSellingPrice);
      setCostPrice(existing.defaultCostPrice);
    }
  };

  // Live calculation metrics
  const liveMetrics = calculateSaleMetrics(
    Number(quantity) || 0,
    Number(sellingPrice) || 0,
    Number(costPrice) || 0
  );

  const handleRecordAnother = () => {
    setSavedSaleSummary(null);
    setProductName('');
    setQuantity(1);
    setSellingPrice('');
    setCostPrice('');
    setCustomerName('');
    setError(null);
    setIsSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);

    if (!productName.trim()) {
      setError('Enter the product or service name.');
      return;
    }

    const qty = Number(quantity);
    if (!qty || qty <= 0 || isNaN(qty)) {
      setError('Quantity must be greater than zero.');
      return;
    }

    if (sellingPrice === '' || Number(sellingPrice) < 0 || isNaN(Number(sellingPrice))) {
      setError('Enter a valid selling price (0 or higher).');
      return;
    }

    const price = Number(sellingPrice);
    const cost = Number(costPrice) || 0;
    if (cost < 0 || isNaN(cost)) {
      setError('Cost price cannot be negative.');
      return;
    }

    if (!saleDate) {
      setError('Select a valid sale date.');
      return;
    }

    try {
      setIsSubmitting(true);
      await addSale({
        productName: productName.trim(),
        quantity: qty,
        sellingPrice: price,
        costPrice: cost,
        paymentMethod,
        customerName: customerName.trim() || undefined,
        saleDate,
      });

      setSavedSaleSummary({
        productName: productName.trim(),
        quantity: qty,
        revenue: liveMetrics.revenue,
        profit: liveMetrics.profit,
        paymentMethod,
      });
      setIsSubmitting(false);
    } catch (err) {
      setError("We couldn't save this sale. Check your connection and try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-full pb-12">
      {/* Top Bar with Back Button */}
      <div className="bg-white dark:bg-[#001A35] border border-slate-200 dark:border-slate-800 rounded-2xl px-4 sm:px-6 py-3.5 mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#059669] cursor-pointer"
            title="Go back"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
              Record Sale
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              Enter what was sold and how the customer paid
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsScannerOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#059669] dark:text-[#34D399] bg-[#ECFDF5] dark:bg-[#064E3B]/50 hover:bg-[#D1FAE5] border border-[#059669]/30 rounded-xl transition-colors cursor-pointer shrink-0"
        >
          <Scan className="w-4 h-4" />
          <span>Scan Barcode</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto">
        {savedSaleSummary ? (
          <div className="p-6 sm:p-8 bg-white dark:bg-[#001A35] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#ECFDF5] dark:bg-[#064E3B] text-[#059669] dark:text-[#34D399] mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Sale saved successfully.
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                {savedSaleSummary.quantity} × <strong>{savedSaleSummary.productName}</strong> recorded for{' '}
                <strong className="tabular-nums">
                  {formatCurrency(savedSaleSummary.revenue, currency)}
                </strong>{' '}
                ({savedSaleSummary.paymentMethod}).
              </p>
            </div>

            {canViewProfit && (
              <div className="max-w-xs mx-auto p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-300">Expected profit</span>
                <span className="font-bold text-[#059669] dark:text-[#34D399] tabular-nums">
                  {formatCurrency(savedSaleSummary.profit, currency)}
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                type="button"
                onClick={handleRecordAnother}
                leftIcon={<PlusCircle className="w-4 h-4" />}
                className="w-full sm:w-auto bg-[#059669] hover:bg-[#047857] text-white font-semibold cursor-pointer"
              >
                Record Another Sale
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => (onSuccess ? onSuccess() : onBack())}
                className="w-full sm:w-auto border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-semibold cursor-pointer"
              >
                View Sales
              </Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-[#001A35] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs p-5 sm:p-8 space-y-6"
          >
            {error && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-medium flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Section A. What was sold */}
            <div className="space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  A. What was sold
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Choose a saved product or type any product or service name.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="productNameInput"
                    className="text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Product or Service Name <span className="text-rose-500">*</span>
                  </label>
                  {products.length > 0 && (
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {products.length} saved {products.length === 1 ? 'product' : 'products'}
                    </span>
                  )}
                </div>
                <input
                  id="productNameInput"
                  type="text"
                  placeholder="e.g. Bag of Rice, Hair Braiding, Phone Charger"
                  value={productName}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  required
                  list="product-suggestions"
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-[#059669] focus:outline-none transition-all placeholder:text-slate-400"
                />
                {products.length > 0 && (
                  <datalist id="product-suggestions">
                    {products.map((p) => (
                      <option key={p.id} value={p.name} />
                    ))}
                  </datalist>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Quantity Sold *"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  step="1"
                  placeholder="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />

                <Input
                  label={`Selling Price (${currency}) *`}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  placeholder="e.g. 15000"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  helperText="What the customer pays per item"
                  required
                  leftAddon={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{currency}</span>}
                />

                <Input
                  label={`Cost Price (${currency})`}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  placeholder="e.g. 10000"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  helperText="What the business paid per item"
                  leftAddon={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{currency}</span>}
                />
              </div>
            </div>

            {/* Section B. Payment details */}
            <div className="space-y-4 pt-2">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  B. Payment details
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  How the customer paid and when the sale happened.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Select
                  label="Payment Method *"
                  options={PAYMENT_METHODS}
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  required
                />

                <Input
                  label="Customer Name (Optional)"
                  type="text"
                  placeholder="e.g. Mrs. Adebayo"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  helperText="Leave blank for walk-in customer"
                />

                <Input
                  label="Sale Date *"
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Section C. Sale summary */}
            <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white">
                  <Calculator className="w-4 h-4 text-[#059669] dark:text-[#34D399]" />
                  <span>C. Sale summary</span>
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Total = Quantity ({Number(quantity) || 0}) × Selling price ({formatCurrency(Number(sellingPrice) || 0, currency)})
                </span>
              </div>

              <div className={`grid grid-cols-1 ${canViewProfit ? 'sm:grid-cols-3' : 'sm:grid-cols-1'} gap-3`}>
                <div className="bg-white dark:bg-[#001A35] p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Total selling amount
                  </p>
                  <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                    {formatCurrency(liveMetrics.revenue, currency)}
                  </p>
                </div>

                {canViewProfit && (
                  <>
                    <div className="bg-white dark:bg-[#001A35] p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Total product cost
                      </p>
                      <p className="text-base sm:text-lg font-bold text-slate-700 dark:text-slate-200 mt-0.5 tabular-nums">
                        {formatCurrency(liveMetrics.cost, currency)}
                      </p>
                    </div>

                    <div className="bg-[#ECFDF5] dark:bg-[#064E3B]/40 p-3 rounded-lg border border-[#059669]/30">
                      <p className="text-xs text-[#047857] dark:text-[#34D399]">
                        Expected profit ({liveMetrics.profitMargin.toFixed(1)}%)
                      </p>
                      <p className="text-base sm:text-lg font-bold text-[#047857] dark:text-[#34D399] mt-0.5 tabular-nums">
                        {formatCurrency(liveMetrics.profit, currency)}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="ghost"
                onClick={onBack}
                disabled={isSubmitting}
                className="w-full sm:w-auto text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isSubmitting}
                disabled={isSubmitting}
                size="md"
                className="w-full sm:w-auto bg-[#059669] hover:bg-[#047857] text-white font-semibold px-6 cursor-pointer"
              >
                Save Sale
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(code, matched) => {
          if (matched) {
            setProductName(matched.name);
            setSellingPrice(matched.defaultSellingPrice);
            setCostPrice(matched.defaultCostPrice);
          } else {
            setProductName(code);
          }
        }}
        products={products}
      />
    </div>
  );
};
