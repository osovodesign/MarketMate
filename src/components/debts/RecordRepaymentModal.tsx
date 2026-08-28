import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useAuth } from '../../context/AuthContext';
import { CustomerDebt, PaymentMethod } from '../../types';
import { formatCurrency } from '../../lib/formatters';
import { DollarSign, CreditCard, Banknote, Smartphone, CheckCircle2 } from 'lucide-react';

interface RecordRepaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: CustomerDebt | null;
}

export const RecordRepaymentModal: React.FC<RecordRepaymentModalProps> = ({
  isOpen,
  onClose,
  debt,
}) => {
  const { recordDebtRepayment } = useBusinessData();
  const { business } = useAuth();
  const currency = business?.currency || 'NGN';

  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Transfer');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!debt) return null;

  const handleClose = () => {
    setAmount('');
    setPaymentMethod('Transfer');
    setNotes('');
    setError(null);
    onClose();
  };

  const handleFullSettlement = () => {
    setAmount(debt.remainingBalance.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payAmount = parseFloat(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      setError('Please enter a valid repayment amount');
      return;
    }
    if (payAmount > debt.remainingBalance) {
      setError(`Repayment cannot exceed the remaining balance (${formatCurrency(debt.remainingBalance, currency)})`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await recordDebtRepayment(debt.id, payAmount, paymentMethod, notes);
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record repayment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Record Debt Repayment"
      description={`Update customer balance for ${debt.customerName}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Balance Overview Card */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span>Customer:</span>
            <span className="font-bold text-slate-900">{debt.customerName}</span>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span>Item / Transaction:</span>
            <span className="text-slate-800">{debt.description}</span>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span>Total Debt Amount:</span>
            <span className="font-semibold text-slate-800">{formatCurrency(debt.totalAmount, currency)}</span>
          </div>
          <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
            <span className="text-xs font-bold text-rose-700">Remaining Balance:</span>
            <span className="text-base font-extrabold text-rose-700">
              {formatCurrency(debt.remainingBalance, currency)}
            </span>
          </div>
        </div>

        {/* Repayment Amount */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Repayment Amount ({currency}) *
            </label>
            <button
              type="button"
              onClick={handleFullSettlement}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline"
            >
              Pay Full Balance ({formatCurrency(debt.remainingBalance, currency)})
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <DollarSign className="w-4 h-4" />
            </div>
            <input
              type="number"
              min="1"
              max={debt.remainingBalance}
              step="any"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 15000"
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-600 rounded-xl text-base font-bold text-slate-900 outline-none transition-all"
            />
          </div>
        </div>

        {/* Payment Method Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Payment Method
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'Transfer', label: 'Transfer', icon: Smartphone },
              { id: 'Cash', label: 'Cash', icon: Banknote },
              { id: 'POS', label: 'POS', icon: CreditCard },
            ].map((method) => {
              const Icon = method.icon;
              const isSelected = paymentMethod === method.id;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-700' : 'text-slate-400'}`} />
                  {method.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Repayment Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Payment Notes (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. OPay transfer ref 492048"
            className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-600 rounded-xl text-sm text-slate-900 outline-none transition-all"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            variant="primary"
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            Confirm Repayment
          </Button>
        </div>
      </form>
    </Modal>
  );
};
