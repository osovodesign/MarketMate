import React, { useState, useEffect } from 'react';
import {
  Gift,
  Copy,
  Check,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  HelpCircle,
  MessageCircle,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useAuth } from '../../context/AuthContext';
import {
  getReferralCodeForUser,
  getReferralShareUrl,
  getWhatsAppShareMessage,
  fetchUserReferrals,
} from '../../lib/referralService';
import { ReferralRecord } from '../../types';

interface ReferralViewProps {
  onBack: () => void;
}

export const ReferralView: React.FC<ReferralViewProps> = ({ onBack }) => {
  const { user, business } = useAuth();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [totalDiscount, setTotalDiscount] = useState<number>(0);
  const [totalSubscribed, setTotalSubscribed] = useState<number>(0);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const referralCode = getReferralCodeForUser(user?.id);
  const shareUrl = getReferralShareUrl(referralCode);
  const merchantName = business?.businessName || user?.fullName || 'MarketMate Merchant';

  useEffect(() => {
    if (user?.id) {
      setLoading(true);
      fetchUserReferrals(user.id, referralCode)
        .then((res) => {
          setReferrals(res.referrals);
          setTotalDiscount(res.totalDiscountPercent);
          setTotalSubscribed(res.totalSubscribed);
          setPendingCount(res.pendingCount);
        })
        .finally(() => setLoading(false));
    }
  }, [user?.id, referralCode]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyMessage = () => {
    const text = getWhatsAppShareMessage(referralCode, merchantName);
    navigator.clipboard.writeText(text);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2500);
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    getWhatsAppShareMessage(referralCode, merchantName)
  )}`;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 shadow-2xs"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Refer a Business &amp; Earn 5% Off
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Early Merchant Referral Offer · Valid October 12th – 30th, 2026
            </p>
          </div>
        </div>
      </div>

      {/* Campaign Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 transform translate-x-6 -translate-y-6 opacity-10 pointer-events-none">
          <Gift className="w-48 h-48" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-1.5 text-emerald-100 text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5" />
              <span>Oct 12 – Oct 30, 2026</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
              Get 5% off your MarketMate subscription!
            </h2>
            <p className="text-xs sm:text-sm text-emerald-50 leading-relaxed">
              Invite fellow store owners to join MarketMate. When they{' '}
              <strong>register and subscribe</strong>, you unlock a 5% discount on your
              subscription starting October 12th!
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs border border-white/20 rounded-xl p-4 text-center shrink-0 min-w-[150px]">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-emerald-100 block">
              Active Discount
            </span>
            <span className="text-3xl font-black text-white font-mono">
              {totalDiscount}%
            </span>
            <span className="text-[11px] text-emerald-100 block mt-0.5">
              {totalSubscribed > 0
                ? `${totalSubscribed} subscribed merchant${totalSubscribed > 1 ? 's' : ''}`
                : 'Unlocks upon subscription'}
            </span>
          </div>
        </div>
      </div>

      {/* Qualification Rule Notice */}
      <div className="flex items-start gap-2.5 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs">
        <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Subscription Requirement: </span>
          <span>
            To qualify for the 5% subscription discount, referred merchants must complete their
            store registration <strong>and subscribe</strong> to MarketMate.
          </span>
        </div>
      </div>

      {/* Shareable Referral Code & Link */}
      <Card padding="lg" className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Unique Referral Code */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Your Referral Code
              </span>
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <span className="font-mono text-xl font-black text-slate-900 dark:text-white tracking-widest">
                  {referralCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
              Fellow merchants can enter this code when creating their account.
            </p>
          </div>

          {/* Shareable Link */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Direct Sign-Up Link
              </span>
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-[200px] font-mono">
                  {shareUrl}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-2xs shrink-0"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
              Automatically applies your referral discount when they click it.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Share on WhatsApp</span>
          </a>

          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={handleCopyMessage}
            leftIcon={
              copiedMessage ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )
            }
          >
            {copiedMessage ? 'Invitation Text Copied!' : 'Copy Invitation Message'}
          </Button>
        </div>
      </Card>

      {/* How it Works (3 Steps) */}
      <Card padding="lg" className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          How the 5% Discount Works
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">
              1
            </span>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Share Your Link</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                Send your referral code or link to another store owner or trader.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">
              2
            </span>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                They Register &amp; Subscribe
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                They open their MarketMate shop and activate their subscription.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">
              3
            </span>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Unlock 5% Off</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                As soon as they subscribe, your 5% discount is unlocked for the Oct 12–30 launch!
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Referrals History List */}
      <Card padding="lg" className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <span>Your Referred Businesses</span>
          </span>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">
              {totalSubscribed} subscribed
            </span>
            {pendingCount > 0 && (
              <span className="text-amber-600 dark:text-amber-400">
                · {pendingCount} awaiting subscription
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-center text-xs text-slate-400 animate-pulse">
            Checking your referral records...
          </div>
        ) : referrals.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-1">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
              No businesses registered with your link yet
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Tap "Share on WhatsApp" above to invite your first merchant friend!
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {referrals.map((ref) => {
              const isSubscribed = ref.referredSubscribed || ref.status === 'qualified';
              return (
                <div
                  key={ref.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl border text-xs transition-colors ${
                    isSubscribed
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                      : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isSubscribed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    )}
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {ref.referredBusinessName || 'New Store Partner'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Registered: {new Date(ref.createdAt).toLocaleDateString()}
                        {ref.subscribedAt &&
                          ` · Subscribed: ${new Date(ref.subscribedAt).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>

                  <div className="self-end sm:self-auto">
                    {isSubscribed ? (
                      <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Subscribed · 5% Discount Active</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Registered · Awaiting Subscription</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
