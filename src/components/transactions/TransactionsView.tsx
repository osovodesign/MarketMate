import React, { useState, useMemo } from 'react';
import {
  ArrowUpDown,
  TrendingUp,
  Receipt,
  Search,
  Filter,
  Download,
  Calendar,
} from 'lucide-react';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatCurrency, formatDateFriendly, getTodayDateString } from '../../lib/formatters';

export const TransactionsView: React.FC = () => {
  const { recentTransactions } = useBusinessData();
  const { business } = useAuth();
  const currency = business?.currency || 'NGN';

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'sale' | 'expense'>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  const filteredTransactions = useMemo(() => {
    return recentTransactions.filter((t) => {
      const matchType = typeFilter === 'all' || t.type === typeFilter;
      const matchPayment = paymentFilter === 'all' || t.paymentMethod === paymentFilter;
      const matchSearch =
        search === '' ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        (t.subtitle && t.subtitle.toLowerCase().includes(search.toLowerCase())) ||
        (t.category && t.category.toLowerCase().includes(search.toLowerCase()));

      return matchType && matchPayment && matchSearch;
    });
  }, [recentTransactions, typeFilter, paymentFilter, search]);

  const totalInflow = useMemo(
    () =>
      filteredTransactions
        .filter((t) => t.type === 'sale')
        .reduce((sum, t) => sum + t.amount, 0),
    [filteredTransactions]
  );

  const totalOutflow = useMemo(
    () =>
      filteredTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0),
    [filteredTransactions]
  );

  // CSV Export utility
  const exportToCSV = () => {
    if (filteredTransactions.length === 0) return;
    const headers = ['Date', 'Type', 'Description', 'Customer/Category', 'Payment Method', 'Amount', 'Gross Profit'];
    const rows = filteredTransactions.map((t) => [
      t.date,
      t.type.toUpperCase(),
      `"${t.title.replace(/"/g, '""')}"`,
      `"${(t.subtitle || t.category || '').replace(/"/g, '""')}"`,
      t.paymentMethod || '',
      t.amount,
      t.profit !== undefined ? t.profit : '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `marketmate_transactions_${getTodayDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Unified Transaction Ledger
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Chronological record of all revenue inflows and expense outflows.
          </p>
        </div>

        <Button
          onClick={exportToCSV}
          variant="secondary"
          size="md"
          leftIcon={<Download className="w-4 h-4 text-slate-600" />}
          className="shadow-xs bg-white hover:bg-slate-50 border border-slate-200"
        >
          Export CSV Ledger
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="md" className="bg-white">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Inflow (Sales)</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-1">
            +{formatCurrency(totalInflow, currency)}
          </p>
        </Card>

        <Card padding="md" className="bg-white">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Outflow (Expenses)</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            -{formatCurrency(totalOutflow, currency)}
          </p>
        </Card>

        <Card padding="md" className="bg-slate-900 text-white">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Cash Flow Balance</p>
          <p className="text-2xl sm:text-3xl font-extrabold mt-1">
            {formatCurrency(totalInflow - totalOutflow, currency)}
          </p>
        </Card>
      </div>

      {/* Filter Controls */}
      <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search all transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9.5 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {/* Type Filter Buttons */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                typeFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setTypeFilter('sale')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                typeFilter === 'sale' ? 'bg-emerald-700 text-white shadow-2xs' : 'text-slate-600'
              }`}
            >
              Sales Only
            </button>
            <button
              onClick={() => setTypeFilter('expense')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                typeFilter === 'expense' ? 'bg-amber-600 text-white shadow-2xs' : 'text-slate-600'
              }`}
            >
              Expenses
            </button>
          </div>
        </div>
      </div>

      {/* Unified Table */}
      <Card padding="none" className="overflow-hidden">
        {filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Party / Category</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Gross Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredTransactions.map((tx) => {
                  const isSale = tx.type === 'sale';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-700 whitespace-nowrap">
                        {formatDateFriendly(tx.date)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge variant={isSale ? 'emerald' : 'amber'} size="sm">
                          {isSale ? 'Sale Inflow' : 'Expense Outflow'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 max-w-xs truncate">
                        {tx.title}
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {tx.subtitle || tx.category || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {tx.paymentMethod}
                      </td>
                      <td className="py-3 px-4 text-right font-bold whitespace-nowrap">
                        <span className={isSale ? 'text-emerald-700' : 'text-slate-900'}>
                          {isSale ? '+' : '-'}
                          {formatCurrency(tx.amount, currency)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap font-medium text-slate-500">
                        {isSale && tx.profit !== undefined ? (
                          <span className="text-emerald-700 font-semibold">
                            +{formatCurrency(tx.profit, currency)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-400">
            No transactions found matching your criteria.
          </div>
        )}
      </Card>
    </div>
  );
};
