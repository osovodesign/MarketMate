import React, { useState } from 'react';
import { ArrowLeft, Receipt, AlertCircle, CheckCircle2, PlusCircle } from 'lucide-react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { ExpenseCategory, PaymentMethod } from '../../types';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, getTodayDateString } from '../../lib/formatters';

interface RecordExpenseViewProps {
  onBack: () => void;
  onSuccess?: () => void;
}

const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; hint: string }[] = [
  { value: 'Supplies', label: 'Stock or Supplies', hint: 'Goods or materials bought' },
  { value: 'Transport', label: 'Transport or Delivery', hint: 'Dispatch rider, bus, fuel' },
  { value: 'Electricity', label: 'Electricity or Fuel', hint: 'Generator fuel, NEPA/PHCN' },
  { value: 'Rent', label: 'Rent', hint: 'Shop rent or stall fee' },
  { value: 'Internet', label: 'Internet or Airtime', hint: 'Data bundles and calls' },
  { value: 'Packaging', label: 'Packaging', hint: 'Nylon, bags, boxes, labels' },
  { value: 'Staff', label: 'Staff Payment', hint: 'Salaries and wages' },
  { value: 'Marketing', label: 'Marketing or Ads', hint: 'Flyers and social media ads' },
  { value: 'Other', label: 'Other', hint: 'Repairs, levies, or other costs' },
];

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'Transfer', label: 'Bank Transfer' },
  { value: 'Cash', label: 'Cash' },
  { value: 'POS', label: 'POS Card Terminal' },
  { value: 'Other', label: 'Other' },
];

const QUICK_SUGGESTIONS: { label: string; category: ExpenseCategory }[] = [
  { label: 'Generator Fuel', category: 'Electricity' },
  { label: 'Dispatch Delivery', category: 'Transport' },
  { label: 'Shop Rent', category: 'Rent' },
  { label: 'Packaging Bags', category: 'Packaging' },
  { label: 'Internet & Airtime', category: 'Internet' },
  { label: 'Store Supplies', category: 'Supplies' },
];

export const RecordExpenseView: React.FC<RecordExpenseViewProps> = ({
  onBack,
  onSuccess,
}) => {
  const { addExpense } = useBusinessData();
  const { business } = useAuth();
  const currency = business?.currency || 'NGN';

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | string>('');
  const [category, setCategory] = useState<ExpenseCategory>('Transport');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Transfer');
  const [expenseDate, setExpenseDate] = useState(getTodayDateString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedExpenseSummary, setSavedExpenseSummary] = useState<{
    description: string;
    amount: number;
    category: ExpenseCategory;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAddAnother = () => {
    setSavedExpenseSummary(null);
    setDescription('');
    setAmount('');
    setError(null);
    setIsSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);

    if (!description.trim()) {
      setError('Enter what the money was spent on.');
      return;
    }

    const amt = Number(amount);
    if (!amt || amt <= 0 || isNaN(amt)) {
      setError('Amount must be greater than zero.');
      return;
    }

    if (!expenseDate) {
      setError('Select a valid date.');
      return;
    }

    try {
      setIsSubmitting(true);
      await addExpense({
        description: description.trim(),
        amount: amt,
        category,
        paymentMethod,
        expenseDate,
      });

      setSavedExpenseSummary({
        description: description.trim(),
        amount: amt,
        category,
      });
      setIsSubmitting(false);
    } catch (err) {
      setError("We couldn't save this expense. Check your connection and try again.");
      setIsSubmitting(false);
    }
  };

  const applySuggestion = (sug: typeof QUICK_SUGGESTIONS[0]) => {
    setDescription(sug.label);
    setCategory(sug.category);
    setError(null);
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
              Add Expense
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              Record money spent to run your business
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-3xl mx-auto">
        {savedExpenseSummary ? (
          <div className="p-6 sm:p-8 bg-white dark:bg-[#001A35] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#ECFDF5] dark:bg-[#064E3B] text-[#059669] dark:text-[#34D399] mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Expense saved successfully.
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                <strong className="tabular-nums">
                  {formatCurrency(savedExpenseSummary.amount, currency)}
                </strong>{' '}
                for <strong>{savedExpenseSummary.description}</strong> ({savedExpenseSummary.category}) has been recorded.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                type="button"
                onClick={handleAddAnother}
                leftIcon={<PlusCircle className="w-4 h-4" />}
                className="w-full sm:w-auto bg-[#059669] hover:bg-[#047857] text-white font-semibold cursor-pointer"
              >
                Add Another Expense
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => (onSuccess ? onSuccess() : onBack())}
                className="w-full sm:w-auto border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-semibold cursor-pointer"
              >
                View Expenses
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

            {/* Section A. Expense details */}
            <div className="space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  A. Expense details
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enter how much was spent and what it was for.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={`Amount Spent (${currency}) *`}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  placeholder="e.g. 4500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  leftAddon={<span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{currency}</span>}
                />

                <Input
                  label="What was the money spent on? *"
                  type="text"
                  placeholder="e.g. Generator fuel, Dispatch delivery, Nylon bags"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setError(null);
                  }}
                  required
                />
              </div>

              {/* Quick Suggestions */}
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                  Common expenses (tap to fill):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_SUGGESTIONS.map((sug) => (
                    <button
                      key={sug.label}
                      type="button"
                      onClick={() => applySuggestion(sug)}
                      className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors font-medium border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      {sug.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tappable Category Selection */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
                  Category <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {EXPENSE_CATEGORIES.map((cat) => {
                    const isSelected = category === cat.value;
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setCategory(cat.value)}
                        className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#ECFDF5] dark:bg-[#064E3B]/50 border-[#059669] text-[#047857] dark:text-[#34D399]'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <p className="text-xs font-semibold leading-tight">{cat.label}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          {cat.hint}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Section B. Payment details */}
            <div className="space-y-4 pt-2">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  B. Payment details
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  How and when this expense was paid.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Payment Method *"
                  options={PAYMENT_METHODS}
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  required
                />

                <Input
                  label="Date *"
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  required
                />
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
                disabled={isSubmitting}
                size="md"
                leftIcon={<Receipt className="w-4 h-4" />}
                className="w-full sm:w-auto bg-[#059669] hover:bg-[#047857] text-white font-semibold px-6 cursor-pointer"
              >
                Save Expense
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
