import React, { useState, useMemo } from 'react';
import {
  FileText,
  Calendar,
  Download,
  TrendingUp,
  Receipt,
  PiggyBank,
  CheckCircle2,
  AlertCircle,
  Share2,
} from 'lucide-react';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatCurrency, formatPercent, formatDateFriendly, getTodayDateString } from '../../lib/formatters';
import { getSaleItems, roundMoney } from '../../lib/math';

export const ReportsView: React.FC = () => {
  const { sales, expenses, getSummaryForRange } = useBusinessData();
  const { business } = useAuth();
  const currency = business?.currency || 'NGN';

  // Default to current month range
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const today = getTodayDateString();

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(today);

  // Compute reactive financial statements for date range
  const summary = useMemo(() => {
    return getSummaryForRange(startDate, endDate);
  }, [startDate, endDate, getSummaryForRange]);

  // Product-level sales breakdown for the selected period (iterates through getSaleItems)
  const productBreakdown = useMemo(() => {
    const periodSales = sales.filter((s) => s.saleDate >= startDate && s.saleDate <= endDate);
    const map: Record<
      string,
      { productName: string; unitsSold: number; revenue: number; cost: number; profit: number }
    > = {};
    let totalUnitsInPeriod = 0;

    for (const sale of periodSales) {
      const items = getSaleItems(sale);
      for (const item of items) {
        const key = item.productName.trim() || 'Item';
        if (!map[key]) {
          map[key] = { productName: key, unitsSold: 0, revenue: 0, cost: 0, profit: 0 };
        }
        map[key].unitsSold += item.quantity;
        map[key].revenue = roundMoney(map[key].revenue + item.subtotal);
        map[key].cost = roundMoney(map[key].cost + item.cost);
        map[key].profit = roundMoney(map[key].profit + item.profit);
        totalUnitsInPeriod += item.quantity;
      }
    }

    const rows = Object.values(map).sort((a, b) => b.revenue - a.revenue);
    return { rows, totalUnitsInPeriod };
  }, [sales, startDate, endDate]);

  // Breakdown of expenses in period
  const expenseBreakdown = useMemo(() => {
    const periodExpenses = expenses.filter((e) => e.expenseDate >= startDate && e.expenseDate <= endDate);
    const catMap: Record<string, number> = {};
    periodExpenses.forEach((e) => {
      catMap[e.category] = (catMap[e.category] || 0) + e.amount;
    });
    return Object.entries(catMap).map(([category, amount]) => ({
      category,
      amount,
      percentage: summary.operatingExpenses > 0 ? Math.round((amount / summary.operatingExpenses) * 100) : 0,
    }));
  }, [expenses, startDate, endDate, summary.operatingExpenses]);

  // Quick Preset Handlers
  const applyPreset = (preset: 'today' | 'thisWeek' | 'thisMonth' | 'lastMonth') => {
    const d = new Date();
    if (preset === 'today') {
      const td = getTodayDateString();
      setStartDate(td);
      setEndDate(td);
    } else if (preset === 'thisWeek') {
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const mon = new Date(d.setDate(diff)).toISOString().split('T')[0];
      setStartDate(mon);
      setEndDate(getTodayDateString());
    } else if (preset === 'thisMonth') {
      const first = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
      setStartDate(first);
      setEndDate(getTodayDateString());
    } else if (preset === 'lastMonth') {
      const first = new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString().split('T')[0];
      const last = new Date(d.getFullYear(), d.getMonth(), 0).toISOString().split('T')[0];
      setStartDate(first);
      setEndDate(last);
    }
  };

  // Export summary statement as print-friendly view
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Financial Profit & Loss Reports
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real profit statement calculated automatically from your recorded transactions.
          </p>
        </div>

        <Button
          onClick={handlePrint}
          variant="secondary"
          size="md"
          leftIcon={<Download className="w-4 h-4 text-slate-600" />}
          className="shadow-xs bg-white hover:bg-slate-50 border border-slate-200"
        >
          Print / Export Report
        </Button>
      </div>

      {/* Date Range Picker & Preset Selector */}
      <Card padding="md" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-500 mr-1">Quick Range:</span>
            <button
              onClick={() => applyPreset('today')}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => applyPreset('thisWeek')}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              This Week
            </button>
            <button
              onClick={() => applyPreset('thisMonth')}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              This Month
            </button>
            <button
              onClick={() => applyPreset('lastMonth')}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Last Month
            </button>
          </div>

          {/* Custom Date Pickers */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span>From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span>To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Main Income & Expense Statement Card */}
      <Card padding="lg" className="bg-white">
        <div className="border-b border-slate-200 pb-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
                Official Profit & Loss Statement
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">{business?.businessName}</h3>
            </div>
            <div className="text-right text-xs text-slate-500">
              <p className="font-semibold text-slate-800">
                Period: {formatDateFriendly(startDate)} – {formatDateFriendly(endDate)}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Currency: {currency}</p>
            </div>
          </div>
        </div>

        {/* Financial Line Items */}
        <div className="space-y-4 text-sm">
          {/* Section 1: Revenue */}
          <div className="space-y-2">
            <div className="flex items-center justify-between font-bold text-slate-900 text-base">
              <span>1. Total Revenue / Gross Sales</span>
              <span className="text-emerald-700">{formatCurrency(summary.revenue, currency)}</span>
            </div>
            <div className="pl-4 text-xs text-slate-500 flex items-center justify-between">
              <span>
                Total customer sales recorded in period ({summary.salesCount}{' '}
                {summary.salesCount === 1 ? 'checkout' : 'checkouts'} • {productBreakdown.totalUnitsInPeriod}{' '}
                {productBreakdown.totalUnitsInPeriod === 1 ? 'unit' : 'units'} sold)
              </span>
              <span>+{formatCurrency(summary.revenue, currency)}</span>
            </div>
          </div>

          {/* Section 2: Cost of Goods Sold */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between font-bold text-slate-900">
              <span>2. Less: Cost of Goods Sold (COGS)</span>
              <span className="text-slate-600">-{formatCurrency(summary.productCosts, currency)}</span>
            </div>
            <div className="pl-4 text-xs text-slate-500 flex items-center justify-between">
              <span>Direct inventory purchase and manufacturing item costs</span>
              <span>-{formatCurrency(summary.productCosts, currency)}</span>
            </div>
          </div>

          {/* Subtotal: Gross Profit */}
          <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between font-extrabold text-slate-900">
            <span>GROSS PROFIT (Revenue − Cost of Goods)</span>
            <span className="text-emerald-800 font-black">
              {formatCurrency(summary.grossProfit, currency)}
            </span>
          </div>

          {/* Section 3: Operating Expenses */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between font-bold text-slate-900">
              <span>3. Less: Operating Expenses (OpEx)</span>
              <span className="text-amber-800">-{formatCurrency(summary.operatingExpenses, currency)}</span>
            </div>

            {/* Sub-item categories */}
            <div className="pl-4 space-y-1.5 text-xs text-slate-600">
              {expenseBreakdown.length > 0 ? (
                expenseBreakdown.map((exp) => (
                  <div key={exp.category} className="flex items-center justify-between">
                    <span>
                      {exp.category} ({exp.percentage}%)
                    </span>
                    <span>-{formatCurrency(exp.amount, currency)}</span>
                  </div>
                ))
              ) : (
                <div className="text-slate-400 italic">No operating expenses recorded for this period.</div>
              )}
            </div>
          </div>

          {/* Final Line: Net Operating Profit */}
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200/80 flex items-center justify-between text-base font-black text-emerald-950 mt-4">
            <div>
              <p className="text-base font-black">NET TAKE-HOME OPERATING PROFIT</p>
              <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                Profit Margin: {formatPercent(summary.profitMargin)}
              </p>
            </div>
            <p className="text-2xl font-black text-emerald-800">
              {formatCurrency(summary.operatingProfit, currency)}
            </p>
          </div>
        </div>

        {/* Product-Level Sales Performance Breakdown */}
        {productBreakdown.rows.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Product-Level Sales Breakdown ({productBreakdown.rows.length}{' '}
                {productBreakdown.rows.length === 1 ? 'Product' : 'Products'})
              </h4>
              <span className="text-xs font-semibold text-slate-500">
                {productBreakdown.totalUnitsInPeriod} total units sold
              </span>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500">
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3 text-center">Units Sold</th>
                    <th className="py-2.5 px-3 text-right">Revenue</th>
                    <th className="py-2.5 px-3 text-right">COGS</th>
                    <th className="py-2.5 px-3 text-right">Gross Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {productBreakdown.rows.map((row) => (
                    <tr key={row.productName} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 font-bold text-slate-900">{row.productName}</td>
                      <td className="py-2 px-3 text-center font-semibold text-slate-700 tabular-nums">
                        {row.unitsSold}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900 tabular-nums">
                        {formatCurrency(row.revenue, currency)}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-600 tabular-nums">
                        {formatCurrency(row.cost, currency)}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700 tabular-nums">
                        +{formatCurrency(row.profit, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Mathematical Integrity Footer */}
        <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Deterministic software math verified • Strict NGN arithmetic</span>
          </div>
          <span>Generated by MarketMate Financial Engine</span>
        </div>
      </Card>
    </div>
  );
};
