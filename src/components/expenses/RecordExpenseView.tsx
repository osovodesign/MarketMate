import React, { useState } from 'react';
import { ArrowLeft, Receipt, AlertCircle, CheckCircle2 } from 'lucide-react';
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

const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'Transport', label: 'Transport & Dispatch Delivery' },
  { value: 'Packaging', label: 'Packaging, Bags & Labels' },
  { value: 'Electricity', label: 'Generator Fuel, Electricity & Power' },
  { value: 'Internet', label: 'Internet Data & Phone Airtime' },
  { value: 'Supplies', label: 'Raw Materials & Store Supplies' },
  { value: 'Rent', label: 'Shop Rent, Stall & Storage Fees' },
  { value: 'Marketing', label: 'Social Media Ads & Promotion' },
  { value: 'Staff', label: 'Staff Salaries, Apprentices & Wages' },
  { value: 'Other', label: 'Other Operating Expense' },
];

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'Transfer', label: 'Bank Transfer' },
  { value: 'Cash', label: 'Cash Payment' },
  { value: 'POS', label: 'POS Terminal' },
  { value: 'Other', label: 'Other Method' },
];

const QUICK_SUGGESTIONS = [
  { label: 'Generator Fuel', category: 'Electricity' as ExpenseCategory },
  { label: 'Dispatch Rider / Delivery', category: 'Transport' as ExpenseCategory },
  { label: 'Shop Rent & Stall Levy', category: 'Rent' as ExpenseCategory },
  { label: 'Packaging Bags / Nylon', category: 'Packaging' as ExpenseCategory },
  { label: 'Internet Data & Airtime', category: 'Internet' as ExpenseCategory },
  { label: 'Restock Raw Supplies', category: 'Supplies' as ExpenseCategory },
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
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!description.trim()) {
      setError('Please enter a description for this expense.');
      return;
    }

    const amt = Number(amount);
    if (!amt || amt <= 0 || isNaN(amt)) {
      setError('Amount must be greater than zero.');
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

      setIsSuccess(true);

      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          onBack();
        }
      }, 700);
    } catch (err) {
      setError('Failed to record expense. Please try again.');
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
      {/* Top Navigation Bar with Back Button */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-slate-500"
            title="Go back"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              Record Expense
            </h1>
            <p className="text-xs text-slate-500">
              Track your operating costs to get an accurate view of take-home profit.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6">
        {isSuccess ? (
          <div className="p-8 bg-white border border-emerald-200 rounded-2xl shadow-sm text-center space-y-3 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Expense Recorded!</h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto font-mono tabular-nums">
              {formatCurrency(Number(amount) || 0, currency)} for {description} has been saved. Returning to your dashboard...
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-8 space-y-6"
          >
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Description & Quick Fill */}
            <div className="space-y-2">
              <Input
                label="Expense Description"
                type="text"
                placeholder="e.g. Generator petrol, Dispatch rider for Ikeja delivery"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setError(null);
                }}
                required
              />

              {/* Quick Suggestion Pills */}
              <div className="pt-1">
                <p className="text-[11px] text-slate-400 font-medium mb-1.5">
                  Frequent expense categories:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_SUGGESTIONS.map((sug) => (
                    <button
                      key={sug.label}
                      type="button"
                      onClick={() => applySuggestion(sug)}
                      className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors font-medium border border-slate-200/60"
                    >
                      {sug.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Amount & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={`Amount Spent (${currency})`}
                type="number"
                min="0"
                step="any"
                placeholder="e.g. 4500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                leftAddon={<span className="text-xs font-semibold text-slate-600">{currency}</span>}
              />

              <Select
                label="Expense Category"
                options={EXPENSE_CATEGORIES}
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                required
              />
            </div>

            {/* Payment Method & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Payment Method"
                options={PAYMENT_METHODS}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                required
              />

              <Input
                label="Date of Expense"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                required
              />
            </div>

            {/* Helpful Financial Advice Note */}
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/70 flex items-start gap-3 text-xs text-amber-900">
              <Receipt className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-950">Why logging every expense matters</p>
                <p className="text-amber-800/90 mt-0.5 leading-relaxed">
                  Recording every small expenditure (airtime, generator fuel, packing nylon) prevents unaccounted cash leakages and ensures your true net profit and tax deductions are 100% accurate.
                </p>
              </div>
            </div>

            {/* Bottom Actions: Explicit Cancel Button + Save Expense Button */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                onClick={onBack}
                disabled={isSubmitting}
                className="text-slate-600 hover:text-slate-900"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isSubmitting}
                size="md"
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6"
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
