import React, { useState } from 'react';
import { Receipt, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { ExpenseCategory, PaymentMethod } from '../../types';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useAuth } from '../../context/AuthContext';
import { getTodayDateString } from '../../lib/formatters';

interface RecordExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export const RecordExpenseModal: React.FC<RecordExpenseModalProps> = ({ isOpen, onClose }) => {
  const { addExpense } = useBusinessData();
  const { business } = useAuth();
  const currency = business?.currency || 'NGN';

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | string>('');
  const [category, setCategory] = useState<ExpenseCategory>('Transport');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Transfer');
  const [expenseDate, setExpenseDate] = useState(getTodayDateString());
  const [isSubmitting, setIsSubmitting] = useState(false);
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

      // Reset
      setDescription('');
      setAmount('');
      setCategory('Transport');
      setExpenseDate(getTodayDateString());
      onClose();
    } catch (err) {
      setError('Failed to record expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Business Expense"
      subtitle="Track your operating costs to get an accurate view of take-home profit."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        <Input
          label="Expense Description"
          type="text"
          placeholder="e.g. Dispatch rider for Ikeja delivery, Generator fuel"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setError(null);
          }}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label={`Amount Spent (${currency})`}
            type="number"
            min="0"
            step="any"
            placeholder="e.g. 4500"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            leftAddon={<span className="text-xs font-semibold">₦</span>}
          />

          <Select
            label="Expense Category"
            options={EXPENSE_CATEGORIES}
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

        {/* Helpful reminder note */}
        <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 flex items-start gap-2.5 text-xs text-amber-900">
          <Receipt className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <span>
            Recording every expense prevents hidden losses and helps MarketMate AI tell you where your money is going.
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting} size="md" variant="primary">
            Save Expense
          </Button>
        </div>
      </form>
    </Modal>
  );
};
