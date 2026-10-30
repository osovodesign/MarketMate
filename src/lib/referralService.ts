import { ReferralRecord } from '../types';
import { db, collection, query, where, getDocs, getDoc, doc, setDoc, updateDoc } from './firebase';

export const REFERRAL_PROGRAM = {
  id: 'marketmate_permanent_referral',
  rewardPercent: 5,
  discountPercent: 5,
  maxDiscountPercent: 50,
  title: 'MarketMate Referral Programme',
  headline: 'Invite More. Grow Together.',
  supportingText: 'Invite as many business owners as you want. Your referral link never expires.',
  description:
    'Share your MarketMate referral link with other business owners. When someone registers through your link and subscribes to MarketMate, you earn the existing referral reward. Your link stays active, so you can keep inviting more businesses.',
};

// Backwards-compatible alias for any external caller
export const REFERRAL_CAMPAIGN = REFERRAL_PROGRAM;

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
 * Compose a permanent WhatsApp invitation message
 */
export const getWhatsAppShareMessage = (code: string, merchantName?: string): string => {
  const shareUrl = getReferralShareUrl(code);
  const trimmedName = merchantName?.trim();
  const greeting = trimmedName ? `Hey! This is ${trimmedName}.` : 'Hey!';

  return `${greeting}

I use MarketMate to manage my sales, expenses, products and business performance.

You can join MarketMate using my referral link:

${shareUrl}

When you register and subscribe, I can earn a 5% referral discount under MarketMate's referral programme.

The referral programme is always open, so you can join whenever you're ready.`;
};

/**
 * Detect ref from current URL query parameters (?ref= or ?r=) and cache in localStorage
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

export const setPendingReferralCode = (code: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const clean = code.trim().toUpperCase();
    if (clean) {
      localStorage.setItem(STORAGE_PENDING_REF_KEY, clean);
    } else {
      localStorage.removeItem(STORAGE_PENDING_REF_KEY);
    }
  } catch (err) {
    console.warn('Error setting pending referral code:', err);
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
 * Register or update the deterministic referral code -> userId mapping in Firestore
 * so referral records can verifiably link to their owner's UID.
 */
export const ensureReferralCodeMapping = async (params: {
  userId: string;
  email?: string;
  businessName?: string;
}): Promise<string> => {
  const code = getReferralCodeForUser(params.userId);
  if (!params.userId || params.userId === 'demo-user-1' || params.userId === 'anonymous') {
    return code;
  }

  try {
    const codeDocRef = doc(db, 'referral_codes', code);
    await setDoc(
      codeDocRef,
      {
        code,
        userId: params.userId,
        email: params.email || '',
        businessName: params.businessName || '',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch {
    // Non-blocking if offline or rules not yet deployed
  }

  return code;
};

/**
 * Record a referral when a new merchant completes registration.
 * - Rejects self-referrals.
 * - Prevents duplicate attribution for the same referredUserId.
 * - Does not write campaign expiry dates on new records.
 * - Initially sets status to 'pending_subscription' and referredSubscribed to false.
 */
export const recordReferralSignup = async (params: {
  referrerCode: string;
  referredUserId: string;
  referredUserEmail?: string;
  referredBusinessName?: string;
}): Promise<ReferralRecord | null> => {
  const cleanCode = params.referrerCode.trim().toUpperCase();
  if (!cleanCode || !params.referredUserId) return null;

  // 1. Reject self-referrals (merchant cannot use their own referral code)
  const ownCode = getReferralCodeForUser(params.referredUserId);
  if (cleanCode === ownCode) {
    clearPendingReferralCode();
    return null;
  }

  // 2. Check if this new merchant has already been attributed in Firestore
  try {
    const col = collection(db, 'referrals');
    const existingQuery = query(col, where('referredUserId', '==', params.referredUserId));
    const existingSnap = await getDocs(existingQuery);
    if (!existingSnap.empty) {
      const existingData = existingSnap.docs[0].data() as ReferralRecord;
      clearPendingReferralCode();
      return existingData;
    }
  } catch (checkErr) {
    console.warn('Could not check existing referral attribution:', checkErr);
  }

  // 3. Also check local cache to prevent duplicate attribution offline
  try {
    const existingCacheRaw = localStorage.getItem(STORAGE_LOCAL_REFERRALS_KEY);
    if (existingCacheRaw) {
      const list: ReferralRecord[] = JSON.parse(existingCacheRaw);
      const existingLocal = list.find((item) => item.referredUserId === params.referredUserId);
      if (existingLocal) {
        clearPendingReferralCode();
        return existingLocal;
      }
    }
  } catch {}

  // 4. Resolve referrerUserId from /referral_codes/{cleanCode} if registered
  let referrerUserId: string | undefined;
  let referrerEmail: string | undefined;
  let referrerBusinessName: string | undefined;
  try {
    const codeSnap = await getDoc(doc(db, 'referral_codes', cleanCode));
    if (codeSnap.exists()) {
      const codeData = codeSnap.data();
      if (codeData?.userId) {
        if (codeData.userId === params.referredUserId) {
          // Self-referral detected via code owner mapping
          clearPendingReferralCode();
          return null;
        }
        referrerUserId = codeData.userId;
        referrerEmail = codeData.email || undefined;
        referrerBusinessName = codeData.businessName || undefined;
      }
    }
  } catch {
    // Proceed with deterministic code attribution if lookup is unavailable
  }

  const referralId = `ref_${params.referredUserId}`;
  const nowIso = new Date().toISOString();

  const record: ReferralRecord = {
    id: referralId,
    referrerCode: cleanCode,
    ...(referrerUserId ? { referrerUserId } : {}),
    ...(referrerEmail ? { referrerEmail } : {}),
    ...(referrerBusinessName ? { referrerBusinessName } : {}),
    referredUserId: params.referredUserId,
    referredUserEmail: params.referredUserEmail || '',
    referredBusinessName: params.referredBusinessName || 'New Store',
    discountPercent: REFERRAL_PROGRAM.rewardPercent, // 5%
    campaign: REFERRAL_PROGRAM.id, // 'marketmate_permanent_referral'
    status: 'pending_subscription',
    referredSubscribed: false,
    createdAt: nowIso,
  };

  let savedToFirestore = false;

  // 5. Write to Firestore
  try {
    const refDoc = doc(db, 'referrals', referralId);
    await setDoc(refDoc, record);
    savedToFirestore = true;
  } catch (err) {
    console.warn('Could not save referral to Firestore (will cache locally):', err);
  }

  // 6. Cache in localStorage
  try {
    const existingCacheRaw = localStorage.getItem(STORAGE_LOCAL_REFERRALS_KEY);
    const list: ReferralRecord[] = existingCacheRaw ? JSON.parse(existingCacheRaw) : [];
    const idx = list.findIndex(
      (item) => item.id === record.id || item.referredUserId === record.referredUserId
    );
    if (idx >= 0) {
      list[idx] = record;
    } else {
      list.push(record);
    }
    localStorage.setItem(STORAGE_LOCAL_REFERRALS_KEY, JSON.stringify(list));
  } catch (localErr) {
    console.warn('Local referral cache write error:', localErr);
  }

  if (savedToFirestore) {
    clearPendingReferralCode();
  }
  return record;
};

/**
 * Update the referred store's business name once the new merchant completes onboarding
 */
export const updateReferredBusinessName = async (
  referredUserId: string,
  businessName: string,
  referredUserEmail?: string
): Promise<void> => {
  if (!referredUserId || !businessName.trim()) return;
  const cleanName = businessName.trim();

  try {
    const col = collection(db, 'referrals');
    const q = query(col, where('referredUserId', '==', referredUserId));
    const snap = await getDocs(q);
    for (const docItem of snap.docs) {
      const data = docItem.data() as ReferralRecord;
      if (data.status === 'pending_subscription' && !data.referredSubscribed) {
        await updateDoc(docItem.ref, {
          referredBusinessName: cleanName,
          ...(referredUserEmail ? { referredUserEmail } : {}),
        });
      }
    }
  } catch {}

  try {
    const cachedRaw = localStorage.getItem(STORAGE_LOCAL_REFERRALS_KEY);
    if (cachedRaw) {
      const list: ReferralRecord[] = JSON.parse(cachedRaw);
      let changed = false;
      const updated = list.map((item) => {
        if (item.referredUserId === referredUserId) {
          changed = true;
          return {
            ...item,
            referredBusinessName: cleanName,
            ...(referredUserEmail ? { referredUserEmail } : {}),
          };
        }
        return item;
      });
      if (changed) {
        localStorage.setItem(STORAGE_LOCAL_REFERRALS_KEY, JSON.stringify(updated));
      }
    }
  } catch {}
};

/**
 * When a merchant's subscription is approved by Super Admin, call this to qualify
 * the referral so the referrer earns their 5% subscription discount.
 * Idempotent: repeated approvals for the same referredUserId do not duplicate rewards.
 */
export const recordReferralSubscription = async (
  referredUserId: string,
  planName: string = 'MarketMate Monthly Plan'
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
      if (data.referredSubscribed === true && data.status === 'qualified') {
        // Already qualified — preserve existing qualification without duplicating reward
        updatedRecord = data;
        continue;
      }
      const patch = {
        referredSubscribed: true,
        status: 'qualified' as const,
        subscribedAt: data.subscribedAt || now,
        subscriptionPlan: planName,
      };
      await updateDoc(docItem.ref, patch);
      updatedRecord = { ...data, ...patch };
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
          if (item.referredSubscribed === true && item.status === 'qualified') {
            if (!updatedRecord) updatedRecord = item;
            return item;
          }
          changed = true;
          const patched: ReferralRecord = {
            ...item,
            referredSubscribed: true,
            status: 'qualified',
            subscribedAt: item.subscribedAt || now,
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
  planName: string = 'MarketMate Monthly Plan'
): Promise<boolean> => {
  const now = new Date().toISOString();
  const patch = {
    referredSubscribed: isSubscribed,
    status: isSubscribed ? 'qualified' : 'pending_subscription',
    subscribedAt: isSubscribed ? now : null,
    subscriptionPlan: isSubscribed ? planName : null,
  };

  const refDoc = doc(db, 'referrals', referralId);
  await updateDoc(refDoc, patch);

  try {
    const cachedRaw = localStorage.getItem(STORAGE_LOCAL_REFERRALS_KEY);
    if (cachedRaw) {
      const list: ReferralRecord[] = JSON.parse(cachedRaw);
      const updatedList = list.map((item) => {
        if (item.id === referralId) {
          return {
            ...item,
            referredSubscribed: isSubscribed,
            status: (isSubscribed ? 'qualified' : 'pending_subscription') as ReferralRecord['status'],
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
 * Helper to deduplicate referral records so a referred merchant is never counted twice,
 * preferring qualified records over pending records if duplicates exist.
 */
const deduplicateReferrals = (records: ReferralRecord[]): ReferralRecord[] => {
  const byKey = new Map<string, ReferralRecord>();
  for (const rec of records) {
    const key = rec.referredUserId ? `uid_${rec.referredUserId}` : `id_${rec.id}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, rec);
    } else {
      const existingQualified = existing.referredSubscribed || existing.status === 'qualified';
      const currentQualified = rec.referredSubscribed || rec.status === 'qualified';
      if (currentQualified && !existingQualified) {
        byKey.set(key, rec);
      }
    }
  }
  return Array.from(byKey.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

/**
 * Fetch referrals belonging to a specific user/code.
 * - Counts both historical records and new permanent programme records.
 * - Unlimited invitations are recorded and displayed even after reaching the 50% discount cap.
 * - Earned discount is 5% per qualified (subscribed) referral, capped at 50%.
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
  const code = (userCode || getReferralCodeForUser(userId)).trim().toUpperCase();
  const rawResults: ReferralRecord[] = [];

  // 1. Fetch from Firestore by referrerCode
  try {
    const col = collection(db, 'referrals');
    const q = query(col, where('referrerCode', '==', code));
    const snap = await getDocs(q);
    snap.forEach((d) => {
      rawResults.push(d.data() as ReferralRecord);
    });
  } catch (err) {
    console.warn('Firestore fetch referrals warning:', err);
  }

  // 2. Also check local fallback for matching referrerCode
  try {
    const cachedRaw = localStorage.getItem(STORAGE_LOCAL_REFERRALS_KEY);
    if (cachedRaw) {
      const localList: ReferralRecord[] = JSON.parse(cachedRaw);
      localList.forEach((item) => {
        if (item.referrerCode === code && !rawResults.some((r) => r.id === item.id)) {
          rawResults.push(item);
        }
      });
    }
  } catch (err) {
    console.warn('Local cache check error:', err);
  }

  const results = deduplicateReferrals(rawResults);
  const totalRegistered = results.length;

  // A referral qualifies for the 5% reward ONLY if the referred merchant registered AND subscribed
  const subscribedReferrals = results.filter(
    (r) => r.referredSubscribed === true || r.status === 'qualified'
  );
  const totalSubscribed = subscribedReferrals.length;
  const pendingCount = Math.max(0, totalRegistered - totalSubscribed);

  // 5% discount per referred merchant who registered AND subscribed, capped at 50%
  const totalDiscountPercent = Math.min(
    totalSubscribed * REFERRAL_PROGRAM.rewardPercent,
    REFERRAL_PROGRAM.maxDiscountPercent
  );

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
  const rawList: ReferralRecord[] = [];
  try {
    const col = collection(db, 'referrals');
    const snap = await getDocs(col);
    snap.forEach((d) => {
      rawList.push(d.data() as ReferralRecord);
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
        if (!rawList.some((r) => r.id === item.id)) {
          rawList.push(item);
        }
      });
    }
  } catch {}

  return deduplicateReferrals(rawList);
};
