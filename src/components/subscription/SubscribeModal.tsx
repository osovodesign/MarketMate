import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Building2,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Clock,
  ArrowRight,
  Send,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  PlatformBankConfig,
  SubscriptionRequest,
} from '../../types';
import {
  fetchPlatformBankConfig,
  submitSubscriptionPayment,
  generatePaymentReference,
  fetchSubscriptionRequests,
} from '../../lib/subscriptionService';
import { fetchUserReferrals } from '../../lib/referralService';

interface SubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SubscribeModal: React.FC<SubscribeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, business } = useAuth();

  const [bankConfig, setBankConfig] = useState<PlatformBankConfig | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'q4_pass'>('monthly');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Form fields
  const [senderBank, setSenderBank] = useState('');
  const [senderAccountName, setSenderAccountName] = useState(business?.ownerName || '');
  const [proofNote, setProofNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<SubscriptionRequest | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Existing pending request
  const [existingRequest, setExistingRequest] = useState<SubscriptionRequest | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      setLoadingInitial(true);
      try {
        const config = await fetchPlatformBankConfig();
        setBankConfig(config);

        // Fetch user referral discount
        if (user?.id) {
          const refStats = await fetchUserReferrals(user.id);
          setDiscountPercent(refStats.totalDiscountPercent || 0);

          // Check if user already has a pending subscription request
          const reqs = await fetchSubscriptionRequests({
            businessId: business?.id,
            userId: user.id,
          });
          const pending = reqs.find((r) => r.status === 'pending');
          if (pending) {
            setExistingRequest(pending);
          }
        }

        // Generate payment reference code
        setPaymentRef(generatePaymentReference(business?.businessName || 'SHOP'));
      } catch (err) {
        console.warn('Error loading subscription info:', err);
      } finally {
        setLoadingInitial(false);
      }
    };

    loadData();
  }, [isOpen, user?.id, business?.id, business?.businessName]);

  if (!isOpen) return null;

  // Strict pricing for 2026: ₦1,000 monthly or ₦3,000 for Q4 3-month pass
  const basePrice = selectedPlan === 'q4_pass' ? 3000 : 1000;

  const discountAmount = Math.round((basePrice * discountPercent) / 100);
  const finalPrice = Math.max(0, basePrice - discountAmount);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !business) return;

    if (!senderBank.trim()) {
      setErrorMessage('Please enter the bank you transferred from.');
      return;
    }
    if (!senderAccountName.trim()) {
      setErrorMessage('Please enter the account name that initiated the transfer.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const planName =
        selectedPlan === 'q4_pass'
          ? 'MarketMate Q4 Finish Strong Pass (3 Months - Oct/Nov/Dec)'
          : 'MarketMate Monthly Plan (₦1,000)';

      const req = await submitSubscriptionPayment({
        businessId: business.id,
        businessName: business.businessName,
        userId: user.id,
        userEmail: user.email,
        ownerName: business.ownerName || user.fullName,
        phone: business.phone,
        planId: selectedPlan,
        planName,
        planOriginalPrice: basePrice,
        discountPercent,
        finalAmount: finalPrice,
        currency: 'NGN',
        senderBank: senderBank.trim(),
        senderAccountName: senderAccountName.trim(),
        paymentReference: paymentRef,
        proofNote: proofNote.trim(),
      });

      setSubmissionSuccess(req);
      setExistingRequest(req);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to submit payment details. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight text-white">
                  Subscribe to MarketMate
                </h3>
                <p className="text-xs text-emerald-100/90 font-medium">
                  Direct Bank Transfer & Instant Admin Verification
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 text-white/90 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Pending submission banner if active */}
          {existingRequest && existingRequest.status === 'pending' && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                      Payment Verification in Progress
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                      Pending Admin Review
                    </span>
                  </div>
                  <p className="text-xs text-amber-800/90 dark:text-amber-300 leading-relaxed">
                    We received your transfer submission for{' '}
                    <strong>₦{existingRequest.finalAmount.toLocaleString()}</strong> ({existingRequest.planName}).
                    Reference:{' '}
                    <code className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900 font-mono font-bold">
                      {existingRequest.paymentReference}
                    </code>
                  </p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    Our admin team will confirm your bank alert and activate your account. No further action is required!
                  </p>
                </div>
              </div>
            </div>
          )}

          {submissionSuccess ? (
            <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 mx-auto flex items-center justify-center">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="text-base font-black text-emerald-900 dark:text-emerald-100">
                Payment Proof Submitted Successfully!
              </h4>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 max-w-md mx-auto leading-relaxed">
                Thank you, <strong>{submissionSuccess.ownerName || submissionSuccess.businessName}</strong>. Your payment
                with reference <code className="font-mono font-bold">{submissionSuccess.paymentReference}</code> has been
                queued for admin verification.
              </p>
              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer transition-colors"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Pro Feature Inclusions Banner */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 text-xs">
                <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200 mb-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Everything Included in MarketMate Pro:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                  <span className="flex items-center gap-1">• Invoice & Quotations</span>
                  <span className="flex items-center gap-1">• Reports & P&L</span>
                  <span className="flex items-center gap-1">• Catalog & Inventory</span>
                  <span className="flex items-center gap-1">• Credit & Debt Book</span>
                  <span className="flex items-center gap-1">• CRM & Contacts</span>
                  <span className="flex items-center gap-1">• Smart Financial Tools</span>
                </div>
              </div>

              {/* Plan Selection Cards */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                  1. Select 2026 Launch Pass (Valid till Dec 31, 2026)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setSelectedPlan('monthly')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                      selectedPlan === 'monthly'
                        ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs">
                      2026 Promo
                    </div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        Monthly Launch Pass
                      </span>
                      <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center border-emerald-600">
                        {selectedPlan === 'monthly' && (
                          <span className="w-2 h-2 rounded-full bg-emerald-600" />
                        )}
                      </span>
                    </div>
                    <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
                      ₦1,000
                      <span className="text-xs font-medium text-slate-500"> / mo</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Flexible monthly billing through Dec 31, 2026.
                    </p>
                  </div>

                  <div
                    onClick={() => setSelectedPlan('q4_pass')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                      selectedPlan === 'q4_pass'
                        ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-xs">
                      🔥 Best Q4 Value
                    </div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        Q4 Pass (3 Months)
                      </span>
                      <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center border-emerald-600">
                        {selectedPlan === 'q4_pass' && (
                          <span className="w-2 h-2 rounded-full bg-emerald-600" />
                        )}
                      </span>
                    </div>
                    <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
                      ₦3,000
                      <span className="text-xs font-medium text-slate-500"> / 3-mo pass</span>
                    </div>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium mt-1">
                      Full access for Oct, Nov &amp; Dec 2026 inclusive.
                    </p>
                  </div>
                </div>
              </div>

              {/* Price & Referral Discount Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>Base Plan Price:</span>
                  <span className="font-mono font-semibold">₦{basePrice.toLocaleString()}</span>
                </div>

                {discountPercent > 0 ? (
                  <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Referral Rewards ({discountPercent}% discount):
                    </span>
                    <span className="font-mono font-bold">- ₦{discountAmount.toLocaleString()}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-slate-400 text-[11px] italic">
                    <span>Referral Discount:</span>
                    <span>0% (Refer peer stores to earn 5% off)</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-sm font-black text-slate-900 dark:text-white">
                  <span>Total Amount to Transfer:</span>
                  <span className="text-emerald-700 dark:text-emerald-400 text-lg font-mono">
                    ₦{finalPrice.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* MarketMate Official Receiving Bank Account */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-900 to-slate-900 text-white shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                      2. Transfer To MarketMate Official Bank
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30">
                    Direct Transfer
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
                    <span className="text-[10px] font-bold text-slate-300 uppercase block">Bank Name</span>
                    <span className="text-sm font-bold text-white block mt-0.5">
                      {bankConfig?.bankName || 'OPay'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-300 uppercase block">Account Number</span>
                      <span className="text-base font-black font-mono text-emerald-300 tracking-wider block mt-0.5">
                        {bankConfig?.accountNumber || '6110157178'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(bankConfig?.accountNumber || '6110157178', 'accNo')}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                      title="Copy Account Number"
                    >
                      {copiedField === 'accNo' ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-300 uppercase block">Account Name</span>
                    <span className="text-xs font-bold text-white block mt-0.5">
                      {bankConfig?.accountName || 'OGHENEOVO DANIEL OSOVOYORON'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(bankConfig?.accountName || 'OGHENEOVO DANIEL OSOVOYORON', 'accName')}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    title="Copy Account Name"
                  >
                    {copiedField === 'accName' ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Narration Reference Code */}
                <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-300 uppercase block">
                      Transfer Narration / Reference
                    </span>
                    <span className="text-xs font-mono font-bold text-white block mt-0.5">
                      {paymentRef}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(paymentRef, 'refCode')}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                    title="Copy Narration Code"
                  >
                    {copiedField === 'refCode' ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-emerald-200/80 leading-relaxed italic">
                  💡 Tip: Quote the reference code in your transfer remark to enable faster verification.
                </p>
              </div>

              {/* Payment Proof Submission Form */}
              <form onSubmit={handleSubmitProof} className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    3. Submit Transfer Verification Details
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    Once you complete the transfer in your bank app, fill in these details so our admin can verify your payment.
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Your Bank Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. GTBank, Kuda, Zenith, OPay"
                      value={senderBank}
                      onChange={(e) => setSenderBank(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Sender Account Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Name on your bank account"
                      value={senderAccountName}
                      onChange={(e) => setSenderAccountName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Transaction Reference / Note (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Bank transaction ID, session ID, or time sent"
                    value={proofNote}
                    onChange={(e) => setProofNote(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <span>Submitting...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Payment Proof for Approval</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
