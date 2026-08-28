import React, { useState, useEffect } from 'react';
import { ShoppingBag, Calculator, Sparkles, CheckCircle2, Scan } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { PaymentMethod } from '../../types';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, getTodayDateString } from '../../lib/formatters';
import { calculateSaleMetrics } from '../../lib/math';
import { BarcodeScannerModal } from '../pos/BarcodeScannerModal';

interface RecordSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'Transfer', label: 'Bank Transfer (Instant/App)' },
  { value: 'Cash', label: 'Cash Payment' },
  { value: 'POS', label: 'POS Card Terminal' },
  { value: 'Other', label: 'Other Method' },
];

export const RecordSaleModal: React.FC<RecordSaleModalProps> = ({ isOpen, onClose }) => {
  const { addSale, products } = useBusinessData();
  const { business } = useAuth();
  const currency = business?.currency || 'NGN';

  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState<number | string>(1);
  const [sellingPrice, setSellingPrice] = useState<number | string>('');
  const [costPrice, setCostPrice] = useState<number | string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Transfer');
  const [customerName, setCustomerName] = useState('');
  const [saleDate, setSaleDate] = useState(getTodayDateString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Auto-fill price suggestion if user picks an existing product name
  const handleProductSelect = (selectedName: string) => {
    setProductName(selectedName);
    const existing = products.find((p) => p.name.toLowerCase() === selectedName.toLowerCase());
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

      // Reset and close
      setProductName('');
      setQuantity(1);
      setSellingPrice('');
      setCostPrice('');
      setCustomerName('');
      setSaleDate(getTodayDateString());
      onClose();
    } catch (err) {
      setError('Failed to record sale. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record New Sale"
      subtitle="Enter details below. Revenue, costs, and profit calculate automatically."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Product Selection / Name */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-700">Product or Service Name</label>
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
            >
              <Scan className="w-3.5 h-3.5" />
              <span>Scan Barcode / QR</span>
            </button>
          </div>
          <input
            type="text"
            placeholder="e.g. Ankara Fabric, Kaftan, Screen Protector"
            value={productName}
            onChange={(e) => {
              setProductName(e.target.value);
              setError(null);
            }}
            required
            list="product-suggestions"
            className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            leftAddon={<span className="text-xs font-semibold">₦</span>}
          />
        </div>

        {/* Cost Price & Payment Method */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label={`Cost Price (what it cost you per item)`}
            type="number"
            min="0"
            step="any"
            placeholder="e.g. 9000 (Optional)"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
            helperText="Used to calculate real profit"
            leftAddon={<span className="text-xs font-semibold">₦</span>}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Customer Name (Optional)"
            type="text"
            placeholder="e.g. Mrs. Adebayo"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />

          <Input
            label="Sale Date"
            type="date"
            value={saleDate}
            onChange={(e) => setSaleDate(e.target.value)}
            required
          />
        </div>

        {/* Live Automatic Calculation Preview Box */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5 text-emerald-800 font-semibold">
              <Calculator className="w-3.5 h-3.5" />
              <span>Automatic Software Calculations</span>
            </span>
            <span>No AI guesswork</span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="bg-white p-2.5 rounded-lg border border-slate-100 text-center">
              <p className="text-[10px] text-slate-400 font-medium">Total Revenue</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                {formatCurrency(liveMetrics.revenue, currency)}
              </p>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-100 text-center">
              <p className="text-[10px] text-slate-400 font-medium">Total Cost</p>
              <p className="text-sm font-bold text-slate-600 mt-0.5">
                {formatCurrency(liveMetrics.cost, currency)}
              </p>
            </div>
            <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-100 text-center">
              <p className="text-[10px] text-emerald-700 font-medium">Gross Profit</p>
              <p className="text-sm font-bold text-emerald-800 mt-0.5">
                {formatCurrency(liveMetrics.profit, currency)}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting} size="md">
            Save Sale
          </Button>
        </div>
      </form>

      {/* Barcode Scanner */}
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
    </Modal>
  );
};
