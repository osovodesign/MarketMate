import React, { useState, useMemo } from 'react';
import {
  Scan,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Tag,
  CreditCard,
  Building2,
  DollarSign,
  UserCheck,
  Lock,
  Unlock,
  Users,
  Percent,
  RefreshCw,
  Receipt,
  Layers,
  ArrowRight,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Product, CartItem, PaymentMethod, CurrencyCode } from '../../types';
import { useBusinessData } from '../../context/BusinessDataContext';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { POSReceiptModal } from './POSReceiptModal';
import { CURRENCIES, convertCurrency } from '../../lib/currencies';
import { formatMoney } from '../../lib/calculations';

interface POSViewProps {
  onOpenStaffModal?: () => void;
  onOpenStaffManagement?: () => void;
  onOpenFxModal?: () => void;
  onOpenFxCalculator?: () => void;
}

export const POSView: React.FC<POSViewProps> = ({
  onOpenStaffModal,
  onOpenStaffManagement,
  onOpenFxModal,
  onOpenFxCalculator,
}) => {
  const handleOpenStaff = onOpenStaffManagement || onOpenStaffModal;
  const handleOpenFx = onOpenFxCalculator || onOpenFxModal;

  const {
    products,
    customers,
    currentSession,
    fxConfig,
    recordPosCheckout,
    lockCashierMode,
    unlockOwnerMode,
    switchStaffSession,
    staffList,
  } = useBusinessData();

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('NGN');
  
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [customCustomerName, setCustomCustomerName] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [amountTendered, setAmountTendered] = useState<string>('');
  const [saleNotes, setSaleNotes] = useState<string>('');
  
  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [lastReceiptData, setLastReceiptData] = useState<{
    sales: any[];
    receiptNumber: string;
    tendered: number;
    change: number;
    customer: string;
  } | null>(null);

  // Cashier PIN Lock modal
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [unlockPin, setUnlockPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Categories extraction
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['all', ...Array.from(set)];
  }, [products]);

  // Filtered product catalog
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !searchTerm.trim() ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.barcode && p.barcode.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCat =
        selectedCategory === 'all' || p.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [products, searchTerm, selectedCategory]);

  // Current currency metadata
  const currMeta = CURRENCIES[selectedCurrency] || CURRENCIES.NGN;
  const ngnRate = fxConfig.rates[selectedCurrency] || 1;

  // Convert an NGN amount to the selected currency
  const toSelectedCurr = (amountNgn: number): number => {
    if (selectedCurrency === 'NGN') return amountNgn;
    const res = convertCurrency(amountNgn, 'NGN', selectedCurrency, fxConfig.rates);
    return res.convertedAmount;
  };

  // Add product to cart
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          product,
          quantity: 1,
          unitPrice: product.defaultSellingPrice,
          discount: 0,
        },
      ];
    });
  };

  // Barcode scanned callback
  const handleBarcodeScanned = (code: string, matchedProduct?: Product) => {
    if (matchedProduct) {
      addToCart(matchedProduct);
    } else {
      // Try finding again in product catalog
      const found = products.find(
        (p) =>
          (p.barcode && p.barcode.toLowerCase() === code.toLowerCase()) ||
          (p.sku && p.sku.toLowerCase() === code.toLowerCase())
      );
      if (found) {
        addToCart(found);
      } else {
        alert(`Barcode "${code}" not found in catalog. You can create this product in the Catalog tab.`);
      }
    }
  };

  // Cart quantity controls
  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQ = item.quantity + delta;
            return newQ > 0 ? { ...item, quantity: newQ } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateItemDiscount = (productId: string, discountNgn: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, discount: Math.max(0, discountNgn) }
          : item
      )
    );
  };

  // Totals calculations
  const totalNgn = cart.reduce(
    (sum, item) => sum + (item.unitPrice - (item.discount || 0)) * item.quantity,
    0
  );
  const totalInSelectedCurrency = toSelectedCurr(totalNgn);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const tenderedNumber = Number(amountTendered) || 0;
  const changeDue = Math.max(0, tenderedNumber - (selectedCurrency === 'NGN' ? totalNgn : totalInSelectedCurrency));

  // Handle Checkout execution
  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const custName =
      selectedCustomer === '__custom'
        ? customCustomerName
        : selectedCustomer || 'Walk-in Customer';

    try {
      const res = await recordPosCheckout({
        items: cart,
        paymentMethod,
        amountTendered: tenderedNumber,
        change: changeDue,
        customerName: custName,
        notes: saleNotes,
        currency: selectedCurrency,
      });

      setLastReceiptData({
        sales: res.sales,
        receiptNumber: res.receiptNumber,
        tendered: tenderedNumber,
        change: changeDue,
        customer: custName,
      });

      setIsReceiptOpen(true);
      // Clear Cart
      setCart([]);
      setAmountTendered('');
      setSaleNotes('');
      setCustomCustomerName('');
      setSelectedCustomer('');
    } catch (err: any) {
      alert('Failed to complete sale: ' + (err.message || 'Unknown error'));
    }
  };

  // Owner unlock submission
  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = unlockOwnerMode(unlockPin);
    if (result.success) {
      setIsUnlockModalOpen(false);
      setUnlockPin('');
      setPinError('');
    } else {
      setPinError(result.message);
    }
  };

  return (
    <div className="space-y-4 pb-24 lg:pb-8">
      {/* Top POS Header & Staff Status Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold shadow-2xs">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 leading-tight">POS Register Terminal</h2>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  currentSession.currentRole === 'owner'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {currentSession.currentRole === 'owner' ? 'Owner Mode' : 'Cashier Mode'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Active Attendant: <strong className="text-slate-800">{currentSession.staffName}</strong>
            </p>
          </div>
        </div>

        {/* Currency & Staff Security Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Currency Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 px-2 flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-emerald-600" />
              FX:
            </span>
            {(['NGN', 'USD', 'GBP', 'EUR', 'CNY', 'GHS'] as CurrencyCode[]).map((cCode) => (
              <button
                key={cCode}
                type="button"
                onClick={() => setSelectedCurrency(cCode)}
                className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedCurrency === cCode
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {cCode}
              </button>
            ))}
          </div>

          {/* FX Rates config trigger */}
          {handleOpenFx && (
            <button
              type="button"
              onClick={handleOpenFx}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
              title="Exchange Rate Calculator & Customs"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Rates</span>
            </button>
          )}

          {/* Cashier Lock / Switch Staff Trigger */}
          {currentSession.currentRole === 'owner' ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={lockCashierMode}
                className="px-3 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Lock Terminal in Cashier Mode"
              >
                <Lock className="w-3.5 h-3.5 text-amber-700" />
                <span>Lock Register</span>
              </button>
              {handleOpenStaff && (
                <button
                  type="button"
                  onClick={handleOpenStaff}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Users className="w-3.5 h-3.5 text-slate-600" />
                  <span>Staff ({staffList.length})</span>
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsUnlockModalOpen(true)}
              className="px-3 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Unlock className="w-3.5 h-3.5 text-purple-700" />
              <span>Owner PIN</span>
            </button>
          )}
        </div>
      </div>

      {/* Main POS 2-Column Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Side: Product Search, Barcode Scanner & Product Grid (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Search bar & Scan Camera trigger */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products by name, SKU, or barcode..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent shadow-2xs"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs shrink-0 transition-colors"
            >
              <Scan className="w-4 h-4" />
              <span>Scan Barcode</span>
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat === 'all' ? 'All Items' : cat}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[580px] overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200 p-6">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">No matching products found</p>
                <p className="text-xs text-slate-500 mt-0.5">Try searching with a different keyword or barcode.</p>
              </div>
            ) : (
              filteredProducts.map((p) => {
                const inCart = cart.find((i) => i.product.id === p.id);
                const displayPrice =
                  selectedCurrency === 'NGN'
                    ? formatMoney(p.defaultSellingPrice)
                    : `${currMeta.symbol}${toSelectedCurr(p.defaultSellingPrice).toFixed(2)}`;

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addToCart(p)}
                    className="p-3 bg-white hover:bg-emerald-50/50 rounded-xl border border-slate-200/80 hover:border-emerald-300 shadow-2xs transition-all text-left flex flex-col justify-between group relative"
                  >
                    {inCart && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-700 text-white text-[10px] font-bold flex items-center justify-center shadow-2xs">
                        {inCart.quantity}
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono block uppercase">
                        {p.sku || p.barcode || 'ITEM'}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-900 line-clamp-2 leading-snug mt-0.5">
                        {p.name}
                      </h4>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-800">{displayPrice}</span>
                      {p.stockQuantity !== undefined && (
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            p.stockQuantity <= (p.lowStockThreshold || 3)
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          Qty: {p.stockQuantity}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Cart, Customer, Payment & Checkout (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 space-y-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-bold text-slate-900">Current Order</h3>
              <span className="text-xs text-slate-500 font-semibold">({totalItemsCount} items)</span>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => setCart([])}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Customer Selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
              Customer Profile:
            </label>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="">Walk-in Customer (General)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name} {c.phone ? `(${c.phone})` : ''}
                </option>
              ))}
              <option value="__custom">+ Custom Customer Name</option>
            </select>
            {selectedCustomer === '__custom' && (
              <input
                type="text"
                value={customCustomerName}
                onChange={(e) => setCustomCustomerName(e.target.value)}
                placeholder="Enter customer full name..."
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 mt-1.5"
              />
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 min-h-[180px] max-h-[260px] overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
            {cart.length === 0 ? (
              <div className="py-10 text-center text-slate-400 space-y-1">
                <ShoppingCart className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-semibold">Cart is empty</p>
                <p className="text-[11px] text-slate-400">Click products or scan barcode to add</p>
              </div>
            ) : (
              cart.map((item) => {
                const itemTotal = (item.unitPrice - (item.discount || 0)) * item.quantity;
                const formattedItemTotal =
                  selectedCurrency === 'NGN'
                    ? formatMoney(itemTotal)
                    : `${currMeta.symbol}${toSelectedCurr(itemTotal).toFixed(2)}`;

                return (
                  <div key={item.product.id} className="pt-2 first:pt-0 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                        {item.product.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {selectedCurrency === 'NGN'
                          ? formatMoney(item.unitPrice)
                          : `${currMeta.symbol}${toSelectedCurr(item.unitPrice).toFixed(2)}`}{' '}
                        each
                      </p>
                    </div>

                    {/* Quantity Modifiers */}
                    <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="w-6 h-6 rounded bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors text-xs font-bold shadow-2xs"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center text-xs font-bold text-slate-800">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="w-6 h-6 rounded bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors text-xs font-bold shadow-2xs"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-slate-900 block">{formattedItemTotal}</span>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-[10px] text-rose-500 hover:text-rose-700 font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
              Payment Method:
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['Cash', 'Transfer', 'POS Terminal', 'Credit'] as PaymentMethod[]).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2 px-1 rounded-xl text-[11px] font-bold text-center transition-colors ${
                    paymentMethod === method
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Cash Tendered & Change Calculator (Shown especially for Cash) */}
          {paymentMethod === 'Cash' && (
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600">Amount Tendered ({selectedCurrency}):</span>
                <input
                  type="number"
                  value={amountTendered}
                  onChange={(e) => setAmountTendered(e.target.value)}
                  placeholder={String(Math.round(selectedCurrency === 'NGN' ? totalNgn : totalInSelectedCurrency))}
                  className="w-28 text-right p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
              {tenderedNumber > 0 && (
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/80">
                  <span className="font-bold text-slate-700">Change Due:</span>
                  <span className="font-extrabold text-emerald-700">
                    {currMeta.symbol}
                    {changeDue.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Order Summary & Big Checkout Button */}
          <div className="pt-2 border-t border-slate-200 space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-bold text-slate-600 uppercase">Grand Total:</span>
              <div className="text-right">
                <span className="text-xl font-extrabold text-slate-900">
                  {selectedCurrency === 'NGN'
                    ? formatMoney(totalNgn)
                    : `${currMeta.symbol}${totalInSelectedCurrency.toFixed(2)}`}
                </span>
                {selectedCurrency !== 'NGN' && (
                  <span className="text-[11px] text-slate-500 block font-normal">
                    ≈ {formatMoney(totalNgn)} (Rate: ₦{ngnRate})
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              disabled={cart.length === 0}
              onClick={handleCheckout}
              className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md flex items-center justify-center gap-2 transition-all"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Complete Sale & Print Receipt</span>
            </button>
          </div>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleBarcodeScanned}
        products={products}
      />

      {/* Receipt Modal */}
      {lastReceiptData && (
        <POSReceiptModal
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          receiptNumber={lastReceiptData.receiptNumber}
          sales={lastReceiptData.sales}
          amountTendered={lastReceiptData.tendered}
          change={lastReceiptData.change}
          customerName={lastReceiptData.customer}
          paymentMethod={paymentMethod}
          currency={selectedCurrency}
        />
      )}

      {/* Cashier Unlock PIN Modal */}
      {isUnlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xs rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="text-center space-y-1">
              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center mx-auto">
                <Unlock className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Unlock Store Owner Privileges</h3>
              <p className="text-xs text-slate-500">Enter your 4-digit Owner PIN code</p>
            </div>

            <form onSubmit={handleUnlockSubmit} className="space-y-3">
              <input
                type="password"
                maxLength={4}
                autoFocus
                value={unlockPin}
                onChange={(e) => {
                  setUnlockPin(e.target.value);
                  setPinError('');
                }}
                placeholder="••••"
                className="w-full text-center tracking-widest text-2xl font-mono p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
              {pinError && <p className="text-xs text-rose-600 text-center font-semibold">{pinError}</p>}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsUnlockModalOpen(false);
                    setUnlockPin('');
                    setPinError('');
                  }}
                  className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-2xs"
                >
                  Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
