import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Search,
  Download,
  Lock,
  Shield,
  Coins,
  CreditCard,
  Building2,
  Receipt,
  UserCheck,
  Calendar,
} from 'lucide-react';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatCurrency, formatDateFriendly, getTodayDateString } from '../../lib/formatters';
import { hasPermission } from '../../lib/staffPermissions';
import { ManagerOverrideModal } from '../staff/ManagerOverrideModal';

export const TransactionsView: React.FC = () => {
  const { recentTransactions, currentSession, activeShift, sales } = useBusinessData();
  const { business } = useAuth();
  const currency = business?.currency || 'NGN';
  const today = getTodayDateString();

  // Permission evaluation
  const canViewExpenses = hasPermission(currentSession, 'canViewExpenses');
  const showProfitAndMargins = hasPermission(currentSession, 'showProfitAndMargins');
  const canExportData = hasPermission(currentSession, 'canExportData');
  const isCashier = currentSession.currentRole === 'cashier';

  // State
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'sale' | 'expense'>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [isManagerOverrideOpen, setIsManagerOverrideOpen] = useState(false);
  const [cashierScope, setCashierScope] = useState<'my_shift' | 'today' | 'all'>('my_shift');

  // Base sanitized list: strictly exclude expenses if user lacks expense view permission
  const sanitizedList = useMemo(() => {
    return recentTransactions.filter((t) => {
      // 1. Enforce expense exclusion
      if (!canViewExpenses && t.type === 'expense') {
        return false;
      }

      // 2. Cashier scoping
      if (isCashier) {
        if (cashierScope === 'my_shift' && activeShift) {
          // If active shift exists, filter by sales made during or by this shift/staff
          const isCurrentStaff = t.rawSale?.staffId ? t.rawSale.staffId === currentSession.staffId : true;
          const isToday = t.date === today;
          return isToday && isCurrentStaff;
        } else if (cashierScope === 'today') {
          return t.date === today;
        }
      }

      return true;
    });
  }, [recentTransactions, canViewExpenses, isCashier, cashierScope, activeShift, currentSession.staffId, today]);

  const filteredTransactions = useMemo(() => {
    return sanitizedList.filter((t) => {
      const matchType = !canViewExpenses
        ? t.type === 'sale'
        : typeFilter === 'all' || t.type === typeFilter;
      const matchPayment = paymentFilter === 'all' || t.paymentMethod === paymentFilter;
      const matchSearch =
        search === '' ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        (t.subtitle && t.subtitle.toLowerCase().includes(search.toLowerCase())) ||
        (t.category && t.category.toLowerCase().includes(search.toLowerCase()));

      return matchType && matchPayment && matchSearch;
    });
  }, [sanitizedList, canViewExpenses, typeFilter, paymentFilter, search]);

  // Aggregate metrics
  const totalInflow = useMemo(
    () =>
      filteredTransactions
        .filter((t) => t.type === 'sale')
        .reduce((sum, t) => sum + t.amount, 0),
    [filteredTransactions]
  );

  const totalOutflow = useMemo(
    () =>
      canViewExpenses
        ? filteredTransactions
            .filter((t) => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0)
        : 0,
    [filteredTransactions, canViewExpenses]
  );

  // Cashier-specific metrics
  const cashSalesTotal = useMemo(
    () =>
      filteredTransactions
        .filter((t) => t.type === 'sale' && t.paymentMethod === 'Cash')
        .reduce((sum, t) => sum + t.amount, 0),
    [filteredTransactions]
  );

  const electronicSalesTotal = useMemo(
    () =>
      filteredTransactions
        .filter((t) => t.type === 'sale' && (t.paymentMethod === 'Transfer' || t.paymentMethod === 'POS'))
        .reduce((sum, t) => sum + t.amount, 0),
    [filteredTransactions]
  );

  const salesCount = useMemo(
    () => filteredTransactions.filter((t) => t.type === 'sale').length,
    [filteredTransactions]
  );

  // Perform actual CSV generation & download
  const executeCSVDownload = () => {
    if (filteredTransactions.length === 0) return;

    // Sanitize headers based on permissions
    const headers = ['Date', 'Type', 'Description', 'Customer/Category', 'Payment Method', 'Amount'];
    if (showProfitAndMargins) {
      headers.push('Gross Profit');
    }

    const rows = filteredTransactions.map((t) => {
      const row = [
        t.date,
        t.type === 'sale' ? 'SALE' : 'EXPENSE',
        `"${t.title.replace(/"/g, '""')}"`,
        `"${(t.subtitle || t.category || '').replace(/"/g, '""')}"`,
        t.paymentMethod || '',
        t.amount,
      ];
      if (showProfitAndMargins) {
        row.push(t.profit !== undefined ? String(t.profit) : '');
      }
      return row;
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const filePrefix = canViewExpenses ? 'marketmate_full_ledger' : 'marketmate_sales_journal';
    link.setAttribute('download', `${filePrefix}_${getTodayDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Export trigger with permission guard
  const handleExportClick = () => {
    if (filteredTransactions.length === 0) return;

    if (!canExportData) {
      // Prompt Manager Override PIN
      setIsManagerOverrideOpen(true);
      return;
    }

    executeCSVDownload();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {canViewExpenses ? 'Unified Transaction Ledger' : 'Register & Shift Sales Journal'}
            </h2>
            {!canViewExpenses && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Staff Scoped
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {canViewExpenses
              ? 'Chronological record of all store revenue inflows and expense outflows.'
              : `Customer sales receipts and payment collections logged for ${currentSession.staffName}.`}
          </p>
        </div>

        <Button
          onClick={handleExportClick}
          variant="secondary"
          size="md"
          leftIcon={
            canExportData ? (
              <Download className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            ) : (
              <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            )
          }
          className="shadow-2xs bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
        >
          {canExportData ? 'Export CSV Ledger' : 'Export CSV (Manager PIN)'}
        </Button>
      </div>

      {/* Summary Cards */}
      {canViewExpenses ? (
        /* Owner / Manager / Accountant Full Ledger Cards */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card padding="md" className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Inflow (Sales)
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">
              +{formatCurrency(totalInflow, currency)}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">{salesCount} sales receipts</p>
          </Card>

          <Card padding="md" className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Outflow (Expenses)
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
              -{formatCurrency(totalOutflow, currency)}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Operating overhead & costs</p>
          </Card>

          <Card padding="md" className="bg-slate-900 dark:bg-slate-950 text-white border border-slate-800">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Cash Flow Balance</p>
            <p className="text-2xl sm:text-3xl font-extrabold mt-1">
              {formatCurrency(totalInflow - totalOutflow, currency)}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Inflow minus operational expenses</p>
          </Card>
        </div>
      ) : (
        /* Cashier / Staff Scoped Shift & Register Cards (No sensitive store expenses or profits) */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card padding="md" className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Sales Rung Up
              </p>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">
              {formatCurrency(totalInflow, currency)}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {salesCount} total receipts processed
            </p>
          </Card>

          <Card padding="md" className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Cash in Register Till
              </p>
              <Coins className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-700 dark:text-amber-400 mt-1">
              {activeShift
                ? formatCurrency(activeShift.expectedCash, currency)
                : formatCurrency(cashSalesTotal, currency)}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {activeShift
                ? `Float (${formatCurrency(activeShift.openingFloat, currency)}) + Cash (${formatCurrency(cashSalesTotal, currency)})`
                : 'Cash payments collected today'}
            </p>
          </Card>

          <Card padding="md" className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Electronic Payments
              </p>
              <CreditCard className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-blue-700 dark:text-blue-400 mt-1">
              {formatCurrency(electronicSalesTotal, currency)}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Bank transfers & POS card payments
            </p>
          </Card>
        </div>
      )}

      {/* Filter Controls */}
      <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={canViewExpenses ? 'Search all transactions...' : 'Search sales receipts...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9.5 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {/* Scope Filter for Cashier */}
          {isCashier && (
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0">
              <button
                onClick={() => setCashierScope('my_shift')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  cashierScope === 'my_shift'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                My Shift
              </button>
              <button
                onClick={() => setCashierScope('today')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  cashierScope === 'today'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Today's Sales
              </button>
              <button
                onClick={() => setCashierScope('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  cashierScope === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                All Sales
              </button>
            </div>
          )}

          {/* Type Filter Buttons (Only shown if user can view expenses) */}
          {canViewExpenses && (
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  typeFilter === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                All Types
              </button>
              <button
                onClick={() => setTypeFilter('sale')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  typeFilter === 'sale'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Sales
              </button>
              <button
                onClick={() => setTypeFilter('expense')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  typeFilter === 'expense'
                    ? 'bg-rose-700 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Expenses
              </button>
            </div>
          )}

          {/* Payment Method Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shrink-0 cursor-pointer"
          >
            <option value="all">All Channels</option>
            <option value="Cash">Cash Only</option>
            <option value="Transfer">Bank Transfer</option>
            <option value="POS">POS Card</option>
          </select>
        </div>
      </div>

      {/* Unified Table */}
      <Card padding="none" className="overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
        {filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Party / Customer</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  {showProfitAndMargins && (
                    <th className="py-3 px-4 text-right">Gross Profit</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredTransactions.map((tx) => {
                  const isSale = tx.type === 'sale';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {formatDateFriendly(tx.date)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge variant={isSale ? 'emerald' : 'amber'} size="sm">
                          {isSale ? 'Sale Receipt' : 'Expense Outflow'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white max-w-xs truncate">
                        {tx.title}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {tx.subtitle || tx.category || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-medium">
                          {tx.paymentMethod === 'Cash' && <Coins className="w-3 h-3 text-amber-500" />}
                          {tx.paymentMethod === 'Transfer' && <Building2 className="w-3 h-3 text-blue-500" />}
                          {tx.paymentMethod === 'POS' && <CreditCard className="w-3 h-3 text-purple-500" />}
                          {tx.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold whitespace-nowrap">
                        <span className={isSale ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}>
                          {isSale ? '+' : '-'}
                          {formatCurrency(tx.amount, currency)}
                        </span>
                      </td>
                      {showProfitAndMargins && (
                        <td className="py-3 px-4 text-right whitespace-nowrap font-medium text-slate-500">
                          {isSale && tx.profit !== undefined ? (
                            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                              +{formatCurrency(tx.profit, currency)}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
            No transactions found matching your criteria.
          </div>
        )}
      </Card>

      {/* Manager Override Modal for CSV Export */}
      <ManagerOverrideModal
        isOpen={isManagerOverrideOpen}
        onClose={() => setIsManagerOverrideOpen(false)}
        onAuthorized={() => {
          setIsManagerOverrideOpen(false);
          executeCSVDownload();
        }}
        actionName="Export Store CSV Transaction Ledger"
        reason="Staff accounts are restricted from exporting financial records. Store Owner or Manager authorization PIN is required to generate this CSV download."
      />
    </div>
  );
};
