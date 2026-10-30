import {
  BusinessProfile,
  PlatformBankConfig,
  SubscriptionAuditAction,
  SubscriptionAuditEvent,
  SubscriptionEntitlement,
  SubscriptionRequest,
  SubscriptionStatus,
} from '../types';
import {
  auth,
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  runTransaction,
  arrayUnion,
} from './firebase';
import { recordReferralSubscription } from './referralService';
import { isSuperAdminEmail } from './adminConfig';

/**
 * End of 31 December 2026 in Africa/Lagos (UTC+1) -> 2026-12-31T22:59:59.999Z
 */
export const Q4_2026_EXPIRY_LAGOS_ISO = '2026-12-31T22:59:59.999Z';
export const DEFAULT_EXPIRY_REMINDER_DAYS = 7;

export const DEFAULT_PLATFORM_BANK: PlatformBankConfig = {
  bankName: 'MONIEPOINT',
  accountNumber: '3006119131',
  accountName: 'MARKET-MATE TECHNOLOGIES LIMITED',
  instructions:
    'Transfer the exact subscription amount to the official MarketMate corporate bank account below. Include your Store Name or Payment Reference in your transfer narration. After paying, submit your sender details below for admin verification.',
  monthlyPlanPrice: 1000, // ₦1,000 / month
  q4PassPrice: 3000, // ₦3,000 flat for October–December 2026 Q4 Package
  q4PromoEnabled: true,
  expiryReminderDays: DEFAULT_EXPIRY_REMINDER_DAYS,
  annualPlanPrice: 3000, // Legacy alias kept in sync with q4PassPrice
  supportPhone: '+234 708 923 8728',
  supportEmail: 'getmarketmate@gmail.com',
};

const STORAGE_PLATFORM_BANK_KEY = 'marketmate_platform_bank_config_v3';
const STORAGE_SUBSCRIPTION_REQUESTS_KEY = 'marketmate_subscription_requests_v1';

/**
 * Format an ISO timestamp in Africa/Lagos timezone (e.g. "30 Oct 2026")
 */
export const formatLagosDate = (isoStr?: string | null): string => {
  if (!isoStr) return '—';
  const date = new Date(isoStr);
  if (isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-NG', {
    timeZone: 'Africa/Lagos',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

/**
 * Format an ISO timestamp with time in Africa/Lagos timezone
 */
export const formatLagosDateTime = (isoStr?: string | null): string => {
  if (!isoStr) return '—';
  const date = new Date(isoStr);
  if (isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-NG', {
    timeZone: 'Africa/Lagos',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/**
 * Helper: number of days in a given year and 0-indexed month
 */
const getDaysInMonth = (year: number, monthZeroIndexed: number): number => {
  return new Date(Date.UTC(year, monthZeroIndexed + 1, 0)).getUTCDate();
};

/**
 * Adds N calendar months in Africa/Lagos (UTC+1), clamping to the last valid day of the target month
 * if the activation day does not exist in the target month (e.g. Jan 31 -> Feb 28/29).
 */
export const addCalendarMonthsLagos = (startIso: string, monthsToAdd: number = 1): string => {
  const LAGOS_OFFSET_MS = 60 * 60 * 1000; // UTC+1 (WAT has no DST)
  const startUtcMs = new Date(startIso).getTime();
  const baseMs = isNaN(startUtcMs) ? Date.now() : startUtcMs;

  const lagosDate = new Date(baseMs + LAGOS_OFFSET_MS);
  const year = lagosDate.getUTCFullYear();
  const month = lagosDate.getUTCMonth();
  const day = lagosDate.getUTCDate();
  const hours = lagosDate.getUTCHours();
  const minutes = lagosDate.getUTCMinutes();
  const seconds = lagosDate.getUTCSeconds();
  const ms = lagosDate.getUTCMilliseconds();

  const totalMonths = month + monthsToAdd;
  const targetYear = year + Math.floor(totalMonths / 12);
  const targetMonth = ((totalMonths % 12) + 12) % 12;
  const maxDay = getDaysInMonth(targetYear, targetMonth);
  const clampedDay = Math.min(day, maxDay);

  const targetLagosMs = Date.UTC(
    targetYear,
    targetMonth,
    clampedDay,
    hours,
    minutes,
    seconds,
    ms
  );
  return new Date(targetLagosMs - LAGOS_OFFSET_MS).toISOString();
};

/**
 * Computes subscription start and expiry timestamps according to MarketMate lifecycle rules:
 * - If renewing before current expiry (`currentExpiresAtIso > approvalTimeIso`), the new period
 *   starts at `currentExpiresAtIso` so the merchant never loses already-paid time.
 * - If activating new or renewing after expiry, the period starts at `approvalTimeIso`.
 * - Monthly plan (`'monthly'`): adds 1 clamped calendar month.
 * - Q4 2026 Pass (`'q4_pass'`): expires at the end of 31 December 2026 in Africa/Lagos
 *   (or +3 calendar months if approved after Q4 2026).
 */
export const calculateSubscriptionPeriod = (
  planId: string,
  approvalTimeIso: string = new Date().toISOString(),
  currentExpiresAtIso?: string | null
): {
  startsAt: string;
  expiresAt: string;
  isRenewal: boolean;
} => {
  const approvalMs = new Date(approvalTimeIso).getTime();
  const existingExpiryMs = currentExpiresAtIso ? new Date(currentExpiresAtIso).getTime() : NaN;

  const isRenewal = !isNaN(existingExpiryMs) && existingExpiryMs > approvalMs;
  const startsAt = isRenewal && currentExpiresAtIso ? currentExpiresAtIso : approvalTimeIso;
  const startsAtMs = new Date(startsAt).getTime();

  let expiresAt: string;
  if (planId === 'q4_pass' || planId === 'annual') {
    const q4EndMs = new Date(Q4_2026_EXPIRY_LAGOS_ISO).getTime();
    if (startsAtMs < q4EndMs) {
      expiresAt = Q4_2026_EXPIRY_LAGOS_ISO;
    } else {
      expiresAt = addCalendarMonthsLagos(startsAt, 3);
    }
  } else {
    expiresAt = addCalendarMonthsLagos(startsAt, 1);
  }

  return {
    startsAt,
    expiresAt,
    isRenewal,
  };
};

/**
 * Infer fallback expiry for legacy businesses that had `isSubscribed: true` and `subscribedAt`
 * before `subscriptionExpiresAt` was introduced.
 */
export const resolveBusinessExpiryIso = (business?: BusinessProfile | null): string | null => {
  if (!business) return null;
  if (business.subscriptionExpiresAt) {
    return business.subscriptionExpiresAt;
  }
  if (business.subscribedAt) {
    const planLower = (business.subscriptionPlan || '').toLowerCase();
    const planId = business.subscriptionPlanId || (planLower.includes('q4') || planLower.includes('3 month') ? 'q4_pass' : 'monthly');
    return calculateSubscriptionPeriod(planId, business.subscribedAt).expiresAt;
  }
  return null;
};

/**
 * Centralised check: returns true ONLY if the business currently has an active, non-expired subscription.
 */
export const isBusinessSubscriptionActive = (
  business?: BusinessProfile | null,
  nowIso: string = new Date().toISOString()
): boolean => {
  if (!business) return false;
  if (business.subscriptionStatus === 'cancelled' || business.subscriptionStatus === 'expired') {
    return false;
  }
  if (!business.isSubscribed && business.subscriptionStatus !== 'active') {
    return false;
  }

  const expiresAt = resolveBusinessExpiryIso(business);
  if (!expiresAt) {
    return Boolean(business.isSubscribed);
  }

  const nowMs = new Date(nowIso).getTime();
  const expiresMs = new Date(expiresAt).getTime();
  if (isNaN(expiresMs)) return Boolean(business.isSubscribed);

  return nowMs <= expiresMs;
};

/**
 * Centralised entitlement & status evaluator used across AuthContext, Merchant UI, and Admin views.
 * Guarantees that:
 * - Expired subscriptions never grant paid access
 * - Pending or rejected renewal requests do NOT overwrite or terminate a still-valid active subscription
 */
export const evaluateSubscriptionEntitlement = (
  business?: BusinessProfile | null,
  requests: SubscriptionRequest[] = [],
  reminderDays: number = DEFAULT_EXPIRY_REMINDER_DAYS,
  nowIso: string = new Date().toISOString()
): SubscriptionEntitlement => {
  const sortedReqs = [...requests].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const pendingRequest = sortedReqs.find((r) => r.status === 'pending') || null;
  const latestRejectedRequest = sortedReqs.find((r) => r.status === 'rejected') || null;

  if (!business) {
    return {
      hasPaidAccess: false,
      effectiveStatus: pendingRequest ? 'pending' : latestRejectedRequest ? 'rejected' : 'free',
      daysRemaining: null,
      isExpiringSoon: false,
      isExpired: false,
      startsAt: null,
      expiresAt: null,
      planId: null,
      planName: null,
      pendingRequest,
      latestRejectedRequest,
    };
  }

  const startsAt = business.subscriptionStartsAt || business.subscribedAt || null;
  const expiresAt = resolveBusinessExpiryIso(business);
  const planName = business.subscriptionPlan || null;
  const planId =
    business.subscriptionPlanId ||
    (planName?.toLowerCase().includes('q4') ? 'q4_pass' : planName ? 'monthly' : null);

  const nowMs = new Date(nowIso).getTime();
  const expiresMs = expiresAt ? new Date(expiresAt).getTime() : NaN;

  if (business.subscriptionStatus === 'cancelled') {
    return {
      hasPaidAccess: false,
      effectiveStatus: pendingRequest ? 'pending' : 'cancelled',
      daysRemaining: 0,
      isExpiringSoon: false,
      isExpired: false,
      startsAt,
      expiresAt,
      planId,
      planName,
      pendingRequest,
      latestRejectedRequest,
    };
  }

  const hasValidExpiry = !isNaN(expiresMs);
  const isCurrentlyActive =
    (business.isSubscribed || business.subscriptionStatus === 'active') &&
    (!hasValidExpiry || nowMs <= expiresMs);

  if (isCurrentlyActive) {
    const daysRemaining = hasValidExpiry
      ? Math.max(0, Math.ceil((expiresMs - nowMs) / (1000 * 60 * 60 * 24)))
      : 30;
    const isExpiringSoon = daysRemaining <= reminderDays;
    return {
      hasPaidAccess: true,
      effectiveStatus: isExpiringSoon ? 'expiring_soon' : 'active',
      daysRemaining,
      isExpiringSoon,
      isExpired: false,
      startsAt,
      expiresAt,
      planId,
      planName,
      pendingRequest,
      latestRejectedRequest,
    };
  }

  // If the store had an expiry date and it is now in the past, or status is explicitly 'expired'
  const hasExpired =
    business.subscriptionStatus === 'expired' ||
    (hasValidExpiry && nowMs > expiresMs && Boolean(business.isSubscribed || business.subscribedAt || business.subscriptionStartsAt));

  if (hasExpired) {
    return {
      hasPaidAccess: false,
      effectiveStatus: pendingRequest ? 'pending' : 'expired',
      daysRemaining: 0,
      isExpiringSoon: false,
      isExpired: true,
      startsAt,
      expiresAt,
      planId,
      planName,
      pendingRequest,
      latestRejectedRequest,
    };
  }

  if (pendingRequest) {
    return {
      hasPaidAccess: false,
      effectiveStatus: 'pending',
      daysRemaining: null,
      isExpiringSoon: false,
      isExpired: false,
      startsAt: null,
      expiresAt: null,
      planId: pendingRequest.planId,
      planName: pendingRequest.planName,
      pendingRequest,
      latestRejectedRequest,
    };
  }

  if (latestRejectedRequest) {
    return {
      hasPaidAccess: false,
      effectiveStatus: 'rejected',
      daysRemaining: null,
      isExpiringSoon: false,
      isExpired: false,
      startsAt: null,
      expiresAt: null,
      planId: latestRejectedRequest.planId,
      planName: latestRejectedRequest.planName,
      pendingRequest: null,
      latestRejectedRequest,
    };
  }

  return {
    hasPaidAccess: false,
    effectiveStatus: 'free',
    daysRemaining: null,
    isExpiringSoon: false,
    isExpired: false,
    startsAt: null,
    expiresAt: null,
    planId: null,
    planName: null,
    pendingRequest: null,
    latestRejectedRequest: null,
  };
};

/**
 * Record an immutable audit trail event in Firestore `subscription_audit_logs`
 */
export const recordSubscriptionAuditEvent = async (params: {
  businessId: string;
  businessName: string;
  requestId?: string;
  actorId: string;
  actorEmail: string;
  action: SubscriptionAuditAction;
  metadata?: Record<string, any>;
}): Promise<SubscriptionAuditEvent> => {
  const id = `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const timestamp = new Date().toISOString();
  const event: SubscriptionAuditEvent = {
    id,
    businessId: params.businessId,
    businessName: params.businessName,
    requestId: params.requestId || '',
    actorId: params.actorId,
    actorEmail: params.actorEmail,
    action: params.action,
    timestamp,
    metadata: params.metadata || {},
  };

  const docRef = doc(db, 'subscription_audit_logs', id);
  await setDoc(docRef, event);
  return event;
};

/**
 * Fetch subscription audit logs for Admin Dashboard or specific business
 */
export const fetchSubscriptionAuditLogs = async (
  businessId?: string
): Promise<SubscriptionAuditEvent[]> => {
  try {
    const col = collection(db, 'subscription_audit_logs');
    const q = businessId
      ? query(col, where('businessId', '==', businessId))
      : query(col, orderBy('timestamp', 'desc'));
    const snap = await getDocs(q);
    const logs: SubscriptionAuditEvent[] = [];
    snap.forEach((d) => logs.push(d.data() as SubscriptionAuditEvent));
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (err) {
    console.warn('Could not load subscription audit logs:', err);
    return [];
  }
};

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
 * Fetch official receiving bank account and plan configuration
 */
export const fetchPlatformBankConfig = async (): Promise<PlatformBankConfig> => {
  try {
    localStorage.removeItem('marketmate_platform_bank_config_v1');
    localStorage.removeItem('marketmate_platform_bank_config_v2');
  } catch {}

  try {
    const configDocRef = doc(db, 'platform_config', 'subscription_bank');
    const snap = await getDoc(configDocRef);
    if (snap.exists()) {
      const data = snap.data() as Partial<PlatformBankConfig>;
      const isLegacyAccount =
        data.accountNumber === '6110157178' ||
        data.bankName?.toLowerCase() === 'opay' ||
        data.accountName?.toUpperCase().includes('OGHENEOVO');

      const resolvedMonthly =
        typeof data.monthlyPlanPrice === 'number' && data.monthlyPlanPrice > 0
          ? data.monthlyPlanPrice
          : DEFAULT_PLATFORM_BANK.monthlyPlanPrice;
      const resolvedQ4 =
        typeof data.q4PassPrice === 'number' && data.q4PassPrice > 0
          ? data.q4PassPrice
          : typeof data.annualPlanPrice === 'number' && data.annualPlanPrice > 0
          ? data.annualPlanPrice
          : DEFAULT_PLATFORM_BANK.q4PassPrice;

      const normalized: PlatformBankConfig = {
        ...DEFAULT_PLATFORM_BANK,
        ...data,
        bankName: isLegacyAccount
          ? DEFAULT_PLATFORM_BANK.bankName
          : data.bankName || DEFAULT_PLATFORM_BANK.bankName,
        accountNumber: isLegacyAccount
          ? DEFAULT_PLATFORM_BANK.accountNumber
          : data.accountNumber || DEFAULT_PLATFORM_BANK.accountNumber,
        accountName: isLegacyAccount
          ? DEFAULT_PLATFORM_BANK.accountName
          : data.accountName || DEFAULT_PLATFORM_BANK.accountName,
        monthlyPlanPrice: resolvedMonthly,
        q4PassPrice: resolvedQ4,
        annualPlanPrice: resolvedQ4,
        q4PromoEnabled: data.q4PromoEnabled !== undefined ? data.q4PromoEnabled : true,
        expiryReminderDays:
          typeof data.expiryReminderDays === 'number' && data.expiryReminderDays > 0
            ? data.expiryReminderDays
            : DEFAULT_EXPIRY_REMINDER_DAYS,
      };

      localStorage.setItem(STORAGE_PLATFORM_BANK_KEY, JSON.stringify(normalized));
      return normalized;
    }
  } catch (err) {
    console.warn('Could not fetch remote platform bank config, checking local fallback:', err);
  }

  try {
    const localStr = localStorage.getItem(STORAGE_PLATFORM_BANK_KEY);
    if (localStr) {
      const parsed = JSON.parse(localStr);
      const normalized: PlatformBankConfig = {
        ...DEFAULT_PLATFORM_BANK,
        ...parsed,
        q4PassPrice: parsed.q4PassPrice ?? parsed.annualPlanPrice ?? DEFAULT_PLATFORM_BANK.q4PassPrice,
        annualPlanPrice: parsed.q4PassPrice ?? parsed.annualPlanPrice ?? DEFAULT_PLATFORM_BANK.q4PassPrice,
      };
      return normalized;
    }
  } catch {}

  return DEFAULT_PLATFORM_BANK;
};

/**
 * Super Admin updates official receiving bank account and pricing
 * Throws on Firestore write failure so Admin UI never reports false success.
 */
export const updatePlatformBankConfig = async (
  config: Partial<PlatformBankConfig>
): Promise<PlatformBankConfig> => {
  const current = await fetchPlatformBankConfig();
  const resolvedQ4Price =
    config.q4PassPrice !== undefined
      ? Number(config.q4PassPrice)
      : config.annualPlanPrice !== undefined
      ? Number(config.annualPlanPrice)
      : current.q4PassPrice;

  const updated: PlatformBankConfig = {
    ...current,
    ...config,
    monthlyPlanPrice:
      config.monthlyPlanPrice !== undefined
        ? Number(config.monthlyPlanPrice)
        : current.monthlyPlanPrice,
    q4PassPrice: resolvedQ4Price,
    annualPlanPrice: resolvedQ4Price,
    updatedAt: new Date().toISOString(),
  };

  const configDocRef = doc(db, 'platform_config', 'subscription_bank');
  await setDoc(configDocRef, updated, { merge: true });

  try {
    localStorage.setItem(STORAGE_PLATFORM_BANK_KEY, JSON.stringify(updated));
  } catch {}

  return updated;
};

/**
 * Merchant submits payment proof of bank transfer.
 * - Validates required fields and prevents duplicate pending requests for the same business.
 * - Writes to Firestore `subscription_requests` and throws on failure (never swallows write errors).
 */
export const submitSubscriptionPayment = async (data: {
  businessId: string;
  businessName: string;
  userId: string;
  userEmail: string;
  ownerName?: string;
  phone?: string;
  planId: 'monthly' | 'q4_pass' | 'annual' | 'pioneer_launch';
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
  if (!data.businessId || !data.userId) {
    throw new Error('Missing store or user account information. Please sign in and try again.');
  }
  if (!data.senderBank.trim() || !data.senderAccountName.trim()) {
    throw new Error('Please provide both the sender bank name and sender account name.');
  }
  if (!data.paymentReference.trim()) {
    throw new Error('Payment reference is required.');
  }

  // Check if an unresolved pending request already exists for this business
  const existingCol = collection(db, 'subscription_requests');
  const existingQuery = query(existingCol, where('businessId', '==', data.businessId));
  const existingSnap = await getDocs(existingQuery);
  const hasPending = existingSnap.docs.some((d) => d.data()?.status === 'pending');
  if (hasPending) {
    throw new Error(
      'You already have a pending payment verification request for this store. Please wait for admin review before submitting another request.'
    );
  }

  const normalizedPlanId = data.planId === 'annual' ? 'q4_pass' : data.planId;
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
    planId: normalizedPlanId,
    planName: data.planName,
    planOriginalPrice: data.planOriginalPrice,
    discountPercent: data.discountPercent,
    finalAmount: data.finalAmount,
    amount: data.finalAmount,
    currency: data.currency || 'NGN',
    senderBank: data.senderBank.trim(),
    senderAccountName: data.senderAccountName.trim(),
    paymentReference: data.paymentReference.trim(),
    transferReference: data.paymentReference.trim(),
    proofNote: data.proofNote?.trim() || '',
    paymentNote: data.proofNote?.trim() || '',
    proofImageUrl: data.proofImageUrl || '',
    status: 'pending',
    submittedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  // 1. Save to Firestore (strictly throw on error — do NOT report false success)
  const docRef = doc(db, 'subscription_requests', reqId);
  await setDoc(docRef, record);

  // 2. Record audit event
  try {
    await recordSubscriptionAuditEvent({
      businessId: data.businessId,
      businessName: data.businessName,
      requestId: reqId,
      actorId: data.userId,
      actorEmail: data.userEmail,
      action: 'subscription_request_submitted',
      metadata: {
        planId: normalizedPlanId,
        planName: data.planName,
        amount: data.finalAmount,
        transferReference: record.paymentReference,
        senderBank: record.senderBank,
      },
    });
  } catch (auditErr) {
    console.warn('Could not write submission audit log:', auditErr);
  }

  // 3. Cache in localStorage for fast UI rendering
  try {
    const raw = localStorage.getItem(STORAGE_SUBSCRIPTION_REQUESTS_KEY);
    const list: SubscriptionRequest[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((r) => r.id !== record.id);
    filtered.unshift(record);
    localStorage.setItem(STORAGE_SUBSCRIPTION_REQUESTS_KEY, JSON.stringify(filtered));
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
    console.warn('Firestore fetch subscription requests error:', err);
  }

  return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

/**
 * Super Admin approves a subscription bank transfer atomically:
 * - Verifies admin authorisation
 * - Atomically verifies request status (idempotent: cannot approve an already-approved request twice)
 * - Calculates start and expiry dates in Africa/Lagos timezone (extending from current expiry if renewing early)
 * - Updates `subscription_requests/{id}`, `businesses/{businessId}`, and `subscription_audit_logs`
 * - Throws on any database failure so the UI never displays false success
 */
export const approveSubscriptionPayment = async (
  request: SubscriptionRequest,
  adminEmail: string
): Promise<{
  startsAt: string;
  expiresAt: string;
  isRenewal: boolean;
}> => {
  if (!isSuperAdminEmail(adminEmail)) {
    throw new Error('Unauthorised: Only an authorised MarketMate Super Admin can approve subscription payments.');
  }

  const now = new Date().toISOString();
  const reqDocRef = doc(db, 'subscription_requests', request.id);
  const bizDocRef = doc(db, 'businesses', request.businessId);
  const auditId = `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const auditDocRef = doc(db, 'subscription_audit_logs', auditId);

  const result = await runTransaction(db, async (transaction) => {
    const reqSnap = await transaction.get(reqDocRef);
    if (!reqSnap.exists()) {
      throw new Error(`Subscription request #${request.id} does not exist in Firestore.`);
    }

    const currentReq = reqSnap.data() as SubscriptionRequest;
    if (currentReq.status === 'approved') {
      throw new Error('This payment request has already been approved. Duplicate approval prevented.');
    }

    const bizSnap = await transaction.get(bizDocRef);
    const bizData = bizSnap.exists() ? (bizSnap.data() as BusinessProfile) : null;
    const existingExpiresAt = resolveBusinessExpiryIso(bizData);

    const normalizedPlanId = currentReq.planId === 'annual' ? 'q4_pass' : currentReq.planId;
    const { startsAt, expiresAt, isRenewal } = calculateSubscriptionPeriod(
      normalizedPlanId,
      now,
      existingExpiresAt
    );

    transaction.update(reqDocRef, {
      status: 'approved',
      reviewedBy: adminEmail,
      reviewedAt: now,
      grantedStartsAt: startsAt,
      grantedExpiresAt: expiresAt,
      updatedAt: now,
    });

    const businessUpdatePayload = {
      isSubscribed: true,
      subscriptionStatus: 'active',
      subscriptionPlan: currentReq.planName,
      subscriptionPlanId: normalizedPlanId,
      isFoundingMerchant: true,
      subscribedAt: now,
      subscriptionStartsAt: startsAt,
      subscriptionExpiresAt: expiresAt,
      lastSubscriptionRequestId: currentReq.id,
      subscriptionUpdatedAt: now,
      subscriptionUpdatedBy: adminEmail,
      subscriptionDiscountPercent: currentReq.discountPercent || 0,
      updatedAt: now,
    };

    if (bizSnap.exists()) {
      transaction.update(bizDocRef, businessUpdatePayload);
    } else {
      transaction.set(
        bizDocRef,
        {
          id: currentReq.businessId,
          userId: currentReq.userId,
          businessName: currentReq.businessName,
          createdAt: now,
          ...businessUpdatePayload,
        },
        { merge: true }
      );
    }

    const auditAction: SubscriptionAuditAction = isRenewal
      ? 'subscription_renewed'
      : 'subscription_payment_approved';

    const auditEvent: SubscriptionAuditEvent = {
      id: auditId,
      businessId: currentReq.businessId,
      businessName: currentReq.businessName,
      requestId: currentReq.id,
      actorId: auth.currentUser?.uid || adminEmail,
      actorEmail: adminEmail,
      action: auditAction,
      timestamp: now,
      metadata: {
        planId: normalizedPlanId,
        planName: currentReq.planName,
        amount: currentReq.finalAmount,
        transferReference: currentReq.paymentReference,
        startsAt,
        expiresAt,
        isRenewal,
      },
    };
    transaction.set(auditDocRef, auditEvent);

    return { startsAt, expiresAt, isRenewal };
  });

  // Update localStorage cache of business if this store is active locally
  try {
    const savedBizStr = localStorage.getItem('marketmate_active_business_v1');
    if (savedBizStr) {
      const b = JSON.parse(savedBizStr);
      if (b.id === request.businessId) {
        b.isSubscribed = true;
        b.subscriptionStatus = 'active';
        b.subscriptionPlan = request.planName;
        b.subscriptionPlanId = request.planId === 'annual' ? 'q4_pass' : request.planId;
        b.subscribedAt = now;
        b.subscriptionStartsAt = result.startsAt;
        b.subscriptionExpiresAt = result.expiresAt;
        b.lastSubscriptionRequestId = request.id;
        b.subscriptionUpdatedAt = now;
        b.subscriptionUpdatedBy = adminEmail;
        localStorage.setItem('marketmate_active_business_v1', JSON.stringify(b));
      }
    }
  } catch {}

  // Qualify referral reward for their referrer
  try {
    await recordReferralSubscription(request.userId, request.planName);
  } catch (refErr) {
    console.warn('Qualifying referral subscription error:', refErr);
  }

  const formattedStart = formatLagosDate(result.startsAt);
  const formattedExpiry = formatLagosDate(result.expiresAt);

  // Notify the merchant with an in-app platform announcement
  try {
    const announcementId = `msg_sub_approved_${request.id}`;
    const annDocRef = doc(db, 'platform_announcements', announcementId);
    await setDoc(annDocRef, {
      id: announcementId,
      title: result.isRenewal
        ? '🎉 Subscription Renewal Approved!'
        : '🎉 Subscription Payment Approved & Active!',
      content: `Hello ${request.ownerName || request.businessName},\n\nYour bank transfer of ₦${request.finalAmount.toLocaleString()} for "${request.planName}" has been verified and approved by MarketMate Admin.\n\n• Active From: ${formattedStart}\n• Valid Until: ${formattedExpiry} (WAT)\n\nAll MarketMate Pro features are unlocked for your store.`,
      type: 'direct',
      targetBusinessId: request.businessId,
      targetBusinessName: request.businessName,
      targetEmail: request.userEmail,
      channel: 'in_app',
      priority: 'important',
      actionUrl: 'subscribe',
      actionLabel: 'View Subscription',
      createdAt: now,
      readBy: [],
    });
  } catch (msgErr) {
    console.warn('Could not post subscription approval announcement:', msgErr);
  }

  // Trigger automated confirmation email with start and expiry dates
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
        startsAt: formattedStart,
        expiresAt: formattedExpiry,
      }),
    }).catch((e) => console.warn('Subscription approval email trigger warning:', e));
  }

  return result;
};

/**
 * Super Admin rejects a subscription bank transfer with a reason.
 * - Requires a non-empty rejection reason.
 * - Does NOT overwrite or terminate a separate, still-valid subscription on the business.
 * - Throws if the Firestore write fails.
 */
export const rejectSubscriptionPayment = async (
  request: SubscriptionRequest,
  reason: string,
  adminEmail: string
): Promise<boolean> => {
  if (!isSuperAdminEmail(adminEmail)) {
    throw new Error('Unauthorised: Only an authorised MarketMate Super Admin can reject subscription payments.');
  }

  const trimmedReason = reason.trim();
  if (!trimmedReason) {
    throw new Error('A rejection reason is required so the merchant knows how to resolve the issue.');
  }

  const now = new Date().toISOString();
  const reqDocRef = doc(db, 'subscription_requests', request.id);
  const auditId = `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const auditDocRef = doc(db, 'subscription_audit_logs', auditId);

  await runTransaction(db, async (transaction) => {
    const reqSnap = await transaction.get(reqDocRef);
    if (!reqSnap.exists()) {
      throw new Error(`Subscription request #${request.id} was not found.`);
    }

    const currentReq = reqSnap.data() as SubscriptionRequest;
    if (currentReq.status === 'approved') {
      throw new Error(
        'Cannot reject a request that has already been approved. Use Cancel/Revoke Subscription instead.'
      );
    }

    transaction.update(reqDocRef, {
      status: 'rejected',
      rejectionReason: trimmedReason,
      reviewedBy: adminEmail,
      reviewedAt: now,
      updatedAt: now,
    });

    const auditEvent: SubscriptionAuditEvent = {
      id: auditId,
      businessId: currentReq.businessId,
      businessName: currentReq.businessName,
      requestId: currentReq.id,
      actorId: auth.currentUser?.uid || adminEmail,
      actorEmail: adminEmail,
      action: 'subscription_payment_rejected',
      timestamp: now,
      metadata: {
        planId: currentReq.planId,
        planName: currentReq.planName,
        amount: currentReq.finalAmount,
        transferReference: currentReq.paymentReference,
        rejectionReason: trimmedReason,
      },
    };
    transaction.set(auditDocRef, auditEvent);
  });

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
        reason: trimmedReason,
      }),
    }).catch((e) => console.warn('Subscription rejection email trigger warning:', e));
  }

  // Notify merchant in-app
  try {
    const announcementId = `msg_sub_rejected_${request.id}`;
    const annDocRef = doc(db, 'platform_announcements', announcementId);
    await setDoc(annDocRef, {
      id: announcementId,
      title: '⚠️ Update on Your Subscription Payment Submission',
      content: `Hello ${request.ownerName || request.businessName},\n\nWe reviewed your bank transfer submission (Ref: ${request.paymentReference}) for ₦${request.finalAmount.toLocaleString()}.\n\nAdmin Note: "${trimmedReason}"\n\nPlease review your transfer details and submit a new verification request or reach out to MarketMate Support.`,
      type: 'direct',
      targetBusinessId: request.businessId,
      targetBusinessName: request.businessName,
      targetEmail: request.userEmail,
      channel: 'in_app',
      priority: 'urgent',
      actionUrl: 'subscribe',
      actionLabel: 'Review & Resubmit',
      createdAt: now,
      readBy: [],
    });
  } catch (msgErr) {
    console.warn('Could not post subscription rejection announcement:', msgErr);
  }

  return true;
};

/**
 * Super Admin manually extends or grants a business subscription (e.g. +1 month or Q4 Pass)
 */
export const extendBusinessSubscription = async (params: {
  businessId: string;
  businessName: string;
  ownerEmail?: string;
  ownerName?: string;
  planId: 'monthly' | 'q4_pass';
  reason: string;
  adminEmail: string;
}): Promise<{ startsAt: string; expiresAt: string }> => {
  if (!isSuperAdminEmail(params.adminEmail)) {
    throw new Error('Unauthorised: Only a Super Admin can manually extend a subscription.');
  }

  const now = new Date().toISOString();
  const bizDocRef = doc(db, 'businesses', params.businessId);
  const auditId = `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const auditDocRef = doc(db, 'subscription_audit_logs', auditId);

  const planName =
    params.planId === 'q4_pass'
      ? 'October–December 2026 Promotional Q4 Package (₦3,000)'
      : 'MarketMate Monthly Plan (₦1,000)';

  const result = await runTransaction(db, async (transaction) => {
    const bizSnap = await transaction.get(bizDocRef);
    if (!bizSnap.exists()) {
      throw new Error('Business profile not found in Firestore.');
    }

    const bizData = bizSnap.data() as BusinessProfile;
    const currentExpiresAt = resolveBusinessExpiryIso(bizData);
    const { startsAt, expiresAt } = calculateSubscriptionPeriod(
      params.planId,
      now,
      currentExpiresAt
    );

    transaction.update(bizDocRef, {
      isSubscribed: true,
      subscriptionStatus: 'active',
      subscriptionPlan: planName,
      subscriptionPlanId: params.planId,
      subscribedAt: bizData.subscribedAt || now,
      subscriptionStartsAt: startsAt,
      subscriptionExpiresAt: expiresAt,
      subscriptionUpdatedAt: now,
      subscriptionUpdatedBy: params.adminEmail,
      updatedAt: now,
    });

    const auditEvent: SubscriptionAuditEvent = {
      id: auditId,
      businessId: params.businessId,
      businessName: params.businessName,
      actorId: auth.currentUser?.uid || params.adminEmail,
      actorEmail: params.adminEmail,
      action: 'subscription_extended',
      timestamp: now,
      metadata: {
        planId: params.planId,
        planName,
        startsAt,
        expiresAt,
        reason: params.reason.trim() || 'Manual extension by Admin',
      },
    };
    transaction.set(auditDocRef, auditEvent);

    return { startsAt, expiresAt };
  });

  // Notify merchant in-app
  try {
    const announcementId = `msg_sub_extended_${params.businessId}_${Date.now()}`;
    await setDoc(doc(db, 'platform_announcements', announcementId), {
      id: announcementId,
      title: '🎉 Your Store Subscription Has Been Extended!',
      content: `Hello ${params.ownerName || params.businessName},\n\nYour MarketMate Pro subscription (${planName}) has been extended by MarketMate Admin.\n\n• Active Until: ${formatLagosDate(result.expiresAt)} (WAT)\n• Note: ${params.reason.trim() || 'Admin subscription extension'}`,
      type: 'direct',
      targetBusinessId: params.businessId,
      targetBusinessName: params.businessName,
      targetEmail: params.ownerEmail || '',
      channel: 'in_app',
      priority: 'important',
      actionUrl: 'subscribe',
      actionLabel: 'View Subscription',
      createdAt: now,
      readBy: [],
    });
  } catch {}

  return result;
};

/**
 * Super Admin manually cancels or revokes a store's active subscription
 * (Merchant data remains 100% intact; paid Pro entitlement is removed).
 */
export const cancelBusinessSubscription = async (params: {
  businessId: string;
  businessName: string;
  ownerEmail?: string;
  ownerName?: string;
  reason: string;
  adminEmail: string;
}): Promise<void> => {
  if (!isSuperAdminEmail(params.adminEmail)) {
    throw new Error('Unauthorised: Only a Super Admin can cancel or revoke a subscription.');
  }
  const trimmedReason = params.reason.trim();
  if (!trimmedReason) {
    throw new Error('Please provide a reason for cancelling/revoking this subscription.');
  }

  const now = new Date().toISOString();
  const bizDocRef = doc(db, 'businesses', params.businessId);
  const auditId = `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const auditDocRef = doc(db, 'subscription_audit_logs', auditId);

  await runTransaction(db, async (transaction) => {
    const bizSnap = await transaction.get(bizDocRef);
    if (!bizSnap.exists()) {
      throw new Error('Business profile not found in Firestore.');
    }

    transaction.update(bizDocRef, {
      isSubscribed: false,
      subscriptionStatus: 'cancelled',
      subscriptionExpiresAt: now,
      subscriptionUpdatedAt: now,
      subscriptionUpdatedBy: params.adminEmail,
      updatedAt: now,
    });

    const auditEvent: SubscriptionAuditEvent = {
      id: auditId,
      businessId: params.businessId,
      businessName: params.businessName,
      actorId: auth.currentUser?.uid || params.adminEmail,
      actorEmail: params.adminEmail,
      action: 'subscription_cancelled',
      timestamp: now,
      metadata: {
        reason: trimmedReason,
      },
    };
    transaction.set(auditDocRef, auditEvent);
  });

  // Notify merchant in-app
  try {
    const announcementId = `msg_sub_cancelled_${params.businessId}_${Date.now()}`;
    await setDoc(doc(db, 'platform_announcements', announcementId), {
      id: announcementId,
      title: 'ℹ️ Your MarketMate Pro Subscription Status Changed',
      content: `Hello ${params.ownerName || params.businessName},\n\nYour MarketMate Pro subscription has been marked as cancelled/inactive.\n\nReason: "${trimmedReason}"\n\nAll your store records, sales, products, and customer history remain completely safe. You can renew your subscription at any time.`,
      type: 'direct',
      targetBusinessId: params.businessId,
      targetBusinessName: params.businessName,
      targetEmail: params.ownerEmail || '',
      channel: 'in_app',
      priority: 'important',
      actionUrl: 'subscribe',
      actionLabel: 'Renew Subscription',
      createdAt: now,
      readBy: [],
    });
  } catch {}
};

/**
 * Idempotent Lifecycle Sweep:
 * Evaluates all businesses for:
 * 1. Subscriptions that have passed `subscriptionExpiresAt` -> transitions them to `expired`, sets `isSubscribed: false`, logs `subscription_expired`, and notifies merchant once.
 * 2. Active subscriptions within 7, 3, or 1 days of expiry -> sends idempotent reminder notification + email once per milestone.
 */
export const processSubscriptionLifecycleSweep = async (
  actorEmail: string = 'system@getmarketmate.online'
): Promise<{
  checkedCount: number;
  expiredCount: number;
  remindersSentCount: number;
}> => {
  const now = new Date();
  const nowIso = now.toISOString();
  const nowMs = now.getTime();

  const bizSnap = await getDocs(collection(db, 'businesses'));
  let checkedCount = 0;
  let expiredCount = 0;
  let remindersSentCount = 0;

  for (const docSnap of bizSnap.docs) {
    checkedCount++;
    const biz = { id: docSnap.id, ...(docSnap.data() as Omit<BusinessProfile, 'id'>) };
    const expiresAt = resolveBusinessExpiryIso(biz);
    if (!expiresAt) continue;

    const expiresMs = new Date(expiresAt).getTime();
    if (isNaN(expiresMs)) continue;

    const sentReminders: string[] = Array.isArray(biz.sentExpiryReminders)
      ? biz.sentExpiryReminders
      : [];

    // Case 1: Subscription has expired
    if ((biz.isSubscribed || biz.subscriptionStatus === 'active') && nowMs > expiresMs) {
      const expiryKey = `expired_${expiresAt}`;
      await updateDoc(doc(db, 'businesses', biz.id), {
        isSubscribed: false,
        subscriptionStatus: 'expired',
        subscriptionExpiresAt: expiresAt,
        subscriptionUpdatedAt: nowIso,
        subscriptionUpdatedBy: actorEmail,
        sentExpiryReminders: arrayUnion(expiryKey),
        updatedAt: nowIso,
      });

      await recordSubscriptionAuditEvent({
        businessId: biz.id,
        businessName: biz.businessName || 'Store',
        actorId: 'system_lifecycle',
        actorEmail,
        action: 'subscription_expired',
        metadata: {
          expiresAt,
          planName: biz.subscriptionPlan || 'MarketMate Pro',
        },
      });

      if (!sentReminders.includes(expiryKey)) {
        const formattedExpiry = formatLagosDate(expiresAt);
        const annId = `msg_sub_expired_${biz.id}_${expiresMs}`;
        await setDoc(doc(db, 'platform_announcements', annId), {
          id: annId,
          title: '⏰ Your MarketMate Pro Subscription Has Expired',
          content: `Hello ${biz.ownerName || biz.businessName},\n\nYour MarketMate Pro subscription expired on ${formattedExpiry}. Your store data, sales history, and inventory are 100% safe. Renew your subscription anytime (₦1,000/month or ₦3,000 Q4 Pass) to restore full Pro access.`,
          type: 'direct',
          targetBusinessId: biz.id,
          targetBusinessName: biz.businessName,
          targetEmail: biz.email || '',
          channel: 'in_app',
          priority: 'urgent',
          actionUrl: 'subscribe',
          actionLabel: 'Renew Now',
          createdAt: nowIso,
          readBy: [],
        }).catch(() => {});

        if (biz.email && biz.email.includes('@')) {
          fetch('/api/email/subscription-reminder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: biz.email,
              ownerName: biz.ownerName,
              businessName: biz.businessName,
              planName: biz.subscriptionPlan || 'MarketMate Pro',
              expiresAt: formattedExpiry,
              daysRemaining: 0,
              isExpired: true,
            }),
          }).catch(() => {});
        }
      }

      expiredCount++;
      continue;
    }

    // Case 2: Active subscription approaching expiry (check 7d, 3d, 1d milestones)
    if ((biz.isSubscribed || biz.subscriptionStatus === 'active') && nowMs <= expiresMs) {
      const daysLeft = Math.ceil((expiresMs - nowMs) / (1000 * 60 * 60 * 24));
      const milestone =
        daysLeft === 1 ? 1 : daysLeft <= 3 && daysLeft > 1 ? 3 : daysLeft <= 7 && daysLeft > 3 ? 7 : null;

      if (milestone !== null) {
        const reminderKey = `reminder_${milestone}d_${expiresAt}`;
        if (!sentReminders.includes(reminderKey)) {
          const formattedExpiry = formatLagosDate(expiresAt);
          await updateDoc(doc(db, 'businesses', biz.id), {
            sentExpiryReminders: arrayUnion(reminderKey),
          });

          const annId = `msg_sub_rem_${milestone}d_${biz.id}_${expiresMs}`;
          await setDoc(doc(db, 'platform_announcements', annId), {
            id: annId,
            title: `⏳ Subscription Renewal Reminder (${daysLeft} ${daysLeft === 1 ? 'Day' : 'Days'} Left)`,
            content: `Hello ${biz.ownerName || biz.businessName},\n\nYour MarketMate Pro subscription (${biz.subscriptionPlan || 'Pro Plan'}) will expire on ${formattedExpiry} (${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} remaining).\n\nRenew early to keep uninterrupted access — your new period will start automatically after your current expiry date so you never lose any paid days!`,
            type: 'direct',
            targetBusinessId: biz.id,
            targetBusinessName: biz.businessName,
            targetEmail: biz.email || '',
            channel: 'in_app',
            priority: daysLeft <= 3 ? 'urgent' : 'important',
            actionUrl: 'subscribe',
            actionLabel: 'Renew Early',
            createdAt: nowIso,
            readBy: [],
          }).catch(() => {});

          if (biz.email && biz.email.includes('@')) {
            fetch('/api/email/subscription-reminder', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: biz.email,
                ownerName: biz.ownerName,
                businessName: biz.businessName,
                planName: biz.subscriptionPlan || 'MarketMate Pro',
                expiresAt: formattedExpiry,
                daysRemaining: daysLeft,
                isExpired: false,
              }),
            }).catch(() => {});
          }

          remindersSentCount++;
        }
      }
    }
  }

  return {
    checkedCount,
    expiredCount,
    remindersSentCount,
  };
};
