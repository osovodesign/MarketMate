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
  Coins,
  KeyRound,
} from 'lucide-react';
import { Product, CartItem, PaymentMethod, CurrencyCode } from '../../types';
import { useBusinessData } from '../../context/BusinessDataContext';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { POSReceiptModal } from './POSReceiptModal';
import { ManagerOverrideModal } from '../staff/ManagerOverrideModal';
import { ShiftClosingModal } from '../staff/ShiftClosingModal';
import { StaffSwitchModal } from '../staff/StaffSwitchModal';
import { ROLE_CONFIGS, hasPermission } from '../../lib/staffPermissions';
import { CURRENCIES, convertCurrency } from '../../lib/currencies';
import { formatMoney } from '../../lib/calculations';
import { formatCurrency } from '../../lib/formatters';

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
    activeShift,
    startStaffShift,
  } = useBusinessData();

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('NGN');

  // Staff & Security Modals
  const [isManagerOverrideOpen, setIsManagerOverrideOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [pendingOverrideAction, setPendingOverrideAction] = useState<(() => void) | null>(null);
  const [isShiftClosingOpen, setIsShiftClosingOpen] = useState(false);
  const [isStaffSwitchOpen, setIsStaffSwitchOpen] = useState(false);
  const [isStartShiftModalOpen, setIsStartShiftModalOpen] = useState(false);
  const [openingFloatInput, setOpeningFloatInput] = useState('10000');
  
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [customCustomerName, setCustomCustomerName] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [amountTendered, setAmountTendered] = useState<string>('');
  const [saleNotes, setSaleNotes] = useState<string>('');
  const [editingDiscountId, setEditingDiscountId] = useState<string | null>(null);
  const [discountInputVal, setDiscountInputVal] = useState<string>('');
  
  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [posNotice, setPosNotice] = useState<{
    type: 'error' | 'warning' | 'success';
    message: string;
  } | null>(null);
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

  // Add product to cart with stock rule check (Section 7.4)
  const addToCart = (product: Product) => {
    setPosNotice(null);
    if (product.stockQuantity !== undefined && product.stockQuantity <= 0) {
      setPosNotice({
        type: 'warning',
        message: `"${product.name}" is Out of Stock. Update its stock quantity in Products & Stock first.`,
      });
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (
          product.stockQuantity !== undefined &&
          existing.quantity + 1 > product.stockQuantity
        ) {
          setPosNotice({
            type: 'warning',
            message: `Only ${product.stockQuantity} in stock for "${product.name}".`,
          });
          return prev;
        }
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
      const found = products.find(
        (p) =>
          (p.barcode && p.barcode.toLowerCase() === code.toLowerCase()) ||
          (p.sku && p.sku.toLowerCase() === code.toLowerCase())
      );
      if (found) {
        addToCart(found);
      } else {
        setPosNotice({
          type: 'warning',
          message: `Product code "${code}" was not found. You can add this product in Products & Stock.`,
        });
      }
    }
  };

  // Cart quantity controls
  const updateQuantity = (productId: string, delta: number) => {
    setPosNotice(null);
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQ = item.quantity + delta;
            if (
              delta > 0 &&
              item.product.stockQuantity !== undefined &&
              newQ > item.product.stockQuantity
            ) {
              setPosNotice({
                type: 'warning',
                message: `Only ${item.product.stockQuantity} in stock for "${item.product.name}".`,
              });
              return item;
            }
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

  const requestItemDiscount = (productId: string, requestedDiscountNgn: number) => {
    const item = cart.find((i) => i.product.id === productId);
    if (!item) return;

    const perms = currentSession.permissions;
    const canDiscount = perms?.canGiveDiscount ?? true;
    const maxPercent = perms?.maxDiscountPercent ?? 100;
    const requestedPercent = Math.round((requestedDiscountNgn / item.unitPrice) * 100);

    if (!canDiscount && requestedDiscountNgn > 0) {
      setOverrideReason(
        'Staff role is restricted from giving custom discounts. Store Owner or Manager PIN is required to authorize this discount.'
      );
      setPendingOverrideAction(() => () => updateItemDiscount(productId, requestedDiscountNgn));
      setIsManagerOverrideOpen(true);
      return;
    }

    if (requestedPercent > maxPercent) {
      setOverrideReason(
        `Requested discount of ${requestedPercent}% exceeds your authorized limit of ${maxPercent}%. Store Owner or Manager PIN is required to authorize.`
      );
      setPendingOverrideAction(() => () => updateItemDiscount(productId, requestedDiscountNgn));
      setIsManagerOverrideOpen(true);
      return;
    }

    updateItemDiscount(productId, requestedDiscountNgn);
  };

  // Open Shift Form Handler
  const handleStartShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const floatAmount = parseFloat(openingFloatInput) || 0;
    try {
      await startStaffShift(currentSession.staffId, floatAmount);
      setIsStartShiftModalOpen(false);
      setPosNotice({
        type: 'success',
        message: 'Shift started. Your opening cash float has been recorded.',
      });
    } catch (err: any) {
      setPosNotice({
        type: 'error',
        message: "We couldn't start the shift. Check your connection and try again.",
      });
    }
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

  // Handle Checkout execution with double-tap protection
  const handleCheckout = async () => {
    if (cart.length === 0 || isCheckingOut) return;
    setPosNotice(null);

    const custName =
      selectedCustomer === '__custom'
        ? customCustomerName
        : selectedCustomer || 'Walk-in Customer';

    try {
      setIsCheckingOut(true);
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
      setCart([]);
      setAmountTendered('');
      setSaleNotes('');
      setCustomCustomerName('');
      setSelectedCustomer('');
      setIsCheckingOut(false);
    } catch (err: any) {
      setPosNotice({
        type: 'error',
        message: "We couldn't complete this sale. Check your connection and try again.",
      });
      setIsCheckingOut(false);
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
      {/* Top Checkout Header & Staff Status Bar */}
      <div className="bg-white dark:bg-[#001A35] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#059669] text-white flex items-center justify-center font-bold shrink-0">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Checkout
              </h2>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                  currentSession.currentRole === 'owner'
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                }`}
              >
                {currentSession.currentRole === 'owner' ? 'Owner' : 'Cashier'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap mt-0.5">
              <span>
                Staff: <strong className="text-slate-800 dark:text-slate-200">{currentSession.staffName}</strong>
              </span>
              {activeShift && (
                <span className="text-[11px] text-[#059669] dark:text-[#34D399] font-medium tabular-nums">
                  · Shift Active (Drawer Cash: {formatCurrency(activeShift.expectedCash, 'NGN')})
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Currency & Staff Security Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Currency Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-semibold text-slate-500 px-2 flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-[#059669]" />
              Currency:
            </span>
            {(['NGN', 'USD', 'GBP', 'EUR', 'CNY', 'GHS'] as CurrencyCode[]).map((cCode) => (
              <button
                key={cCode}
                type="button"
                onClick={() => setSelectedCurrency(cCode)}
                className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedCurrency === cCode
                    ? 'bg-[#059669] text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cCode}
              </button>
            ))}

            {selectedCurrency !== 'NGN' && (
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800 shrink-0 tabular-nums">
                1 {selectedCurrency} = ₦{ngnRate.toLocaleString()}
              </span>
            )}
          </div>

          {handleOpenFx && (
            <button
              type="button"
              onClick={handleOpenFx}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Import Cost Calculator & Exchange Rates"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
              <span className="hidden sm:inline">Rates</span>
            </button>
          )}

          {activeShift && (
            <button
              type="button"
              onClick={() => setIsShiftClosingOpen(true)}
              className="px-3 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Coins className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              <span>Close Shift</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsStaffSwitchOpen(true)}
            className="px-3 py-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-purple-700 dark:text-purple-400" />
            <span>Switch Staff</span>
          </button>

          {handleOpenStaff && (
            <button
              type="button"
              onClick={handleOpenStaff}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
              <span>Staff ({staffList.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Inline Feedback Banner */}
      {posNotice && (
        <div
          role="alert"
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-3 ${
            posNotice.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              : posNotice.type === 'warning'
              ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
              : 'bg-[#ECFDF5] dark:bg-[#064E3B]/50 border-[#059669]/30 text-[#047857] dark:text-[#34D399]'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{posNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setPosNotice(null)}
            className="text-xs font-semibold underline cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Cashier Shift Banner */}
      {activeShift ? (
        <div className="bg-white dark:bg-[#001A35] border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-3.5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#059669] text-white flex items-center justify-center font-bold shrink-0">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Active Shift: {activeShift.staffName}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Open
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                  Started {new Date(activeShift.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · Opening Float: {formatCurrency(activeShift.openingFloat, 'NGN')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 shrink-0">
              <div className="bg-slate-50 dark:bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">
                  Shift Sales
                </span>
                <span className="text-xs sm:text-sm font-bold text-[#059669] dark:text-[#34D399] tabular-nums">
                  {formatCurrency(
                    activeShift.totalSalesAmount ||
                      activeShift.totalCashCollected +
                        activeShift.totalTransferCollected +
                        activeShift.totalPosCollected,
                    'NGN'
                  )}
                </span>
                <span className="text-[10px] text-slate-400 block tabular-nums">
                  ({activeShift.totalSalesCount || 0} sales)
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">
                  Cash in Drawer
                </span>
                <span className="text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-400 tabular-nums">
                  {formatCurrency(activeShift.expectedCash, 'NGN')}
                </span>
                <span className="text-[10px] text-slate-400 block">Float + Cash</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">
                  Transfer & POS
                </span>
                <span className="text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-400 tabular-nums">
                  {formatCurrency(activeShift.totalTransferCollected + activeShift.totalPosCollected, 'NGN')}
                </span>
                <span className="text-[10px] text-slate-400 block">Non-Cash</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsShiftClosingOpen(true)}
                className="w-full md:w-auto px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Close Shift</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#001A35] border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold shrink-0">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                No active cash drawer shift for {currentSession.staffName}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Start a shift with your opening cash to track cash drawer totals during the day.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsStartShiftModalOpen(true)}
            className="px-3.5 py-2 bg-[#059669] hover:bg-[#047857] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0 cursor-pointer transition-colors"
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Start Shift</span>
          </button>
        </div>
      )}

      {/* Main Checkout 2-Column Split Layout */}
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
                placeholder="Search products by name or product code..."
                className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-[#001A35] border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-transparent"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="px-4 py-2.5 bg-[#059669] hover:bg-[#047857] text-white rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0 transition-colors cursor-pointer"
            >
              <Scan className="w-4 h-4" />
              <span>Scan Barcode</span>
            </button>
          </div>

          {/* Category Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-900 dark:bg-[#059669] text-white'
                    : 'bg-white dark:bg-[#001A35] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {cat === 'all' ? 'All Products' : cat}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[580px] overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-white dark:bg-[#001A35] rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  No matching products found
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Try another search term or add products in Products & Stock.
                </p>
              </div>
            ) : (
              filteredProducts.map((p) => {
                const inCart = cart.find((i) => i.product.id === p.id);
                const displayPrice =
                  selectedCurrency === 'NGN'
                    ? formatMoney(p.defaultSellingPrice)
                    : `${currMeta.symbol}${toSelectedCurr(p.defaultSellingPrice).toFixed(2)}`;
                const isOutOfStock = p.stockQuantity !== undefined && p.stockQuantity <= 0;
                const isLowStock =
                  p.stockQuantity !== undefined &&
                  p.stockQuantity > 0 &&
                  p.stockQuantity <= (p.lowStockThreshold ?? 5);

                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => addToCart(p)}
                    className={`p-3 bg-white dark:bg-[#001A35] rounded-xl border transition-all text-left flex flex-col justify-between group relative ${
                      isOutOfStock
                        ? 'opacity-60 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                        : 'border-slate-200 dark:border-slate-800 hover:border-[#059669] cursor-pointer'
                    }`}
                  >
                    {inCart && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#059669] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                        {inCart.quantity}
                      </div>
                    )}
                    <div>
                      {(p.sku || p.barcode) && (
                        <span className="text-[10px] text-slate-400 font-mono block uppercase">
                          {p.sku || p.barcode}
                        </span>
                      )}
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2 leading-snug mt-0.5">
                        {p.name}
                      </h4>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-[#059669] dark:text-[#34D399] tabular-nums">
                        {displayPrice}
                      </span>
                      {p.stockQuantity !== undefined && (
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded tabular-nums ${
                            isOutOfStock
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {isOutOfStock
                            ? 'Out of Stock'
                            : isLowStock
                            ? `Low Stock (${p.stockQuantity})`
                            : `In Stock (${p.stockQuantity})`}
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
        <div className="lg:col-span-5 bg-white dark:bg-[#001A35] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-[#059669] dark:text-[#34D399]" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Cart</h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold tabular-nums">
                ({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'})
              </span>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => setCart([])}
                className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear Cart</span>
              </button>
            )}
          </div>

          {/* Customer Selection (Optional — Walk-in allowed) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
              Customer (Optional)
            </label>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#059669]"
            >
              <option value="">Walk-in Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name} {c.phone ? `(${c.phone})` : ''}
                </option>
              ))}
              <option value="__custom">+ Enter Customer Name</option>
            </select>
            {selectedCustomer === '__custom' && (
              <input
                type="text"
                value={customCustomerName}
                onChange={(e) => setCustomCustomerName(e.target.value)}
                placeholder="Enter customer name..."
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#059669] mt-1.5"
              />
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 min-h-[180px] max-h-[260px] overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100 dark:divide-slate-800">
            {cart.length === 0 ? (
              <div className="py-10 text-center text-slate-400 space-y-1">
                <ShoppingCart className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Your cart is empty
                </p>
                <p className="text-[11px] text-slate-400">
                  Tap a product on the left or scan a barcode to add it
                </p>
              </div>
            ) : (
              cart.map((item) => {
                const itemTotal = (item.unitPrice - (item.discount || 0)) * item.quantity;
                const formattedItemTotal =
                  selectedCurrency === 'NGN'
                    ? formatMoney(itemTotal)
                    : `${currMeta.symbol}${toSelectedCurr(itemTotal).toFixed(2)}`;

                return (
                  <div key={item.product.id} className="pt-2.5 first:pt-0 flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate leading-tight">
                          {item.product.name}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                          <span>
                            {selectedCurrency === 'NGN'
                              ? formatMoney(item.unitPrice)
                              : `${currMeta.symbol}${toSelectedCurr(item.unitPrice).toFixed(2)}`}{' '}
                            each
                          </span>
                          {item.discount && item.discount > 0 ? (
                            <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/80 px-1.5 py-0.5 rounded">
                              Discount: -{formatMoney(item.discount)}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="w-6 h-6 rounded bg-white dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white flex items-center justify-center transition-colors text-xs font-bold cursor-pointer"
                          aria-label={`Decrease quantity of ${item.product.name}`}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center text-xs font-bold text-slate-800 dark:text-white tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="w-6 h-6 rounded bg-white dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white flex items-center justify-center transition-colors text-xs font-bold cursor-pointer"
                          aria-label={`Increase quantity of ${item.product.name}`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-slate-900 dark:text-white block tabular-nums">
                          {formattedItemTotal}
                        </span>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (editingDiscountId === item.product.id) {
                                setEditingDiscountId(null);
                              } else {
                                setEditingDiscountId(item.product.id);
                                setDiscountInputVal(item.discount ? String(item.discount) : '');
                              }
                            }}
                            className="text-[10px] text-[#059669] dark:text-[#34D399] hover:underline font-semibold cursor-pointer"
                          >
                            {item.discount ? 'Edit Discount' : 'Discount'}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-[10px] text-rose-600 dark:text-rose-400 hover:underline font-semibold cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Inline Discount Input Editor */}
                    {editingDiscountId === item.product.id && (
                      <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 mt-1">
                        <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                          Discount per item ({selectedCurrency}):
                        </span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            placeholder="0"
                            value={discountInputVal}
                            onChange={(e) => setDiscountInputVal(e.target.value)}
                            className="w-20 p-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-right font-bold text-slate-900 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const val = parseFloat(discountInputVal) || 0;
                              requestItemDiscount(item.product.id, val);
                              setEditingDiscountId(null);
                            }}
                            className="px-2 py-1 bg-[#059669] text-white text-[10px] font-semibold rounded cursor-pointer"
                          >
                            Apply
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingDiscountId(null)}
                            className="px-1.5 py-1 text-slate-500 text-[10px] cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
              Payment Method
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['Cash', 'Transfer', 'POS', 'Other'] as PaymentMethod[]).map((method) => {
                const label =
                  method === 'Other'
                    ? 'Customer Debt'
                    : method === 'POS'
                    ? 'POS Card'
                    : method;
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => {
                      if (
                        method === 'Other' &&
                        currentSession.permissions &&
                        !currentSession.permissions.canRecordDebt
                      ) {
                        setOverrideReason(
                          'Recording customer credit or unpaid debt is restricted for cashiers. Store Owner or Manager authorization required.'
                        );
                        setPendingOverrideAction(() => () => setPaymentMethod(method));
                        setIsManagerOverrideOpen(true);
                        return;
                      }
                      setPaymentMethod(method);
                    }}
                    className={`py-2 px-1 rounded-xl text-xs font-semibold text-center transition-colors cursor-pointer ${
                      paymentMethod === method
                        ? 'bg-[#059669] text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash Received & Change Calculator */}
          {paymentMethod === 'Cash' && (
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600 dark:text-slate-300">
                  Amount Received ({selectedCurrency}):
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={amountTendered}
                  onChange={(e) => setAmountTendered(e.target.value)}
                  placeholder={String(
                    Math.round(selectedCurrency === 'NGN' ? totalNgn : totalInSelectedCurrency)
                  )}
                  className="w-28 text-right p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#059669] focus:outline-none tabular-nums"
                />
              </div>
              {tenderedNumber > 0 && (
                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200 dark:border-slate-700">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    Change Due:
                  </span>
                  <span className="font-bold text-[#059669] dark:text-[#34D399] tabular-nums">
                    {currMeta.symbol}
                    {changeDue.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Amount Due & Complete Sale Button */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Amount Due
              </span>
              <div className="text-right">
                <span className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                  {selectedCurrency === 'NGN'
                    ? formatMoney(totalNgn)
                    : `${currMeta.symbol}${totalInSelectedCurrency.toFixed(2)}`}
                </span>
                {selectedCurrency !== 'NGN' && (
                  <span className="text-[11px] text-slate-500 block font-normal tabular-nums">
                    ≈ {formatMoney(totalNgn)} (Rate: ₦{ngnRate})
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              disabled={cart.length === 0 || isCheckingOut}
              onClick={handleCheckout}
              className="w-full py-3.5 bg-[#059669] hover:bg-[#047857] disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{isCheckingOut ? 'Saving Sale...' : 'Complete Sale & View Receipt'}</span>
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
      {/* Manager Security Override Modal */}
      <ManagerOverrideModal
        isOpen={isManagerOverrideOpen}
        onClose={() => {
          setIsManagerOverrideOpen(false);
          setPendingOverrideAction(null);
        }}
        reason={overrideReason}
        onSuccess={() => {
          if (pendingOverrideAction) {
            pendingOverrideAction();
            setPendingOverrideAction(null);
          }
        }}
      />

      {/* Staff Shift Closing & Reconciliation Modal */}
      <ShiftClosingModal
        isOpen={isShiftClosingOpen}
        onClose={() => setIsShiftClosingOpen(false)}
      />

      {/* Staff Switch Keypad Modal */}
      <StaffSwitchModal
        isOpen={isStaffSwitchOpen}
        onClose={() => setIsStaffSwitchOpen(false)}
        onOpenManageStaff={handleOpenStaff}
      />

      {/* Start Shift / Opening Cash Float Modal */}
      {isStartShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm shadow-xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Open Register Till
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Starting shift for {currentSession.staffName}
                </p>
              </div>
            </div>

            <form onSubmit={handleStartShiftSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Opening Cash Float in Drawer (₦):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    ₦
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    autoFocus
                    value={openingFloatInput}
                    onChange={(e) => setOpeningFloatInput(e.target.value)}
                    placeholder="e.g. 10000"
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {['0', '5000', '10000', '20000'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setOpeningFloatInput(preset)}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                    >
                      ₦{Number(preset).toLocaleString()}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  This cash float is counted at the start of your shift and subtracted at end-of-shift reconciliation.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsStartShiftModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-2xs cursor-pointer"
                >
                  Start Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
