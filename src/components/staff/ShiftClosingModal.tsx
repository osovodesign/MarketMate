import React, { useState } from 'react';
import {
  X,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Share2,
  Printer,
  Coins,
  ArrowRight,
} from 'lucide-react';
import { StaffShiftRecord } from '../../types';
import { useBusinessData } from '../../context/BusinessDataContext';
import { formatCurrency } from '../../lib/formatters';
import { useAuth } from '../../context/AuthContext';

interface ShiftClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  shiftToClose?: StaffShiftRecord | null;
  onShiftClosed?: (closedShift: StaffShiftRecord) => void;
}

export const ShiftClosingModal: React.FC<ShiftClosingModalProps> = ({
  isOpen,
  onClose,
  shiftToClose,
  onShiftClosed,
}) => {
  const { currentSession, activeShift, closeStaffShift } = useBusinessData();
  const { business } = useAuth();
  const currency = business?.currency || 'NGN';

  const targetShift = shiftToClose || activeShift;

  const [actualCashInput, setActualCashInput] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedShift, setCompletedShift] = useState<StaffShiftRecord | null>(null);

  if (!isOpen) return null;

  const countedCash = parseFloat(actualCashInput) || 0;
  const expectedCash = targetShift?.expectedCash || 0;
  const difference = countedCash - expectedCash;

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetShift) return;

    try {
      setIsSubmitting(true);
      const res = await closeStaffShift(targetShift.id, countedCash, notes);
      setIsSubmitting(false);
      setCompletedShift(res);
      if (onShiftClosed) onShiftClosed(res);
    } catch (err: any) {
      setIsSubmitting(false);
      alert('Error closing shift: ' + (err.message || 'Unknown error'));
    }
  };

  const handleShareWhatsApp = () => {
    if (!targetShift && !completedShift) return;
    const s = completedShift || targetShift!;
    const diff = s.cashDifference !== undefined ? s.cashDifference : difference;

    const message = `📋 *MARKETMATE SHIFT RECONCILIATION SUMMARY*
Store: *${business?.businessName || 'Store'}*
Cashier: *${s.staffName}* (${s.role.toUpperCase()})
Shift Started: ${new Date(s.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
Shift Ended: ${s.endedAt ? new Date(s.endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}

*CASH DRAWER RECONCILIATION:*
• Opening Float: ${formatCurrency(s.openingFloat, currency)}
• Total Sales Count: ${s.totalSalesCount} transactions
• Cash Collected: ${formatCurrency(s.cashSalesAmount, currency)}
• POS Card / Transfer: ${formatCurrency(s.transferSalesAmount + s.posCardSalesAmount, currency)}
--------------------------------
• Expected Cash: ${formatCurrency(s.expectedCash, currency)}
• Actual Cash Counted: ${formatCurrency(s.actualCashCounted || countedCash, currency)}
• Difference: ${diff === 0 ? 'BALANCED ✅ (₦0.00)' : diff > 0 ? `OVERAGE (+${formatCurrency(diff, currency)})` : `SHORTAGE ⚠️ (${formatCurrency(diff, currency)})`}

Notes: ${s.notes || 'None'}`;

    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#FEFEFE] dark:bg-[#001A35] w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-50/80 dark:bg-emerald-950/40 border-b border-emerald-200/60 dark:border-emerald-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#059669] text-white flex items-center justify-center font-bold shadow-2xs">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                {completedShift ? 'Shift Handover Receipt' : 'End Shift & Cash Drawer Count'}
              </h3>
              <p className="text-xs text-[#059669] dark:text-[#34D399] font-medium">
                {targetShift ? `Attendant: ${targetShift.staffName}` : 'Reconcile register cash'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {!targetShift && !completedShift ? (
            <div className="text-center py-8 space-y-2">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
              <p className="text-sm font-bold text-slate-800 dark:text-white">No active shift detected</p>
              <p className="text-xs text-slate-500">
                You can start a new shift anytime from the Staff & Cashier menu.
              </p>
              <button
                onClick={onClose}
                className="mt-3 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Close Window
              </button>
            </div>
          ) : completedShift ? (
            /* Completed Shift Handover Receipt View */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B]/30 border border-[#059669]/30 text-center space-y-1">
                <CheckCircle2 className="w-8 h-8 text-[#059669] dark:text-[#34D399] mx-auto" />
                <h4 className="text-base font-extrabold text-[#001A35] dark:text-[#FEFEFE]">
                  Shift Successfully Closed & Logged!
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {completedShift.cashDifference === 0
                    ? 'Cash drawer is perfectly balanced with zero discrepancy.'
                    : completedShift.cashDifference! > 0
                    ? `Drawer has an overage of ${formatCurrency(completedShift.cashDifference!, currency)}.`
                    : `Drawer has a shortage of ${formatCurrency(Math.abs(completedShift.cashDifference!), currency)}.`}
                </p>
              </div>

              {/* Receipt Summary Card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="text-slate-500">Cashier:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{completedShift.staffName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="text-slate-500">Transactions Recorded:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{completedShift.totalSalesCount} sales</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="text-slate-500">Cash Expected:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(completedShift.expectedCash, currency)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="text-slate-500">Actual Cash Counted:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(completedShift.actualCashCounted || 0, currency)}</span>
                </div>
                <div className="flex justify-between pt-1 text-sm font-extrabold">
                  <span>Reconciliation Status:</span>
                  <span
                    className={
                      completedShift.cashDifference === 0
                        ? 'text-[#059669] dark:text-[#34D399]'
                        : completedShift.cashDifference! > 0
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }
                  >
                    {completedShift.cashDifference === 0
                      ? 'Balanced ✅'
                      : completedShift.cashDifference! > 0
                      ? `+${formatCurrency(completedShift.cashDifference!, currency)}`
                      : `-${formatCurrency(Math.abs(completedShift.cashDifference!), currency)}`}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="flex-1 py-2.5 px-3 bg-[#059669] hover:bg-[#047857] text-[#FEFEFE] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Send Handover to Owner via WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Shift Closing Form */
            <form onSubmit={handleCloseShift} className="space-y-4">
              {/* Shift Overview Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Opening Float
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {formatCurrency(targetShift!.openingFloat, currency)}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Shift Cash Sales
                  </span>
                  <span className="text-sm font-bold text-[#059669] dark:text-[#34D399] mt-0.5 block">
                    {formatCurrency(targetShift!.cashSalesAmount, currency)}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Non-Cash (Card/Transfer)
                  </span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-0.5 block">
                    {formatCurrency(targetShift!.transferSalesAmount + targetShift!.posCardSalesAmount, currency)}
                  </span>
                </div>
              </div>

              {/* Expected Total Cash Banner */}
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-purple-950 dark:text-purple-200 block">
                    Expected Cash in Drawer:
                  </span>
                  <span className="text-[11px] text-purple-700 dark:text-purple-300">
                    Float ({formatCurrency(targetShift!.openingFloat, currency)}) + Cash Sales ({formatCurrency(targetShift!.cashSalesAmount, currency)})
                  </span>
                </div>
                <span className="text-lg font-extrabold text-purple-950 dark:text-purple-100 font-mono">
                  {formatCurrency(expectedCash, currency)}
                </span>
              </div>

              {/* Physical Cash Counted Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-white flex items-center justify-between">
                  <span>Actual Cash Counted in Drawer:</span>
                  <span className="text-[11px] font-normal text-slate-500">Count physical notes & coins</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
                    ₦
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    autoFocus
                    value={actualCashInput}
                    onChange={(e) => setActualCashInput(e.target.value)}
                    placeholder={expectedCash.toString()}
                    className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-base font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#059669] focus:outline-none"
                  />
                </div>
              </div>

              {/* Live Variance Calculation */}
              {actualCashInput && (
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
                    difference === 0
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 text-emerald-800 dark:text-emerald-300'
                      : difference > 0
                      ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-300 text-blue-800 dark:text-blue-300'
                      : 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 text-rose-800 dark:text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {difference === 0 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                    <span>
                      {difference === 0
                        ? 'Cash Drawer Balanced Exactly'
                        : difference > 0
                        ? 'Cash Drawer Overage'
                        : 'Cash Drawer Shortage'}
                    </span>
                  </div>
                  <span className="font-mono text-sm">
                    {difference === 0
                      ? '₦0.00'
                      : difference > 0
                      ? `+${formatCurrency(difference, currency)}`
                      : `-${formatCurrency(Math.abs(difference), currency)}`}
                  </span>
                </div>
              )}

              {/* Handover Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Shift Handover Notes (Optional):
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. ₦5,000 kept in till for tomorrow morning change; handover done to Blessing."
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#059669] focus:outline-none text-slate-900 dark:text-white"
                />
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !actualCashInput}
                  className="py-2.5 px-5 bg-[#059669] hover:bg-[#047857] text-[#FEFEFE] rounded-xl text-xs font-bold shadow-2xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span>Confirm & Close Shift</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
