import React, { useState, useEffect } from 'react';
import {
  Gift,
  Copy,
  Check,
  Share2,
  Calendar,
  Sparkles,
  Users,
  Percent,
  CheckCircle2,
  Clock,
  HelpCircle,
  ArrowRight,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import {
  REFERRAL_CAMPAIGN,
  getReferralCodeForUser,
  getReferralShareUrl,
  getWhatsAppShareMessage,
  fetchUserReferrals,
} from '../../lib/referralService';
import { ReferralRecord } from '../../types';

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReferralModal: React.FC<ReferralModalProps> = ({ isOpen, onClose }) => {
  const { user, business } = useAuth();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [totalDiscount, setTotalDiscount] = useState<number>(0);
  const [totalRegistered, setTotalRegistered] = useState<number>(0);
  const [totalSubscribed, setTotalSubscribed] = useState<number>(0);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const referralCode = getReferralCodeForUser(user?.id);
  const shareUrl = getReferralShareUrl(referralCode);
  const merchantName = business?.businessName || user?.fullName || 'MarketMate Merchant';

  useEffect(() => {
    if (isOpen && user?.id) {
      setLoading(true);
      fetchUserReferrals(user.id, referralCode)
        .then((res) => {
          setReferrals(res.referrals);
          setTotalDiscount(res.totalDiscountPercent);
          setTotalRegistered(res.totalRegistered);
          setTotalSubscribed(res.totalSubscribed);
          setPendingCount(res.pendingCount);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, user?.id, referralCode]);

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

  const handleWhatsAppShare = () => {
    const text = getWhatsAppShareMessage(referralCode, merchantName);
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Refer a Business & Earn 5% Off"
      subtitle="Early Merchant Referral Offer • Valid October 12th – 30th, 2026"
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Campaign Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-6 -translate-y-6 opacity-10 pointer-events-none">
            <Gift className="w-48 h-48" />
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-md">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold backdrop-blur-xs">
                <Calendar className="w-3 h-3" />
                <span>Oct 12 – Oct 30, 2026</span>
              </div>
              <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                Get 5% off your MarketMate subscription!
              </h3>
              <p className="text-xs text-emerald-50 leading-relaxed">
                Invite fellow store owners to join MarketMate. When they <strong>register and subscribe</strong>, you unlock a 5% discount on your subscription starting October 12th!
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-xs border border-white/20 rounded-xl p-3 text-center shrink-0 min-w-[130px]">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-emerald-100 block">
                Active Discount
              </span>
              <span className="text-2xl font-black text-white font-mono">
                {totalDiscount}%
              </span>
              <span className="text-[10px] text-emerald-100 block mt-0.5">
                {totalSubscribed > 0
                  ? `${totalSubscribed} subscribed merchant${totalSubscribed > 1 ? 's' : ''}`
                  : 'Unlocks upon subscription'}
              </span>
            </div>
          </div>
        </div>

        {/* Qualification Rule Notice */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs">
          <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Subscription Requirement: </span>
            <span>
              To qualify for the 5% subscription discount, referred merchants must complete their store registration <strong>and subscribe</strong> to MarketMate.
            </span>
          </div>
        </div>

        {/* Sharable Referral Code & Link */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Unique Referral Code */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Your Referral Code
              </span>
              <div className="mt-1 flex items-center justify-between">
                <span className="font-mono text-lg font-black text-slate-900 dark:text-white tracking-widest">
                  {referralCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors cursor-pointer"
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
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
              Fellow merchants can enter this code when creating their account.
            </p>
          </div>

          {/* Sharable Link */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Direct Sign-Up Link
              </span>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-[180px] font-mono">
                  {shareUrl}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-2xs"
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
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
              Automatically applies your referral discount when they click it.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
          <Button
            type="button"
            fullWidth
            onClick={handleWhatsAppShare}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            leftIcon={<MessageCircle className="w-4 h-4" />}
          >
            Share on WhatsApp
          </Button>

          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={handleCopyMessage}
            leftIcon={copiedMessage ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          >
            {copiedMessage ? 'Invitation Text Copied!' : 'Copy Invitation Message'}
          </Button>
        </div>

        {/* How it Works (3 Steps) */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            How the 5% Discount Works
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-start gap-2.5">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">
                1
              </span>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Share Your Link</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Send your referral code or link to another store owner or trader.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">
                2
              </span>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">They Register & Subscribe</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  They open their MarketMate shop and activate their subscription.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">
                3
              </span>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Unlock 5% Off</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  As soon as they subscribe, your 5% discount is unlocked for the Oct 12–30 launch!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Referrals History List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span>Your Referred Businesses</span>
            </span>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                {totalSubscribed} subscribed
              </span>
              {pendingCount > 0 && (
                <span className="text-amber-600 dark:text-amber-400">
                  • {pendingCount} awaiting subscription
                </span>
              )}
            </div>
          </div>

          {loading ? (
            <div className="p-4 text-center text-xs text-slate-400 animate-pulse">
              Checking your referral records...
            </div>
          ) : referrals.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-1">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                No businesses registered with your link yet
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Tap "Share on WhatsApp" above to invite your first merchant friend!
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {referrals.map((ref) => {
                const isSubscribed = ref.referredSubscribed || ref.status === 'qualified';
                return (
                  <div
                    key={ref.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl border text-xs transition-colors ${
                      isSubscribed
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {isSubscribed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      )}
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">
                          {ref.referredBusinessName || 'New Store Partner'}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          Registered: {new Date(ref.createdAt).toLocaleDateString()}
                          {ref.subscribedAt && ` • Subscribed: ${new Date(ref.subscribedAt).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>

                    <div className="self-end sm:self-auto">
                      {isSubscribed ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          <Check className="w-3 h-3" />
                          <span>Subscribed • 5% Discount Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800" title="Will unlock 5% discount once this merchant activates their MarketMate subscription">
                          <Clock className="w-3 h-3" />
                          <span>Registered • Awaiting Subscription</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
