import React, { createContext, useContext, useState, useEffect } from 'react';
import { BusinessProfile, BusinessCategory, CurrencyCode } from '../types';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  testFirestoreConnection,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';

import { isSuperAdminEmail, SUPER_ADMIN_CONFIG } from '../lib/adminConfig';
import {
  detectAndStoreReferralCode,
  getPendingReferralCode,
  recordReferralSignup,
} from '../lib/referralService';
import { triggerWelcomeEmail } from '../lib/emailService';
import { isBusinessSubscriptionActive } from '../lib/subscriptionService';

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  photoURL?: string;
  isAnonymous?: boolean;
  isSuperAdmin?: boolean;
}

interface AuthContextType {
  user: UserSession | null;
  business: BusinessProfile | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  isDemoMode: boolean;
  isLoading: boolean;
  isCloudConnected: boolean;
  isSuperAdmin: boolean;
  isSubscribed: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; cancelled?: boolean; error?: string }>;
  signup: (
    fullName: string,
    email: string,
    password: string,
    referralCode?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  createBusiness: (data: {
    businessName: string;
    businessType: BusinessCategory;
    currency: CurrencyCode;
    phone?: string;
  }) => Promise<void>;
  updateBusiness: (data: Partial<BusinessProfile>) => Promise<void>;
  activateSubscription: (planName?: string) => Promise<{ success: boolean; error?: string }>;
  activateDemoMode: () => void;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER: UserSession = {
  id: 'demo-user-1',
  email: 'ada@adafashion.ng',
  fullName: 'Adaeze Okonkwo',
};

const DEMO_BUSINESS: BusinessProfile = {
  id: 'demo-biz-1',
  userId: 'demo-user-1',
  businessName: 'Ada Fashion & Fabrics',
  businessType: 'Fashion & Apparel',
  currency: 'NGN',
  phone: '+234 803 123 4567',
  ownerName: 'Adaeze Okonkwo',
  createdAt: '2026-08-01T08:00:00Z',
  updatedAt: '2026-08-27T08:00:00Z',
  isSubscribed: true,
  subscriptionPlan: 'MarketMate Pro (Free Demo Explorer)',
  subscribedAt: '2026-08-01T08:00:00Z',
};

const STORAGE_KEYS = {
  USER: 'marketmate_auth_user',
  BUSINESS: 'marketmate_business_profile',
  IS_DEMO: 'marketmate_is_demo',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Synchronously restore cached session on frame 0 to prevent landing/onboarding flashes on refresh
  const [user, setUser] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      if (saved) return JSON.parse(saved);
      const isDemo = localStorage.getItem(STORAGE_KEYS.IS_DEMO) === 'true';
      if (isDemo) return DEMO_USER;
    } catch {}
    return null;
  });

  const [business, setBusiness] = useState<BusinessProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BUSINESS);
      if (saved) return JSON.parse(saved);
      const isDemo = localStorage.getItem(STORAGE_KEYS.IS_DEMO) === 'true';
      if (isDemo) return DEMO_BUSINESS;
    } catch {}
    return null;
  });

  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.IS_DEMO) === 'true';
    } catch {}
    return false;
  });

  // If user & business or demo already cached locally, we are not blocking initial render
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
      const savedDemo = localStorage.getItem(STORAGE_KEYS.IS_DEMO) === 'true';
      if (savedUser || savedDemo) {
        return false;
      }
    } catch {}
    return true;
  });

  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);

  // Test Firestore connection on boot & check for referral codes in URL
  useEffect(() => {
    detectAndStoreReferralCode();
    testFirestoreConnection().then((connected) => {
      setIsCloudConnected(connected);
    });
  }, []);

  // Helper to fetch user's business profile from Firestore or local cache
  const fetchBusinessProfile = async (uid: string, userEmail?: string): Promise<BusinessProfile | null> => {
    try {
      const userDocRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists() && userSnap.data().currentBusinessId) {
        const bizId = userSnap.data().currentBusinessId;
        const bizDocRef = doc(db, 'businesses', bizId);
        const bizSnap = await getDoc(bizDocRef);
        if (bizSnap.exists()) {
          const bizData = bizSnap.data() as BusinessProfile;
          localStorage.setItem(STORAGE_KEYS.BUSINESS, JSON.stringify(bizData));
          try {
            const nowIso = new Date().toISOString();
            setDoc(
              bizDocRef,
              {
                ownerEmail: userEmail || (bizData as any).ownerEmail || '',
                lastActiveAt: nowIso,
              },
              { merge: true }
            ).catch(() => {});
          } catch (_) {}
          return bizData;
        }
      }

      // Query businesses where ownerId == uid
      const bizQuery = query(collection(db, 'businesses'), where('ownerId', '==', uid));
      const bizQuerySnap = await getDocs(bizQuery);
      if (!bizQuerySnap.empty) {
        const firstBiz = bizQuerySnap.docs[0].data() as BusinessProfile;
        localStorage.setItem(STORAGE_KEYS.BUSINESS, JSON.stringify(firstBiz));
        try {
          const nowIso = new Date().toISOString();
          setDoc(
            doc(db, 'businesses', firstBiz.id),
            {
              ownerEmail: userEmail || (firstBiz as any).ownerEmail || '',
              lastActiveAt: nowIso,
            },
            { merge: true }
          ).catch(() => {});
        } catch (_) {}
        return firstBiz;
      }

      // Check local storage fallback
      const savedBizStr = localStorage.getItem(STORAGE_KEYS.BUSINESS);
      if (savedBizStr) {
        const localBiz = JSON.parse(savedBizStr);
        if (localBiz.userId === uid || localBiz.ownerId === uid) {
          return localBiz;
        }
      }
    } catch (err) {
      console.warn('Could not fetch cloud business profile (falling back to local cache):', err);
      const savedBizStr = localStorage.getItem(STORAGE_KEYS.BUSINESS);
      if (savedBizStr) {
        try {
          return JSON.parse(savedBizStr);
        } catch {}
      }
    }
    return null;
  };

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const isSuper = isSuperAdminEmail(firebaseUser.email);
        const userObj: UserSession = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          fullName:
            firebaseUser.displayName ||
            firebaseUser.email?.split('@')[0] ||
            (isSuper ? 'App Owner (Admin)' : 'Merchant'),
          photoURL: firebaseUser.photoURL || undefined,
          isSuperAdmin: isSuper,
        };

        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userObj));
        localStorage.removeItem(STORAGE_KEYS.IS_DEMO);

        // Fetch business profile BEFORE concluding auth state to prevent Onboarding flash
        const bizData = await fetchBusinessProfile(firebaseUser.uid, firebaseUser.email || undefined);

        setUser(userObj);
        setBusiness(bizData);
        setIsDemoMode(false);
      } else {
        // No Firebase user logged in
        const savedIsDemo = localStorage.getItem(STORAGE_KEYS.IS_DEMO) === 'true';
        if (savedIsDemo) {
          setUser(DEMO_USER);
          setBusiness(DEMO_BUSINESS);
          setIsDemoMode(true);
        } else {
          setUser(null);
          setBusiness(null);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (): Promise<{ success: boolean; cancelled?: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const isSuper = isSuperAdminEmail(fbUser.email);
      const userObj: UserSession = {
        id: fbUser.uid,
        email: fbUser.email || '',
        fullName: fbUser.displayName || (isSuper ? 'App Owner (Admin)' : 'Merchant'),
        photoURL: fbUser.photoURL || undefined,
        isSuperAdmin: isSuper,
      };

      // Save user doc in Firestore
      try {
        const userDocRef = doc(db, 'users', fbUser.uid);
        await setDoc(
          userDocRef,
          {
            id: fbUser.uid,
            email: fbUser.email || '',
            fullName: fbUser.displayName || 'Merchant',
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );

        // Record pending referral if user signed up with a referral link
        const pendingRef = getPendingReferralCode();
        if (pendingRef) {
          recordReferralSignup({
            referrerCode: pendingRef,
            referredUserId: fbUser.uid,
            referredUserEmail: fbUser.email || undefined,
            referredBusinessName: fbUser.displayName || 'New Merchant',
          }).catch((err) => console.warn('Referral signup record error:', err));
        }
        // Trigger welcome email for new Google signups
        if (fbUser.email && fbUser.email.includes('@')) {
          triggerWelcomeEmail({
            email: fbUser.email,
            ownerName: fbUser.displayName || 'Merchant user / Business Owner',
            userId: fbUser.uid,
          }).catch((e) => console.warn('Welcome email trigger notice:', e));
        }
      } catch (err) {
        console.warn('User doc save fallback:', err);
      }

      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userObj));
      localStorage.removeItem(STORAGE_KEYS.IS_DEMO);
      const bizData = await fetchBusinessProfile(fbUser.uid, fbUser.email || undefined);

      setUser(userObj);
      setBusiness(bizData);
      setIsDemoMode(false);
      setIsLoading(false);
      return { success: true };
    } catch (error: any) {
      setIsLoading(false);
      
      // User closed the popup window voluntarily or clicked outside
      if (
        error.code === 'auth/popup-closed-by-user' ||
        error.code === 'auth/cancelled-popup-request' ||
        error.message?.includes('popup-closed')
      ) {
        return {
          success: false,
          cancelled: true,
        };
      }

      console.warn('Google sign-in exception:', error.code || error.message);
      let errMsg = 'Google Sign-in failed.';
      if (error.code === 'auth/unauthorized-domain' || error.message?.includes('unauthorized-domain')) {
        errMsg = 'auth/unauthorized-domain';
      } else if (error.code === 'auth/popup-blocked') {
        errMsg = 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
      } else if (error.message) {
        errMsg = error.message;
      }
      return {
        success: false,
        error: errMsg,
      };
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const fbUser = cred.user;
      const isSuper = isSuperAdminEmail(fbUser.email || email);
      const userObj: UserSession = {
        id: fbUser.uid,
        email: fbUser.email || email,
        fullName: fbUser.displayName || email.split('@')[0],
        isSuperAdmin: isSuper,
      };

      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userObj));
      localStorage.removeItem(STORAGE_KEYS.IS_DEMO);
      const bizData = await fetchBusinessProfile(fbUser.uid, fbUser.email || email);

      setUser(userObj);
      setBusiness(bizData);
      setIsDemoMode(false);
      setIsLoading(false);
      return { success: true };
    } catch (error: any) {
      setIsLoading(false);
      let errMsg = 'Failed to sign in. Please check your credentials.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errMsg = 'Invalid email or password. Please try again.';
      } else if (error.code === 'auth/too-many-requests') {
        errMsg = 'Too many failed login attempts. Please reset your password or try again later.';
      } else if (error.message) {
        errMsg = error.message;
      }
      return { success: false, error: errMsg };
    }
  };

  const signup = async (
    fullName: string,
    email: string,
    password: string,
    referralCode?: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const fbUser = cred.user;

      // Update Firebase auth profile
      await updateProfile(fbUser, { displayName: fullName.trim() });

      const userObj: UserSession = {
        id: fbUser.uid,
        email: fbUser.email || email,
        fullName: fullName.trim(),
      };

      // Store in users collection
      try {
        await setDoc(doc(db, 'users', fbUser.uid), {
          id: fbUser.uid,
          email: fbUser.email || email,
          fullName: fullName.trim(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Record referral if provided or pending
        const codeToAttribute = (referralCode || getPendingReferralCode() || '').trim().toUpperCase();
        if (codeToAttribute) {
          recordReferralSignup({
            referrerCode: codeToAttribute,
            referredUserId: fbUser.uid,
            referredUserEmail: fbUser.email || email,
            referredBusinessName: fullName.trim(),
          }).catch((err) => console.warn('Referral signup record error:', err));
        }
        // Trigger welcome email immediately upon signup
        if (email && email.includes('@')) {
          triggerWelcomeEmail({
            email: email.trim(),
            ownerName: fullName.trim(),
            userId: fbUser.uid,
          }).catch((e) => console.warn('Welcome email trigger notice:', e));
        }
      } catch (err) {
        console.warn('Could not write user profile doc:', err);
      }

      setUser(userObj);
      setBusiness(null);
      setIsDemoMode(false);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userObj));
      localStorage.removeItem(STORAGE_KEYS.BUSINESS);
      localStorage.removeItem(STORAGE_KEYS.IS_DEMO);
      setIsLoading(false);
      return { success: true };
    } catch (error: any) {
      setIsLoading(false);
      let errMsg = 'Failed to create your account.';
      if (error.code === 'auth/email-already-in-use') {
        errMsg = 'An account with this email already exists. Please log in.';
      } else if (error.code === 'auth/weak-password') {
        errMsg = 'Password is too weak. Please use at least 6 characters.';
      } else if (error.message) {
        errMsg = error.message;
      }
      return { success: false, error: errMsg };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Sign out warning:', e);
    }
    setUser(null);
    setBusiness(null);
    setIsDemoMode(false);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.BUSINESS);
    localStorage.removeItem(STORAGE_KEYS.IS_DEMO);
  };

  const createBusiness = async (data: {
    businessName: string;
    businessType: BusinessCategory;
    currency: CurrencyCode;
    phone?: string;
  }) => {
    setIsLoading(true);
    const bizId = `biz_${user?.id ? user.id.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 30) : Date.now()}_${Date.now()}`;
    const newProfile: BusinessProfile = {
      id: bizId,
      userId: user?.id || 'anonymous',
      businessName: data.businessName.trim(),
      businessType: data.businessType,
      currency: data.currency || 'NGN',
      phone: data.phone?.trim() || '',
      ownerName: user?.fullName || 'Merchant',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setBusiness(newProfile);
    localStorage.setItem(STORAGE_KEYS.BUSINESS, JSON.stringify(newProfile));

    // Save to Firestore if authenticated
    if (user?.id) {
      try {
        const bizDocRef = doc(db, 'businesses', bizId);
        await setDoc(bizDocRef, {
          id: bizId,
          ownerId: user.id,
          ownerEmail: user.email || '',
          businessName: newProfile.businessName,
          businessType: newProfile.businessType,
          currency: newProfile.currency,
          phone: newProfile.phone || '',
          ownerName: newProfile.ownerName || '',
          createdAt: newProfile.createdAt,
          updatedAt: newProfile.updatedAt,
        });

        // Update user doc with current business ID
        const userDocRef = doc(db, 'users', user.id);
        await setDoc(userDocRef, { currentBusinessId: bizId }, { merge: true });

        // Update welcome email with newly established business details
        if (user.email && user.email.includes('@')) {
          triggerWelcomeEmail({
            email: user.email,
            ownerName: user.fullName || newProfile.ownerName,
            businessName: newProfile.businessName,
            businessType: newProfile.businessType,
            userId: user.id,
          }).catch((e) => console.warn('Welcome email trigger notice:', e));
        }
      } catch (err) {
        console.warn('Could not sync business profile to cloud:', err);
      }
    }
    setIsLoading(false);
  };

  const updateBusiness = async (data: Partial<BusinessProfile>) => {
    if (!business) return;
    // Strip privileged subscription fields from client profile updates;
    // only Super Admin approval/management workflows can mutate subscription entitlement.
    const {
      isSubscribed: _ignoreIsSubscribed,
      subscriptionStatus: _ignoreSubStatus,
      subscriptionPlan: _ignoreSubPlan,
      subscriptionPlanId: _ignoreSubPlanId,
      subscribedAt: _ignoreSubscribedAt,
      subscriptionStartsAt: _ignoreSubStartsAt,
      subscriptionExpiresAt: _ignoreSubExpiresAt,
      lastSubscriptionRequestId: _ignoreLastReqId,
      subscriptionUpdatedAt: _ignoreSubUpdatedAt,
      subscriptionUpdatedBy: _ignoreSubUpdatedBy,
      ...safeProfileData
    } = data;

    const updated: BusinessProfile = {
      ...business,
      ...safeProfileData,
      updatedAt: new Date().toISOString(),
    };
    setBusiness(updated);
    localStorage.setItem(STORAGE_KEYS.BUSINESS, JSON.stringify(updated));

    if (user?.id && business.id) {
      try {
        const bizDocRef = doc(db, 'businesses', business.id);
        await setDoc(
          bizDocRef,
          {
            ...safeProfileData,
            updatedAt: updated.updatedAt,
            ownerId: user.id,
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('Could not sync business update to cloud:', err);
      }
    }
  };

  const activateSubscription = async (
    _planName: string = 'MarketMate Monthly Plan'
  ): Promise<{ success: boolean; error?: string }> => {
    return {
      success: false,
      error:
        'Client self-activation is disabled. Please submit your bank transfer proof for MarketMate Admin verification.',
    };
  };

  const activateDemoMode = () => {
    setUser(DEMO_USER);
    setBusiness(DEMO_BUSINESS);
    setIsDemoMode(true);
    localStorage.setItem(STORAGE_KEYS.IS_DEMO, 'true');
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(DEMO_USER));
    localStorage.setItem(STORAGE_KEYS.BUSINESS, JSON.stringify(DEMO_BUSINESS));
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return {
        success: true,
        message: `Password reset email sent to ${email}. Please check your inbox.`,
      };
    } catch (error: any) {
      console.error('Password reset error:', error);
      return {
        success: false,
        message: error.message || 'Could not send reset email. Please verify the email address.',
      };
    }
  };

  const isAuthenticated = !!user;
  const isOnboarded = !!business;
  const isSuperAdmin = !!user?.isSuperAdmin || isSuperAdminEmail(user?.email);
  // Demo Mode account (Adaeze) has all Pro features unlocked for exploration.
  // Real registered stores only have Pro access while their subscription is active and not expired.
  const isSubscribed = Boolean(
    isBusinessSubscriptionActive(business) || isSuperAdmin || user?.isSuperAdmin || isDemoMode
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        business,
        isAuthenticated,
        isOnboarded,
        isDemoMode,
        isLoading,
        isCloudConnected,
        isSuperAdmin,
        isSubscribed,
        login,
        loginWithGoogle,
        signup,
        logout,
        createBusiness,
        updateBusiness,
        activateSubscription,
        activateDemoMode,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
