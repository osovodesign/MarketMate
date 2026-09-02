import React, { useState } from 'react';
import {
  TrendingUp,
  Receipt,
  PiggyBank,
  Percent,
  PlusCircle,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Bot,
  Package,
  Calendar,
  Calculator,
  Sliders,
  FileText,
  Users,
  Target,
  Clock,
} from 'lucide-react';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ReceiptModal } from '../sales/ReceiptModal';
import { formatCurrency, formatPercent, formatDateFriendly } from '../../lib/formatters';
import { AppView, Sale } from '../../types';
import { QuickStartGuide } from '../onboarding/QuickStartGuide';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
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

type PeriodTab = 'today' | 'thisWeek' | 'thisMonth';

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
  const { metrics, sales, expenses, debts, totalOutstandingReceivables, totalUnpaidInvoices, invoices } = useBusinessData();
  const { business, user } = useAuth();
  const currency = business?.currency || 'NGN';

  const [activePeriod, setActivePeriod] = useState<PeriodTab>('today');
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);
  const activeDebtorsCount = debts.filter((d) => d.status !== 'settled').length;
  const unpaidInvoices = invoices.filter((i) => i.type === 'invoice' && i.status !== 'paid');

  // Select active period summary
  const currentSummary =
    activePeriod === 'today'
      ? metrics.today
      : activePeriod === 'thisWeek'
      ? metrics.thisWeek
      : metrics.thisMonth;

  const periodLabels: Record<PeriodTab, string> = {
    today: "Today's Performance",
    thisWeek: 'This Week (Mon - Sun)',
    thisMonth: 'This Month Performance',
  };

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 text-xs space-y-1">
          <p className="font-bold text-slate-800 dark:text-white">{label}</p>
          <p className="text-emerald-700 dark:text-emerald-400 font-semibold">
            Sales: {formatCurrency(payload[0]?.value, currency)}
          </p>
          {payload[1] && (
            <p className="text-amber-700 dark:text-amber-400 font-semibold">
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
      {/* Interactive Getting Started / Quick-Start Checklist */}
      <QuickStartGuide
        onNavigate={onNavigate}
        onOpenAddSale={onOpenAddSale}
        onOpenAddExpense={onOpenAddExpense}
        onOpenTourModal={onOpenTourModal || (() => {})}
      />

      {/* Top Greeting & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Good day, {user?.fullName?.split(' ')[0] || 'Partner'} 👋
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Here is what happened in <span className="font-semibold text-slate-700 dark:text-slate-200">{business?.businessName}</span>
          </p>
        </div>

        {/* Quick Action Button Group */}
        <div className="flex items-center gap-2.5">
          <Button
            onClick={onOpenAddSale}
            size="md"
            leftIcon={<PlusCircle className="w-4 h-4" />}
            className="flex-1 sm:flex-none shadow-xs"
          >
            + Record Sale
          </Button>
          <Button
            onClick={onOpenAddExpense}
            variant="outline"
            size="md"
            leftIcon={<Receipt className="w-4 h-4" />}
            className="flex-1 sm:flex-none"
          >
            + Record Expense
          </Button>
        </div>
      </div>

      {/* Period Selection Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setActivePeriod('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activePeriod === 'today'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setActivePeriod('thisWeek')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activePeriod === 'thisWeek'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setActivePeriod('thisMonth')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activePeriod === 'thisMonth'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            This Month
          </button>
        </div>

        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 hidden sm:block">
          {periodLabels[activePeriod]}
        </span>
      </div>

      {/* 3 Core Metric Cards (Today / This Week / This Month based on Tab) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Sales / Revenue */}
        <Card padding="md" className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {activePeriod === 'today' ? "Today's Sales" : activePeriod === 'thisWeek' ? "This Week's Sales" : "This Month's Sales"}
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">
                {formatCurrency(currentSummary.revenue, currency)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              {currentSummary.salesCount} {currentSummary.salesCount === 1 ? 'sale' : 'sales'} recorded
            </span>
            <button
              onClick={() => onNavigate('sales')}
              className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-0.5"
            >
              <span>View sales</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </Card>

        {/* Operating Expenses */}
        <Card padding="md" className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {activePeriod === 'today' ? "Today's Expenses" : activePeriod === 'thisWeek' ? "This Week's Expenses" : "This Month's Expenses"}
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">
                {formatCurrency(currentSummary.operatingExpenses, currency)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              {currentSummary.expensesCount} {currentSummary.expensesCount === 1 ? 'expense' : 'expenses'} recorded
            </span>
            <button
              onClick={() => onNavigate('expenses')}
              className="text-amber-800 dark:text-amber-400 font-semibold hover:underline flex items-center gap-0.5"
            >
              <span>View expenses</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </Card>

        {/* Net Operating Profit */}
        <Card padding="md" className="bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-800/60 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                {activePeriod === 'today' ? "Today's Take-Home Profit" : activePeriod === 'thisWeek' ? "This Week's Profit" : "This Month's Profit"}
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-800 dark:text-emerald-300 mt-1 tracking-tight">
                {formatCurrency(currentSummary.operatingProfit, currency)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <PiggyBank className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between text-xs">
            <span className="text-emerald-800 dark:text-emerald-300 font-semibold">
              Profit Margin: {formatPercent(currentSummary.profitMargin)}
            </span>
            <button
              onClick={() => onNavigate('reports')}
              className="text-emerald-900 dark:text-emerald-200 font-bold hover:underline flex items-center gap-0.5"
            >
              <span>Full reports</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </Card>
      </div>

      {/* AI Business Insight Highlight Callout & Smart Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50/50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-200/80 dark:border-amber-800/60 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                  MarketMate AI Analysis
                </span>
                <Badge variant="amber" size="sm">
                  Live Data
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">
                {metrics.thisMonth.revenue > 0 ? (
                  <>
                    This month you have generated{' '}
                    <strong className="text-slate-900 dark:text-white font-bold">
                      {formatCurrency(metrics.thisMonth.revenue, currency)}
                    </strong>{' '}
                    in total sales with a net profit of{' '}
                    <strong className="text-emerald-700 dark:text-emerald-400 font-bold">
                      {formatCurrency(metrics.thisMonth.operatingProfit, currency)}
                    </strong>{' '}
                    ({formatPercent(metrics.thisMonth.profitMargin)} margin).{' '}
                    {metrics.topSellingProducts[0] && (
                      <span>
                        Top revenue driver is <em>{metrics.topSellingProducts[0].name}</em>.
                      </span>
                    )}
                  </>
                ) : (
                  'You have not recorded sales or expenses yet. Add your first transaction to unlock AI financial recommendations.'
                )}
              </p>
            </div>
          </div>

          <Button
            onClick={() => onNavigate('ai')}
            variant="secondary"
            size="sm"
            className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-amber-200/80 dark:border-amber-800 font-bold shrink-0 w-full sm:w-auto"
            rightIcon={<Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
          >
            Ask MarketMate AI
          </Button>
        </div>

        {/* Quick Tools Launch Card */}
        <Card padding="md" className="flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Smart Financial Tools
            </p>
            {onOpenGoalsModal && (
              <button
                onClick={onOpenGoalsModal}
                className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center gap-1"
              >
                <Target className="w-3.5 h-3.5" />
                Goals & Targets
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {onOpenPricingCalculator && (
              <button
                onClick={onOpenPricingCalculator}
                className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 text-xs font-bold text-left transition-colors flex items-center gap-2 border border-emerald-200/60 dark:border-emerald-800/60"
              >
                <Calculator className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <span className="leading-tight">Pricing Calculator</span>
              </button>
            )}
            {onOpenProfitSimulator && (
              <button
                onClick={onOpenProfitSimulator}
                className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100/80 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-xs font-bold text-left transition-colors flex items-center gap-2 border border-amber-200/60 dark:border-amber-800/60"
              >
                <Sliders className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                <span className="leading-tight">Profit Simulator</span>
              </button>
            )}
          </div>
        </Card>
      </div>

      {/* Outstanding Receivables / Debt Banner (If active debt exists) */}
      {totalOutstandingReceivables > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 via-amber-50/50 to-orange-50 dark:from-rose-950/40 dark:via-amber-950/30 dark:to-orange-950/30 border border-rose-200/90 dark:border-rose-800/60 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider">
                  Uncollected Customer Credit
                </p>
                <Badge variant="rose" size="sm">
                  {activeDebtorsCount} Active Debtor{activeDebtorsCount === 1 ? '' : 's'}
                </Badge>
              </div>
              <p className="text-sm text-slate-800 dark:text-slate-200 font-medium mt-0.5">
                Customers currently owe you{' '}
                <strong className="text-rose-700 dark:text-rose-400 font-extrabold">
                  {formatCurrency(totalOutstandingReceivables, currency)}
                </strong>
                . Send friendly WhatsApp reminders to speed up collection.
              </p>
            </div>
          </div>

          <Button
            onClick={() => onNavigate('debts')}
            variant="outline"
            size="sm"
            className="border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-300 hover:bg-rose-100/80 dark:hover:bg-rose-950/60 font-bold shrink-0 w-full sm:w-auto"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Open Debt Book
          </Button>
        </div>
      )}

      {/* Unpaid Invoices Banner */}
      {totalUnpaidInvoices > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/40 to-slate-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-slate-900 border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">
                  Pending Invoice Remittances
                </p>
                <Badge variant="emerald" size="sm">
                  {unpaidInvoices.length} Pending Invoice{unpaidInvoices.length === 1 ? '' : 's'}
                </Badge>
              </div>
              <p className="text-sm text-slate-800 dark:text-slate-200 font-medium mt-0.5">
                You have{' '}
                <strong className="text-emerald-800 dark:text-emerald-400 font-extrabold">
                  {formatCurrency(totalUnpaidInvoices, currency)}
                </strong>{' '}
                in issued invoices awaiting client payment.
              </p>
            </div>
          </div>

          <Button
            onClick={() => onNavigate('invoices')}
            variant="outline"
            size="sm"
            className="border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/80 dark:hover:bg-emerald-950/60 font-bold shrink-0 w-full sm:w-auto"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Manage Invoices
          </Button>
        </div>
      )}

      {/* Charts & Analytics Row (7-Day Sales Trend & Top Products / Expense Categories) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Performance Trend Chart */}
        <Card padding="md" className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>7-Day Sales & Profit Trend</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Daily comparison over the past week</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span className="text-slate-600 dark:text-slate-300">Sales</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-600 dark:text-slate-300">Profit</span>
              </div>
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#94A3B8' }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
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
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="#D97706"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorProfit)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Expense Category Breakdown */}
        <Card padding="md">
          <CardHeader>
            <div>
              <CardTitle>Operating Expenses</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Where your money went this month</p>
            </div>
          </CardHeader>

          {metrics.expenseCategoryBreakdown.length > 0 ? (
            <div className="space-y-3.5 pt-1">
              {metrics.expenseCategoryBreakdown.slice(0, 5).map((item, idx) => (
                <div key={item.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{item.category}</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatCurrency(item.amount, currency)} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
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
            <div className="py-12 text-center text-xs text-slate-400">
              <Receipt className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p>No expenses recorded this month.</p>
            </div>
          )}
        </Card>
      </div>

      {/* Bottom Row: Recent Transactions & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions List */}
        <Card padding="md" className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Latest sales and operating expenses</p>
            </div>
            <button
              onClick={() => onNavigate('transactions')}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:underline flex items-center gap-1"
            >
              <span>See all</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </CardHeader>

          {metrics.recentTransactions.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {metrics.recentTransactions.slice(0, 6).map((tx) => {
                const isSale = tx.type === 'sale';
                return (
                  <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isSale
                            ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400'
                            : 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {isSale ? <TrendingUp className="w-4 h-4" /> : <Receipt className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate leading-tight">{tx.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {tx.subtitle || tx.category || tx.paymentMethod} • {formatDateFriendly(tx.date)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-2">
                      <div>
                        <p
                          className={`text-sm font-bold leading-tight ${
                            isSale ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {isSale ? '+' : '-'}
                          {formatCurrency(tx.amount, currency)}
                        </p>
                        {isSale && tx.profit !== undefined && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
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
                          className="p-1.5 text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-lg transition-colors"
                          title="Generate WhatsApp / Print Receipt"
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
            <div className="py-8 text-center text-xs text-slate-400">
              No transactions recorded yet. Click "+ Record Sale" to start.
            </div>
          )}
        </Card>

        {/* Top Selling Products / Services */}
        <Card padding="md">
          <CardHeader>
            <div>
              <CardTitle>Top Selling Items</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Best revenue generators</p>
            </div>
          </CardHeader>

          {metrics.topSellingProducts.length > 0 ? (
            <div className="space-y-3 pt-1">
              {metrics.topSellingProducts.map((prod, idx) => (
                <div
                  key={prod.name}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{prod.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{prod.quantity} units sold</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(prod.revenue, currency)}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Profit: {formatCurrency(prod.profit, currency)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              <Package className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p>No sales recorded yet.</p>
            </div>
          )}
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
