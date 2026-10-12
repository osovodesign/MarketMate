import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  LifeBuoy,
  X,
  Sparkles,
  HelpCircle,
  Headphones,
  ShieldCheck,
  ChevronRight,
  MessageCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { SUPPORT_CONFIG, getWhatsAppSupportUrl } from '../../lib/adminConfig';
import { SocialMediaLinks } from './SocialMediaLinks';
import { createSupportTicket, fetchUserSupportTickets } from '../../lib/supportService';
import { SupportTicket, SupportTicketCategory, SupportTicketPriority } from '../../types';

interface HelpSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessName?: string;
}

export const HelpSupportModal: React.FC<HelpSupportModalProps> = ({
  isOpen,
  onClose,
  businessName = 'My Business',
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'ticket' | 'history' | 'channels'>('whatsapp');

  // Ticket Form State
  const [category, setCategory] = useState<SupportTicketCategory>('general');
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [whatsappPhone, setWhatsappPhone] = useState<string>('');
  const [priority, setPriority] = useState<SupportTicketPriority>('normal');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccessTicket, setSubmitSuccessTicket] = useState<SupportTicket | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // User inquiries history
  const [myTickets, setMyTickets] = useState<SupportTicket[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  // Custom question for WhatsApp prefill
  const [waCustomTopic, setWaCustomTopic] = useState<string>('');

  useEffect(() => {
    if (isOpen && user?.id) {
      loadHistory();
    }
  }, [isOpen, user?.id]);

  const loadHistory = async () => {
    if (!user?.id) return;
    setIsLoadingHistory(true);
    try {
      const tickets = await fetchUserSupportTickets(user.id);
      setMyTickets(tickets);
    } catch (err) {
      console.warn('Failed loading tickets history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSendTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setErrorMessage('Please provide both a subject and details of your request.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const ticket = await createSupportTicket({
        userId: user?.id || `user_${Date.now()}`,
        userEmail: user?.email || 'merchant@marketmate.app',
        userName: user?.fullName || 'Business Owner',
        businessName: businessName,
        whatsappPhone: whatsappPhone.trim() || undefined,
        category,
        subject: subject.trim(),
        message: message.trim(),
        priority,
      });

      setSubmitSuccessTicket(ticket);
      setSubject('');
      setMessage('');
      setWhatsappPhone('');
      await loadHistory();
    } catch (err: any) {
      console.error('Ticket submission failed:', err);
      setErrorMessage('Could not submit inquiry. Please retry or contact us directly on WhatsApp.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                  MarketMate Admin & Support Hub
                </h2>
                <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Admin Active
                </span>
              </div>
              <p className="text-xs text-emerald-100/80 mt-0.5">
                Reach out to the MarketMate leadership team for assistance, upgrades, and questions
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 px-4 pt-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 overflow-x-auto shrink-0 text-xs">
          <button
            onClick={() => {
              setActiveTab('whatsapp');
              setSubmitSuccessTicket(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 font-bold rounded-t-lg transition-colors border-b-2 cursor-pointer shrink-0 ${
              activeTab === 'whatsapp'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>WhatsApp Admin Chat</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
              Fastest
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('ticket');
              setSubmitSuccessTicket(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 font-bold rounded-t-lg transition-colors border-b-2 cursor-pointer shrink-0 ${
              activeTab === 'ticket'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Send className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Send In-App Ticket</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('history');
              loadHistory();
            }}
            className={`flex items-center gap-1.5 px-3 py-2 font-bold rounded-t-lg transition-colors border-b-2 cursor-pointer shrink-0 ${
              activeTab === 'history'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>My Inquiries ({myTickets.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('channels');
              setSubmitSuccessTicket(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 font-bold rounded-t-lg transition-colors border-b-2 cursor-pointer shrink-0 ${
              activeTab === 'channels'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Phone className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Phone & Email</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* TAB 1: WHATSAPP CHAT (PREFERRED IN NIGERIA) */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Chat directly with the MarketMate Admin on WhatsApp
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                      Instant 1-on-1 assistance for setup, staff onboarding, feature explanations, or subscription verifications.
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                        <Phone className="w-3.5 h-3.5" />
                        {SUPPORT_CONFIG.whatsappDisplay}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {SUPPORT_CONFIG.responseTimeNotice}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Optional Quick Message topic */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  What would you like to discuss? (Optional)
                </label>
                <input
                  type="text"
                  value={waCustomTopic}
                  onChange={(e) => setWaCustomTopic(e.target.value)}
                  placeholder="e.g. Help configuring thermal receipts, subscription upgrade..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                <a
                  href={getWhatsAppSupportUrl({
                    businessName,
                    userEmail: user?.email,
                    subject: waCustomTopic.trim() || undefined,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Start WhatsApp Chat Now</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
                <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 mt-2">
                  Opens WhatsApp Web on desktop or the WhatsApp App on your phone.
                </p>
              </div>

              {/* Admin Guarantee Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Verified Official Admin</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
                    Direct communication with the official MarketMate technical and operations leadership.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-1">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Personalized Assistance</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
                    We can guide you through stock uploads, currency settings, or multi-user staff PINs.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: IN-APP TICKET FORM */}
          {activeTab === 'ticket' && (
            <div className="space-y-4">
              {submitSuccessTicket ? (
                <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white mx-auto flex items-center justify-center shadow-md">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-emerald-950 dark:text-emerald-200">
                    Inquiry Submitted Successfully!
                  </h3>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 max-w-md mx-auto leading-relaxed">
                    Your inquiry has been logged with reference{' '}
                    <strong className="font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700">
                      {submitSuccessTicket.id}
                    </strong>
                    . Our admin desk has been notified and will review it promptly.
                  </p>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                    <button
                      onClick={() => setActiveTab('history')}
                      className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      View in My Inquiries
                    </button>
                    <button
                      onClick={() => setSubmitSuccessTicket(null)}
                      className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                    >
                      Submit Another Ticket
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSendTicket} className="space-y-3.5">
                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Category */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Category
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as SupportTicketCategory)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="general">General Question</option>
                        <option value="payment_subscription">Subscription / Payment Approval</option>
                        <option value="pos_sales">POS Register & Scanning</option>
                        <option value="inventory_catalog">Inventory & Catalog Setup</option>
                        <option value="bug_report">Report an Issue or Bug</option>
                        <option value="feature_request">Request a New Feature</option>
                        <option value="account_security">Account & Staff Security</option>
                      </select>
                    </div>

                    {/* Callback WhatsApp Phone */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        WhatsApp Number for Callback (Optional)
                      </label>
                      <input
                        type="tel"
                        value={whatsappPhone}
                        onChange={(e) => setWhatsappPhone(e.target.value)}
                        placeholder="e.g. 08012345678"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Subject / Summary *
                    </label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Question about my annual pioneer discount, receipt printer setup..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Detailed Description *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Please describe what you need help with or any errors you are experiencing..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                    />
                  </div>

                  {/* Priority */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Priority:
                      </span>
                      <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="priority"
                          value="normal"
                          checked={priority === 'normal'}
                          onChange={() => setPriority('normal')}
                          className="accent-emerald-600"
                        />
                        <span>Normal</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-rose-700 dark:text-rose-400 font-semibold cursor-pointer">
                        <input
                          type="radio"
                          name="priority"
                          value="urgent"
                          checked={priority === 'urgent'}
                          onChange={() => setPriority('urgent')}
                          className="accent-rose-600"
                        />
                        <span>Urgent / Critical</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmitting ? 'Submitting...' : 'Submit to Admin Desk'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: USER TICKETS HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {isLoadingHistory ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  Loading your inquiries...
                </div>
              ) : myTickets.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    No inquiries submitted yet
                  </h4>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    Any messages or tickets you submit to the admin team will appear here along with admin replies.
                  </p>
                  <button
                    onClick={() => setActiveTab('ticket')}
                    className="mt-2 text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
                  >
                    + Submit your first inquiry
                  </button>
                </div>
              ) : (
                myTickets.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-2.5 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded font-bold">
                            {t.id}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              t.status === 'resolved'
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                : t.status === 'in_progress'
                                ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                                : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                            }`}
                          >
                            {t.status === 'resolved'
                              ? '✓ Resolved'
                              : t.status === 'in_progress'
                              ? 'In Progress'
                              : 'Open / Pending'}
                          </span>
                          {t.priority === 'urgent' && (
                            <span className="text-[9px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 px-1.5 py-0.2 rounded">
                              URGENT
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                          {t.subject}
                        </h4>
                      </div>

                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(t.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                      {t.message}
                    </p>

                    {/* Admin Reply if present */}
                    {t.adminReply && (
                      <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            Admin Reply from {t.repliedBy || 'MarketMate Support'}
                          </span>
                          {t.repliedAt && (
                            <span className="font-normal opacity-80">
                              {new Date(t.repliedAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-emerald-950 dark:text-emerald-200 whitespace-pre-line">
                          {t.adminReply}
                        </p>
                      </div>
                    )}

                    {/* Direct WhatsApp Follow-up button */}
                    <div className="pt-1 flex justify-end">
                      <a
                        href={getWhatsAppSupportUrl({
                          businessName,
                          userEmail: user?.email,
                          ticketId: t.id,
                          subject: t.subject,
                        })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Follow up on WhatsApp with Ticket #{t.id}</span>
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: DIRECT CHANNELS & PHONE */}
          {activeTab === 'channels' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* WhatsApp */}
                <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Official WhatsApp Hotline
                    </h4>
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                      {SUPPORT_CONFIG.whatsappDisplay}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      International: {SUPPORT_CONFIG.whatsappInternational}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <a
                      href={getWhatsAppSupportUrl({ businessName, userEmail: user?.email })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                    >
                      <span>Chat with Admin</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <a
                      href={SUPPORT_CONFIG.whatsappCommunityLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                    >
                      <span>Join Group</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Direct Phone Call */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Direct Phone Support
                    </h4>
                    <p className="text-xs font-bold text-blue-700 dark:text-blue-400 mt-0.5">
                      {SUPPORT_CONFIG.phoneDisplay}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Available during operating business hours.
                    </p>
                  </div>
                  <a
                    href={SUPPORT_CONFIG.callPhoneLink}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline"
                  >
                    <span>Call Admin Now</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Official Support Email */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Official Company Email
                    </h4>
                    <p className="text-xs font-bold text-purple-700 dark:text-purple-400 mt-0.5">
                      {SUPPORT_CONFIG.email}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      For formal requests, partnerships, and invoicing.
                    </p>
                  </div>
                  <a
                    href={`mailto:${SUPPORT_CONFIG.email}?subject=MarketMate Merchant Inquiry - ${encodeURIComponent(businessName)}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 hover:underline"
                  >
                    <span>Send Email</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Founder / Super Admin Direct Email */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-700 text-white flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Executive Founder Desk
                    </h4>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                      {SUPPORT_CONFIG.adminDirectEmail}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Direct escalation to leadership.
                    </p>
                  </div>
                  <a
                    href={`mailto:${SUPPORT_CONFIG.adminDirectEmail}?subject=Direct Admin Escalation - ${encodeURIComponent(businessName)}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300 hover:underline"
                  >
                    <span>Write Founder</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Official Social Media Channels */}
              <div className="pt-2">
                <SocialMediaLinks variant="cards" showTitle={true} />
              </div>

              {/* Working Hours Banner */}
              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs flex items-center gap-3">
                <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold">Operating Support Hours (WAT)</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {SUPPORT_CONFIG.hoursDisplay}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-500 text-[11px]">
            MarketMate™ Merchant Care & Customer Success
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
