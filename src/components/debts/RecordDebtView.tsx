import React, { useState } from 'react';
import {
  ArrowLeft,
  Users,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, getTodayDateString } from '../../lib/formatters';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface RecordDebtViewProps {
  onBack: () => void;
  onSuccess?: () => void;
}

export const RecordDebtView: React.FC<RecordDebtViewProps> = ({ onBack, onSuccess }) => {
  const { addDebt, customers, products } = useBusinessData();
  const { business } = useAuth();
  const currency = business?.currency || 'NGN';

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick Customer Select
  const handleSelectCustomer = (customerId: string) => {
    if (!customerId) return;
    const found = customers.find((c) => c.id === customerId);
    if (found) {
      setCustomerName(found.name);
      setCustomerPhone(found.phone || '');
    }
  };

  const totalNum = parseFloat(totalAmount) || 0;
  const initialPaidNum = parseFloat(amountPaid) || 0;
  const balanceDueNum = Math.max(0, totalNum - initialPaidNum);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setError('Please enter the customer name');
      return;
    }
    if (totalNum <= 0) {
      setError('Please enter a valid credit/debt amount');
      return;
    }
    if (initialPaidNum > totalNum) {
      setError('Initial deposit cannot exceed total debt amount');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await addDebt({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        description: description.trim() || 'Credit purchase',
        totalAmount: totalNum,
        amountPaid: initialPaidNum,
        dueDate: dueDate || undefined,
        notes: notes.trim() || undefined,
      });

      setIsSuccess(true);
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          onBack();
        }
      }, 900);
    } catch (err: any) {
      setError(err.message || 'Failed to record credit');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Navigation Bar with Back button */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Return to previous screen"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Customer Debt Book
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500">Credit Ledger</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Record Customer Credit / Debt
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track receivables ("Book Me Down"), due dates, and automated WhatsApp payment reminders
          </p>
        </div>
      </div>

      {/* Main Centered Form Card */}
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 sm:p-7">
        {isSuccess ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Credit Successfully Recorded!</h2>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Debt for <strong className="text-slate-800">{customerName}</strong> of{' '}
              <strong className="text-slate-800 font-mono">
                {formatCurrency(balanceDueNum, currency)}
              </strong>{' '}
              has been saved to your customer debt ledger.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Customer Details Box */}
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <Users className="w-4 h-4 text-emerald-800" />
                  <span>Customer Contact</span>
                </div>
                {customers.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">Pick from Directory:</span>
                    <select
                      onChange={(e) => handleSelectCustomer(e.target.value)}
                      className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Choose saved customer...
                      </option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.phone ? `(${c.phone})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Customer Name *
                  </label>
                  <Input
                    placeholder="e.g. Mama Nkechi or Baba Tunde"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    WhatsApp / Phone Number
                  </label>
                  <Input
                    placeholder="e.g. 0803 123 4567"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    helperText="Required for 1-click WhatsApp debt payment reminders"
                  />
                </div>
              </div>
            </div>

            {/* Debt Details */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Items Taken / Description *
                </label>
                <Input
                  placeholder="e.g. 2 bags of 50kg rice, 1 carton vegetable oil"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Total Debt Amount ({currency}) *
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="e.g. 45000"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="font-mono text-base font-bold text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Initial Deposit Paid ({currency})
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="e.g. 15000 (if paid part)"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="font-mono"
                    helperText="Leave empty or 0 if nothing was paid yet"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Promised Repayment Due Date</span>
                  </label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    helperText="MarketMate alerts you when this debt is overdue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Agreement / Additional Notes
                  </label>
                  <Input
                    placeholder="e.g. Promised to transfer balance this Friday"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Live Ledger Calculation Preview */}
            <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                <span className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                  <TrendingUp className="w-4 h-4 text-emerald-700" />
                  <span>Ledger Balance Calculation</span>
                </span>
                <span className="text-[11px] text-slate-400">Automatic book balance</span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-white p-3 rounded-lg border border-slate-200/80 text-center">
                  <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                    Total Value
                  </p>
                  <p className="text-sm sm:text-base font-bold text-slate-900 mt-0.5 font-mono tabular-nums">
                    {formatCurrency(totalNum, currency)}
                  </p>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200/80 text-center">
                  <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                    Deposit Paid
                  </p>
                  <p className="text-sm sm:text-base font-bold text-emerald-700 mt-0.5 font-mono tabular-nums">
                    {formatCurrency(initialPaidNum, currency)}
                  </p>
                </div>

                <div className="bg-rose-50/70 p-3 rounded-lg border border-rose-200/80 text-center">
                  <p className="text-[10px] uppercase font-semibold text-rose-700 tracking-wider">
                    Remaining Debt
                  </p>
                  <p className="text-sm sm:text-base font-bold text-rose-800 mt-0.5 font-mono tabular-nums">
                    {formatCurrency(balanceDueNum, currency)}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Actions: Cancel + Save Credit Button */}
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
                className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold px-7"
              >
                Save to Debt Book
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
