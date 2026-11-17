import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Scan,
  Calculator,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Search,
  Receipt as ReceiptIcon,
  Lock,
  Package,
} from 'lucide-react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { PaymentMethod, Product, Sale } from '../../types';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, getTodayDateString } from '../../lib/formatters';
import { calculateMultiItemSaleMetrics, roundMoney } from '../../lib/math';
import { BarcodeScannerModal } from '../pos/BarcodeScannerModal';
import { ReceiptModal } from './ReceiptModal';
import { ManagerOverrideModal } from '../staff/ManagerOverrideModal';
import { hasPermission } from '../../lib/staffPermissions';

interface RecordSaleViewProps {
  onBack: () => void;
  onSuccess?: () => void;
  prefillCustomer?: string;
  prefillProduct?: Product;
}

interface DraftSaleLineItem {
  id: string;
  productId?: string;
  productName: string;
  barcode?: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  availableStock?: number;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'Transfer', label: 'Bank Transfer' },
  { value: 'Cash', label: 'Cash' },
  { value: 'POS', label: 'POS Card Terminal' },
];

export const RecordSaleView: React.FC<RecordSaleViewProps> = ({
  onBack,
  onSuccess,
  prefillCustomer,
  prefillProduct,
}) => {
  const { addSale, products, customers, currentSession } = useBusinessData();
  const { business } = useAuth();
  const currency = business?.currency || 'NGN';

  const canViewProfit = hasPermission(currentSession, 'showProfitAndMargins');
  const canViewCost = hasPermission(currentSession, 'showCostPrice');
  const canGiveDiscount = hasPermission(currentSession, 'canGiveDiscount');

  // Cart items state for multi-product checkout
  const [lineItems, setLineItems] = useState<DraftSaleLineItem[]>([]);

  // Current entry form fields (for adding an item or quick 1-item checkout)
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(
    prefillProduct?.id
  );
  const [productName, setProductName] = useState(prefillProduct?.name || '');
  const [barcode, setBarcode] = useState<string | undefined>(prefillProduct?.barcode);
  const [quantity, setQuantity] = useState<number | string>(1);
  const [sellingPrice, setSellingPrice] = useState<number | string>(
    prefillProduct?.defaultSellingPrice ?? ''
  );
  const [costPrice, setCostPrice] = useState<number | string>(
    prefillProduct?.defaultCostPrice ?? ''
  );
  const [productSearchFilter, setProductSearchFilter] = useState('');

  // Transaction-level fields
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Transfer');
  const [customerName, setCustomerName] = useState(prefillCustomer || '');
  const [saleDate, setSaleDate] = useState(getTodayDateString());
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState<number | string>('');
  const [isDiscountAuthorized, setIsDiscountAuthorized] = useState(false);
  const [isManagerOverrideOpen, setIsManagerOverrideOpen] = useState(false);

  // Submission & modal states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedSale, setSavedSale] = useState<Sale | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    if (prefillProduct) {
      setSelectedProductId(prefillProduct.id);
      setProductName(prefillProduct.name);
      setBarcode(prefillProduct.barcode);
      setSellingPrice(prefillProduct.defaultSellingPrice);
      setCostPrice(prefillProduct.defaultCostPrice);
    }
  }, [prefillProduct]);

  useEffect(() => {
    if (prefillCustomer) {
      setCustomerName(prefillCustomer);
    }
  }, [prefillCustomer]);

  // Match typed product name to saved inventory product
  const handleProductNameChange = (typedName: string) => {
    setProductName(typedName);
    setError(null);
    const existing = products.find(
      (p) => p.name.trim().toLowerCase() === typedName.trim().toLowerCase()
    );
    if (existing) {
      setSelectedProductId(existing.id);
      setBarcode(existing.barcode);
      setSellingPrice(existing.defaultSellingPrice);
      setCostPrice(existing.defaultCostPrice);
    } else {
      setSelectedProductId(undefined);
      setBarcode(undefined);
    }
  };

  // Select a product chip or dropdown item
  const handlePickSavedProduct = (prod: Product) => {
    setError(null);
    setSelectedProductId(prod.id);
    setProductName(prod.name);
    setBarcode(prod.barcode);
    setSellingPrice(prod.defaultSellingPrice);
    setCostPrice(prod.defaultCostPrice);
    setQuantity(1);
  };

  // Add or merge an item into lineItems
  const appendOrMergeItem = (itemToAdd: {
    productId?: string;
    productName: string;
    barcode?: string;
    quantity: number;
    unitPrice: number;
    costPrice: number;
    availableStock?: number;
  }) => {
    setLineItems((prev) => {
      const existingIndex = prev.findIndex(
        (existing) =>
          (itemToAdd.productId && existing.productId === itemToAdd.productId) ||
          (!itemToAdd.productId &&
            !existing.productId &&
            existing.productName.toLowerCase() === itemToAdd.productName.toLowerCase() &&
            existing.unitPrice === itemToAdd.unitPrice)
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        const current = updated[existingIndex];
        updated[existingIndex] = {
          ...current,
          quantity: current.quantity + itemToAdd.quantity,
          unitPrice: itemToAdd.unitPrice,
          costPrice: itemToAdd.costPrice,
        };
        return updated;
      }

      return [
        ...prev,
        {
          id: `line_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          ...itemToAdd,
        },
      ];
    });
  };

  // Validate current entry inputs and add to Current Sale Items list
  const handleAddItemToSale = () => {
    setError(null);
    const cleanName = productName.trim();
    if (!cleanName) {
      setError('Enter or select a product name before adding to the sale.');
      return;
    }

    const qty = Number(quantity);
    if (!qty || qty <= 0 || isNaN(qty)) {
      setError('Quantity must be greater than zero.');
      return;
    }

    if (sellingPrice === '' || Number(sellingPrice) < 0 || isNaN(Number(sellingPrice))) {
      setError('Enter a valid unit selling price (0 or higher).');
      return;
    }

    const unitPriceNum = roundMoney(Number(sellingPrice));
    const matchedProd = products.find(
      (p) =>
        (selectedProductId && p.id === selectedProductId) ||
        p.name.trim().toLowerCase() === cleanName.toLowerCase()
    );

    const resolvedCost =
      costPrice !== '' && !isNaN(Number(costPrice)) && Number(costPrice) >= 0
        ? roundMoney(Number(costPrice))
        : matchedProd?.defaultCostPrice || 0;

    appendOrMergeItem({
      productId: matchedProd?.id || selectedProductId,
      productName: matchedProd?.name || cleanName,
      barcode: matchedProd?.barcode || barcode,
      quantity: qty,
      unitPrice: unitPriceNum,
      costPrice: resolvedCost,
      availableStock: matchedProd?.stockQuantity,
    });

    // Reset entry fields so the user can immediately add another product
    setSelectedProductId(undefined);
    setProductName('');
    setBarcode(undefined);
    setQuantity(1);
    setSellingPrice('');
    setCostPrice('');
  };

  // Inline quantity update in Current Sale Items list
  const handleUpdateLineQuantity = (lineId: string, newQty: number) => {
    if (isNaN(newQty) || newQty < 1) return;
    setLineItems((prev) =>
      prev.map((item) => (item.id === lineId ? { ...item, quantity: newQty } : item))
    );
  };

  // Inline unit price update in Current Sale Items list
  const handleUpdateLinePrice = (lineId: string, newPrice: number) => {
    if (isNaN(newPrice) || newPrice < 0) return;
    setLineItems((prev) =>
      prev.map((item) => (item.id === lineId ? { ...item, unitPrice: newPrice } : item))
    );
  };

  // Remove item from Current Sale Items list
  const handleRemoveLineItem = (lineId: string) => {
    setLineItems((prev) => prev.filter((item) => item.id !== lineId));
  };

  // Effective items for live preview (combines cart items + any valid pending draft item)
  const pendingDraftItem = useMemo(() => {
    const cleanName = productName.trim();
    const qty = Number(quantity);
    const price = Number(sellingPrice);
    if (!cleanName || !qty || qty <= 0 || sellingPrice === '' || isNaN(price) || price < 0) {
      return null;
    }
    const matchedProd = products.find(
      (p) =>
        (selectedProductId && p.id === selectedProductId) ||
        p.name.trim().toLowerCase() === cleanName.toLowerCase()
    );
    const resolvedCost =
      costPrice !== '' && !isNaN(Number(costPrice)) && Number(costPrice) >= 0
        ? roundMoney(Number(costPrice))
        : matchedProd?.defaultCostPrice || 0;

    return {
      productId: matchedProd?.id || selectedProductId,
      productName: matchedProd?.name || cleanName,
      barcode: matchedProd?.barcode || barcode,
      quantity: qty,
      unitPrice: roundMoney(price),
      costPrice: resolvedCost,
      availableStock: matchedProd?.stockQuantity,
    };
  }, [productName, quantity, sellingPrice, costPrice, selectedProductId, barcode, products]);

  const effectiveItemsForSummary = useMemo(() => {
    const base = lineItems.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      barcode: item.barcode,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      costPrice: item.costPrice,
      discount: 0,
    }));

    if (pendingDraftItem) {
      const existingIdx = base.findIndex(
        (existing) =>
          (pendingDraftItem.productId && existing.productId === pendingDraftItem.productId) ||
          (!pendingDraftItem.productId &&
            !existing.productId &&
            existing.productName.toLowerCase() === pendingDraftItem.productName.toLowerCase() &&
            existing.unitPrice === pendingDraftItem.unitPrice)
      );
      if (existingIdx > -1) {
        base[existingIdx] = {
          ...base[existingIdx],
          quantity: base[existingIdx].quantity + pendingDraftItem.quantity,
        };
      } else {
        base.push({
          ...pendingDraftItem,
          discount: 0,
        });
      }
    }

    return base;
  }, [lineItems, pendingDraftItem]);

  const liveMetrics = useMemo(() => {
    return calculateMultiItemSaleMetrics(effectiveItemsForSummary, Number(discount) || 0);
  }, [effectiveItemsForSummary, discount]);

  // Filtered quick-pick inventory products
  const quickPickProducts = useMemo(() => {
    const q = productSearchFilter.trim().toLowerCase();
    const list = q
      ? products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            (p.category && p.category.toLowerCase().includes(q)) ||
            (p.barcode && p.barcode.toLowerCase().includes(q))
        )
      : products;
    return list.slice(0, 8);
  }, [products, productSearchFilter]);

  const handleRecordAnother = () => {
    setSavedSale(null);
    setLineItems([]);
    setSelectedProductId(undefined);
    setProductName('');
    setBarcode(undefined);
    setQuantity(1);
    setSellingPrice('');
    setCostPrice('');
    setCustomerName('');
    setNotes('');
    setDiscount('');
    setError(null);
    setIsSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);

    if (effectiveItemsForSummary.length === 0) {
      setError('Add at least one product or fill out the product details above to complete the sale.');
      return;
    }

    if (!saleDate) {
      setError('Select a valid sale date.');
      return;
    }

    const orderDiscount = Math.max(0, Number(discount) || 0);
    if (orderDiscount > liveMetrics.grossSubtotal) {
      setError('Discount cannot exceed the sale subtotal.');
      return;
    }

    try {
      setIsSubmitting(true);
      const firstItem = effectiveItemsForSummary[0];
      const created = await addSale({
        productId: firstItem.productId,
        productName: liveMetrics.summaryProductName,
        quantity: liveMetrics.totalQuantity,
        sellingPrice: liveMetrics.primarySellingPrice,
        costPrice: liveMetrics.primaryCostPrice,
        paymentMethod,
        customerName: customerName.trim() || undefined,
        notes: notes.trim() || undefined,
        saleDate,
        discount: orderDiscount,
        items: effectiveItemsForSummary,
      });

      setSavedSale(created);
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
              Add one or multiple products to a single customer checkout
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
      <div className="max-w-4xl mx-auto">
        {savedSale ? (
          <div className="p-6 sm:p-8 bg-white dark:bg-[#001A35] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-[#ECFDF5] dark:bg-[#064E3B] text-[#059669] dark:text-[#34D399] mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Sale recorded & stock updated
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                Receipt <strong>{savedSale.receiptNumber || `#${savedSale.id.slice(-6).toUpperCase()}`}</strong> •{' '}
                {savedSale.items?.length || 1}{' '}
                {(savedSale.items?.length || 1) === 1 ? 'product' : 'products'} ({savedSale.quantity}{' '}
                {savedSale.quantity === 1 ? 'unit' : 'units'}) paid via{' '}
                <strong>{savedSale.paymentMethod}</strong>
              </p>
            </div>

            {/* Itemized Breakdown of Saved Sale */}
            <div className="max-w-lg mx-auto rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50/60 dark:bg-slate-900/50">
              <div className="px-4 py-2.5 bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <span>Items Sold</span>
                <span>Line Total</span>
              </div>
              <div className="divide-y divide-slate-200/70 dark:divide-slate-800">
                {(savedSale.items || []).map((item, idx) => (
                  <div
                    key={`${item.productName}_${idx}`}
                    className="px-4 py-2.5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {item.productName}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {item.quantity} × {formatCurrency(item.unitPrice, currency)}
                      </p>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                      {formatCurrency(item.subtotal, currency)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 bg-white dark:bg-[#001A35] border-t border-slate-200 dark:border-slate-700 space-y-1.5">
                {(savedSale.discount || 0) > 0 && (
                  <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-400">
                    <span>Discount Applied</span>
                    <span className="font-semibold tabular-nums">
                      -{formatCurrency(savedSale.discount || 0, currency)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm font-bold text-slate-900 dark:text-white">
                  <span>Total Paid</span>
                  <span className="text-[#059669] dark:text-[#34D399] tabular-nums">
                    {formatCurrency(savedSale.revenue, currency)}
                  </span>
                </div>
                {canViewProfit && (
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span>Expected Profit</span>
                    <span className="font-bold text-[#059669] dark:text-[#34D399] tabular-nums">
                      +{formatCurrency(savedSale.profit, currency)}
                    </span>
                  </div>
                )}
              </div>
            </div>

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
                variant="secondary"
                onClick={() => setIsReceiptModalOpen(true)}
                leftIcon={<ReceiptIcon className="w-4 h-4" />}
                className="w-full sm:w-auto border border-slate-300 dark:border-slate-700 font-semibold cursor-pointer"
              >
                View / Share Receipt
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => (onSuccess ? onSuccess() : onBack())}
                className="w-full sm:w-auto border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-semibold cursor-pointer"
              >
                View Sales History
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

            {/* Section A. Add Product(s) to Sale */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                    A. Add Products to Sale
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tap a saved product below or type any item name. Click &ldquo;Add to Sale&rdquo; to include multiple products in one checkout.
                  </p>
                </div>
                {lineItems.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#ECFDF5] dark:bg-[#064E3B]/60 text-[#059669] dark:text-[#34D399] text-xs font-bold shrink-0">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    {lineItems.length} {lineItems.length === 1 ? 'Product' : 'Products'} in Sale
                  </span>
                )}
              </div>

              {/* Quick-Select Saved Inventory Products */}
              {products.length > 0 && (
                <div className="space-y-2 bg-slate-50/80 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-[#059669]" />
                      Quick Pick from Inventory ({products.length})
                    </span>
                    {products.length > 4 && (
                      <div className="relative w-full sm:w-56">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={productSearchFilter}
                          onChange={(e) => setProductSearchFilter(e.target.value)}
                          placeholder="Filter inventory..."
                          className="w-full pl-8 pr-2.5 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#059669]"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
                    {quickPickProducts.map((p) => {
                      const isSelected = selectedProductId === p.id;
                      const isOut = p.stockQuantity !== undefined && p.stockQuantity <= 0;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handlePickSavedProduct(p)}
                          className={`px-3 py-2 rounded-xl border text-left transition-all shrink-0 cursor-pointer ${
                            isSelected
                              ? 'bg-[#ECFDF5] dark:bg-[#064E3B] border-[#059669] ring-1 ring-[#059669]'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-[#059669]/50'
                          }`}
                        >
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[150px]">
                            {p.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] font-semibold text-[#059669] dark:text-[#34D399] tabular-nums">
                              {formatCurrency(p.defaultSellingPrice, currency)}
                            </span>
                            {p.stockQuantity !== undefined && (
                              <span
                                className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${
                                  isOut
                                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {p.stockQuantity} left
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Product Entry Row */}
              <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="productNameInput"
                    className="text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Product or Service Name {lineItems.length === 0 && <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    id="productNameInput"
                    type="text"
                    placeholder="e.g. Bag of Rice, Hair Braiding, Phone Charger"
                    value={productName}
                    onChange={(e) => handleProductNameChange(e.target.value)}
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

                <div
                  className={`grid grid-cols-1 ${
                    canViewCost ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
                  } gap-4`}
                >
                  <Input
                    label="Quantity"
                    type="number"
                    inputMode="numeric"
                    min="1"
                    step="1"
                    placeholder="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />

                  <Input
                    label={`Unit Selling Price (${currency})`}
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    placeholder="e.g. 15000"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    helperText="Price per unit"
                    leftAddon={
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {currency}
                      </span>
                    }
                  />

                  {canViewCost && (
                    <Input
                      label={`Unit Cost Price (${currency})`}
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="any"
                      placeholder="e.g. 10000"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      helperText="Cost per unit (for profit math)"
                      leftAddon={
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {currency}
                        </span>
                      }
                    />
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {pendingDraftItem ? (
                      <span>
                        Line preview:{' '}
                        <strong className="text-slate-900 dark:text-white">
                          {pendingDraftItem.quantity} × {pendingDraftItem.productName}
                        </strong>{' '}
                        ={' '}
                        <strong className="text-[#059669] dark:text-[#34D399] tabular-nums">
                          {formatCurrency(
                            roundMoney(pendingDraftItem.quantity * pendingDraftItem.unitPrice),
                            currency
                          )}
                        </strong>
                      </span>
                    ) : (
                      <span>Fill out product name, quantity, and price to add to this sale.</span>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAddItemToSale}
                    leftIcon={<Plus className="w-4 h-4 text-[#059669]" />}
                    className="w-full sm:w-auto border border-[#059669]/40 bg-[#ECFDF5]/70 dark:bg-[#064E3B]/40 text-[#047857] dark:text-[#34D399] hover:bg-[#D1FAE5] font-semibold cursor-pointer"
                  >
                    Add Product to Sale List
                  </Button>
                </div>
              </div>

              {/* Current Sale Items List (Multi-Product Cart Table) */}
              {lineItems.length > 0 && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900">
                  <div className="px-4 py-2.5 bg-slate-100/90 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-[#059669]" />
                      Current Sale Items ({lineItems.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setLineItems([])}
                      className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
                    {lineItems.map((item) => {
                      const lineSubtotal = roundMoney(item.quantity * item.unitPrice);
                      const exceedsStock =
                        item.availableStock !== undefined && item.quantity > item.availableStock;

                      return (
                        <div
                          key={item.id}
                          className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                {item.productName}
                              </p>
                              {item.availableStock !== undefined && (
                                <span
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                                    exceedsStock
                                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                  }`}
                                >
                                  Stock: {item.availableStock}
                                </span>
                              )}
                            </div>
                            {exceedsStock && (
                              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                                Note: Quantity ({item.quantity}) exceeds recorded stock ({item.availableStock}). Stock will be set to 0.
                              </p>
                            )}
                          </div>

                          {/* Quantity Stepper + Editable Unit Price + Line Total + Remove */}
                          <div className="flex items-center justify-between sm:justify-end gap-3 flex-wrap">
                            {/* Quantity Controls */}
                            <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateLineQuantity(item.id, Math.max(1, item.quantity - 1))
                                }
                                className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                                title="Decrease quantity"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleUpdateLineQuantity(item.id, parseInt(e.target.value, 10) || 1)
                                }
                                className="w-12 text-center text-xs font-bold text-slate-900 dark:text-white bg-transparent focus:outline-none tabular-nums"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateLineQuantity(item.id, item.quantity + 1)}
                                className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                                title="Increase quantity"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Editable Unit Price */}
                            <div className="flex items-center gap-1">
                              <span className="text-[11px] text-slate-400">×</span>
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={item.unitPrice}
                                onChange={(e) =>
                                  handleUpdateLinePrice(item.id, parseFloat(e.target.value) || 0)
                                }
                                className="w-24 px-2 py-1 text-xs font-semibold text-right bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white tabular-nums focus:outline-none focus:ring-1 focus:ring-[#059669]"
                                title="Unit selling price"
                              />
                            </div>

                            {/* Line Subtotal */}
                            <div className="min-w-[90px] text-right">
                              <p className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                                {formatCurrency(lineSubtotal, currency)}
                              </p>
                            </div>

                            {/* Remove Line Button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveLineItem(item.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                              title="Remove product from sale"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Section B. Payment & Customer Details */}
            <div className="space-y-4 pt-2">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  B. Customer & Payment Details
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  How the customer paid, who bought the items, and any optional discount or note.
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

                <div className="space-y-1.5">
                  <label
                    htmlFor="customerNameInput"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Customer Name (Optional)
                  </label>
                  <input
                    id="customerNameInput"
                    type="text"
                    placeholder="Walk-in or select saved customer"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    list="customer-suggestions"
                    className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-[#059669] focus:outline-none"
                  />
                  {customers.length > 0 && (
                    <datalist id="customer-suggestions">
                      {customers.map((c) => (
                        <option key={c.id} value={c.name} />
                      ))}
                    </datalist>
                  )}
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Leave blank for walk-in customer
                  </p>
                </div>

                <Input
                  label="Sale Date *"
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Discount Field with Staff Permission Guard */}
                <div>
                  {canGiveDiscount || isDiscountAuthorized ? (
                    <Input
                      label={`Total Discount (${currency}) (Optional)`}
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="any"
                      placeholder="0"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      leftAddon={
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {currency}
                        </span>
                      }
                    />
                  ) : (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Discount
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsManagerOverrideOpen(true)}
                        className="w-full px-3.5 py-2 text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-center gap-1.5 hover:bg-amber-100 transition-colors cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Unlock Discount (Manager PIN)</span>
                      </button>
                    </div>
                  )}
                </div>

                <Input
                  label="Sale Note (Optional)"
                  type="text"
                  placeholder="e.g. Paid via OPay, delivered by rider"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Section C. Live Multi-Product Sale Summary */}
            <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white">
                  <Calculator className="w-4 h-4 text-[#059669] dark:text-[#34D399]" />
                  <span>C. Checkout Summary</span>
                </span>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {liveMetrics.items.length}{' '}
                  {liveMetrics.items.length === 1 ? 'product line' : 'product lines'} •{' '}
                  {liveMetrics.totalQuantity}{' '}
                  {liveMetrics.totalQuantity === 1 ? 'total unit' : 'total units'}
                </span>
              </div>

              {liveMetrics.totalDiscount > 0 && (
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 px-1">
                  <span>
                    Gross Subtotal: {formatCurrency(liveMetrics.grossSubtotal, currency)}
                  </span>
                  <span className="text-amber-700 dark:text-amber-400 font-semibold">
                    Discount: -{formatCurrency(liveMetrics.totalDiscount, currency)}
                  </span>
                </div>
              )}

              <div
                className={`grid grid-cols-1 ${
                  canViewProfit ? 'sm:grid-cols-3' : 'sm:grid-cols-1'
                } gap-3`}
              >
                <div className="bg-white dark:bg-[#001A35] p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Final Total Payable
                  </p>
                  <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                    {formatCurrency(liveMetrics.revenue, currency)}
                  </p>
                </div>

                {canViewProfit && (
                  <>
                    <div className="bg-white dark:bg-[#001A35] p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Total Product Cost
                      </p>
                      <p className="text-base sm:text-lg font-bold text-slate-700 dark:text-slate-200 mt-0.5 tabular-nums">
                        {formatCurrency(liveMetrics.cost, currency)}
                      </p>
                    </div>

                    <div className="bg-[#ECFDF5] dark:bg-[#064E3B]/40 p-3 rounded-lg border border-[#059669]/30">
                      <p className="text-xs text-[#047857] dark:text-[#34D399]">
                        Expected Profit ({liveMetrics.profitMargin.toFixed(1)}%)
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
                disabled={isSubmitting || effectiveItemsForSummary.length === 0}
                size="md"
                className="w-full sm:w-auto bg-[#059669] hover:bg-[#047857] text-white font-semibold px-6 cursor-pointer"
              >
                Complete Sale ({formatCurrency(liveMetrics.revenue, currency)})
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
            appendOrMergeItem({
              productId: matched.id,
              productName: matched.name,
              barcode: matched.barcode,
              quantity: 1,
              unitPrice: matched.defaultSellingPrice,
              costPrice: matched.defaultCostPrice,
              availableStock: matched.stockQuantity,
            });
          } else {
            setProductName(code);
            setBarcode(code);
          }
        }}
        products={products}
      />

      {/* Manager Override Modal for Discount */}
      <ManagerOverrideModal
        isOpen={isManagerOverrideOpen}
        onClose={() => setIsManagerOverrideOpen(false)}
        onAuthorized={() => {
          setIsDiscountAuthorized(true);
          setIsManagerOverrideOpen(false);
        }}
        actionName="Authorize Sale Discount"
        reason="Staff accounts require Store Owner or Manager PIN approval to apply a discount on a sale."
      />

      {/* Receipt Modal for Immediate Printing/WhatsApp Sharing After Checkout */}
      {savedSale && (
        <ReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          sale={savedSale}
        />
      )}
    </div>
  );
};
