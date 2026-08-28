import React, { useState, useEffect } from 'react';
import { X, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { Invoice, PaymentMethod } from '../../types';
import { useBusinessData } from '../../context/BusinessDataContext';
import { formatCurrency, getTodayDateString } from '../../lib/formatters';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

interface RecordInvoicePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
}

export const RecordInvoicePaymentModal: React.FC<RecordInvoicePaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
}) => {
  const { recordInvoicePayment } = useBusinessData();
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Transfer');
  const [autoRecordAsSale, setAutoRecordAsSale] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && invoice) {
      setAmount(invoice.balanceDue.toString());
      setPaymentMethod('Transfer');
      setAutoRecordAsSale(true);
      setError('');
    }
  }, [isOpen, invoice]);

  if (!isOpen || !invoice) return null;

  const numericAmount = Number(amount) || 0;
  const newBalance = Math.max(0, invoice.balanceDue - numericAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount <= 0) {
      setError('Please enter a payment amount greater than zero');
      return;
    }
    if (numericAmount > invoice.balanceDue) {
      setError(`Payment amount cannot exceed remaining balance of ${formatCurrency(invoice.balanceDue)}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await recordInvoicePayment(invoice.id, numericAmount, paymentMethod, autoRecordAsSale);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Record Payment</h2>
              <p className="text-xs text-slate-500">Invoice #{invoice.invoiceNumber}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Invoice Summary Card */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Customer:</span>
              <span className="font-bold text-slate-900">{invoice.customerName}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Total Invoiced:</span>
              <span className="font-semibold text-slate-800">{formatCurrency(invoice.total)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Already Paid:</span>
              <span className="font-semibold text-emerald-700">{formatCurrency(invoice.amountPaid)}</span>
            </div>
            <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-slate-200">
              <span>Remaining Balance:</span>
              <span className="text-amber-900 font-extrabold">{formatCurrency(invoice.balanceDue)}</span>
            </div>
          </div>

          <div>
            <Input
              label="Payment Amount Received (₦)"
              type="number"
              min="1"
              max={invoice.balanceDue}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 50000"
              required
            />
            {numericAmount > 0 && numericAmount < invoice.balanceDue && (
              <p className="text-[11px] text-amber-700 mt-1 font-medium">
                Remaining after payment: {formatCurrency(newBalance)} (Status will be Partially Paid)
              </p>
            )}
            {numericAmount >= invoice.balanceDue && (
              <p className="text-[11px] text-emerald-700 mt-1 font-medium flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                This payment will mark the invoice as Paid in Full!
              </p>
            )}
          </div>

          <div>
            <Select
              label="Payment Method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              options={[
                { value: 'Transfer', label: 'Bank Transfer (Direct / Instant)' },
                { value: 'POS', label: 'POS Terminal / Debit Card' },
                { value: 'Cash', label: 'Cash Payment' },
              ]}
            />
          </div>

          <div className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-xl">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                checked={autoRecordAsSale}
                onChange={(e) => setAutoRecordAsSale(e.target.checked)}
                className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600 w-4 h-4 mt-0.5"
              />
              <div>
                <span className="font-semibold text-slate-900">
                  Automatically sync to Sales Revenue Ledger
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Reflects this payment immediately in your dashboard daily/monthly revenue & profit metrics.
                </p>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="bg-emerald-700 hover:bg-emerald-800"
            >
              Confirm Payment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
