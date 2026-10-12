import { ReferralRecord } from '../types';
import { db, collection, query, where, getDocs, doc, setDoc, updateDoc } from './firebase';

export const REFERRAL_CAMPAIGN = {
  discountPercent: 5,
  startDate: '2026-10-12',
  endDate: '2026-10-30',
  title: 'MarketMate Pioneer Referral Campaign',
  headline: 'Refer a Business to Register & Subscribe — Earn 5% Off',
  durationText: 'October 12th – October 30th, 2026',
  description:
    'Share your referral link with fellow merchants. When they register their store AND subscribe to MarketMate, you unlock a 5% discount on your subscription valid throughout the launch window (Oct 12 – 30, 2026).',
};

const STORAGE_PENDING_REF_KEY = 'marketmate_pending_referral_code';
const STORAGE_LOCAL_REFERRALS_KEY = 'marketmate_local_referrals_cache';

/**
 * Generate a deterministic, human-readable referral code from a user ID
 * e.g., 'MM-A4F79C'
 */
export const getReferralCodeForUser = (userId?: string | null): string => {
  if (!userId) return 'MM-GROW26';
  // Strip non-alphanumeric chars and take 6 characters
  const cleanId = userId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const sub = cleanId.slice(0, 6).padEnd(6, 'X');
  return `MM-${sub}`;
};

/**
 * Generate the full sharable URL with ?ref=CODE
 */
export const getReferralShareUrl = (code: string): string => {
  if (typeof window !== 'undefined') {
    // Retain localhost for local testing
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `${window.location.origin}/?ref=${encodeURIComponent(code)}`;
    }
  }
  // Production official domain
  return `https://getmarketmate.online/?ref=${encodeURIComponent(code)}`;
};

/**
 * Compose a high-converting WhatsApp message emphasizing registration + subscription
 */
export const getWhatsAppShareMessage = (code: string, merchantName?: string): string => {
  const shareUrl = getReferralShareUrl(code);
  const senderPrefix = merchantName ? `Hey! This is ${merchantName}. ` : 'Hey! ';
  return `${senderPrefix}I manage my store sales, daily inventory, and instant receipts with MarketMate.

Register and subscribe to MarketMate using my referral link:
${shareUrl}

🎁 Special Launch Offer: When you register and subscribe to MarketMate, we unlock a 5% discount on our subscription (valid from October 12th to October 30th, 2026)!`;
};

/**
 * Detect ref from current URL query parameters and cache in localStorage
 */
export const detectAndStoreReferralCode = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref') || urlParams.get('r');
    if (ref && ref.trim()) {
      const cleanRef = ref.trim().toUpperCase();
      localStorage.setItem(STORAGE_PENDING_REF_KEY, cleanRef);
      return cleanRef;
    }
    return localStorage.getItem(STORAGE_PENDING_REF_KEY);
  } catch (err) {
    console.warn('Error reading referral params:', err);
    return null;
  }
};

export const getPendingReferralCode = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(STORAGE_PENDING_REF_KEY);
  } catch {
    return null;
  }
};

export const clearPendingReferralCode = (): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_PENDING_REF_KEY);
  } catch (err) {
    console.warn('Error clearing pending referral code:', err);
  }
};

/**
 * Record a referral when a new merchant completes registration.
 * Initially, status is 'pending_subscription' and referredSubscribed is false,
 * unless they immediately subscribe upon registration.
 */
export const recordReferralSignup = async (params: {
  referrerCode: string;
  referredUserId: string;
  referredUserEmail?: string;
  referredBusinessName?: string;
  isSubscribed?: boolean;
  subscriptionPlan?: string;
}): Promise<ReferralRecord | null> => {
  const cleanCode = params.referrerCode.trim().toUpperCase();
  if (!cleanCode || !params.referredUserId) return null;

  const referralId = `ref_${params.referredUserId}_${cleanCode.replace(/[^A-Z0-9]/g, '')}`;
  const isSubscribed = Boolean(params.isSubscribed);

  const record: ReferralRecord = {
    id: referralId,
    referrerCode: cleanCode,
    referredUserId: params.referredUserId,
    referredUserEmail: params.referredUserEmail || '',
    referredBusinessName: params.referredBusinessName || 'New Store',
    discountPercent: REFERRAL_CAMPAIGN.discountPercent, // 5%
    campaign: REFERRAL_CAMPAIGN.title,
    validFrom: REFERRAL_CAMPAIGN.startDate, // '2026-10-12'
    validUntil: REFERRAL_CAMPAIGN.endDate, // '2026-10-30'
    status: isSubscribed ? 'qualified' : 'pending_subscription',
    referredSubscribed: isSubscribed,
    subscribedAt: isSubscribed ? new Date().toISOString() : undefined,
    subscriptionPlan: isSubscribed ? params.subscriptionPlan || 'Pioneer Standard' : undefined,
    createdAt: new Date().toISOString(),
  };

  // 1. Try writing to Firestore
  try {
    const refDoc = doc(db, 'referrals', referralId);
    await setDoc(refDoc, record, { merge: true });
  } catch (err) {
    console.warn('Could not save referral to Firestore (will save locally):', err);
  }

  // 2. Also cache in localStorage
  try {
    const existingCacheRaw = localStorage.getItem(STORAGE_LOCAL_REFERRALS_KEY);
    const list: ReferralRecord[] = existingCacheRaw ? JSON.parse(existingCacheRaw) : [];
    const idx = list.findIndex((item) => item.id === record.id);
    if (idx >= 0) {
      list[idx] = record;
    } else {
      list.push(record);
    }
    localStorage.setItem(STORAGE_LOCAL_REFERRALS_KEY, JSON.stringify(list));
  } catch (localErr) {
    console.warn('Local referral cache write error:', localErr);
  }

  // Clear the pending code once registered
  clearPendingReferralCode();
  return record;
};

/**
 * When a merchant actually subscribes to MarketMate, call this to activate
 * the referral so that the referrer earns their 5% subscription discount.
 */
export const recordReferralSubscription = async (
  referredUserId: string,
  planName: string = 'Pioneer Standard'
): Promise<ReferralRecord | null> => {
  if (!referredUserId) return null;

  let updatedRecord: ReferralRecord | null = null;
  const now = new Date().toISOString();

  // 1. Update in Firestore by querying referredUserId
  try {
    const col = collection(db, 'referrals');
    const q = query(col, where('referredUserId', '==', referredUserId));
    const snap = await getDocs(q);

    for (const docItem of snap.docs) {
      const data = docItem.data() as ReferralRecord;
      const patch = {
        referredSubscribed: true,
        status: 'qualified',
        subscribedAt: now,
        subscriptionPlan: planName,
      };
      await updateDoc(docItem.ref, patch);
      updatedRecord = { ...data, ...patch, status: 'qualified' };
    }
  } catch (err) {
    console.warn('Firestore update referral subscription error:', err);
  }

  // 2. Update local storage cache
  try {
    const cachedRaw = localStorage.getItem(STORAGE_LOCAL_REFERRALS_KEY);
    if (cachedRaw) {
      const list: ReferralRecord[] = JSON.parse(cachedRaw);
      let changed = false;
      const updatedList = list.map((item) => {
        if (item.referredUserId === referredUserId) {
          changed = true;
          const patched = {
            ...item,
            referredSubscribed: true,
            status: 'qualified' as const,
            subscribedAt: now,
            subscriptionPlan: planName,
          };
          if (!updatedRecord) updatedRecord = patched;
          return patched;
        }
        return item;
      });
      if (changed) {
        localStorage.setItem(STORAGE_LOCAL_REFERRALS_KEY, JSON.stringify(updatedList));
      }
    }
  } catch (localErr) {
    console.warn('Local cache referral subscription error:', localErr);
  }

  return updatedRecord;
};

/**
 * Super Admin toggle to manually mark/unmark a referred store as subscribed
 */
export const updateReferralSubscriptionStatus = async (
  referralId: string,
  isSubscribed: boolean,
  planName: string = 'Pioneer Standard'
): Promise<boolean> => {
  const now = new Date().toISOString();
  const patch = {
    referredSubscribed: isSubscribed,
    status: isSubscribed ? 'qualified' : 'pending_subscription',
    subscribedAt: isSubscribed ? now : null,
    subscriptionPlan: isSubscribed ? planName : null,
  };

  try {
    const refDoc = doc(db, 'referrals', referralId);
    await updateDoc(refDoc, patch);
  } catch (err) {
    console.warn('Firestore update referral status error:', err);
  }

  try {
    const cachedRaw = localStorage.getItem(STORAGE_LOCAL_REFERRALS_KEY);
    if (cachedRaw) {
      const list: ReferralRecord[] = JSON.parse(cachedRaw);
      const updatedList = list.map((item) => {
        if (item.id === referralId) {
          return {
            ...item,
            referredSubscribed: isSubscribed,
            status: (isSubscribed ? 'qualified' : 'pending_subscription') as any,
            subscribedAt: isSubscribed ? now : undefined,
            subscriptionPlan: isSubscribed ? planName : undefined,
          };
        }
        return item;
      });
      localStorage.setItem(STORAGE_LOCAL_REFERRALS_KEY, JSON.stringify(updatedList));
    }
  } catch {}

  return true;
};

/**
 * Fetch referrals belonging to a specific user/code.
 * Total discount is ONLY awarded for referrals where referredSubscribed === true!
 */
export const fetchUserReferrals = async (
  userId: string,
  userCode?: string
): Promise<{
  referrals: ReferralRecord[];
  totalRegistered: number;
  totalSubscribed: number;
  pendingCount: number;
  totalDiscountPercent: number;
}> => {
  const code = userCode || getReferralCodeForUser(userId);
  const results: ReferralRecord[] = [];

  // 1. Fetch from Firestore
  try {
    const col = collection(db, 'referrals');
    const q = query(col, where('referrerCode', '==', code));
    const snap = await getDocs(q);
    snap.forEach((d) => {
      const data = d.data() as ReferralRecord;
      results.push(data);
    });
  } catch (err) {
    console.warn('Firestore fetch referrals warning:', err);
  }

  // 2. Also check local fallback
  try {
    const cachedRaw = localStorage.getItem(STORAGE_LOCAL_REFERRALS_KEY);
    if (cachedRaw) {
      const localList: ReferralRecord[] = JSON.parse(cachedRaw);
      localList.forEach((item) => {
        if (item.referrerCode === code && !results.some((r) => r.id === item.id)) {
          results.push(item);
        }
      });
    }
  } catch (err) {
    console.warn('Local cache check error:', err);
  }

  const totalRegistered = results.length;
  // A referral qualifies for discount ONLY if the merchant registered AND subscribed
  const subscribedReferrals = results.filter((r) => r.referredSubscribed === true || r.status === 'qualified');
  const totalSubscribed = subscribedReferrals.length;
  const pendingCount = Math.max(0, totalRegistered - totalSubscribed);

  // 5% discount per referred merchant who registered AND subscribed
  const totalDiscountPercent = Math.min(totalSubscribed * REFERRAL_CAMPAIGN.discountPercent, 50);

  return {
    referrals: results,
    totalRegistered,
    totalSubscribed,
    pendingCount,
    totalDiscountPercent,
  };
};

/**
 * Fetch all referrals across the platform (for Super Admin)
 */
export const fetchAllReferrals = async (): Promise<ReferralRecord[]> => {
  const list: ReferralRecord[] = [];
  try {
    const col = collection(db, 'referrals');
    const snap = await getDocs(col);
    snap.forEach((d) => {
      list.push(d.data() as ReferralRecord);
    });
  } catch (err) {
    console.warn('Admin fetchAllReferrals error:', err);
  }

  // Merge with local storage if any
  try {
    const cachedRaw = localStorage.getItem(STORAGE_LOCAL_REFERRALS_KEY);
    if (cachedRaw) {
      const localList: ReferralRecord[] = JSON.parse(cachedRaw);
      localList.forEach((item) => {
        if (!list.some((r) => r.id === item.id)) {
          list.push(item);
        }
      });
    }
  } catch {}

  // Sort descending by date
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};
