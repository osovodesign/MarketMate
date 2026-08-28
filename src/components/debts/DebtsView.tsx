import React, { useState, useMemo } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useAuth } from '../../context/AuthContext';
import { CustomerDebt } from '../../types';
import { formatCurrency, formatDateFriendly } from '../../lib/formatters';
import { AddDebtModal } from './AddDebtModal';
import { RecordRepaymentModal } from './RecordRepaymentModal';
import {
  Users,
  Search,
  Plus,
  Phone,
  MessageSquare,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Copy,
  Check,
  Send,
  Sparkles,
} from 'lucide-react';

export const DebtsView: React.FC = () => {
  const { debts, deleteDebt, totalOutstandingReceivables } = useBusinessData();
  const { business } = useAuth();
  const currency = business?.currency || 'NGN';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid_partial' | 'settled'>('unpaid_partial');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [repaymentDebt, setRepaymentDebt] = useState<CustomerDebt | null>(null);
  const [expandedDebtId, setExpandedDebtId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Filtered debts
  const filteredDebts = useMemo(() => {
    return debts.filter((d) => {
      // Status filter
      if (statusFilter === 'unpaid_partial' && d.status === 'settled') return false;
      if (statusFilter === 'settled' && d.status !== 'settled') return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = d.customerName.toLowerCase().includes(q);
        const matchPhone = d.customerPhone?.toLowerCase().includes(q) || false;
        const matchDesc = d.description.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchDesc) return false;
      }

      return true;
    });
  }, [debts, statusFilter, searchQuery]);

  // Aggregate stats
  const totalDebtsCount = debts.length;
  const activeDebtorsCount = debts.filter((d) => d.status !== 'settled').length;
  const totalSettledCount = debts.filter((d) => d.status === 'settled').length;
  const totalHistoricalCredit = debts.reduce((sum, d) => sum + d.totalAmount, 0);

  // Generate WhatsApp Payment Reminder text
  const generateWhatsAppReminder = (debt: CustomerDebt): string => {
    const businessName = business?.businessName || 'our store';
    const amountStr = formatCurrency(debt.remainingBalance, currency);
    const dueDateStr = debt.dueDate ? ` on or before *${debt.dueDate}*` : '';

    return `Hello ${debt.customerName} 👋,\n\nTrust you are having a wonderful day! This is a gentle and friendly reminder from *${businessName}* regarding the outstanding balance of *${amountStr}* for your purchase (${debt.description})${dueDateStr}.\n\nKindly let us know once convenient for payment or transfer. We appreciate your continued business and partnership! ✨`;
  };

  const handleCopyReminder = (debt: CustomerDebt) => {
    const text = generateWhatsAppReminder(debt);
    navigator.clipboard.writeText(text);
    setCopiedId(debt.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleOpenWhatsApp = (debt: CustomerDebt) => {
    const text = encodeURIComponent(generateWhatsAppReminder(debt));
    let phone = debt.customerPhone ? debt.customerPhone.replace(/[^0-9]/g, '') : '';
    if (phone.startsWith('0') && phone.length === 11) {
      phone = '234' + phone.substring(1);
    }
    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      {/* Header with Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-emerald-700" />
            Customer Debt & Credit Book
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track customer receivables, log partial payments, and send polite WhatsApp payment reminders
          </p>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          className="shadow-2xs"
        >
          Record Credit Sale
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Outstanding Receivables */}
        <Card className="p-4 sm:p-5 bg-gradient-to-br from-rose-50/70 via-white to-orange-50/40 border-rose-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-rose-800 uppercase tracking-wider">
              Total Money Owed to You
            </p>
            <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-rose-700 mt-2">
            {formatCurrency(totalOutstandingReceivables, currency)}
          </p>
          <p className="text-xs text-rose-900/80 mt-1 font-semibold">
            {activeDebtorsCount} customer{activeDebtorsCount === 1 ? '' : 's'} with unpaid balances
          </p>
        </Card>

        {/* Active Debtors Count */}
        <Card className="p-4 sm:p-5 bg-gradient-to-br from-amber-50/60 via-white to-yellow-50/40 border-amber-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              Active Credit Accounts
            </p>
            <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            {activeDebtorsCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Out of {totalDebtsCount} total recorded credit sales
          </p>
        </Card>

        {/* Fully Settled Credit Records */}
        <Card className="p-4 sm:p-5 bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/40 border-emerald-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Fully Settled Customers
            </p>
            <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-800 mt-2">
            {totalSettledCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Total lifetime credit: {formatCurrency(totalHistoricalCredit, currency)}
          </p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, phone, or item..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-600 rounded-xl text-xs sm:text-sm text-slate-900 outline-none transition-all"
            />
          </div>

          {/* Filter Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200">
            <button
              onClick={() => setStatusFilter('unpaid_partial')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'unpaid_partial'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Unpaid / Pending ({activeDebtorsCount})
            </button>
            <button
              onClick={() => setStatusFilter('settled')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'settled'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Settled ({totalSettledCount})
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All ({totalDebtsCount})
            </button>
          </div>
        </div>
      </Card>

      {/* Debts List */}
      <div className="space-y-3">
        {filteredDebts.length === 0 ? (
          <Card className="p-8 sm:p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {statusFilter === 'unpaid_partial'
                ? 'No outstanding customer debts!'
                : 'No credit records match your filter'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1 mb-4">
              {statusFilter === 'unpaid_partial'
                ? 'Great news! All recorded customer debts have been fully settled.'
                : 'Try adjusting your search query or add a new customer credit sale.'}
            </p>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Record Credit Sale
            </Button>
          </Card>
        ) : (
          filteredDebts.map((debt) => {
            const isSettled = debt.status === 'settled';
            const isPartial = debt.status === 'partial';
            const percentPaid = Math.min(100, Math.round((debt.amountPaid / debt.totalAmount) * 100)) || 0;
            const isExpanded = expandedDebtId === debt.id;

            return (
              <Card
                key={debt.id}
                className={`p-4 sm:p-5 transition-all border ${
                  isSettled
                    ? 'bg-slate-50/50 border-slate-200'
                    : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Customer Info */}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-extrabold text-slate-900">
                        {debt.customerName}
                      </span>
                      <Badge
                        variant={isSettled ? 'emerald' : isPartial ? 'amber' : 'rose'}
                        size="sm"
                      >
                        {isSettled ? 'Settled in Full' : isPartial ? 'Partially Paid' : 'Unpaid'}
                      </Badge>
                      {debt.customerPhone && (
                        <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {debt.customerPhone}
                        </span>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 font-medium">
                      {debt.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                      <span>Created: {formatDateFriendly(debt.createdAt.split('T')[0])}</span>
                      {debt.dueDate && (
                        <span
                          className={`font-semibold flex items-center gap-1 ${
                            !isSettled && debt.dueDate < new Date().toISOString().split('T')[0]
                              ? 'text-rose-600'
                              : 'text-slate-600'
                          }`}
                        >
                          <Calendar className="w-3 h-3" />
                          Due: {formatDateFriendly(debt.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Financial Balance & Progress */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6">
                    <div className="min-w-[180px] space-y-1.5">
                      <div className="flex justify-between items-baseline text-xs">
                        <span className="text-slate-500 font-medium">Remaining:</span>
                        <span
                          className={`font-extrabold ${
                            isSettled ? 'text-slate-600' : 'text-rose-700 text-sm sm:text-base'
                          }`}
                        >
                          {formatCurrency(debt.remainingBalance, currency)}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                        <div
                          className={`h-full transition-all rounded-full ${
                            isSettled ? 'bg-emerald-600' : 'bg-amber-500'
                          }`}
                          style={{ width: `${percentPaid}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold">
                        <span>Paid: {formatCurrency(debt.amountPaid, currency)}</span>
                        <span>Total: {formatCurrency(debt.totalAmount, currency)}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {!isSettled && (
                        <>
                          <Button
                            onClick={() => setRepaymentDebt(debt)}
                            size="sm"
                            variant="primary"
                            className="text-xs font-bold"
                          >
                            Record Payment
                          </Button>

                          {/* WhatsApp Reminder Direct Action */}
                          <button
                            onClick={() => handleOpenWhatsApp(debt)}
                            className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1.5 border border-emerald-200/80 transition-colors"
                            title="Send Polite Reminder via WhatsApp"
                          >
                            <MessageSquare className="w-4 h-4 text-emerald-600" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </button>

                          <button
                            onClick={() => handleCopyReminder(debt)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                            title="Copy Reminder Text"
                          >
                            {copiedId === debt.id ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </>
                      )}

                      {/* Expand Repayment History Toggle */}
                      {debt.repayments && debt.repayments.length > 0 && (
                        <button
                          onClick={() =>
                            setExpandedDebtId(isExpanded ? null : debt.id)
                          }
                          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="View Payment History"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      )}

                      {/* Delete / Remove */}
                      {confirmDeleteId === debt.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              deleteDebt(debt.id);
                              setConfirmDeleteId(null);
                            }}
                            className="px-2 py-1 bg-rose-600 text-white text-[10px] font-bold rounded-lg"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(debt.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                          title="Delete debt record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Repayment History Accordion */}
                {isExpanded && debt.repayments && debt.repayments.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Payment History ({debt.repayments.length})
                    </p>
                    <div className="space-y-1.5">
                      {debt.repayments.map((rep) => (
                        <div
                          key={rep.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs"
                        >
                          <div className="space-y-0.5">
                            <span className="font-bold text-emerald-800">
                              +{formatCurrency(rep.amount, currency)}
                            </span>
                            <span className="text-slate-500 ml-2">via {rep.paymentMethod}</span>
                            {rep.notes && (
                              <p className="text-[11px] text-slate-400">{rep.notes}</p>
                            )}
                          </div>
                          <span className="text-slate-400 text-[11px] font-medium">
                            {formatDateFriendly(rep.date)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Modals */}
      <AddDebtModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <RecordRepaymentModal
        isOpen={!!repaymentDebt}
        onClose={() => setRepaymentDebt(null)}
        debt={repaymentDebt}
      />
    </div>
  );
};
