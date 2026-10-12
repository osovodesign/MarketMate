import { PlatformBankConfig, SubscriptionRequest } from '../types';
import { db, collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, orderBy } from './firebase';
import { recordReferralSubscription } from './referralService';

export const DEFAULT_PLATFORM_BANK: PlatformBankConfig = {
  bankName: 'OPay',
  accountNumber: '6110157178',
  accountName: 'OGHENEOVO DANIEL OSOVOYORON',
  instructions:
    'Transfer the exact subscription amount to the official MarketMate bank account below. Include your Store Name or Payment Reference in your transfer narration. After paying, submit your sender details below for admin approval.',
  monthlyPlanPrice: 7000,
  annualPlanPrice: 70000, // Save ₦14,000 (2 months free)
  supportPhone: '+234 708 923 8728',
  supportEmail: 'getmarketmate@gmail.com',
};

const STORAGE_PLATFORM_BANK_KEY = 'marketmate_platform_bank_config_v1';
const STORAGE_SUBSCRIPTION_REQUESTS_KEY = 'marketmate_subscription_requests_v1';

/**
 * Generate a clean, unique payment reference code for bank transfer narration
 * e.g. MM-SUB-STORE-4829
 */
export const generatePaymentReference = (businessName: string = 'STORE'): string => {
  const cleanName = businessName
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 6)
    .padEnd(4, 'X');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `MM-SUB-${cleanName}-${randomSuffix}`;
};

/**
 * Fetch official receiving bank account configuration
 */
export const fetchPlatformBankConfig = async (): Promise<PlatformBankConfig> => {
  try {
    const configDocRef = doc(db, 'platform_config', 'subscription_bank');
    const snap = await getDoc(configDocRef);
    if (snap.exists()) {
      const data = snap.data() as PlatformBankConfig;
      localStorage.setItem(STORAGE_PLATFORM_BANK_KEY, JSON.stringify(data));
      return { ...DEFAULT_PLATFORM_BANK, ...data };
    }
  } catch (err) {
    console.warn('Could not fetch remote platform bank config, checking local fallback:', err);
  }

  try {
    const localStr = localStorage.getItem(STORAGE_PLATFORM_BANK_KEY);
    if (localStr) {
      const parsed = JSON.parse(localStr);
      if (
        parsed.accountNumber === '0123456789' ||
        parsed.bankName === 'Access Bank PLC' ||
        parsed.monthlyPlanPrice === 5000
      ) {
        const updated = {
          ...DEFAULT_PLATFORM_BANK,
          ...parsed,
          monthlyPlanPrice: 7000,
          annualPlanPrice: 70000,
          bankName: 'OPay',
          accountNumber: '6110157178',
          accountName: 'OGHENEOVO DANIEL OSOVOYORON',
        };
        localStorage.setItem(STORAGE_PLATFORM_BANK_KEY, JSON.stringify(updated));
        return updated;
      }
      return { ...DEFAULT_PLATFORM_BANK, ...parsed };
    }
  } catch {}

  return DEFAULT_PLATFORM_BANK;
};

/**
 * Super Admin updates official receiving bank account and pricing
 */
export const updatePlatformBankConfig = async (
  config: Partial<PlatformBankConfig>
): Promise<PlatformBankConfig> => {
  const current = await fetchPlatformBankConfig();
  const updated: PlatformBankConfig = {
    ...current,
    ...config,
    updatedAt: new Date().toISOString(),
  };

  try {
    const configDocRef = doc(db, 'platform_config', 'subscription_bank');
    await setDoc(configDocRef, updated, { merge: true });
  } catch (err) {
    console.warn('Firestore update platform bank config error:', err);
  }

  try {
    localStorage.setItem(STORAGE_PLATFORM_BANK_KEY, JSON.stringify(updated));
  } catch {}

  return updated;
};

/**
 * Merchant submits payment proof of bank transfer
 */
export const submitSubscriptionPayment = async (data: {
  businessId: string;
  businessName: string;
  userId: string;
  userEmail: string;
  ownerName?: string;
  phone?: string;
  planId: 'monthly' | 'annual' | 'pioneer_launch';
  planName: string;
  planOriginalPrice: number;
  discountPercent: number;
  finalAmount: number;
  currency?: string;
  senderBank: string;
  senderAccountName: string;
  paymentReference: string;
  proofNote?: string;
  proofImageUrl?: string;
}): Promise<SubscriptionRequest> => {
  const reqId = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  const record: SubscriptionRequest = {
    id: reqId,
    businessId: data.businessId,
    businessName: data.businessName,
    userId: data.userId,
    userEmail: data.userEmail,
    ownerName: data.ownerName || '',
    phone: data.phone || '',
    planId: data.planId,
    planName: data.planName,
    planOriginalPrice: data.planOriginalPrice,
    discountPercent: data.discountPercent,
    finalAmount: data.finalAmount,
    currency: data.currency || 'NGN',
    senderBank: data.senderBank.trim(),
    senderAccountName: data.senderAccountName.trim(),
    paymentReference: data.paymentReference.trim(),
    proofNote: data.proofNote?.trim() || '',
    proofImageUrl: data.proofImageUrl || '',
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  // 1. Save to Firestore
  try {
    const docRef = doc(db, 'subscription_requests', reqId);
    await setDoc(docRef, record);
  } catch (err) {
    console.warn('Firestore save subscription request error:', err);
  }

  // 2. Cache in localStorage
  try {
    const raw = localStorage.getItem(STORAGE_SUBSCRIPTION_REQUESTS_KEY);
    const list: SubscriptionRequest[] = raw ? JSON.parse(raw) : [];
    list.unshift(record);
    localStorage.setItem(STORAGE_SUBSCRIPTION_REQUESTS_KEY, JSON.stringify(list));
  } catch {}

  return record;
};

/**
 * Fetch subscription requests (all for super admin, or filtered by user/business)
 */
export const fetchSubscriptionRequests = async (filter?: {
  userId?: string;
  businessId?: string;
}): Promise<SubscriptionRequest[]> => {
  const results: SubscriptionRequest[] = [];

  try {
    const col = collection(db, 'subscription_requests');
    let q;
    if (filter?.businessId) {
      q = query(col, where('businessId', '==', filter.businessId));
    } else if (filter?.userId) {
      q = query(col, where('userId', '==', filter.userId));
    } else {
      q = query(col, orderBy('createdAt', 'desc'));
    }

    const snap = await getDocs(q);
    snap.forEach((d) => {
      results.push(d.data() as SubscriptionRequest);
    });
  } catch (err) {
    console.warn('Firestore fetch subscription requests error, falling back to local:', err);
  }

  // Fallback to local storage if remote empty
  if (results.length === 0) {
    try {
      const raw = localStorage.getItem(STORAGE_SUBSCRIPTION_REQUESTS_KEY);
      if (raw) {
        const localList: SubscriptionRequest[] = JSON.parse(raw);
        if (filter?.businessId) {
          return localList.filter((r) => r.businessId === filter.businessId);
        }
        if (filter?.userId) {
          return localList.filter((r) => r.userId === filter.userId);
        }
        return localList;
      }
    } catch {}
  }

  return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

/**
 * Super Admin approves a subscription bank transfer
 * - Updates request status to 'approved'
 * - Updates business doc to isSubscribed: true
 * - Triggers referral reward qualification for referrer
 * - Creates a confirmation announcement for the merchant
 */
export const approveSubscriptionPayment = async (
  request: SubscriptionRequest,
  adminEmail: string
): Promise<boolean> => {
  const now = new Date().toISOString();

  // 1. Update request status in Firestore
  try {
    const docRef = doc(db, 'subscription_requests', request.id);
    await updateDoc(docRef, {
      status: 'approved',
      reviewedBy: adminEmail,
      reviewedAt: now,
      updatedAt: now,
    });
  } catch (err) {
    console.warn('Firestore approve request update error:', err);
  }

  // 2. Update the merchant's business document
  try {
    const bizDocRef = doc(db, 'businesses', request.businessId);
    await updateDoc(bizDocRef, {
      isSubscribed: true,
      subscriptionPlan: request.planName,
      subscribedAt: now,
      subscriptionDiscountPercent: request.discountPercent,
      updatedAt: now,
    });
  } catch (err) {
    console.warn('Firestore business subscription update error:', err);
  }

  // 3. Update localStorage cache of business if this store is active locally
  try {
    const savedBizStr = localStorage.getItem('marketmate_active_business_v1');
    if (savedBizStr) {
      const b = JSON.parse(savedBizStr);
      if (b.id === request.businessId) {
        b.isSubscribed = true;
        b.subscriptionPlan = request.planName;
        b.subscribedAt = now;
        localStorage.setItem('marketmate_active_business_v1', JSON.stringify(b));
      }
    }
  } catch {}

  // 4. Qualify referral reward for their referrer
  try {
    await recordReferralSubscription(request.userId, request.planName);
  } catch (refErr) {
    console.warn('Qualifying referral subscription error:', refErr);
  }

  // 5. Notify the merchant with an in-app platform announcement
  try {
    const announcementId = `msg_sub_approved_${request.id}`;
    const annDocRef = doc(db, 'platform_announcements', announcementId);
    await setDoc(annDocRef, {
      id: announcementId,
      title: '🎉 Subscription Payment Approved & Active!',
      content: `Hello ${request.ownerName || request.businessName},\n\nYour bank transfer of ₦${request.finalAmount.toLocaleString()} for the "${request.planName}" plan has been verified and approved by MarketMate Admin.\n\nYour subscription is now fully active! Thank you for partnering with MarketMate to power your store.`,
      type: 'direct',
      targetBusinessId: request.businessId,
      targetBusinessName: request.businessName,
      targetEmail: request.userEmail,
      channel: 'in_app',
      priority: 'important',
      actionUrl: 'settings',
      actionLabel: 'View Subscription',
      createdAt: now,
      readBy: [],
    });
  } catch (msgErr) {
    console.warn('Could not post subscription approval announcement:', msgErr);
  }

  // 6. Update local request list
  try {
    const raw = localStorage.getItem(STORAGE_SUBSCRIPTION_REQUESTS_KEY);
    if (raw) {
      const list: SubscriptionRequest[] = JSON.parse(raw);
      const updated = list.map((r) =>
        r.id === request.id
          ? {
              ...r,
              status: 'approved' as const,
              reviewedBy: adminEmail,
              reviewedAt: now,
              updatedAt: now,
            }
          : r
      );
      localStorage.setItem(STORAGE_SUBSCRIPTION_REQUESTS_KEY, JSON.stringify(updated));
    }
  } catch {}

  // 7. Trigger automated confirmation email from notifications@getmarketmate.online
  if (request.userEmail && request.userEmail.includes('@')) {
    fetch('/api/email/subscription-approval', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: request.userEmail,
        ownerName: request.ownerName,
        businessName: request.businessName,
        planName: request.planName,
        amount: request.finalAmount,
        discountPercent: request.discountPercent,
      }),
    }).catch((e) => console.warn('Subscription approval email trigger warning:', e));
  }

  return true;
};

/**
 * Super Admin rejects a subscription bank transfer with a reason
 */
export const rejectSubscriptionPayment = async (
  request: SubscriptionRequest,
  reason: string,
  adminEmail: string
): Promise<boolean> => {
  const now = new Date().toISOString();

  try {
    const docRef = doc(db, 'subscription_requests', request.id);
    await updateDoc(docRef, {
      status: 'rejected',
      rejectionReason: reason.trim(),
      reviewedBy: adminEmail,
      reviewedAt: now,
      updatedAt: now,
    });
  } catch (err) {
    console.warn('Firestore reject request error:', err);
  }

  // Trigger automated notification email
  if (request.userEmail && request.userEmail.includes('@')) {
    fetch('/api/email/subscription-rejection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: request.userEmail,
        ownerName: request.ownerName,
        businessName: request.businessName,
        planName: request.planName,
        reason,
      }),
    }).catch((e) => console.warn('Subscription rejection email trigger warning:', e));
  }

  // Notify merchant of rejection / request for clarification
  try {
    const announcementId = `msg_sub_rejected_${request.id}`;
    const annDocRef = doc(db, 'platform_announcements', announcementId);
    await setDoc(annDocRef, {
      id: announcementId,
      title: '⚠️ Subscription Payment Update Needed',
      content: `Hello ${request.ownerName || request.businessName},\n\nWe reviewed your subscription transfer submission for reference ${request.paymentReference}. However, we could not confirm the transfer with the details provided:\n\n"${reason.trim()}"\n\nPlease check your bank statement or contact support at ${DEFAULT_PLATFORM_BANK.supportEmail} / ${DEFAULT_PLATFORM_BANK.supportPhone}.`,
      type: 'direct',
      targetBusinessId: request.businessId,
      targetBusinessName: request.businessName,
      targetEmail: request.userEmail,
      channel: 'in_app',
      priority: 'urgent',
      actionUrl: 'settings',
      actionLabel: 'Resolve Payment',
      createdAt: now,
      readBy: [],
    });
  } catch (msgErr) {
    console.warn('Could not post subscription rejection announcement:', msgErr);
  }

  try {
    const raw = localStorage.getItem(STORAGE_SUBSCRIPTION_REQUESTS_KEY);
    if (raw) {
      const list: SubscriptionRequest[] = JSON.parse(raw);
      const updated = list.map((r) =>
        r.id === request.id
          ? {
              ...r,
              status: 'rejected' as const,
              rejectionReason: reason.trim(),
              reviewedBy: adminEmail,
              reviewedAt: now,
              updatedAt: now,
            }
          : r
      );
      localStorage.setItem(STORAGE_SUBSCRIPTION_REQUESTS_KEY, JSON.stringify(updated));
    }
  } catch {}

  return true;
};
