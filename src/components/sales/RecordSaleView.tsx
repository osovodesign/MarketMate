import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Scan,
  Calculator,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  TrendingUp,
  Percent,
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

interface RecordSaleViewProps {
  onBack: () => void;
  onSuccess?: () => void;
  prefillCustomer?: string;
  prefillProduct?: Product;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'Transfer', label: 'Bank Transfer (Instant / App)' },
  { value: 'Cash', label: 'Cash Payment' },
  { value: 'POS', label: 'POS Card Terminal' },
  { value: 'Other', label: 'Other Method' },
];

export const RecordSaleView: React.FC<RecordSaleViewProps> = ({
  onBack,
  onSuccess,
  prefillCustomer,
  prefillProduct,
}) => {
  const { addSale, products } = useBusinessData();
  const { business } = useAuth();
  const currency = business?.currency || 'NGN';

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
  const [isSuccess, setIsSuccess] = useState(false);
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

  // Auto-fill price suggestion if user picks an existing product name
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!productName.trim()) {
      setError('Please enter the product or service name.');
      return;
    }

    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      setError('Quantity must be greater than 0.');
      return;
    }

    const price = Number(sellingPrice);
    if (price < 0 || isNaN(price)) {
      setError('Selling price cannot be negative.');
      return;
    }

    const cost = Number(costPrice) || 0;
    if (cost < 0 || isNaN(cost)) {
      setError('Cost price cannot be negative.');
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

      setIsSuccess(true);

      // Brief delay to allow user to see success confirmation before returning
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          onBack();
        }
      }, 700);
    } catch (err) {
      setError('Failed to record sale. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-full pb-12">
      {/* Top Navigation Bar with Back Button */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
            title="Go back"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              Record Sale
            </h1>
            <p className="text-xs text-slate-500">
              Enter details below. Revenue, costs, and profit calculate automatically.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsScannerOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
        >
          <Scan className="w-4 h-4 text-emerald-700" />
          <span className="hidden sm:inline">Scan Barcode / QR</span>
          <span className="sm:hidden">Scan</span>
        </button>
      </div>

      {/* Main Form Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6">
        {isSuccess ? (
          <div className="p-8 bg-white border border-emerald-200 rounded-2xl shadow-sm text-center space-y-3 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Sale Recorded Successfully!</h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {quantity}x {productName} recorded for {formatCurrency(liveMetrics.revenue, currency)}. Returning to your dashboard...
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-8 space-y-6"
          >
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Product Section */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="productNameInput" className="text-xs font-semibold text-slate-700">
                  Product or Service Name <span className="text-rose-500">*</span>
                </label>
                {products.length > 0 && (
                  <span className="text-[11px] text-slate-400">
                    {products.length} catalog items available
                  </span>
                )}
              </div>
              <input
                id="productNameInput"
                type="text"
                placeholder="e.g. Ankara Fabric, Screen Protector, Catering Fee"
                value={productName}
                onChange={(e) => handleProductSelect(e.target.value)}
                required
                list="product-suggestions"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none transition-all placeholder:text-slate-400"
              />
              {products.length > 0 && (
                <datalist id="product-suggestions">
                  {products.map((p) => (
                    <option key={p.id} value={p.name} />
                  ))}
                </datalist>
              )}
            </div>

            {/* Quantity & Selling Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Quantity Sold"
                type="number"
                min="1"
                step="1"
                placeholder="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />

              <Input
                label={`Selling Price (per item in ${currency})`}
                type="number"
                min="0"
                step="any"
                placeholder="e.g. 15000"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                required
                leftAddon={<span className="text-xs font-semibold text-slate-600">{currency}</span>}
              />
            </div>

            {/* Cost Price & Payment Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Cost Price (what it cost you per item)"
                type="number"
                min="0"
                step="any"
                placeholder="e.g. 9000 (Optional)"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                helperText="Used to accurately compute gross profit and profit margins"
                leftAddon={<span className="text-xs font-semibold text-slate-600">{currency}</span>}
              />

              <Select
                label="Payment Method"
                options={PAYMENT_METHODS}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                required
              />
            </div>

            {/* Customer & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Customer Name (Optional)"
                type="text"
                placeholder="e.g. Mrs. Adebayo"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                helperText="Attaches customer record for receipts and transaction history"
              />

              <Input
                label="Sale Date"
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                required
              />
            </div>

            {/* Live Software Calculation Preview */}
            <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                <span className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                  <Calculator className="w-4 h-4 text-emerald-700" />
                  <span>Real-Time Financial Calculations</span>
                </span>
                <span className="text-[11px] text-slate-400">Deterministic business math</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-white p-3 rounded-lg border border-slate-200/80 text-center">
                  <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                    Total Revenue
                  </p>
                  <p className="text-sm sm:text-base font-bold text-slate-900 mt-0.5 font-mono tabular-nums">
                    {formatCurrency(liveMetrics.revenue, currency)}
                  </p>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200/80 text-center">
                  <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                    Total Cost
                  </p>
                  <p className="text-sm sm:text-base font-bold text-slate-600 mt-0.5 font-mono tabular-nums">
                    {formatCurrency(liveMetrics.cost, currency)}
                  </p>
                </div>

                <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-200/80 text-center">
                  <p className="text-[10px] uppercase font-semibold text-emerald-700 tracking-wider">
                    Gross Profit
                  </p>
                  <p className="text-sm sm:text-base font-bold text-emerald-800 mt-0.5 font-mono tabular-nums">
                    {formatCurrency(liveMetrics.profit, currency)}
                  </p>
                </div>

                <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-200/80 text-center">
                  <p className="text-[10px] uppercase font-semibold text-emerald-700 tracking-wider">
                    Profit Margin
                  </p>
                  <p className="text-sm sm:text-base font-bold text-emerald-800 mt-0.5 font-mono tabular-nums">
                    {liveMetrics.profitMargin.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Actions: Explicit Cancel Button + Save Sale Button */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                onClick={onBack}
                disabled={isSubmitting}
                className="text-slate-600 hover:text-slate-900"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isSubmitting}
                size="md"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6"
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
