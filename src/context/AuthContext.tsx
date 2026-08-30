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

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  photoURL?: string;
  isAnonymous?: boolean;
}

interface AuthContextType {
  user: UserSession | null;
  business: BusinessProfile | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  isDemoMode: boolean;
  isLoading: boolean;
  isCloudConnected: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signup: (fullName: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  createBusiness: (data: {
    businessName: string;
    businessType: BusinessCategory;
    currency: CurrencyCode;
    phone?: string;
  }) => Promise<void>;
  updateBusiness: (data: Partial<BusinessProfile>) => Promise<void>;
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
};

const STORAGE_KEYS = {
  USER: 'marketmate_auth_user',
  BUSINESS: 'marketmate_business_profile',
  IS_DEMO: 'marketmate_is_demo',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);

  // Test Firestore connection on boot
  useEffect(() => {
    testFirestoreConnection().then((connected) => {
      setIsCloudConnected(connected);
    });
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userObj: UserSession = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          fullName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Merchant',
          photoURL: firebaseUser.photoURL || undefined,
        };

        setUser(userObj);
        setIsDemoMode(false);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userObj));
        localStorage.removeItem(STORAGE_KEYS.IS_DEMO);

        // Fetch user's business profile from Firestore
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userDocRef);

          if (userSnap.exists() && userSnap.data().currentBusinessId) {
            const bizId = userSnap.data().currentBusinessId;
            const bizDocRef = doc(db, 'businesses', bizId);
            const bizSnap = await getDoc(bizDocRef);
            if (bizSnap.exists()) {
              const bizData = bizSnap.data() as BusinessProfile;
              setBusiness(bizData);
              localStorage.setItem(STORAGE_KEYS.BUSINESS, JSON.stringify(bizData));
            }
          } else {
            // Query businesses where ownerId == uid
            const bizQuery = query(collection(db, 'businesses'), where('ownerId', '==', firebaseUser.uid));
            const bizQuerySnap = await getDocs(bizQuery);
            if (!bizQuerySnap.empty) {
              const firstBiz = bizQuerySnap.docs[0].data() as BusinessProfile;
              setBusiness(firstBiz);
              localStorage.setItem(STORAGE_KEYS.BUSINESS, JSON.stringify(firstBiz));
            } else {
              // Check local storage fallback
              const savedBizStr = localStorage.getItem(STORAGE_KEYS.BUSINESS);
              if (savedBizStr) {
                const localBiz = JSON.parse(savedBizStr);
                if (localBiz.userId === firebaseUser.uid) {
                  setBusiness(localBiz);
                } else {
                  setBusiness(null);
                }
              } else {
                setBusiness(null);
              }
            }
          }
        } catch (err) {
          console.warn('Could not fetch cloud business profile (falling back to local cache):', err);
          const savedBizStr = localStorage.getItem(STORAGE_KEYS.BUSINESS);
          if (savedBizStr) {
            setBusiness(JSON.parse(savedBizStr));
          }
        }
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

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const userObj: UserSession = {
        id: fbUser.uid,
        email: fbUser.email || '',
        fullName: fbUser.displayName || 'Merchant',
        photoURL: fbUser.photoURL || undefined,
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
      } catch (err) {
        console.warn('User doc save fallback:', err);
      }

      setUser(userObj);
      setIsDemoMode(false);
      setIsLoading(false);
      return { success: true };
    } catch (error: any) {
      setIsLoading(false);
      console.error('Google sign-in error:', error);
      let errMsg = 'Google Sign-in failed.';
      if (error.code === 'auth/unauthorized-domain' || error.message?.includes('unauthorized-domain')) {
        errMsg = 'auth/unauthorized-domain';
      } else if (error.code === 'auth/popup-closed-by-user' || error.message?.includes('popup-closed')) {
        errMsg = 'Sign-in window was closed before completing.';
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
      const userObj: UserSession = {
        id: fbUser.uid,
        email: fbUser.email || email,
        fullName: fbUser.displayName || email.split('@')[0],
      };
      setUser(userObj);
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
    password: string
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
      } catch (err) {
        console.warn('Could not sync business profile to cloud:', err);
      }
    }
    setIsLoading(false);
  };

  const updateBusiness = async (data: Partial<BusinessProfile>) => {
    if (!business) return;
    const updated: BusinessProfile = {
      ...business,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    setBusiness(updated);
    localStorage.setItem(STORAGE_KEYS.BUSINESS, JSON.stringify(updated));

    if (user?.id && business.id) {
      try {
        const bizDocRef = doc(db, 'businesses', business.id);
        await setDoc(bizDocRef, {
          ...updated,
          ownerId: user.id,
        }, { merge: true });
      } catch (err) {
        console.warn('Could not sync business update to cloud:', err);
      }
    }
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
        login,
        loginWithGoogle,
        signup,
        logout,
        createBusiness,
        updateBusiness,
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
