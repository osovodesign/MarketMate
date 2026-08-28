import React, { useState, useMemo } from 'react';
import {
  Receipt,
  PlusCircle,
  Search,
  Trash2,
  Calendar,
  AlertCircle,
  PieChart as PieChartIcon,
  Tag,
} from 'lucide-react';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatCurrency, formatDateFriendly } from '../../lib/formatters';
import { ExpenseCategory, Expense } from '../../types';

interface ExpensesViewProps {
  onOpenAddExpense: () => void;
}

const ALL_CATEGORIES: ExpenseCategory[] = [
  'Transport',
  'Packaging',
  'Electricity',
  'Internet',
  'Supplies',
  'Rent',
  'Marketing',
  'Staff',
  'Other',
];

export const ExpensesView: React.FC<ExpensesViewProps> = ({ onOpenAddExpense }) => {
  const { expenses, deleteExpense } = useBusinessData();
  const { business } = useAuth();
  const currency = business?.currency || 'NGN';

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Filtered expenses list
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchSearch =
        search === '' ||
        e.description.toLowerCase().includes(search.toLowerCase()) ||
        e.category.toLowerCase().includes(search.toLowerCase());

      const matchCategory = categoryFilter === 'all' || e.category === categoryFilter;

      return matchSearch && matchCategory;
    });
  }, [expenses, search, categoryFilter]);

  // Aggregate totals
  const totalExpenseAmount = useMemo(
    () => filteredExpenses.reduce((acc, e) => acc + e.amount, 0),
    [filteredExpenses]
  );

  // Top spending category
  const topCategory = useMemo(() => {
    if (filteredExpenses.length === 0) return null;
    const catMap: Record<string, number> = {};
    filteredExpenses.forEach((e) => {
      catMap[e.category] = (catMap[e.category] || 0) + e.amount;
    });
    const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    return sorted[0] ? { name: sorted[0][0], amount: sorted[0][1] } : null;
  }, [filteredExpenses]);

  const handleDelete = async (id: string) => {
    await deleteExpense(id);
    setConfirmDeleteId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Operating Expenses
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Keep track of fuel, deliveries, packaging, rent, and overhead costs.
          </p>
        </div>

        <Button
          onClick={onOpenAddExpense}
          variant="outline"
          size="md"
          leftIcon={<PlusCircle className="w-4 h-4" />}
          className="shadow-xs"
        >
          + Record Expense
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="md" className="bg-white">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Expenses</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            {formatCurrency(totalExpenseAmount, currency)}
          </p>
          <p className="text-xs text-slate-500 mt-1">{filteredExpenses.length} transactions recorded</p>
        </Card>

        <Card padding="md" className="bg-white">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Highest Expense Area</p>
          <p className="text-xl sm:text-2xl font-extrabold text-amber-800 mt-1 truncate">
            {topCategory ? topCategory.name : 'None'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {topCategory ? formatCurrency(topCategory.amount, currency) : 'No expense recorded'}
          </p>
        </Card>

        <Card padding="md" className="bg-amber-50/50 border-amber-200/80">
          <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">Expense Average</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-900 mt-1">
            {formatCurrency(
              filteredExpenses.length > 0 ? totalExpenseAmount / filteredExpenses.length : 0,
              currency
            )}
          </p>
          <p className="text-xs text-amber-800 mt-1">Average cost per item</p>
        </Card>
      </div>

      {/* Search & Category Filter Pills */}
      <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search expenses by description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9.5 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
          />
        </div>

        {/* Scrollable Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              categoryFilter === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Categories
          </button>
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                categoryFilter === cat
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses Table */}
      <Card padding="none" className="overflow-hidden">
        {filteredExpenses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-700 whitespace-nowrap">
                      {formatDateFriendly(exp.expenseDate)}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 max-w-xs truncate">
                      {exp.description}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge variant="amber" size="sm">
                        {exp.category}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                      {exp.paymentMethod}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                      -{formatCurrency(exp.amount, currency)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {confirmDeleteId === exp.id ? (
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(exp.id)}
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
                          onClick={() => setConfirmDeleteId(exp.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Delete record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-14 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">No expense records found</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {search || categoryFilter !== 'all'
                  ? 'Try adjusting your search terms or category filter.'
                  : 'Start recording your business costs like generator fuel, delivery, packaging or data.'}
              </p>
            </div>
            <Button onClick={onOpenAddExpense} variant="outline" size="sm" className="mt-2">
              + Record Expense
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};
