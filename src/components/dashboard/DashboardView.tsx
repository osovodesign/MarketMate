import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Receipt,
  PiggyBank,
  PlusCircle,
  ArrowRight,
  Bot,
  Package,
  Calculator,
  Sliders,
  FileText,
  Users,
  Target,
  Lock,
  Shield,
  Coins,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { ReceiptModal } from '../sales/ReceiptModal';
import { formatCurrency, formatPercent, formatDateFriendly, getTodayDateString } from '../../lib/formatters';
import {
  calculatePeriodSummary,
  filterSalesByDateRange,
  filterExpensesByDateRange,
} from '../../lib/math';
import { AppView, Sale } from '../../types';
import { QuickStartGuide } from '../onboarding/QuickStartGuide';
import { hasPermission } from '../../lib/staffPermissions';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface DashboardViewProps {
  onNavigate: (view: AppView) => void;
  onOpenAddSale: () => void;
  onOpenAddExpense: () => void;
  onOpenPricingCalculator?: () => void;
  onOpenProfitSimulator?: () => void;
  onOpenGoalsModal?: () => void;
  onOpenTourModal?: () => void;
}

type PeriodTab = 'today' | 'thisWeek' | 'thisMonth' | 'custom';

const CATEGORY_COLORS = [
  '#059669', // Emerald
  '#D97706', // Amber
  '#2563EB', // Blue
  '#7C3AED', // Purple
  '#DC2626', // Rose
  '#0891B2', // Cyan
  '#4B5563', // Slate
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenAddSale,
  onOpenAddExpense,
  onOpenPricingCalculator,
  onOpenProfitSimulator,
  onOpenGoalsModal,
  onOpenTourModal,
}) => {
  const {
    metrics,
    sales,
    expenses,
    products,
    debts,
    totalOutstandingReceivables,
    totalUnpaidInvoices,
    invoices,
    currentSession,
    activeShift,
  } = useBusinessData();
  const { business, user, isSubscribed } = useAuth();
  const currency = business?.currency || 'NGN';

  const canViewExpenses = hasPermission(currentSession, 'canViewExpenses');
  const canRecordExpenses = canViewExpenses;
  const canViewProfit = hasPermission(currentSession, 'showProfitAndMargins');

  const todayStr = getTodayDateString();
  const [activePeriod, setActivePeriod] = useState<PeriodTab>('today');
  const [customStartDate, setCustomStartDate] = useState<string>(todayStr);
  const [customEndDate, setCustomEndDate] = useState<string>(todayStr);
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);

  const activeDebtorsCount = debts.filter((d) => d.status !== 'settled').length;
  const unpaidInvoices = invoices.filter((i) => i.type === 'invoice' && i.status !== 'paid');
  const lowStockProducts = useMemo(
    () =>
      products.filter(
        (p) =>
          p.stockQuantity !== undefined &&
          p.stockQuantity <= (p.lowStockThreshold ?? 5)
      ),
    [products]
  );

  // Select active period summary using exact existing calculation
  const currentSummary = useMemo(() => {
    if (activePeriod === 'today') return metrics.today;
    if (activePeriod === 'thisWeek') return metrics.thisWeek;
    if (activePeriod === 'thisMonth') return metrics.thisMonth;
    const start = customStartDate <= customEndDate ? customStartDate : customEndDate;
    const end = customEndDate >= customStartDate ? customEndDate : customStartDate;
    const filteredSales = filterSalesByDateRange(sales, start, end);
    const filteredExpenses = filterExpensesByDateRange(expenses, start, end);
    return calculatePeriodSummary(filteredSales, filteredExpenses);
  }, [activePeriod, metrics, sales, expenses, customStartDate, customEndDate]);

  // Day-over-day performance comparison deltas for Today
  const yesterdayTrend =
    metrics.salesTrend && metrics.salesTrend.length >= 2
      ? metrics.salesTrend[metrics.salesTrend.length - 2]
      : null;
  const yesterdayRevenue = yesterdayTrend?.revenue || 0;
  const salesDeltaPercent =
    yesterdayRevenue > 0 && activePeriod === 'today'
      ? Math.round(((currentSummary.revenue - yesterdayRevenue) / yesterdayRevenue) * 100)
      : null;

  const yesterdayProfit = yesterdayTrend?.profit || 0;
  const profitDeltaPercent =
    yesterdayProfit > 0 && activePeriod === 'today'
      ? Math.round(((currentSummary.operatingProfit - yesterdayProfit) / yesterdayProfit) * 100)
      : null;

  const periodDisplayLabel = useMemo(() => {
    if (activePeriod === 'today') return 'Today';
    if (activePeriod === 'thisWeek') return 'This Week';
    if (activePeriod === 'thisMonth') return 'This Month';
    return `${formatDateFriendly(customStartDate)} – ${formatDateFriendly(customEndDate)}`;
  }, [activePeriod, customStartDate, customEndDate]);

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 text-xs space-y-1">
          <p className="font-bold text-slate-800 dark:text-white">{label}</p>
          <p className="text-[#059669] dark:text-[#34D399] font-semibold tabular-nums">
            Sales: {formatCurrency(payload[0]?.value, currency)}
          </p>
          {canViewProfit && payload[1] && (
            <p className="text-amber-700 dark:text-amber-400 font-semibold tabular-nums">
              Profit: {formatCurrency(payload[1]?.value, currency)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* 1. Top Area: Greeting, Date Range, and Main Actions (Record Sale / Add Expense) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-[#001A35] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] dark:text-white tracking-tight">
            {business?.businessName || `Good day, ${user?.fullName?.split(' ')[0] || 'Merchant'}`}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
            Showing numbers for <span className="font-semibold text-slate-900 dark:text-white">{periodDisplayLabel}</span>
          </p>
        </div>

        {/* Primary & Secondary Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={onOpenAddSale}
            size="md"
            leftIcon={<PlusCircle className="w-4 h-4" />}
            className="flex-1 sm:flex-none bg-[#059669] hover:bg-[#047857] text-white font-semibold cursor-pointer whitespace-nowrap"
          >
            Record Sale
          </Button>
          {canRecordExpenses && (
            <Button
              onClick={onOpenAddExpense}
              variant="outline"
              size="md"
              leftIcon={<Receipt className="w-4 h-4" />}
              className="flex-1 sm:flex-none border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold cursor-pointer whitespace-nowrap"
            >
              Add Expense
            </Button>
          )}
        </div>
      </div>

      {/* Date Range Filter Controls: Today | This Week | This Month | Custom Date */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 self-start">
          {(
            [
              { id: 'today', label: 'Today' },
              { id: 'thisWeek', label: 'This Week' },
              { id: 'thisMonth', label: 'This Month' },
              { id: 'custom', label: 'Custom Date' },
            ] as { id: PeriodTab; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActivePeriod(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activePeriod === tab.id
                  ? 'bg-white dark:bg-[#001A35] text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activePeriod === 'custom' && (
          <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-[#001A35] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <label className="text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1.5">
              <span>From</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              />
            </label>
            <label className="text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1.5">
              <span>To</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              />
            </label>
          </div>
        )}
      </div>

      {/* 2. Business Summary Figures (Sales, Expenses, Profit, Customer Debts) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales Card */}
        <Card padding="md" className="flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Sales
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Money received from sales.
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#ECFDF5] text-[#059669] dark:bg-[#064E3B]/40 dark:text-[#34D399] flex items-center justify-center shrink-0">
                <TrendingUp className="w-4.5 h-4.5" />
              </div>
            </div>

            <p className="text-2xl sm:text-3xl font-bold text-[#0F172A] dark:text-white mt-3 tracking-tight tabular-nums">
              {formatCurrency(currentSummary.revenue, currency)}
            </p>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 tabular-nums">
              {currentSummary.salesCount} {currentSummary.salesCount === 1 ? 'sale' : 'sales'}
              {salesDeltaPercent !== null && (
                <span className="ml-1.5 text-slate-600 dark:text-slate-300 font-medium">
                  · {salesDeltaPercent >= 0 ? `+${salesDeltaPercent}%` : `${salesDeltaPercent}%`} vs yesterday
                </span>
              )}
            </span>
            <button
              onClick={() => onNavigate('sales')}
              className="text-[#059669] dark:text-[#34D399] font-semibold hover:underline flex items-center gap-0.5 cursor-pointer whitespace-nowrap"
            >
              <span>View Sales</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </Card>

        {/* Expenses Card */}
        <Card padding="md" className="flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {canViewExpenses ? 'Expenses' : 'Cash Drawer Float'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {canViewExpenses
                    ? 'Money spent by the business.'
                    : 'Expected cash in the active drawer.'}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                {canViewExpenses ? <Receipt className="w-4.5 h-4.5" /> : <Coins className="w-4.5 h-4.5" />}
              </div>
            </div>

            <div className="mt-3">
              {canViewExpenses ? (
                <p className="text-2xl sm:text-3xl font-bold text-[#0F172A] dark:text-white tracking-tight tabular-nums">
                  {formatCurrency(currentSummary.operatingExpenses, currency)}
                </p>
              ) : activeShift ? (
                <p className="text-2xl sm:text-3xl font-bold text-amber-700 dark:text-amber-400 tracking-tight tabular-nums">
                  {formatCurrency(activeShift.expectedCash, currency)}
                </p>
              ) : (
                <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-sm font-medium py-1.5">
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>Owner & Manager access only</span>
                </span>
              )}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            {canViewExpenses ? (
              <>
                <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                  {currentSummary.expensesCount}{' '}
                  {currentSummary.expensesCount === 1 ? 'expense' : 'expenses'}
                </span>
                <button
                  onClick={() => onNavigate('expenses')}
                  className="text-amber-800 dark:text-amber-400 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer whitespace-nowrap"
                >
                  <span>View Expenses</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </>
            ) : (
              <>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  {activeShift ? `Shift: ${activeShift.staffName}` : 'No active shift'}
                </span>
                <button
                  onClick={() => onNavigate('pos')}
                  className="text-[#059669] dark:text-[#34D399] font-semibold hover:underline flex items-center gap-0.5 cursor-pointer whitespace-nowrap"
                >
                  <span>Open Checkout</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        </Card>

        {/* Profit Card */}
        <Card
          padding="md"
          className="bg-[#ECFDF5] dark:bg-[#064E3B]/30 border-[#059669]/30 dark:border-[#059669]/40 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-[#065F46] dark:text-[#34D399]">
                  Profit
                </p>
                <p className="text-xs text-[#047857]/90 dark:text-[#A7F3D0]/80">
                  What remains after product costs and expenses.
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#059669] text-white flex items-center justify-center shrink-0">
                {canViewProfit ? <PiggyBank className="w-4.5 h-4.5" /> : <Shield className="w-4.5 h-4.5" />}
              </div>
            </div>

            <div className="mt-3">
              {canViewProfit ? (
                <p className="text-2xl sm:text-3xl font-bold text-[#047857] dark:text-[#34D399] tracking-tight tabular-nums">
                  {formatCurrency(currentSummary.operatingProfit, currency)}
                </p>
              ) : (
                <span className="flex items-center gap-1.5 text-sm font-semibold text-[#047857] dark:text-[#34D399] py-1.5">
                  <Shield className="w-4 h-4 shrink-0" />
                  <span>Owner & Manager access only</span>
                </span>
              )}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-[#059669]/20 flex items-center justify-between text-xs">
            {canViewProfit ? (
              <>
                <span className="text-[#065F46] dark:text-[#A7F3D0] font-medium tabular-nums">
                  Margin: {formatPercent(currentSummary.profitMargin)}
                  {profitDeltaPercent !== null && (
                    <span className="ml-1">
                      · {profitDeltaPercent >= 0 ? `+${profitDeltaPercent}%` : `${profitDeltaPercent}%`}
                    </span>
                  )}
                </span>
                <button
                  onClick={() => onNavigate('reports')}
                  className="text-[#047857] dark:text-[#34D399] font-semibold hover:underline flex items-center gap-0.5 cursor-pointer whitespace-nowrap"
                >
                  <span>Reports</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </>
            ) : (
              <>
                <span className="text-[#065F46] dark:text-[#A7F3D0] text-[11px]">
                  Hidden for cashier role
                </span>
                <button
                  onClick={() => onNavigate('pos')}
                  className="text-[#047857] dark:text-[#34D399] font-semibold hover:underline flex items-center gap-0.5 cursor-pointer whitespace-nowrap"
                >
                  <span>Checkout</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        </Card>

        {/* Customer Debts Card */}
        <Card padding="md" className="flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Customer Debts
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Money customers still owe your business.
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Users className="w-4.5 h-4.5" />
              </div>
            </div>

            <p className="text-2xl sm:text-3xl font-bold text-[#0F172A] dark:text-white mt-3 tracking-tight tabular-nums">
              {formatCurrency(totalOutstandingReceivables, currency)}
            </p>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 tabular-nums">
              {activeDebtorsCount === 0
                ? 'No unpaid customer debts'
                : `${activeDebtorsCount} ${activeDebtorsCount === 1 ? 'customer owes' : 'customers owe'}`}
            </span>
            <button
              onClick={() => onNavigate('debts')}
              className="text-rose-700 dark:text-rose-400 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer whitespace-nowrap"
            >
              <span>Customer Debts</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </Card>
      </div>

      {/* Empty State when Merchant has no sales recorded yet (Section 7.3) */}
      {sales.length === 0 && (
        <Card padding="md" className="border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B]/50 text-[#059669] dark:text-[#34D399] flex items-center justify-center shrink-0 mt-0.5">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  No sales have been recorded yet
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                  Record your first sale to see your daily sales, profit, and recent activity here. You can also add your products first so their prices fill in automatically.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Button
                onClick={onOpenAddSale}
                size="sm"
                leftIcon={<PlusCircle className="w-4 h-4" />}
                className="bg-[#059669] hover:bg-[#047857] text-white font-semibold cursor-pointer"
              >
                Record First Sale
              </Button>
              <Button
                onClick={() => onNavigate(isSubscribed ? 'create-product' : 'products')}
                variant="outline"
                size="sm"
                leftIcon={<Package className="w-4 h-4" />}
                className="border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-semibold cursor-pointer"
              >
                Add Product
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* 3. Attention Area: Low-stock products, unpaid customer debts, and unpaid invoices (Section 7.3) */}
      {(lowStockProducts.length > 0 || totalOutstandingReceivables > 0 || totalUnpaidInvoices > 0) && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Needs Your Attention
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Low-Stock Products Alert */}
            {lowStockProducts.length > 0 && (
              <div className="p-4 rounded-2xl bg-white dark:bg-[#001A35] border border-amber-300 dark:border-amber-800/70 flex flex-col justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                      Low Stock Alert
                    </p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                      {lowStockProducts.length}{' '}
                      {lowStockProducts.length === 1 ? 'product is' : 'products are'} low or out of stock
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {lowStockProducts
                        .slice(0, 2)
                        .map((p) => `${p.name} (${p.stockQuantity ?? 0} left)`)
                        .join(', ')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('products')}
                  className="text-xs font-semibold text-amber-800 dark:text-amber-300 hover:underline flex items-center gap-1 self-start cursor-pointer"
                >
                  <span>Update Stock in Products & Stock</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Unpaid Customer Debts Alert */}
            {totalOutstandingReceivables > 0 && (
              <div className="p-4 rounded-2xl bg-white dark:bg-[#001A35] border border-rose-200 dark:border-rose-800/70 flex flex-col justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <Users className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                      Unpaid Customer Debts
                    </p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                      {formatCurrency(totalOutstandingReceivables, currency)} owed by {activeDebtorsCount}{' '}
                      {activeDebtorsCount === 1 ? 'customer' : 'customers'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Send payment reminders or record repayments.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('debts')}
                  className="text-xs font-semibold text-rose-700 dark:text-rose-300 hover:underline flex items-center gap-1 self-start cursor-pointer"
                >
                  <span>Open Customer Debts</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Unpaid Invoices Alert */}
            {totalUnpaidInvoices > 0 && (
              <div className="p-4 rounded-2xl bg-white dark:bg-[#001A35] border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-[#059669] dark:text-[#34D399] flex items-center justify-center shrink-0">
                    <FileText className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#059669] dark:text-[#34D399]">
                      Invoices Needing Attention
                    </p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                      {formatCurrency(totalUnpaidInvoices, currency)} across {unpaidInvoices.length}{' '}
                      unpaid {unpaidInvoices.length === 1 ? 'invoice' : 'invoices'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Review unpaid invoices or record customer payments.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('invoices')}
                  className="text-xs font-semibold text-[#059669] dark:text-[#34D399] hover:underline flex items-center gap-1 self-start cursor-pointer"
                >
                  <span>Review Invoices & Quotes</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Getting Started Checklist Guide */}
      <QuickStartGuide
        onNavigate={onNavigate}
        onOpenAddSale={onOpenAddSale}
        onOpenAddExpense={onOpenAddExpense}
        onOpenTourModal={onOpenTourModal || (() => {})}
      />

      {/* 5. Performance Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Performance Trend Chart */}
        <Card padding="md" className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>
                {canViewProfit ? '7-Day Sales & Profit Trend' : '7-Day Sales Trend'}
              </CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Daily performance over the past 7 days
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
                <span className="text-slate-600 dark:text-slate-300">Sales</span>
              </div>
              {canViewProfit && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-slate-600 dark:text-slate-300">Profit</span>
                </div>
              )}
            </div>
          </CardHeader>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.salesTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D97706" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#D97706" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.25} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickFormatter={(val) => (val >= 1000 ? `₦${(val / 1000).toFixed(0)}k` : `₦${val}`)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#059669"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
                {canViewProfit && (
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke="#D97706"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorProfit)"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Expense Category Breakdown */}
        <Card padding="md">
          <CardHeader>
            <div>
              <CardTitle>Expenses This Month</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Where your business money was spent
              </p>
            </div>
          </CardHeader>

          {metrics.expenseCategoryBreakdown.length > 0 ? (
            <div className="space-y-3.5 pt-1">
              {metrics.expenseCategoryBreakdown.slice(0, 5).map((item, idx) => (
                <div key={item.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{item.category}</span>
                    <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                      {formatCurrency(item.amount, currency)} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.max(5, item.percentage))}%`,
                        backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
              <Receipt className="w-7 h-7 mx-auto text-slate-300 dark:text-slate-600" />
              <p>No expenses recorded this month.</p>
              {canRecordExpenses && (
                <button
                  onClick={onOpenAddExpense}
                  className="text-xs font-semibold text-[#059669] dark:text-[#34D399] hover:underline cursor-pointer"
                >
                  Add First Expense
                </button>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* 6. Recent Activity & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity List */}
        <Card padding="md" className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Latest recorded sales and expenses
              </p>
            </div>
            <button
              onClick={() => onNavigate('transactions')}
              className="text-xs font-semibold text-[#059669] dark:text-[#34D399] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All Transactions</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </CardHeader>

          {metrics.recentTransactions.filter((tx) => canViewExpenses || tx.type === 'sale').length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {metrics.recentTransactions
                .filter((tx) => canViewExpenses || tx.type === 'sale')
                .slice(0, 6)
                .map((tx) => {
                  const isSale = tx.type === 'sale';
                  return (
                    <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isSale
                              ? 'bg-emerald-50 dark:bg-emerald-950/80 text-[#059669] dark:text-[#34D399]'
                              : 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400'
                          }`}
                        >
                          {isSale ? <TrendingUp className="w-4 h-4" /> : <Receipt className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate leading-tight">
                              {tx.title}
                            </p>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
                              · {isSale ? 'Sale' : 'Expense'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {tx.subtitle || tx.category || tx.paymentMethod} · {formatDateFriendly(tx.date)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-2">
                        <div>
                          <p
                            className={`text-sm font-bold leading-tight tabular-nums ${
                              isSale
                                ? 'text-[#059669] dark:text-[#34D399]'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {isSale ? '+' : '-'}
                            {formatCurrency(tx.amount, currency)}
                          </p>
                          {isSale && tx.profit !== undefined && canViewProfit && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 tabular-nums">
                              Profit: {formatCurrency(tx.profit, currency)}
                            </p>
                          )}
                        </div>
                        {isSale && (
                          <button
                            onClick={() => {
                              const saleObj = sales.find((s) => s.id === tx.id);
                              if (saleObj) setSelectedSaleForReceipt(saleObj);
                            }}
                            className="p-1.5 text-slate-400 hover:text-[#059669] dark:hover:text-[#34D399] hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-lg transition-colors cursor-pointer"
                            title="View Receipt"
                            aria-label="View Receipt"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
              No transactions recorded yet. Select &ldquo;Record Sale&rdquo; to add your first record.
            </div>
          )}
        </Card>

        {/* Top Selling Products */}
        <Card padding="md">
          <CardHeader>
            <div>
              <CardTitle>Top Selling Products</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Products with the highest sales this month
              </p>
            </div>
          </CardHeader>

          {metrics.topSellingProducts.length > 0 ? (
            <div className="space-y-2.5 pt-1">
              {metrics.topSellingProducts.map((prod, idx) => (
                <div
                  key={prod.name}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center shrink-0 tabular-nums">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {prod.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                        {prod.quantity} {prod.quantity === 1 ? 'unit' : 'units'} sold
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-[#059669] dark:text-[#34D399] tabular-nums">
                      {formatCurrency(prod.revenue, currency)}
                    </p>
                    {canViewProfit && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">
                        Profit: {formatCurrency(prod.profit, currency)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
              <Package className="w-7 h-7 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p>No product sales recorded yet.</p>
            </div>
          )}
        </Card>
      </div>

      {/* 7. Business Assistant & Business Tools Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#001A35] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B]/50 text-[#059669] dark:text-[#34D399] flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  Business Assistant
                </span>
                {!isSubscribed && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                    Pro
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                {metrics.thisMonth.revenue > 0 ? (
                  <>
                    This month you have recorded{' '}
                    <strong className="text-slate-900 dark:text-white font-semibold tabular-nums">
                      {formatCurrency(metrics.thisMonth.revenue, currency)}
                    </strong>{' '}
                    in sales
                    {canViewProfit && (
                      <>
                        {' '}with{' '}
                        <strong className="text-[#059669] dark:text-[#34D399] font-semibold tabular-nums">
                          {formatCurrency(metrics.thisMonth.operatingProfit, currency)}
                        </strong>{' '}
                        in profit ({formatPercent(metrics.thisMonth.profitMargin)} margin)
                      </>
                    )}
                    . Ask a question about your sales, expenses, or product prices.
                  </>
                ) : (
                  'Ask questions about your sales, expenses, or product prices in plain language.'
                )}
              </p>
            </div>
          </div>

          <Button
            onClick={() => onNavigate('ai')}
            variant="outline"
            size="sm"
            className="border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-semibold shrink-0 w-full sm:w-auto cursor-pointer whitespace-nowrap"
          >
            Open Business Assistant
          </Button>
        </div>

        {/* Business Tools Quick Links */}
        <Card padding="md" className="flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Business Tools
            </p>
            {onOpenGoalsModal && (
              <button
                onClick={onOpenGoalsModal}
                className="text-xs font-semibold text-[#059669] dark:text-[#34D399] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Target className="w-3.5 h-3.5" />
                <span>Business Goals</span>
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {onOpenPricingCalculator && (
              <button
                onClick={onOpenPricingCalculator}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold text-left transition-colors flex items-center gap-2 border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                <Calculator className="w-4 h-4 text-[#059669] dark:text-[#34D399] shrink-0" />
                <span className="leading-tight truncate">Pricing Calculator</span>
              </button>
            )}
            {onOpenProfitSimulator && (
              <button
                onClick={onOpenProfitSimulator}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold text-left transition-colors flex items-center gap-2 border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                <Sliders className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="leading-tight truncate">Profit Planner</span>
              </button>
            )}
          </div>
        </Card>
      </div>

      {/* Digital Receipt Modal */}
      <ReceiptModal
        isOpen={!!selectedSaleForReceipt}
        onClose={() => setSelectedSaleForReceipt(null)}
        sale={selectedSaleForReceipt}
      />
    </div>
  );
};
