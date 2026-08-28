import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  PlusCircle,
  Search,
  Filter,
  Trash2,
  Calendar,
  CreditCard,
  User,
  ArrowUpDown,
  Download,
  Share2,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { ReceiptModal } from './ReceiptModal';
import { formatCurrency, formatPercent, formatDateFriendly } from '../../lib/formatters';
import { PaymentMethod, Sale } from '../../types';

interface SalesViewProps {
  onOpenAddSale: () => void;
}

export const SalesView: React.FC<SalesViewProps> = ({ onOpenAddSale }) => {
  const { sales, deleteSale } = useBusinessData();
  const { business } = useAuth();
  const currency = business?.currency || 'NGN';

  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Filtered sales list
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const matchSearch =
        search === '' ||
        s.productName.toLowerCase().includes(search.toLowerCase()) ||
        (s.customerName && s.customerName.toLowerCase().includes(search.toLowerCase()));

      const matchPayment = paymentFilter === 'all' || s.paymentMethod === paymentFilter;

      return matchSearch && matchPayment;
    });
  }, [sales, search, paymentFilter]);

  // Aggregate totals
  const totalRevenue = useMemo(() => filteredSales.reduce((acc, s) => acc + s.revenue, 0), [filteredSales]);
  const totalCost = useMemo(() => filteredSales.reduce((acc, s) => acc + s.cost, 0), [filteredSales]);
  const totalProfit = useMemo(() => filteredSales.reduce((acc, s) => acc + s.profit, 0), [filteredSales]);
  const totalUnits = useMemo(() => filteredSales.reduce((acc, s) => acc + s.quantity, 0), [filteredSales]);

  const handleDelete = async (id: string) => {
    await deleteSale(id);
    setConfirmDeleteId(null);
    if (selectedSaleForReceipt?.id === id) {
      setSelectedSaleForReceipt(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Sales Records</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage your daily transactions, product margins, and customer sales.
          </p>
        </div>

        <Button
          onClick={onOpenAddSale}
          size="md"
          leftIcon={<PlusCircle className="w-4 h-4" />}
          className="shadow-xs"
        >
          + Record New Sale
        </Button>
      </div>

      {/* Metric Summary Cards for Filtered Results */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card padding="sm" className="bg-white">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Sales</p>
          <p className="text-lg sm:text-2xl font-extrabold text-slate-900 mt-1">
            {formatCurrency(totalRevenue, currency)}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">{filteredSales.length} records</p>
        </Card>

        <Card padding="sm" className="bg-white">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Product Costs</p>
          <p className="text-lg sm:text-2xl font-extrabold text-slate-600 mt-1">
            {formatCurrency(totalCost, currency)}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">{totalUnits} units sold</p>
        </Card>

        <Card padding="sm" className="bg-emerald-50/60 border-emerald-200">
          <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Total Gross Profit</p>
          <p className="text-lg sm:text-2xl font-extrabold text-emerald-800 mt-1">
            {formatCurrency(totalProfit, currency)}
          </p>
          <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
            Margin: {totalRevenue > 0 ? formatPercent((totalProfit / totalRevenue) * 100) : '0%'}
          </p>
        </Card>

        <Card padding="sm" className="bg-white">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Avg. Sale Value</p>
          <p className="text-lg sm:text-2xl font-extrabold text-slate-900 mt-1">
            {formatCurrency(filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0, currency)}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Per receipt</p>
        </Card>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9.5 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-slate-500 shrink-0">Payment:</span>
          {['all', 'Transfer', 'Cash', 'POS', 'Other'].map((method) => (
            <button
              key={method}
              onClick={() => setPaymentFilter(method)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                paymentFilter === method
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {method === 'all' ? 'All Channels' : method}
            </button>
          ))}
        </div>
      </div>

      {/* Sales Table Card */}
      <Card padding="none" className="overflow-hidden">
        {filteredSales.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Product / Item</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4 text-right">Selling Price</th>
                  <th className="py-3 px-4 text-right">Total Revenue</th>
                  <th className="py-3 px-4 text-right">Cost Price</th>
                  <th className="py-3 px-4 text-right">Profit</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-700 whitespace-nowrap">
                      {formatDateFriendly(sale.saleDate)}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{sale.productName}</p>
                      {sale.customerName && (
                        <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{sale.customerName}</span>
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800">
                      {sale.quantity}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">
                      {formatCurrency(sale.sellingPrice, currency)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                      {formatCurrency(sale.revenue, currency)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500 whitespace-nowrap">
                      {formatCurrency(sale.cost, currency)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        +{formatCurrency(sale.profit, currency)}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge
                        variant={
                          sale.paymentMethod === 'Transfer'
                            ? 'blue'
                            : sale.paymentMethod === 'Cash'
                            ? 'emerald'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {sale.paymentMethod}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => setSelectedSaleForReceipt(sale)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors"
                          title="View & Share Customer Receipt / Invoice"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        {confirmDeleteId === sale.id ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(sale.id)}
                              className="px-2 py-1 bg-rose-600 text-white rounded text-[10px] font-bold hover:bg-rose-700"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-[10px] hover:bg-slate-300"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(sale.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Delete record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-14 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">No sales records found</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {search || paymentFilter !== 'all'
                  ? 'Try changing your search query or payment filters.'
                  : 'Start recording your first customer sale to automatically track income and profits.'}
              </p>
            </div>
            <Button onClick={onOpenAddSale} size="sm" className="mt-2">
              + Record Sale
            </Button>
          </div>
        )}
      </Card>

      {/* Digital Receipt Modal */}
      <ReceiptModal
        isOpen={!!selectedSaleForReceipt}
        onClose={() => setSelectedSaleForReceipt(null)}
        sale={selectedSaleForReceipt}
      />
    </div>
  );
};
