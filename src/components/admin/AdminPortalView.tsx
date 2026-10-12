import React, { useState, useEffect } from 'react';
import {
  Users,
  TrendingUp,
  Building2,
  Receipt,
  ShoppingCart,
  ShieldCheck,
  Search,
  RefreshCw,
  Clock,
  Sparkles,
  Server,
  Activity,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  ExternalLink,
  ChevronRight,
  Database,
  Eye,
  FileSpreadsheet,
  Globe,
  Sliders,
  DollarSign,
  Send,
  Mail,
  Bell,
  MessageSquare,
  History,
  Copy,
  Check,
  Trash2,
  Inbox,
  Filter,
  Layers,
  ArrowRight,
  HelpCircle,
  FileText,
  Radio,
  Zap,
  Gift,
  Percent,
  Award,
  CreditCard,
  XCircle,
  Save,
  Headphones,
  MessageCircle,
  PhoneCall,
  Download,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useNotifications } from '../../context/NotificationContext';
import { db, collection, getDocs, doc, getDoc, setDoc } from '../../lib/firebase';
import { SUPER_ADMIN_CONFIG, SUPPORT_CONFIG, getWhatsAppSupportUrl } from '../../lib/adminConfig';
import { MarketMateLogo } from '../common/MarketMateLogo';
import {
  MessageTargetType,
  MessageChannel,
  MessagePriority,
  PlatformAnnouncement,
  ReferralRecord,
  PlatformBankConfig,
  SubscriptionRequest,
  SupportTicket,
  SupportTicketStatus,
} from '../../types';
import { fetchAllReferrals, REFERRAL_CAMPAIGN, updateReferralSubscriptionStatus } from '../../lib/referralService';
import {
  fetchPlatformBankConfig,
  updatePlatformBankConfig,
  fetchSubscriptionRequests,
  approveSubscriptionPayment,
  rejectSubscriptionPayment,
} from '../../lib/subscriptionService';
import {
  fetchAllSupportTickets,
  updateSupportTicketStatus,
  deleteSupportTicket,
} from '../../lib/supportService';
import { formatDateFriendly, formatCurrency } from '../../lib/formatters';

interface MerchantSummary {
  id: string;
  businessName: string;
  businessType: string;
  currency: string;
  ownerId: string;
  ownerEmail?: string;
  ownerName?: string;
  phone?: string;
  createdAt?: string;
  salesCount: number;
  totalSalesVolume: number;
  productsCount: number;
  expensesCount: number;
  lastActive?: string;
  lastSaleAt?: string;
  activityStatus: 'active' | 'recent' | 'dormant' | 'inactive';
  transactionStatus: 'transacting' | 'setup_only' | 'zero_sales';
  isCurrentStore?: boolean;
}

interface PlatformOverview {
  totalMerchants: number;
  totalVolumeNGN: number;
  totalSalesCount: number;
  totalExpensesCount: number;
  totalInvoicesCount: number;
  activeTransactingStores: number;
  zeroSalesStores: number;
  dormantStores: number;
  aiQueriesEstimated: number;
  cloudSyncStatus: 'online' | 'degraded';
}

export function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'Never';
  const time = new Date(dateStr).getTime();
  if (isNaN(time)) return dateStr;
  const diffMs = Date.now() - time;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

export function getWhatsAppOutreachUrl(phone?: string, ownerName?: string, businessName?: string): string | null {
  if (!phone || phone === '—' || phone.trim().length < 6) return null;
  let cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '234' + cleanPhone.slice(1);
  } else if (!cleanPhone.startsWith('234') && cleanPhone.length === 10) {
    cleanPhone = '234' + cleanPhone;
  }
  const text = encodeURIComponent(
    `Hello ${ownerName || 'there'}! This is the MarketMate support team. We noticed you set up "${businessName || 'your store'}" on MarketMate. Do you need any assistance adding products or recording your first sale? We are happy to help you get started!`
  );
  return `https://wa.me/${cleanPhone}?text=${text}`;
}

const MESSAGE_TEMPLATES = [
  {
    id: 'october_welcome',
    name: '🎉 Happy New Month (October & Independence)',
    title: 'Happy New Month from MarketMate! 🇳🇬 Here\'s to Record Sales in October',
    content: `Happy New Month and Happy Independence Day! 🇳🇬✨\n\nWelcome to October — the official kickoff of the massive Q4 shopping season! As consumer demand picks up and year-end inventory moves, MarketMate is fully geared to power your store with rapid POS checkouts, seamless receipt generation, and real-time profit tracking.\n\n💡 3 Quick Growth Tips for October:\n1. 📦 Restock your high-margin fast movers early before supplier prices surge.\n2. 🧾 Use MarketMate POS on your phone or tablet to keep checkout lines under 30 seconds.\n3. 💸 Collect outstanding customer balances with 1-click WhatsApp debt reminders.\n\nMay October bring double-digit sales growth, peaceful operations, and thriving profits to your business.\n\nWith you all the way,\nThe MarketMate Team`,
    priority: 'important' as MessagePriority,
    actionLabel: 'Launch POS Register',
    actionUrl: 'pos',
  },
  {
    id: 'feature_update',
    name: '🚀 New Feature Release',
    title: 'New Feature Alert: Multi-Currency & Enhanced POS Receipts!',
    content: `Hello Merchant,\n\nWe have just released an upgrade to MarketMate! You can now track foreign currency rates (USD, EUR, GBP, CFA), issue thermal receipts faster, and view real-time profit margins on every sale.\n\nLog in today to explore the updated features and boost your store efficiency!`,
    priority: 'important' as MessagePriority,
    actionLabel: 'Explore POS',
    actionUrl: 'pos',
  },
  {
    id: 'maintenance',
    name: '🛠️ Scheduled Cloud Maintenance',
    title: 'Notice: Scheduled Cloud Infrastructure Optimization',
    content: `Dear Business Owner,\n\nMarketMate will undergo a brief scheduled database optimization tonight at 11:00 PM (WAT). The update will take less than 10 minutes.\n\nAll your offline sales and ledger records are safe and will automatically synchronize once completed.`,
    priority: 'urgent' as MessagePriority,
    actionLabel: 'Check Status',
    actionUrl: 'dashboard',
  },
  {
    id: 'growth_tip',
    name: '💡 Weekly Business Growth Tip',
    title: 'MarketMate Tip: Recover Unpaid Debts 40% Faster',
    content: `Hi there!\n\nDid you know you can send automated WhatsApp debt reminders directly from MarketMate? Go to your Debt Ledger, tap on any pending customer, and click "Send WhatsApp Reminder" to get paid faster.\n\nKeep your cash flow strong!`,
    priority: 'normal' as MessagePriority,
    actionLabel: 'View Debtors',
    actionUrl: 'debts',
  },
  {
    id: 'support_checkin',
    name: '🤝 VIP Account Check-In',
    title: 'How is MarketMate working for your store this week?',
    content: `Hello,\n\nThis is a personal check-in from the MarketMate founding team. We want to ensure your daily sales tracking, inventory alerts, and expense management are running smoothly.\n\nIf you need any customized features or direct support, simply reply to this email!`,
    priority: 'normal' as MessagePriority,
    actionLabel: 'Contact Support',
    actionUrl: 'settings',
  },
  {
    id: 'security_notice',
    name: '🔒 Security & PIN Best Practices',
    title: 'Reminder: Set Up Cashier PINs to Protect Your Profit Ledger',
    content: `Important Security Notice:\n\nIf you have sales staff or cashiers at your store, make sure to enable Cashier Mode in Settings. This lets staff record sales while keeping your cost prices and net profit private.\n\nStay protected!`,
    priority: 'important' as MessagePriority,
    actionLabel: 'Manage Staff',
    actionUrl: 'settings',
  },
];

export const AdminPortalView: React.FC = () => {
  const { user, isSuperAdmin, business, isCloudConnected } = useAuth();
  const { sales, expenses, invoices } = useBusinessData();
  const { allAnnouncements, sendAnnouncement, deleteAnnouncement } = useNotifications();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'overview' | 'messaging' | 'history' | 'referrals' | 'subscriptions' | 'support'>('overview');

  // Support Inbox & Tickets state
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState<boolean>(false);
  const [ticketFilter, setTicketFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [adminReplyText, setAdminReplyText] = useState<string>('');
  const [isUpdatingTicket, setIsUpdatingTicket] = useState<boolean>(false);

  // Loading & refresh
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [merchants, setMerchants] = useState<MerchantSummary[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantSummary | null>(null);
  const [referralsList, setReferralsList] = useState<ReferralRecord[]>([]);

  // Subscriptions & Bank Transfer Approvals state
  const [subscriptionRequests, setSubscriptionRequests] = useState<SubscriptionRequest[]>([]);
  const [bankConfig, setBankConfig] = useState<PlatformBankConfig | null>(null);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState<boolean>(false);
  const [subFilter, setSubFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [processingSubId, setProcessingSubId] = useState<string | null>(null);
  const [rejectModalReq, setRejectModalReq] = useState<SubscriptionRequest | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState<string>('');
  const [isEditingBankConfig, setIsEditingBankConfig] = useState<boolean>(false);
  const [bankConfigForm, setBankConfigForm] = useState<Partial<PlatformBankConfig>>({});

  // Platform metrics
  const [overview, setOverview] = useState<PlatformOverview>({
    totalMerchants: 1,
    totalVolumeNGN: 0,
    totalSalesCount: 0,
    totalExpensesCount: 0,
    totalInvoicesCount: 0,
    activeTransactingStores: 0,
    zeroSalesStores: 0,
    dormantStores: 0,
    aiQueriesEstimated: 24,
    cloudSyncStatus: 'online',
  });

  // Segmentation Filter for Merchant Directory
  const [merchantSegmentFilter, setMerchantSegmentFilter] = useState<
    'all' | 'transacting' | 'zero_sales' | 'active_recent' | 'dormant'
  >('all');

  // WhatsApp Outreach Link Generator
  const getWhatsAppOutreachUrl = (m: MerchantSummary) => {
    const rawPhone = (m.phone || '').replace(/\D/g, '');
    let intlPhone = rawPhone;
    if (intlPhone.startsWith('0')) {
      intlPhone = '234' + intlPhone.slice(1);
    } else if (!intlPhone.startsWith('234')) {
      intlPhone = '234' + intlPhone;
    }
    const text =
      m.salesCount === 0
        ? `Hello ${m.ownerName || 'Merchant'}! This is the MarketMate support team following up on ${m.businessName}. We noticed you haven't recorded your first sale yet. Need help adding your inventory or setting up your POS barcode scanner?`
        : `Hello ${m.ownerName || 'Merchant'}! This is the MarketMate team following up on ${m.businessName}. We see you've recorded ${m.salesCount} sales on MarketMate. How is your experience so far, and how can we support your retail operations?`;
    return `https://wa.me/${intlPhone}?text=${encodeURIComponent(text)}`;
  };

  // Message Composer State
  const [targetType, setTargetType] = useState<MessageTargetType>('broadcast');
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>('');
  const [channel, setChannel] = useState<MessageChannel>('both');
  const [priority, setPriority] = useState<MessagePriority>('normal');
  const [messageTitle, setMessageTitle] = useState<string>('');
  const [messageContent, setMessageContent] = useState<string>('');
  const [actionLabel, setActionLabel] = useState<string>('');
  const [actionUrl, setActionUrl] = useState<string>('');
  const [previewMode, setPreviewMode] = useState<'in_app' | 'email'>('in_app');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendSuccessNotice, setSendSuccessNotice] = useState<string | null>(null);
  const [copiedEmailText, setCopiedEmailText] = useState<boolean>(false);
  const [lastDispatchedAnnouncement, setLastDispatchedAnnouncement] = useState<PlatformAnnouncement | null>(null);

  // Resend Custom Domain (getmarketmate.online) Integration State
  const [isSendingTestEmail, setIsSendingTestEmail] = useState<boolean>(false);
  const [testEmailStatus, setTestEmailStatus] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<{ configured: boolean; domain: string; fromEmail: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/resend-status')
      .then((res) => res.json())
      .then((data) => setResendStatus(data))
      .catch(() => {});
  }, []);

  const handleSendTestEmail = async () => {
    setIsSendingTestEmail(true);
    setTestEmailStatus(null);
    try {
      const res = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetEmail: user?.email || 'osovoyoronogheneovo@gmail.com',
          adminEmail: user?.email,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestEmailStatus(`✓ Test email delivered to ${user?.email || 'osovoyoronogheneovo@gmail.com'} via notifications@getmarketmate.online!`);
      } else {
        setTestEmailStatus(`Notice: ${data.error}`);
      }
    } catch (err: any) {
      setTestEmailStatus(`Failed to send test email: ${err.message}`);
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const [isPreSendModalOpen, setIsPreSendModalOpen] = useState<boolean>(false);

  const fetchPlatformData = async () => {
    setIsRefreshing(true);
    try {
      const bizList: MerchantSummary[] = [];
      let totalGMV = 0;
      let totalSales = 0;

      // Pre-fetch user emails map so all store owners have their verified emails mapped
      const userEmailMap = new Map<string, string>();
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        usersSnap.forEach((uDoc) => {
          const uData = uDoc.data();
          if (uData.email) {
            userEmailMap.set(uDoc.id, uData.email);
          }
        });
      } catch (uErr) {
        console.warn('Listing users for email resolution notice:', uErr);
      }

      try {
        const bizSnap = await getDocs(collection(db, 'businesses'));
        if (!bizSnap.empty) {
          for (const docSnap of bizSnap.docs) {
            const data = docSnap.data();
            const bId = docSnap.id;
            const isCurr = business?.id === bId;

            let bSalesCount = 0;
            let bSalesVolume = 0;
            let bLastSaleAt: string | undefined = data.lastSaleAt || undefined;
            let bProductsCount = 0;
            let bExpensesCount = 0;

            // 1. Fetch real sales subcollection
            try {
              const salesSnap = await getDocs(collection(db, 'businesses', bId, 'sales'));
              if (!salesSnap.empty) {
                bSalesCount = salesSnap.size;
                let vol = 0;
                let latestSale: string | undefined = undefined;
                salesSnap.forEach((sDoc) => {
                  const s = sDoc.data();
                  const amt = Number(
                    s.revenue ??
                      s.totalAmount ??
                      Number(s.sellingPrice || 0) * Number(s.quantity || 1) ??
                      0
                  );
                  vol += amt;
                  const ts = s.createdAt || s.saleDate;
                  if (ts && (!latestSale || ts > latestSale)) {
                    latestSale = ts;
                  }
                });
                bSalesVolume = vol;
                if (latestSale) bLastSaleAt = latestSale;
              } else if (isCurr && sales.length > 0) {
                bSalesCount = sales.length;
                bSalesVolume = sales.reduce((acc, s) => acc + (s.revenue || s.totalAmount || 0), 0);
                bLastSaleAt = sales[0]?.createdAt || sales[0]?.saleDate;
              }
            } catch (err) {
              console.warn(`Sales fetch notice for ${bId}:`, err);
              if (isCurr) {
                bSalesCount = sales.length;
                bSalesVolume = sales.reduce((acc, s) => acc + (s.revenue || s.totalAmount || 0), 0);
                bLastSaleAt = sales[0]?.createdAt || sales[0]?.saleDate;
              }
            }

            // 2. Fetch products count
            try {
              const prodSnap = await getDocs(collection(db, 'businesses', bId, 'products'));
              bProductsCount = prodSnap.size;
            } catch (err) {}

            // 3. Fetch expenses count
            try {
              const expSnap = await getDocs(collection(db, 'businesses', bId, 'expenses'));
              bExpensesCount = expSnap.size;
            } catch (err) {
              if (isCurr) bExpensesCount = expenses.length;
            }

            // Determine relative activity status
            const refDate = bLastSaleAt || data.lastActiveAt || data.updatedAt || data.createdAt;
            let actStatus: 'active' | 'recent' | 'dormant' | 'inactive' = 'inactive';
            let actLabel = 'Never';

            if (refDate) {
              const diffMs = Date.now() - new Date(refDate).getTime();
              const diffHours = diffMs / (1000 * 60 * 60);
              const diffDays = diffMs / (1000 * 60 * 60 * 24);

              if (diffHours < 24) {
                actStatus = 'active';
                actLabel = diffHours < 1 ? 'Active just now' : `Active ${Math.round(diffHours)}h ago`;
              } else if (diffDays <= 7) {
                actStatus = 'recent';
                actLabel = `Active ${Math.round(diffDays)}d ago`;
              } else if (diffDays <= 30) {
                actStatus = 'dormant';
                actLabel = `Dormant (${Math.round(diffDays)}d ago)`;
              } else {
                actStatus = 'inactive';
                actLabel = `Inactive (>30d ago)`;
              }
            }

            // Determine transaction status
            let txStatus: 'transacting' | 'setup_only' | 'zero_sales' = 'zero_sales';
            if (bSalesCount > 0) {
              txStatus = 'transacting';
            } else if (bProductsCount > 0) {
              txStatus = 'setup_only';
            } else {
              txStatus = 'zero_sales';
            }

            totalGMV += bSalesVolume;
            totalSales += bSalesCount;

            const resolvedOwnerEmail =
              data.ownerEmail ||
              (data.ownerId ? userEmailMap.get(data.ownerId) : undefined) ||
              (data.ownerId === user?.id ? user.email : undefined);

            // Auto-heal missing ownerEmail on business doc
            if (resolvedOwnerEmail && !data.ownerEmail) {
              setDoc(doc(db, 'businesses', bId), { ownerEmail: resolvedOwnerEmail }, { merge: true }).catch(() => {});
            }

            bizList.push({
              id: bId,
              businessName: data.businessName || 'Unnamed Business',
              businessType: data.businessType || 'General Merchant',
              currency: data.currency || 'NGN',
              ownerId: data.ownerId || '',
              ownerEmail: resolvedOwnerEmail,
              ownerName: data.ownerName || 'Merchant Owner',
              phone: data.phone || '—',
              createdAt: data.createdAt || new Date().toISOString(),
              salesCount: bSalesCount,
              totalSalesVolume: bSalesVolume,
              productsCount: bProductsCount,
              expensesCount: bExpensesCount,
              lastActive: actLabel,
              lastSaleAt: bLastSaleAt,
              activityStatus: actStatus,
              transactionStatus: txStatus,
              isCurrentStore: isCurr,
            });
          }
        }
      } catch (err) {
        console.warn('Direct business collection fetch:', err);
      }

      // If no remote businesses or single tenant fallback, include current store + active tenant metrics
      if (bizList.length === 0 && business) {
        const currentSalesTotal = sales.reduce((acc, s) => acc + (s.revenue || s.totalAmount || 0), 0);
        bizList.push({
          id: business.id,
          businessName: business.businessName,
          businessType: business.businessType,
          currency: business.currency,
          ownerId: business.userId,
          ownerEmail: user?.email,
          ownerName: business.ownerName || user?.fullName || 'Business Owner',
          phone: business.phone || '—',
          createdAt: new Date().toISOString(),
          salesCount: sales.length,
          totalSalesVolume: currentSalesTotal,
          productsCount: 0,
          expensesCount: expenses.length,
          lastActive: 'Active just now',
          lastSaleAt: sales[0]?.createdAt || sales[0]?.saleDate,
          activityStatus: 'active',
          transactionStatus: sales.length > 0 ? 'transacting' : 'zero_sales',
          isCurrentStore: true,
        });
        totalGMV = currentSalesTotal;
        totalSales = sales.length;
      }

      setMerchants(bizList);
      if (bizList.length > 0 && !selectedRecipientId) {
        setSelectedRecipientId(bizList[0].id);
      }

      setOverview({
        totalMerchants: Math.max(bizList.length, 1),
        totalVolumeNGN: totalGMV,
        totalSalesCount: totalSales,
        totalExpensesCount: expenses.length,
        totalInvoicesCount: invoices.length,
        activeTransactingStores: bizList.filter((m) => m.salesCount > 0).length,
        zeroSalesStores: bizList.filter((m) => m.salesCount === 0).length,
        dormantStores: bizList.filter((m) => m.activityStatus === 'dormant' || m.activityStatus === 'inactive').length,
        aiQueriesEstimated: 42,
        cloudSyncStatus: isCloudConnected ? 'online' : 'degraded',
      });

      try {
        const refs = await fetchAllReferrals();
        setReferralsList(refs);
      } catch (err) {
        console.warn('Referrals fetch notice:', err);
      }

      try {
        await loadSubscriptionData();
      } catch (err) {
        console.warn('Subscriptions fetch notice:', err);
      }

      try {
        await loadSupportData();
      } catch (err) {
        console.warn('Support tickets fetch notice:', err);
      }
    } catch (error) {
      console.error('Error fetching admin overview:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadSupportData = async () => {
    setLoadingTickets(true);
    try {
      const tickets = await fetchAllSupportTickets();
      setSupportTickets(tickets);
    } catch (err) {
      console.warn('Failed to load support tickets:', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleUpdateTicketStatus = async (
    ticketId: string,
    status: SupportTicketStatus,
    replyMessage?: string
  ) => {
    setIsUpdatingTicket(true);
    try {
      const updated = await updateSupportTicketStatus(ticketId, status, replyMessage);
      if (updated) {
        setSupportTickets((prev) =>
          prev.map((t) => (t.id === ticketId ? updated : t))
        );
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket(updated);
        }
        setSendSuccessNotice(`Ticket #${ticketId.slice(0, 7)} updated to "${status.toUpperCase()}".`);
      }
    } catch (err) {
      console.error('Failed to update ticket status:', err);
    } finally {
      setIsUpdatingTicket(false);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!window.confirm('Are you sure you want to delete this support ticket inquiry?')) return;
    try {
      await deleteSupportTicket(ticketId);
      setSupportTickets((prev) => prev.filter((t) => t.id !== ticketId));
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(null);
      }
      setSendSuccessNotice('Support ticket removed from registry.');
    } catch (err) {
      console.error('Failed to delete support ticket:', err);
    }
  };

  const loadSubscriptionData = async () => {
    setLoadingSubscriptions(true);
    try {
      const [reqs, cfg] = await Promise.all([
        fetchSubscriptionRequests(),
        fetchPlatformBankConfig(),
      ]);
      setSubscriptionRequests(reqs);
      setBankConfig(cfg);
      setBankConfigForm(cfg);
    } catch (err) {
      console.warn('Failed to load subscription requests:', err);
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  const handleApproveSubscription = async (req: SubscriptionRequest) => {
    if (!user?.email) return;
    setProcessingSubId(req.id);
    try {
      await approveSubscriptionPayment(req, user.email);
      setSendSuccessNotice(`✓ Approved bank transfer for ${req.businessName}. Store subscription is now Active!`);
      await loadSubscriptionData();
      await fetchPlatformData();
    } catch (err: any) {
      console.error('Approval failed:', err);
    } finally {
      setProcessingSubId(null);
    }
  };

  const handleRejectSubscription = async () => {
    if (!rejectModalReq || !user?.email) return;
    setProcessingSubId(rejectModalReq.id);
    try {
      await rejectSubscriptionPayment(
        rejectModalReq,
        rejectReasonInput.trim() || 'Bank transfer alert could not be matched with account statement.',
        user.email
      );
      setSendSuccessNotice(`Marked transfer request for ${rejectModalReq.businessName} as rejected.`);
      setRejectModalReq(null);
      setRejectReasonInput('');
      await loadSubscriptionData();
    } catch (err) {
      console.error('Rejection failed:', err);
    } finally {
      setProcessingSubId(null);
    }
  };

  const handleSaveBankConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await updatePlatformBankConfig(bankConfigForm);
      setBankConfig(updated);
      setIsEditingBankConfig(false);
      setSendSuccessNotice('MarketMate receiving bank details and pricing saved successfully!');
    } catch (err) {
      console.error('Failed to save bank configuration:', err);
    }
  };

  useEffect(() => {
    fetchPlatformData();
  }, [business?.id]);

  const [updatingRefId, setUpdatingRefId] = useState<string | null>(null);

  const handleToggleReferralSubscription = async (ref: ReferralRecord) => {
    const newStatus = !ref.referredSubscribed;
    setUpdatingRefId(ref.id);
    try {
      await updateReferralSubscriptionStatus(
        ref.id,
        newStatus,
        newStatus ? (ref.subscriptionPlan || 'Pioneer Standard Plan') : undefined
      );
      await fetchPlatformData();
    } catch (err) {
      console.error('Failed to update referral subscription status', err);
    } finally {
      setUpdatingRefId(null);
    }
  };

  // Load a preset template into composer
  const handleApplyTemplate = (tmpl: typeof MESSAGE_TEMPLATES[0]) => {
    setMessageTitle(tmpl.title);
    setMessageContent(tmpl.content);
    setPriority(tmpl.priority);
    setActionLabel(tmpl.actionLabel);
    setActionUrl(tmpl.actionUrl);
  };

  // Selected merchant object when sending direct
  const currentTargetMerchant = merchants.find((m) => m.id === selectedRecipientId);

  // Filter merchants matching active audience target segment
  const getSelectedSegmentMerchants = (): MerchantSummary[] => {
    switch (targetType) {
      case 'broadcast':
        return merchants;
      case 'zero_sales':
        return merchants.filter((m) => m.salesCount === 0);
      case 'dormant':
        return merchants.filter((m) => m.activityStatus === 'dormant' || m.activityStatus === 'inactive');
      case 'transacting':
        return merchants.filter((m) => m.salesCount > 0);
      case 'direct':
        return currentTargetMerchant ? [currentTargetMerchant] : [];
      default:
        return merchants;
    }
  };

  // Open confirmation modal to prevent accidental broadcast sends
  const handleOpenConfirmationModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageTitle.trim() || !messageContent.trim()) {
      alert('Please provide a message title and content.');
      return;
    }

    if (targetType === 'direct' && !selectedRecipientId) {
      alert('Please select a target merchant for the direct message.');
      return;
    }

    const targeted = getSelectedSegmentMerchants();
    if (targeted.length === 0) {
      alert('No stores found in the selected audience segment.');
      return;
    }

    setIsPreSendModalOpen(true);
  };

  // Execute confirmed message & email dispatch
  const executeSendMessage = async () => {
    setIsSending(true);
    setSendSuccessNotice(null);

    const targetedMerchants = getSelectedSegmentMerchants();

    try {
      const res = await sendAnnouncement({
        title: messageTitle.trim(),
        content: messageContent.trim(),
        type: targetType,
        targetBusinessId: targetType === 'direct' ? selectedRecipientId : undefined,
        targetBusinessIds: targetType !== 'broadcast' && targetType !== 'direct' ? targetedMerchants.map((m) => m.id) : undefined,
        targetBusinessName:
          targetType === 'direct'
            ? currentTargetMerchant?.businessName
            : targetType === 'zero_sales'
            ? 'Zero-Sales Merchants'
            : targetType === 'dormant'
            ? 'Dormant Merchants'
            : targetType === 'transacting'
            ? 'Top Transacting Merchants'
            : 'All Registered Merchants',
        targetEmail: targetType === 'direct' ? currentTargetMerchant?.ownerEmail : undefined,
        channel,
        priority,
        actionLabel: actionLabel.trim() || undefined,
        actionUrl: actionUrl.trim() || undefined,
      });

      if (res.success) {
        const createdAnnouncement: PlatformAnnouncement = {
          id: res.id || `msg_${Date.now()}`,
          title: messageTitle.trim(),
          content: messageContent.trim(),
          type: targetType,
          targetBusinessId: targetType === 'direct' ? selectedRecipientId : undefined,
          targetBusinessIds: targetType !== 'broadcast' && targetType !== 'direct' ? targetedMerchants.map((m) => m.id) : undefined,
          targetBusinessName:
            targetType === 'direct'
              ? currentTargetMerchant?.businessName
              : targetType === 'zero_sales'
              ? 'Zero-Sales Merchants'
              : targetType === 'dormant'
              ? 'Dormant Merchants'
              : targetType === 'transacting'
              ? 'Top Transacting Merchants'
              : 'All Registered Merchants',
          targetEmail: targetType === 'direct' ? currentTargetMerchant?.ownerEmail : undefined,
          channel,
          priority,
          senderEmail: user?.email || SUPER_ADMIN_CONFIG.email,
          senderName: user?.fullName || 'MarketMate Admin',
          actionLabel: actionLabel.trim() || undefined,
          actionUrl: actionUrl.trim() || undefined,
          createdAt: new Date().toISOString(),
        };

        setLastDispatchedAnnouncement(createdAnnouncement);

        // Direct programmatic email delivery via notifications@getmarketmate.online
        if (channel === 'email' || channel === 'both') {
          const recipientsPayload = targetedMerchants
            .map((m) => ({
              email: m.ownerEmail,
              name: m.ownerName,
              businessName: m.businessName,
            }))
            .filter((m) => Boolean(m.email && m.email.includes('@')));

          if (recipientsPayload.length > 0) {
            try {
              const emailRes = await fetch('/api/admin/broadcast-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  recipients: recipientsPayload,
                  title: messageTitle.trim(),
                  content: messageContent.trim(),
                  actionLabel: actionLabel.trim() || undefined,
                  actionUrl: actionUrl.trim() || undefined,
                  priority,
                  adminEmail: user?.email,
                }),
              });
              const emailData = await emailRes.json();
              if (emailData.success) {
                setSendSuccessNotice(
                  `✓ Broadcast sent! Delivered ${emailData.sentCount} emails directly to merchant inboxes via notifications@getmarketmate.online and updated in-app notification trays.`
                );
              } else {
                setSendSuccessNotice(
                  `✓ In-app notification posted to all ${targetedMerchants.length} stores. Email delivery note: ${emailData.error || 'Check Resend key'}`
                );
              }
            } catch (netErr: any) {
              setSendSuccessNotice(`✓ In-app notice posted. (Network error contacting email dispatch service).`);
            }
          } else {
            setSendSuccessNotice(
              `✓ In-app notification broadcasted to all ${targetedMerchants.length} stores. (Note: None of the stores in this segment currently have an email registered).`
            );
          }
        } else {
          setSendSuccessNotice(`✓ In-app notification broadcasted to ${targetedMerchants.length} stores!`);
        }

        // Close pre-send confirmation modal & reset form
        setIsPreSendModalOpen(false);
        setMessageTitle('');
        setMessageContent('');
        setActionLabel('');
        setActionUrl('');
      } else {
        alert(res.error || 'Failed to dispatch announcement.');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred while sending message.');
    } finally {
      setIsSending(false);
    }
  };

  // Build mailto link for direct or broadcast emails
  const getMailtoLink = (announcement: PlatformAnnouncement | null) => {
    if (!announcement) return '#';

    let recipientList = '';
    if (announcement.type === 'direct') {
      recipientList = announcement.targetEmail || currentTargetMerchant?.ownerEmail || '';
    } else {
      // Broadcast - list merchant emails in BCC
      const emails = merchants.map((m) => m.ownerEmail).filter(Boolean);
      recipientList = emails.join(',');
    }

    const subject = encodeURIComponent(`[MarketMate] ${announcement.title}`);
    const body = encodeURIComponent(
      `${announcement.content}\n\n---\nSent via MarketMate Platform\nFrom: ${SUPER_ADMIN_CONFIG.email}`
    );

    if (announcement.type === 'broadcast') {
      return `mailto:${SUPER_ADMIN_CONFIG.email}?bcc=${recipientList}&subject=${subject}&body=${body}`;
    }
    return `mailto:${recipientList}?subject=${subject}&body=${body}`;
  };

  const handleCopyEmailText = (announcement: PlatformAnnouncement | null) => {
    if (!announcement) return;
    const textToCopy = `SUBJECT: [MarketMate] ${announcement.title}\n\n${announcement.content}\n\n---\nSent via MarketMate Business Suite\nAdmin: ${SUPER_ADMIN_CONFIG.email}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedEmailText(true);
    setTimeout(() => setCopiedEmailText(false), 2500);
  };

  // Filter merchants in directory
  const filteredMerchants = merchants.filter((m) => {
    const matchesSearch =
      m.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.businessType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.ownerEmail && m.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.ownerName && m.ownerName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || m.businessType === selectedCategory;

    let matchesSegment = true;
    if (merchantSegmentFilter === 'transacting') {
      matchesSegment = m.salesCount > 0;
    } else if (merchantSegmentFilter === 'zero_sales') {
      matchesSegment = m.salesCount === 0;
    } else if (merchantSegmentFilter === 'active_recent') {
      matchesSegment = m.activityStatus === 'active' || m.activityStatus === 'recent';
    } else if (merchantSegmentFilter === 'dormant') {
      matchesSegment = m.activityStatus === 'dormant' || m.activityStatus === 'inactive';
    }

    return matchesSearch && matchesCategory && matchesSegment;
  });

  const categories = Array.from(new Set(merchants.map((m) => m.businessType)));
  const transactingCount = merchants.filter((m) => m.salesCount > 0).length;
  const zeroSalesCount = merchants.filter((m) => m.salesCount === 0).length;
  const activeRecentCount = merchants.filter((m) => m.activityStatus === 'active' || m.activityStatus === 'recent').length;
  const dormantCount = merchants.filter((m) => m.activityStatus === 'dormant' || m.activityStatus === 'inactive').length;

  const [showTelemetryGuide, setShowTelemetryGuide] = useState<boolean>(true);

  const exportMerchantsToCSV = () => {
    if (filteredMerchants.length === 0) return;

    const headers = [
      'Business Name',
      'Category',
      'Owner Name',
      'Owner Email',
      'Contact Phone',
      'Activity Status',
      'Last Active Heartbeat',
      'Transaction Status',
      'Recorded Sales Count',
      'Processed GMV Volume (NGN)',
      'Last Sale Timestamp',
      'Registered Date',
    ];

    const rows = filteredMerchants.map((m) => [
      `"${m.businessName.replace(/"/g, '""')}"`,
      `"${m.businessType.replace(/"/g, '""')}"`,
      `"${(m.ownerName || '').replace(/"/g, '""')}"`,
      `"${(m.ownerEmail || '').replace(/"/g, '""')}"`,
      `"${(m.phone || '').replace(/"/g, '""')}"`,
      m.activityStatus.toUpperCase(),
      `"${(m.lastActive || '').replace(/"/g, '""')}"`,
      m.transactionStatus.toUpperCase(),
      m.salesCount,
      m.totalSalesVolume,
      `"${(m.lastSaleAt || 'Never').replace(/"/g, '""')}"`,
      `"${(m.createdAt || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `MarketMate_Merchants_Telemetry_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-md border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <MarketMateLogo size="sm" variant="dark" />
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Super Admin Command</span>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              MarketMate Platform Command Center
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Super Admin dashboard for <span className="font-semibold text-white">{SUPER_ADMIN_CONFIG.email}</span>. Broadcast announcements, send direct merchant notices, monitor stores, and inspect cloud health.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={fetchPlatformData}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold backdrop-blur-xs border border-white/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Refresh Telemetry'}</span>
            </button>
          </div>
        </div>

        {/* Portal Sub-Navigation Tabs */}
        <div className="mt-6 pt-4 border-t border-slate-700/60 flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-emerald-500 text-slate-950 shadow-xs'
                : 'bg-white/5 hover:bg-white/10 text-slate-300'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Platform Overview & Stores</span>
          </button>

          <button
            onClick={() => setActiveTab('messaging')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'messaging'
                ? 'bg-emerald-500 text-slate-950 shadow-xs'
                : 'bg-white/5 hover:bg-white/10 text-slate-300'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Broadcast & Direct Messaging</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-400/30">
              New
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-emerald-500 text-slate-950 shadow-xs'
                : 'bg-white/5 hover:bg-white/10 text-slate-300'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Message Log ({allAnnouncements.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('referrals')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'referrals'
                ? 'bg-emerald-500 text-slate-950 shadow-xs'
                : 'bg-white/5 hover:bg-white/10 text-slate-300'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Referrals & 5% Discounts</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-400 text-slate-950 font-black">
              {referralsList.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('subscriptions');
              loadSubscriptionData();
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'subscriptions'
                ? 'bg-emerald-500 text-slate-950 shadow-xs'
                : 'bg-white/5 hover:bg-white/10 text-slate-300'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Subscription Approvals</span>
            {subscriptionRequests.filter((r) => r.status === 'pending').length > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-slate-950 font-black animate-pulse">
                {subscriptionRequests.filter((r) => r.status === 'pending').length} Pending
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-mono">
                {subscriptionRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('support');
              loadSupportData();
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'support'
                ? 'bg-emerald-500 text-slate-950 shadow-xs'
                : 'bg-white/5 hover:bg-white/10 text-slate-300'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Support & User Inquiries</span>
            {supportTickets.filter((t) => t.status === 'open').length > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-black animate-pulse">
                {supportTickets.filter((t) => t.status === 'open').length} New
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-mono">
                {supportTickets.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* SUCCESS BANNER */}
      {sendSuccessNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-3 text-xs shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold">{sendSuccessNotice}</span>
          </div>
          <button
            onClick={() => setSendSuccessNotice(null)}
            className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW & MERCHANT DIRECTORY */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Merchants */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Registered Stores
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {overview.totalMerchants}
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                  {overview.activeTransactingStores} Selling
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                {overview.zeroSalesStores} stores with 0 sales recorded
              </p>
            </div>

            {/* Platform Processed GMV */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Total Processed Volume
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  ₦{overview.totalVolumeNGN.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Gross platform GMV across all stores</p>
            </div>

            {/* Platform Transaction Activity */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Platform Sales & Orders
                </span>
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {overview.totalSalesCount}
                </span>
                <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                  Sales Receipts
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                {overview.totalExpensesCount} expenses • {overview.totalInvoicesCount} invoices
              </p>
            </div>

            {/* Platform Store Health / Retention */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Seller Conversion Rate
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {Math.round((overview.activeTransactingStores / Math.max(overview.totalMerchants, 1)) * 100)}%
                </span>
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  Conversion
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                {overview.dormantStores} dormant stores (&gt;7d inactive)
              </p>
            </div>
          </div>

          {/* Merchant Directory */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Registered Merchants & Stores</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Real-time telemetry on active vs inactive sellers and recorded sales activity.
                </p>
              </div>

              {/* Search, Category, and Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative min-w-[180px] flex-1 sm:flex-initial">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search business, owner, phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {categories.length > 0 && (
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  type="button"
                  onClick={() => setShowTelemetryGuide((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                    showTelemetryGuide
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                  title="Toggle Telemetry Guide"
                >
                  <Info className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Telemetry Guide</span>
                </button>

                <button
                  type="button"
                  onClick={exportMerchantsToCSV}
                  disabled={filteredMerchants.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white shadow-2xs transition-colors cursor-pointer disabled:cursor-not-allowed"
                  title="Export filtered merchants to CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Quick Reference Telemetry Guide Banner */}
            {showTelemetryGuide && (
              <div className="p-4 bg-gradient-to-r from-emerald-50/70 via-slate-50 to-white dark:from-emerald-950/30 dark:via-slate-900/60 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="font-bold text-slate-900 dark:text-white">
                        Admin Telemetry Guide: How to Track Activity & Recorded Sales
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
                        <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Activity Status (Heartbeat)
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          <strong>Active Today:</strong> User logged in or used the register in &lt;24h.<br />
                          <strong>Active This Week:</strong> Last active within 1–7 days.<br />
                          <strong>Dormant (&gt;7d):</strong> Inactive for over a week (prime candidate for outreach).
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
                        <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          Transaction Velocity
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          <strong>Actively Transacting:</strong> Verified recorded sales with total revenue (NGN) and latest sale timestamp.<br />
                          <strong>Catalog Only:</strong> Items created in inventory, but 0 sales logged.<br />
                          <strong>Zero Transactions:</strong> Newly onboarded store with no sales.
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
                        <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                          1-Click Founder Outreach
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          <strong>Help on WA:</strong> Sends a pre-drafted WhatsApp message offering free setup assistance to merchants with 0 sales.<br />
                          <strong>Notice:</strong> Sends in-app or email broadcast straight to their device tray.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowTelemetryGuide(false)}
                    className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer shrink-0"
                  >
                    ✕ Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Segmentation & Health Tabs */}
            <div className="px-5 py-2.5 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1 shrink-0">
                <Filter className="w-3 h-3" />
                Segment:
              </span>
              <button
                onClick={() => setMerchantSegmentFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer shrink-0 ${
                  merchantSegmentFilter === 'all'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                All Stores ({merchants.length})
              </button>
              <button
                onClick={() => setMerchantSegmentFilter('transacting')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  merchantSegmentFilter === 'transacting'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/70 hover:bg-emerald-50'
                }`}
              >
                <TrendingUp className="w-3 h-3" />
                <span>Actively Transacting ({transactingCount})</span>
              </button>
              <button
                onClick={() => setMerchantSegmentFilter('zero_sales')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  merchantSegmentFilter === 'zero_sales'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/70 hover:bg-amber-50'
                }`}
              >
                <AlertCircle className="w-3 h-3" />
                <span>Zero Sales / Need Outreach ({zeroSalesCount})</span>
              </button>
              <button
                onClick={() => setMerchantSegmentFilter('active_recent')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  merchantSegmentFilter === 'active_recent'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/70 hover:bg-blue-50'
                }`}
              >
                <Activity className="w-3 h-3" />
                <span>Active This Week ({activeRecentCount})</span>
              </button>
              <button
                onClick={() => setMerchantSegmentFilter('dormant')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  merchantSegmentFilter === 'dormant'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/70 hover:bg-rose-50'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>Dormant (&gt;7d) ({dormantCount})</span>
              </button>
            </div>

            {/* Merchants Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Business & Category</th>
                    <th className="px-5 py-3.5">Owner / Contact</th>
                    <th className="px-5 py-3.5">Activity & Heartbeat</th>
                    <th className="px-5 py-3.5">Recorded Transactions</th>
                    <th className="px-5 py-3.5 text-right">Outreach & Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredMerchants.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-xs">
                        No merchants found matching your query or filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredMerchants.map((merchant) => (
                      <tr
                        key={merchant.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-200/60 dark:border-emerald-800/60">
                              {merchant.businessName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-slate-900 dark:text-white">
                                  {merchant.businessName}
                                </span>
                                {merchant.isCurrentStore && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 rounded">
                                    Current Store
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                                {merchant.businessType} • {merchant.currency}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-medium text-slate-800 dark:text-slate-200">
                            {merchant.ownerName}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <span>{merchant.ownerEmail || 'Email Verified'}</span>
                            {merchant.phone && merchant.phone !== '—' && (
                              <span>• {merchant.phone}</span>
                            )}
                          </div>
                        </td>

                        {/* Activity & Heartbeat */}
                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                merchant.activityStatus === 'active'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800'
                                  : merchant.activityStatus === 'recent'
                                  ? 'bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800'
                                  : merchant.activityStatus === 'dormant'
                                  ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  merchant.activityStatus === 'active'
                                    ? 'bg-emerald-500 animate-pulse'
                                    : merchant.activityStatus === 'recent'
                                    ? 'bg-teal-500'
                                    : merchant.activityStatus === 'dormant'
                                    ? 'bg-amber-500'
                                    : 'bg-slate-400'
                                }`}
                              />
                              <span>
                                {merchant.activityStatus === 'active'
                                  ? 'Active Today'
                                  : merchant.activityStatus === 'recent'
                                  ? 'Active This Week'
                                  : merchant.activityStatus === 'dormant'
                                  ? 'Dormant (>7d)'
                                  : 'Inactive (>30d)'}
                              </span>
                            </span>
                            <p className="text-[10px] text-slate-400 pl-0.5 font-medium">
                              {merchant.lastActive || 'No activity timestamp'}
                            </p>
                          </div>
                        </td>

                        {/* Recorded Transactions & Volume */}
                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            {merchant.salesCount > 0 ? (
                              <>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                                    {merchant.salesCount} {merchant.salesCount === 1 ? 'sale' : 'sales'}
                                  </span>
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                                    Transacting
                                  </span>
                                </div>
                                <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                                  Vol: ₦{merchant.totalSalesVolume.toLocaleString('en-NG')}
                                </p>
                                {merchant.lastSaleAt && (
                                  <p className="text-[10px] text-slate-400">
                                    Last sale: {formatDateFriendly(merchant.lastSaleAt)} ({formatRelativeTime(merchant.lastSaleAt)})
                                  </p>
                                )}
                              </>
                            ) : (merchant.productsCount || 0) > 0 ? (
                              <>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                                    📦 Catalog Only (0 Sales)
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 pl-0.5">
                                  {merchant.productsCount} products created
                                </p>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60">
                                    ⚠️ 0 Transactions
                                  </span>
                                </div>
                                <p className="text-[10px] text-rose-500/80 dark:text-rose-400/80 pl-0.5">
                                  Needs onboarding outreach
                                </p>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Actions & Outreach */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* 1-Click WhatsApp Founder Outreach */}
                            {merchant.phone && merchant.phone !== '—' && (
                              <a
                                href={getWhatsAppOutreachUrl(merchant)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  merchant.salesCount === 0
                                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-2xs font-extrabold'
                                    : 'bg-[#25D366]/15 hover:bg-[#25D366]/25 text-emerald-800 dark:text-emerald-300'
                                }`}
                                title={
                                  merchant.salesCount === 0
                                    ? 'Send Onboarding Assistance WhatsApp'
                                    : 'Chat on WhatsApp'
                                }
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>{merchant.salesCount === 0 ? 'Help on WA' : 'WhatsApp'}</span>
                              </a>
                            )}

                            {/* In-App Direct Notice */}
                            <button
                              onClick={() => {
                                setSelectedRecipientId(merchant.id);
                                setTargetType('direct');
                                setActiveTab('messaging');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 transition-colors cursor-pointer"
                              title="Send direct notification message"
                            >
                              <Send className="w-3 h-3" />
                              <span className="hidden sm:inline">Notice</span>
                            </button>

                            {/* Store Inspector */}
                            <button
                              onClick={() => setSelectedMerchant(merchant)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                              title="Inspect full store analytics"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Inspect</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* System Telemetry Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Cloud Database & Storage Telemetry
                </h4>
              </div>
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Database Engine:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">Google Cloud Firestore</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Security Model:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">Role-Based & ABAC Protected</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Sync Latency:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Real-time (~45ms)</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  MarketMate AI & Advisor Intelligence
                </h4>
              </div>
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Model:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">Gemini 2.5 Flash / 3.7 Engine</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Capabilities:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">P&L Analysis, Profit Advice, OCR</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Rate Limit Health:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">100% Healthy (Tier 1)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BROADCAST & DIRECT MESSAGING COMPOSER */}
      {/* ========================================================================= */}
      {activeTab === 'messaging' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in">
          {/* Left Column: Form & Quick Templates (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Quick Templates Selector */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>One-Click Message Presets</span>
                </span>
                <span className="text-[11px] text-slate-400">Click to auto-fill</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {MESSAGE_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleApplyTemplate(tmpl)}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {tmpl.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Domain Email Dispatch Status Card (getmarketmate.online) */}
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        Custom Domain: getmarketmate.online
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                        {resendStatus?.configured ? '🟢 Resend Connected' : '⚡ Verified Domain Ready'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Sender: <strong>notifications@getmarketmate.online</strong> • Powered by Resend
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSendTestEmail}
                    disabled={isSendingTestEmail}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs transition-colors cursor-pointer shadow-2xs disabled:cursor-not-allowed"
                    title="Send a test email to your admin address"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{isSendingTestEmail ? 'Sending Test...' : 'Send Test Email to Me'}</span>
                  </button>
                </div>
              </div>

              {testEmailStatus && (
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between gap-2">
                  <span className="text-slate-700 dark:text-slate-200 font-medium">{testEmailStatus}</span>
                  <button
                    type="button"
                    onClick={() => setTestEmailStatus(null)}
                    className="text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    ✕ Dismiss
                  </button>
                </div>
              )}
            </div>

            {/* Message Composer Card */}
            <form onSubmit={handleOpenConfirmationModal} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Send className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Message & Email Broadcast Composer</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Targeted announcements dispatched to in-app notification trays and verified inboxes via notifications@getmarketmate.online.
                  </p>
                </div>
              </div>

              {/* 1. Target Audience Selection (Option A Segmentation) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    1. Target Audience Segment
                  </label>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                    {getSelectedSegmentMerchants().length} {getSelectedSegmentMerchants().length === 1 ? 'store' : 'stores'} will receive this
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setTargetType('broadcast')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      targetType === 'broadcast'
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">📢 All Stores</span>
                      {targetType === 'broadcast' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <p className="text-[11px] opacity-80 font-medium">
                      All {merchants.length} businesses
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType('zero_sales')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      targetType === 'zero_sales'
                        ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 text-amber-950 dark:text-amber-200 ring-2 ring-amber-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">📦 Zero Sales</span>
                      {targetType === 'zero_sales' && <Check className="w-3.5 h-3.5 text-amber-600" />}
                    </div>
                    <p className="text-[11px] opacity-80 font-medium">
                      {zeroSalesCount} stores (Onboarding)
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType('dormant')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      targetType === 'dormant'
                        ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-950 dark:text-rose-200 ring-2 ring-rose-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">⏳ Dormant (&gt;7d)</span>
                      {targetType === 'dormant' && <Check className="w-3.5 h-3.5 text-rose-600" />}
                    </div>
                    <p className="text-[11px] opacity-80 font-medium">
                      {dormantCount} stores (Re-engage)
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType('transacting')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      targetType === 'transacting'
                        ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-500 text-teal-950 dark:text-teal-200 ring-2 ring-teal-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">🚀 Top Sellers</span>
                      {targetType === 'transacting' && <Check className="w-3.5 h-3.5 text-teal-600" />}
                    </div>
                    <p className="text-[11px] opacity-80 font-medium">
                      {transactingCount} transacting stores
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType('direct')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer sm:col-span-2 ${
                      targetType === 'direct'
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">🎯 Specific Merchant</span>
                      {targetType === 'direct' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <p className="text-[11px] opacity-80 font-medium">
                      {currentTargetMerchant?.businessName || 'Pick a specific store below'}
                    </p>
                  </button>
                </div>

                {/* If direct, show searchable store dropdown */}
                {targetType === 'direct' && (
                  <div className="pt-2">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Select Recipient Store:
                    </label>
                    <select
                      value={selectedRecipientId}
                      onChange={(e) => setSelectedRecipientId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                    >
                      {merchants.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.businessName} — {m.ownerName} ({m.ownerEmail || 'Email Verified'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* 2. Channel & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Channel Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    2. Delivery Channel
                  </label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as MessageChannel)}
                    className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="both">⚡ Both (In-App Notification + Email)</option>
                    <option value="in_app">📱 In-App Notification Only</option>
                    <option value="email">📧 Email Dispatch Only</option>
                  </select>
                </div>

                {/* Priority Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    3. Urgency / Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as MessagePriority)}
                    className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="normal">Normal (Standard Tray)</option>
                    <option value="important">Important (Highlighted Badge)</option>
                    <option value="urgent">🚨 Urgent (Top Dashboard Alert Banner)</option>
                  </select>
                </div>
              </div>

              {/* 3. Subject / Title */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  4. Message Headline / Subject
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Upgrade Notice: New Multi-Currency POS is Live!"
                  value={messageTitle}
                  onChange={(e) => setMessageTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* 4. Message Body */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  5. Message Content / Rich Body
                </label>
                <textarea
                  required
                  rows={6}
                  placeholder="Write your announcement or direct note to the merchant here..."
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  className="w-full p-3.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed font-sans"
                />
              </div>

              {/* 5. Optional Call-to-Action Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Action Button Label (Optional):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Try Feature Now"
                    value={actionLabel}
                    onChange={(e) => setActionLabel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Target View or URL:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. pos, debts, settings or https://..."
                    value={actionUrl}
                    onChange={(e) => setActionUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Direct Email Delivery Transparency Bar */}
              {(channel === 'email' || channel === 'both') && (
                <div className="p-3 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200/90 dark:border-emerald-800/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">
                      Direct Email Active: <strong>{getSelectedSegmentMerchants().filter((m) => Boolean(m.ownerEmail)).length}</strong> verified merchant inboxes will receive this email directly from <strong>notifications@getmarketmate.online</strong>.
                    </span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Sender: notifications@getmarketmate.online (Reply-To: {SUPER_ADMIN_CONFIG.email})</span>
                </div>

                <button
                  type="submit"
                  disabled={isSending || !messageTitle.trim() || !messageContent.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? 'Dispatching Message...' : 'Dispatch Message Directly'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Live Message Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                    Live Merchant Preview
                  </h4>
                </div>

                {/* Preview Mode Switch */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setPreviewMode('in_app')}
                    className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                      previewMode === 'in_app'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-500'
                    }`}
                  >
                    In-App Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode('email')}
                    className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                      previewMode === 'email'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-500'
                    }`}
                  >
                    Email View
                  </button>
                </div>
              </div>

              {previewMode === 'in_app' ? (
                /* IN-APP PREVIEW */
                <div className="space-y-4">
                  <div className="text-[11px] font-semibold text-slate-400">
                    How it renders in the merchant's notification drawer:
                  </div>

                  {/* Simulated notification card */}
                  <div className="p-4 rounded-xl border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-xs relative space-y-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                        {targetType === 'broadcast' ? '📢 Broadcast' : '🎯 Direct'}
                      </span>
                      {priority === 'urgent' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
                          🚨 Urgent Banner
                        </span>
                      )}
                      {priority === 'important' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                          Important
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                      {messageTitle || 'Message Title Headline'}
                    </h4>

                    <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed whitespace-pre-line">
                      {messageContent || 'Your message body will render cleanly here for the merchant to read.'}
                    </p>

                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                      <span>MarketMate Team • Just now</span>
                      {actionLabel && (
                        <span className="px-2 py-0.5 rounded bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold">
                          {actionLabel}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* If Urgent, preview top banner */}
                  {priority === 'urgent' && (
                    <div className="pt-2">
                      <div className="text-[11px] font-semibold text-slate-400 mb-1.5">
                        Urgent Top Alert Banner:
                      </div>
                      <div className="p-2.5 rounded-lg bg-red-600 text-white text-[11px] flex items-center justify-between gap-2 shadow-xs">
                        <div className="truncate flex-1 font-medium">
                          <strong>{messageTitle || 'Urgent Notice'}:</strong> {messageContent || 'Action required.'}
                        </div>
                        {actionLabel && (
                          <span className="px-2 py-0.5 rounded bg-white text-slate-900 text-[10px] font-bold shrink-0">
                            {actionLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* EMAIL PREVIEW */
                <div className="space-y-3">
                  <div className="text-[11px] font-semibold text-slate-400">
                    How it formats for email inbox delivery:
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono space-y-2">
                    <div className="text-[11px] text-slate-500 border-b border-slate-200 dark:border-slate-700 pb-2">
                      <div><strong>From:</strong> MarketMate Support &lt;{SUPER_ADMIN_CONFIG.email}&gt;</div>
                      <div><strong>To:</strong> {targetType === 'broadcast' ? `All Merchants (BCC ${merchants.length} recipients)` : currentTargetMerchant?.ownerEmail || 'merchant@store.com'}</div>
                      <div><strong>Subject:</strong> [MarketMate] {messageTitle || 'Message Subject'}</div>
                    </div>

                    <div className="text-slate-800 dark:text-slate-200 font-sans text-xs leading-relaxed whitespace-pre-line pt-1">
                      {messageContent || 'Email message body text...'}
                    </div>

                    {actionLabel && (
                      <div className="pt-2 font-sans">
                        <span className="inline-block px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-[11px]">
                          {actionLabel} →
                        </span>
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700 text-[10px] text-slate-400 font-sans">
                      MarketMate Business Solutions • Built for Nigerian MSMEs
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Dispatch Action Card */}
            <div className="bg-gradient-to-br from-emerald-950 to-slate-900 p-5 rounded-2xl border border-emerald-800/40 text-white space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400" />
                <h4 className="font-bold text-xs text-white">Direct Email Dispatcher</h4>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                Need to launch your default mail client (Gmail, Outlook, Apple Mail) with all merchant BCCs pre-filled?
              </p>
              <a
                href={getMailtoLink({
                  id: 'preview',
                  title: messageTitle || 'Update Notice',
                  content: messageContent || 'Message details',
                  type: targetType,
                  targetEmail: currentTargetMerchant?.ownerEmail,
                  channel,
                  priority,
                  senderEmail: SUPER_ADMIN_CONFIG.email,
                  senderName: 'MarketMate Admin',
                  createdAt: new Date().toISOString(),
                })}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-slate-950 text-xs font-bold hover:bg-slate-100 transition-colors shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Launch Mail App With Draft</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MESSAGE AUDIT LOG & HISTORY */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden animate-in fade-in">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Broadcast & Message Audit History</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Full ledger of all announcements and direct notices sent to merchants.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('messaging')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              <Send className="w-3 h-3" />
              <span>Compose New</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Headline & Content</th>
                  <th className="px-5 py-3.5">Target Audience</th>
                  <th className="px-5 py-3.5">Channel</th>
                  <th className="px-5 py-3.5">Priority</th>
                  <th className="px-5 py-3.5">Read Count</th>
                  <th className="px-5 py-3.5">Sent Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {allAnnouncements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-400 text-xs">
                      No broadcast messages sent yet. Click "Compose New" to send your first merchant announcement.
                    </td>
                  </tr>
                ) : (
                  allAnnouncements.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-5 py-4 max-w-xs">
                        <div className="font-bold text-slate-900 dark:text-white truncate">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {item.content}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {item.type === 'broadcast' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            <span>All Merchants</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            <span>{item.targetBusinessName || 'Direct'}</span>
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span className="capitalize text-[11px] font-medium text-slate-600 dark:text-slate-300">
                          {item.channel.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {item.priority === 'urgent' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
                            Urgent
                          </span>
                        ) : item.priority === 'important' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                            Important
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            Normal
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {item.readBy?.length || 0} views
                        </div>
                      </td>

                      <td className="px-5 py-4 text-slate-500 dark:text-slate-400 text-[11px]">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setMessageTitle(item.title);
                              setMessageContent(item.content);
                              setPriority(item.priority);
                              setChannel(item.channel);
                              setTargetType(item.type);
                              if (item.targetBusinessId) {
                                setSelectedRecipientId(item.targetBusinessId);
                              }
                              setActiveTab('messaging');
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            title="Reuse as template"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this message broadcast?')) {
                                deleteAnnouncement(item.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer"
                            title="Delete announcement"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: REFERRAL & SUBSCRIPTION DISCOUNT CAMPAIGN LEDGER */}
      {/* ========================================================================= */}
      {activeTab === 'referrals' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Campaign Status Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white border border-emerald-500/30 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-400/30">
                  <Gift className="w-3.5 h-3.5" />
                  <span>Early Business Referral Campaign</span>
                </div>
                <h3 className="text-lg font-black tracking-tight">
                  5% Subscription Discount Program
                </h3>
                <p className="text-xs text-emerald-200/80 max-w-2xl leading-relaxed">
                  Every registered business owner who refers another shop to register <strong>and subscribe</strong> to MarketMate earns a 5% discount on their upcoming subscription (commencing October 12th, 2026).
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-right shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block">
                  Campaign Validity
                </span>
                <span className="text-sm font-black font-mono">
                  {REFERRAL_CAMPAIGN.durationText}
                </span>
                <span className="text-[10px] text-white/70 block mt-0.5">
                  Subscription launch window
                </span>
              </div>
            </div>
          </div>

          {/* Key Referral Statistics */}
          {(() => {
            const qualifiedReferrals = referralsList.filter(
              (r) => r.referredSubscribed || r.status === 'qualified'
            );
            const pendingReferrals = referralsList.filter(
              (r) => !r.referredSubscribed && r.status !== 'qualified'
            );
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Registered</span>
                    <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                    {referralsList.length}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                    Merchants registered with a referral code
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Subscribed & Qualified</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
                    {qualifiedReferrals.length}
                  </div>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                    Stores that registered & subscribed (+5% off each)
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Awaiting Subscription</span>
                    <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                    {pendingReferrals.length}
                  </div>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1">
                    Registered shops yet to activate subscription
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Active Discounts Granted</span>
                    <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-purple-700 dark:text-purple-300 font-mono">
                    {qualifiedReferrals.length * REFERRAL_CAMPAIGN.discountPercent}%
                  </div>
                  <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium mt-1">
                    From qualified store subscriptions
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Referrals Ledger Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Gift className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Referral Attribution Ledger</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Complete audit trail of referred accounts, subscription status, and credited 5% discounts.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchPlatformData()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Referrer Code</th>
                    <th className="px-5 py-3.5">Referred Shop Name</th>
                    <th className="px-5 py-3.5">Referred Owner Email</th>
                    <th className="px-5 py-3.5">Registered</th>
                    <th className="px-5 py-3.5">Subscription Status</th>
                    <th className="px-5 py-3.5">5% Discount Qualification</th>
                    <th className="px-5 py-3.5 text-right">Admin Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {referralsList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-slate-400 text-xs">
                        No referrals recorded yet. When merchants share their referral link (e.g. <code>?ref=MM-XXXXXX</code>) or input a referral code at signup, they will be attributed here automatically.
                      </td>
                    </tr>
                  ) : (
                    referralsList.map((ref) => {
                      const isSubscribed = ref.referredSubscribed || ref.status === 'qualified';
                      return (
                        <tr key={ref.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-5 py-3.5 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            {ref.referrerCode}
                          </td>
                          <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                            {ref.referredBusinessName || 'New Store'}
                          </td>
                          <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                            {ref.referredEmail || '—'}
                          </td>
                          <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px]">
                            {new Date(ref.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="px-5 py-3.5">
                            {isSubscribed ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Subscribed</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                <span>Pending Subscription</span>
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            {isSubscribed ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <Percent className="w-3 h-3" />
                                <span>5% Off Qualified</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">
                                Unlocks on subscription
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              type="button"
                              disabled={updatingRefId === ref.id}
                              onClick={() => handleToggleReferralSubscription(ref)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                                isSubscribed
                                  ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                                  : 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700'
                              }`}
                            >
                              {updatingRefId === ref.id
                                ? 'Updating...'
                                : isSubscribed
                                ? 'Revoke Subscription'
                                : 'Confirm Subscription'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: SUBSCRIPTION APPROVALS & PLATFORM BANK ACCOUNT */}
      {/* ========================================================================= */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Pending Approvals
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
                  {subscriptionRequests.filter((r) => r.status === 'pending').length}
                </span>
                <span className="text-xs text-slate-500 font-medium">Awaiting verification</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Direct bank transfers to review</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Active Subscribed Stores
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {merchants.filter((m) => m.isSubscribed).length}
                </span>
                <span className="text-xs text-slate-500 font-medium">of {merchants.length} stores</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Tenants with active subscription</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Verified Sub Revenue
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                  ₦
                  {subscriptionRequests
                    .filter((r) => r.status === 'approved')
                    .reduce((sum, r) => sum + (r.finalAmount || 0), 0)
                    .toLocaleString()}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Total approved transfer revenue</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Total Sub Submissions
                </span>
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                  {subscriptionRequests.length}
                </span>
                <span className="text-xs text-slate-500 font-medium">All time</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Bank payment submissions</p>
            </div>
          </div>

          {/* MarketMate Official Receiving Bank Card */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-6 text-white border border-slate-700/60 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950">
                    Platform Bank Settings
                  </span>
                  <span className="text-xs text-emerald-300 font-medium">
                    Where merchants transfer subscription fees
                  </span>
                </div>
                <h3 className="text-lg font-black text-white mt-1">
                  MarketMate Receiving Bank Account
                </h3>
                <p className="text-xs text-slate-300 max-w-xl mt-0.5 leading-relaxed">
                  These details are displayed to merchants in the subscription modal. You can update your bank name,
                  account number, or subscription prices at any time without needing a Paystack account.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setBankConfigForm(bankConfig || {});
                  setIsEditingBankConfig(!isEditingBankConfig);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors cursor-pointer self-start sm:self-auto"
              >
                {isEditingBankConfig ? 'Cancel Editing' : 'Edit Bank Account & Prices'}
              </button>
            </div>

            {isEditingBankConfig ? (
              <form onSubmit={handleSaveBankConfig} className="mt-6 pt-6 border-t border-slate-700/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      required
                      value={bankConfigForm.bankName || ''}
                      onChange={(e) =>
                        setBankConfigForm({ ...bankConfigForm, bankName: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-800/90 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Account Number
                    </label>
                    <input
                      type="text"
                      required
                      value={bankConfigForm.accountNumber || ''}
                      onChange={(e) =>
                        setBankConfigForm({ ...bankConfigForm, accountNumber: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-800/90 border border-slate-600 text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Account Name
                    </label>
                    <input
                      type="text"
                      required
                      value={bankConfigForm.accountName || ''}
                      onChange={(e) =>
                        setBankConfigForm({ ...bankConfigForm, accountName: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-800/90 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Monthly Plan Price (₦)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={100}
                      value={bankConfigForm.monthlyPlanPrice ?? 7000}
                      onChange={(e) =>
                        setBankConfigForm({
                          ...bankConfigForm,
                          monthlyPlanPrice: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-800/90 border border-slate-600 text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Annual Plan Price (₦)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={1000}
                      value={bankConfigForm.annualPlanPrice ?? 70000}
                      onChange={(e) =>
                        setBankConfigForm({
                          ...bankConfigForm,
                          annualPlanPrice: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-800/90 border border-slate-600 text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingBankConfig(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Platform Bank Details</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-700/60">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Bank Name</span>
                  <span className="text-sm font-bold text-white block mt-0.5">
                    {bankConfig?.bankName || 'OPay'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Account Number</span>
                  <span className="text-base font-black font-mono text-emerald-400 block mt-0.5">
                    {bankConfig?.accountNumber || '6110157178'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Account Name</span>
                  <span className="text-xs font-bold text-white block mt-0.5 truncate">
                    {bankConfig?.accountName || 'OGHENEOVO DANIEL OSOVOYORON'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Plan Rates</span>
                  <span className="text-xs font-bold text-emerald-300 block mt-0.5 font-mono">
                    ₦{(bankConfig?.monthlyPlanPrice || 7000).toLocaleString()}/mo • ₦
                    {(bankConfig?.annualPlanPrice || 70000).toLocaleString()}/yr
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Verification Queue Section */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Subscription Bank Transfer Ledger</span>
                  <span className="text-xs font-normal text-slate-500">
                    ({subscriptionRequests.length} total submissions)
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Confirm receipt of funds in your bank account, then click "Approve & Activate" to grant the store full subscription access and qualify their referrer's discount.
                </p>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setSubFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    subFilter === 'pending'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Pending ({subscriptionRequests.filter((r) => r.status === 'pending').length})
                </button>
                <button
                  type="button"
                  onClick={() => setSubFilter('approved')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    subFilter === 'approved'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Approved ({subscriptionRequests.filter((r) => r.status === 'approved').length})
                </button>
                <button
                  type="button"
                  onClick={() => setSubFilter('rejected')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    subFilter === 'rejected'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Rejected ({subscriptionRequests.filter((r) => r.status === 'rejected').length})
                </button>
                <button
                  type="button"
                  onClick={() => setSubFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    subFilter === 'all'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  All ({subscriptionRequests.length})
                </button>
              </div>
            </div>

            {/* Submissions Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Store & Merchant</th>
                    <th className="px-5 py-3">Plan & Price</th>
                    <th className="px-5 py-3">Transfer Details</th>
                    <th className="px-5 py-3">Payment Reference</th>
                    <th className="px-5 py-3">Date Submitted</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Approval Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loadingSubscriptions ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                        <span>Loading subscription requests...</span>
                      </td>
                    </tr>
                  ) : subscriptionRequests.filter((r) => subFilter === 'all' || r.status === subFilter)
                      .length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                        <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                        <p className="font-semibold text-sm">No subscription requests in this view</p>
                        <p className="text-xs text-slate-400 mt-1">
                          When merchants initiate bank transfer subscriptions, their payment proofs appear here for verification.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    subscriptionRequests
                      .filter((r) => subFilter === 'all' || r.status === subFilter)
                      .map((req) => (
                        <tr
                          key={req.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          {/* Store & Merchant */}
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {req.businessName}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {req.ownerName || req.userEmail}
                            </div>
                            {req.phone && (
                              <div className="text-[10px] text-slate-400 font-mono">
                                Tel: {req.phone}
                              </div>
                            )}
                          </td>

                          {/* Plan & Price */}
                          <td className="px-5 py-3.5">
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {req.planName}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400">
                                ₦{req.finalAmount.toLocaleString()}
                              </span>
                              {req.discountPercent > 0 && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                                  {req.discountPercent}% Ref Discount
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Transfer Details */}
                          <td className="px-5 py-3.5">
                            <div className="text-slate-800 dark:text-slate-200 font-medium">
                              From: <strong>{req.senderBank}</strong>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Name: {req.senderAccountName}
                            </div>
                            {req.proofNote && (
                              <div className="text-[11px] text-slate-400 italic max-w-xs truncate mt-0.5">
                                Note: "{req.proofNote}"
                              </div>
                            )}
                          </td>

                          {/* Payment Reference */}
                          <td className="px-5 py-3.5">
                            <code className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-[11px] font-bold">
                              {req.paymentReference}
                            </code>
                          </td>

                          {/* Date Submitted */}
                          <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px]">
                            {new Date(req.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>

                          {/* Status */}
                          <td className="px-5 py-3.5">
                            {req.status === 'approved' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Approved</span>
                              </span>
                            ) : req.status === 'rejected' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                <span>Rejected</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                <span>Pending Review</span>
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-3.5 text-right space-x-2">
                            {req.status === 'pending' ? (
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={processingSubId === req.id}
                                  onClick={() => handleApproveSubscription(req)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  {processingSubId === req.id ? 'Approving...' : '✓ Approve & Activate'}
                                </button>
                                <button
                                  type="button"
                                  disabled={processingSubId === req.id}
                                  onClick={() => {
                                    setRejectModalReq(req);
                                    setRejectReasonInput('');
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 transition-colors cursor-pointer"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : req.status === 'approved' ? (
                              <span className="text-[11px] text-slate-400 font-medium">
                                Active • Reviewed by {req.reviewedBy?.split('@')[0] || 'Admin'}
                              </span>
                            ) : (
                              <button
                                type="button"
                                disabled={processingSubId === req.id}
                                onClick={() => handleApproveSubscription(req)}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
                              >
                                Re-approve
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: SUPPORT & USER INQUIRIES */}
      {/* ========================================================================= */}
      {activeTab === 'support' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header & WhatsApp Config Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/30 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Headphones className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-white">
                    Support & User Inquiries Hub
                  </h3>
                  <span className="text-[10px] bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                    Live
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Manage incoming customer assistance tickets, bug reports, and direct WhatsApp conversations.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href={getWhatsAppSupportUrl('Hello Admin, checking the MarketMate support line status.')}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                title="Test Official WhatsApp Line"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Official WhatsApp: {SUPPORT_CONFIG.whatsappDisplay}</span>
              </a>

              <button
                type="button"
                onClick={loadSupportData}
                disabled={loadingTickets}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingTickets ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Inquiries</span>
                <Inbox className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1.5 font-mono">
                {supportTickets.length}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200/60 dark:border-rose-900/50 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">Open / Pending</span>
                <AlertCircle className="w-4 h-4 text-rose-500" />
              </div>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1.5 font-mono">
                {supportTickets.filter((t) => t.status === 'open').length}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200/60 dark:border-amber-900/50 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">In Progress</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1.5 font-mono">
                {supportTickets.filter((t) => t.status === 'in_progress').length}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200/60 dark:border-emerald-900/50 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Resolved</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1.5 font-mono">
                {supportTickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length}
              </p>
            </div>
          </div>

          {/* Filter Bar & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="flex flex-wrap items-center gap-1.5">
              {(['all', 'open', 'in_progress', 'resolved'] as const).map((filter) => {
                const count =
                  filter === 'all'
                    ? supportTickets.length
                    : filter === 'resolved'
                    ? supportTickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length
                    : supportTickets.filter((t) => t.status === filter).length;

                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setTicketFilter(filter)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      ticketFilter === filter
                        ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70'
                    }`}
                  >
                    <span>
                      {filter === 'all'
                        ? 'All Tickets'
                        : filter === 'open'
                        ? 'Open / New'
                        : filter === 'in_progress'
                        ? 'In Progress'
                        : 'Resolved'}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        ticketFilter === filter
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search ticket subject, user or phone..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Tickets List View */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
            {loadingTickets ? (
              <div className="p-12 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                <p className="text-xs font-semibold">Loading support tickets...</p>
              </div>
            ) : supportTickets.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">All Clear! No Pending Inquiries</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                  Users can submit tickets from the Floating Support button, user menu, or reach out to WhatsApp ({SUPPORT_CONFIG.whatsappDisplay}).
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {supportTickets
                  .filter((ticket) => {
                    // Status filter
                    if (ticketFilter === 'open' && ticket.status !== 'open') return false;
                    if (ticketFilter === 'in_progress' && ticket.status !== 'in_progress') return false;
                    if (ticketFilter === 'resolved' && ticket.status !== 'resolved' && ticket.status !== 'closed') return false;

                    // Search filter
                    if (searchTerm.trim()) {
                      const term = searchTerm.toLowerCase();
                      const matchSubject = ticket.subject.toLowerCase().includes(term);
                      const matchEmail = ticket.userEmail.toLowerCase().includes(term);
                      const matchPhone = (ticket.whatsappPhone || '').toLowerCase().includes(term);
                      const matchMerchant = (ticket.businessName || '').toLowerCase().includes(term);
                      const matchMsg = ticket.message.toLowerCase().includes(term);
                      return matchSubject || matchEmail || matchPhone || matchMerchant || matchMsg;
                    }
                    return true;
                  })
                  .map((ticket) => {
                    const isUrgent = ticket.priority === 'urgent' || ticket.priority === 'high';
                    const isOpen = ticket.status === 'open';

                    return (
                      <div
                        key={ticket.id}
                        className={`p-4 sm:p-5 hover:bg-slate-50/80 dark:hover:bg-slate-850/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          isOpen ? 'bg-amber-50/20 dark:bg-amber-950/10' : ''
                        }`}
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                ticket.status === 'open'
                                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                                  : ticket.status === 'in_progress'
                                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                  : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                              }`}
                            >
                              {ticket.status.replace('_', ' ')}
                            </span>

                            {isUrgent && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-500 text-white flex items-center gap-1">
                                <Zap className="w-2.5 h-2.5" />
                                {ticket.priority.toUpperCase()}
                              </span>
                            )}

                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {ticket.category.replace(/_/g, ' ')}
                            </span>

                            <span className="text-[11px] text-slate-400">
                              {new Date(ticket.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                              {ticket.subject}
                            </h4>
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                            {ticket.message}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                            <span className="font-semibold text-slate-700 dark:text-slate-200">
                              Store: {ticket.businessName || 'MarketMate User'}
                            </span>
                            <span>•</span>
                            <span>{ticket.userEmail}</span>
                            {ticket.whatsappPhone && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                                  WA: {ticket.whatsappPhone}
                                </span>
                              </>
                            )}
                            {ticket.adminReply && (
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                ✓ Replied by Admin
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Fast Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                          {/* Direct WhatsApp Responder */}
                          {ticket.whatsappPhone && (
                            <a
                              href={`https://wa.me/${ticket.whatsappPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                `Hello from MarketMate Support. Regarding your inquiry on "${ticket.subject}": `
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60 transition-colors cursor-pointer"
                              title="Direct WhatsApp Chat with User"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setAdminReplyText(ticket.adminReply || '');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                          >
                            Manage Ticket
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteTicket(ticket.id)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                            title="Delete Ticket"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUPPORT TICKET MANAGEMENT MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Manage Support Ticket
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    ID: #{selectedTicket.id.slice(0, 10)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              {/* Ticket Info Card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {selectedTicket.subject}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    Category: {selectedTicket.category.replace(/_/g, ' ')}
                  </span>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                  {selectedTicket.message}
                </p>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-slate-400 block">Sender Email:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedTicket.userEmail}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Store Name:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedTicket.businessName || 'Not recorded'}
                    </span>
                  </div>
                  {selectedTicket.whatsappPhone && (
                    <div>
                      <span className="text-slate-400 block">WhatsApp Number:</span>
                      <span className="font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                        {selectedTicket.whatsappPhone}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-400 block">Submitted At:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {new Date(selectedTicket.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Fast WhatsApp Chat Trigger */}
              {selectedTicket.whatsappPhone && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 text-xs">
                    <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Chat directly with this customer on WhatsApp</span>
                  </div>
                  <a
                    href={`https://wa.me/${selectedTicket.whatsappPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      `Hello from MarketMate Support! We received your inquiry regarding "${selectedTicket.subject}": `
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shrink-0 shadow-xs"
                  >
                    Open WhatsApp Chat
                  </a>
                </div>
              )}

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Update Ticket Status:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['open', 'in_progress', 'resolved'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      disabled={isUpdatingTicket}
                      onClick={() => handleUpdateTicketStatus(selectedTicket.id, st, adminReplyText)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                        selectedTicket.status === st
                          ? st === 'open'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : st === 'in_progress'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin Resolution & Reply Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Official Admin Response / Resolution Notes:
                </label>
                <textarea
                  rows={4}
                  value={adminReplyText}
                  onChange={(e) => setAdminReplyText(e.target.value)}
                  placeholder="Type official reply or resolution details here (visible to merchant in their ticket history)..."
                  className="w-full p-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleDeleteTicket(selectedTicket.id)}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
              >
                Delete Ticket
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={isUpdatingTicket}
                  onClick={() =>
                    handleUpdateTicketStatus(
                      selectedTicket.id,
                      selectedTicket.status === 'open' ? 'in_progress' : selectedTicket.status,
                      adminReplyText
                    )
                  }
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  {isUpdatingTicket ? 'Saving...' : 'Save Reply & Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJECT SUBSCRIPTION REASON MODAL */}
      {rejectModalReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-rose-50 dark:bg-rose-950/40">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Reject Subscription Request
                </h3>
              </div>
              <button
                onClick={() => setRejectModalReq(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600 dark:text-slate-300">
                You are marking the subscription payment for <strong>{rejectModalReq.businessName}</strong> (Ref:{' '}
                <code>{rejectModalReq.paymentReference}</code>) as rejected.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Rejection (Sent to Merchant in Notification)
                </label>
                <textarea
                  rows={3}
                  value={rejectReasonInput}
                  onChange={(e) => setRejectReasonInput(e.target.value)}
                  placeholder="e.g. We checked our bank alerts and could not match the transfer. Please confirm your sender account name or contact support."
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalReq(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={processingSubId === rejectModalReq.id}
                  onClick={handleRejectSubscription}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer"
                >
                  {processingSubId === rejectModalReq.id ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRE-SEND BROADCAST CONFIRMATION MODAL (Option A Safeguard) */}
      {isPreSendModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Confirm Broadcast Dispatch
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Review audience and delivery channels before sending.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPreSendModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Audience & Channel Overview */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Segment</span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs block">
                    {targetType === 'broadcast'
                      ? '📢 All Stores'
                      : targetType === 'zero_sales'
                      ? '📦 Zero-Sales Stores'
                      : targetType === 'dormant'
                      ? '⏳ Dormant (>7d)'
                      : targetType === 'transacting'
                      ? '🚀 Top Sellers'
                      : `🎯 ${currentTargetMerchant?.businessName || 'Single Merchant'}`}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold block">
                    {getSelectedSegmentMerchants().length} {getSelectedSegmentMerchants().length === 1 ? 'store' : 'stores'} targeted
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Delivery Channel</span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs block">
                    {channel === 'both' ? '⚡ In-App + Email' : channel === 'email' ? '📧 Email Only' : '📱 In-App Only'}
                  </span>
                  <span className="text-[10px] text-slate-500 block truncate">
                    Sender: notifications@getmarketmate.online
                  </span>
                </div>
              </div>

              {/* Message Details Preview */}
              <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-200 text-xs">
                  <span>Subject:</span>
                  <span>{messageTitle}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed line-clamp-3">
                  {messageContent}
                </p>
                {actionLabel && (
                  <span className="inline-block text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700">
                    CTA Button: {actionLabel}
                  </span>
                )}
              </div>

              {/* Recipient Stores List Preview */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Recipient Preview ({getSelectedSegmentMerchants().filter((m) => Boolean(m.ownerEmail)).length} with valid emails):
                </span>
                <div className="max-h-28 overflow-y-auto rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 p-2 space-y-1 text-[11px]">
                  {getSelectedSegmentMerchants().slice(0, 8).map((m) => (
                    <div key={m.id} className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                      <span className="font-medium truncate max-w-[180px]">{m.businessName}</span>
                      <span className="text-[10px] text-slate-400">{m.ownerEmail || 'In-App only'}</span>
                    </div>
                  ))}
                  {getSelectedSegmentMerchants().length > 8 && (
                    <div className="text-[10px] text-slate-400 text-center pt-1 italic">
                      + {getSelectedSegmentMerchants().length - 8} more stores
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsPreSendModalOpen(false)}
                disabled={isSending}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer hover:bg-slate-50"
              >
                Cancel / Edit
              </button>

              <button
                type="button"
                onClick={executeSendMessage}
                disabled={isSending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {isSending
                    ? 'Dispatching Emails...'
                    : `Confirm & Send (${getSelectedSegmentMerchants().length})`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MERCHANT DRILL-DOWN MODAL */}
      {selectedMerchant && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-sm flex items-center justify-center">
                  {selectedMerchant.businessName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedMerchant.businessName}
                  </h3>
                  <p className="text-xs text-slate-500">{selectedMerchant.businessType}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMerchant(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Owner Name</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {selectedMerchant.ownerName}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{selectedMerchant.ownerEmail || 'Email unlisted'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Contact Phone</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {selectedMerchant.phone || 'Not specified'}
                  </span>
                  {selectedMerchant.phone && selectedMerchant.phone !== '—' && (
                    <a
                      href={getWhatsAppOutreachUrl(selectedMerchant)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-emerald-600 hover:underline font-bold flex items-center gap-1 mt-0.5"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>Direct WhatsApp</span>
                    </a>
                  )}
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Activity Status</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        selectedMerchant.activityStatus === 'active'
                          ? 'bg-emerald-500 animate-pulse'
                          : selectedMerchant.activityStatus === 'recent'
                          ? 'bg-teal-500'
                          : selectedMerchant.activityStatus === 'dormant'
                          ? 'bg-amber-500'
                          : 'bg-slate-400'
                      }`}
                    />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {selectedMerchant.activityStatus === 'active'
                        ? 'Active Today'
                        : selectedMerchant.activityStatus === 'recent'
                        ? 'Active This Week'
                        : selectedMerchant.activityStatus === 'dormant'
                        ? 'Dormant (>7d)'
                        : 'Inactive (>30d)'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{selectedMerchant.lastActive}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Recorded Sales & GMV</span>
                  <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 block mt-0.5">
                    ₦{selectedMerchant.totalSalesVolume.toLocaleString('en-NG')}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                    {selectedMerchant.salesCount} {selectedMerchant.salesCount === 1 ? 'sale' : 'sales'} • {selectedMerchant.productsCount || 0} items
                  </span>
                  {selectedMerchant.lastSaleAt && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-1 font-medium">
                      Latest sale: {formatDateFriendly(selectedMerchant.lastSaleAt)} ({formatRelativeTime(selectedMerchant.lastSaleAt)})
                    </span>
                  )}
                </div>
              </div>

              {selectedMerchant.salesCount === 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-[11px] space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Onboarding Opportunity Detected</span>
                  </div>
                  <p>
                    This merchant has zero recorded sales. Reaching out with setup assistance or barcode scanning tips helps convert them into active daily users.
                  </p>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                🛡️ <strong>Super Admin Store Telemetry:</strong> Live metrics reflect verified subcollections in Firestore. User credentials and private customer PII are protected under NDPR/GDPR standards.
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {selectedMerchant.phone && selectedMerchant.phone !== '—' && (
                  <a
                    href={getWhatsAppOutreachUrl(selectedMerchant)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp Outreach</span>
                  </a>
                )}

                <button
                  onClick={() => {
                    setSelectedRecipientId(selectedMerchant.id);
                    setTargetType('direct');
                    setSelectedMerchant(null);
                    setActiveTab('messaging');
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send In-App Notice</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedMerchant(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
