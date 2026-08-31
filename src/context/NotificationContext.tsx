import React, { createContext, useContext, useState, useEffect } from 'react';
import { PlatformAnnouncement, MessageTargetType, MessageChannel, MessagePriority } from '../types';
import { useAuth } from './AuthContext';
import {
  db,
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  arrayUnion,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import { SUPER_ADMIN_CONFIG } from '../lib/adminConfig';

interface NotificationContextType {
  announcements: PlatformAnnouncement[]; // Announcements relevant to current merchant
  allAnnouncements: PlatformAnnouncement[]; // All announcements (for Super Admin)
  unreadCount: number;
  activeBanner: PlatformAnnouncement | null;
  isLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissBanner: (id: string) => void;
  sendAnnouncement: (data: {
    title: string;
    content: string;
    type: MessageTargetType;
    targetBusinessId?: string;
    targetBusinessName?: string;
    targetEmail?: string;
    channel: MessageChannel;
    priority: MessagePriority;
    actionUrl?: string;
    actionLabel?: string;
  }) => Promise<{ success: boolean; id?: string; error?: string }>;
  deleteAnnouncement: (id: string) => Promise<{ success: boolean; error?: string }>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const DISMISSED_BANNERS_KEY = 'marketmate_dismissed_banners_v1';

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, business, isSuperAdmin } = useAuth();
  const [allAnnouncements, setAllAnnouncements] = useState<PlatformAnnouncement[]>([]);
  const [dismissedBannerIds, setDismissedBannerIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(DISMISSED_BANNERS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Subscribe to platform announcements collection in real-time
  useEffect(() => {
    if (!user) {
      setAllAnnouncements([]);
      setIsLoading(false);
      return;
    }

    try {
      const announcementsRef = collection(db, 'platform_announcements');
      const q = query(announcementsRef);

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: PlatformAnnouncement[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            list.push({
              id: docSnap.id,
              title: data.title || '',
              content: data.content || '',
              type: data.type || 'broadcast',
              targetBusinessId: data.targetBusinessId,
              targetBusinessName: data.targetBusinessName,
              targetEmail: data.targetEmail,
              channel: data.channel || 'in_app',
              priority: data.priority || 'normal',
              senderEmail: data.senderEmail || SUPER_ADMIN_CONFIG.email,
              senderName: data.senderName || 'MarketMate Team',
              actionUrl: data.actionUrl,
              actionLabel: data.actionLabel,
              createdAt: data.createdAt || new Date().toISOString(),
              readBy: data.readBy || [],
              emailSentCount: data.emailSentCount,
            });
          });

          // Sort by createdAt descending
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setAllAnnouncements(list);
          setIsLoading(false);
        },
        (error) => {
          console.warn('Announcements snapshot notice:', error);
          setIsLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('Real-time announcements setup exception:', err);
      setIsLoading(false);
    }
  }, [user?.id]);

  // Filter announcements for current merchant
  const announcements = React.useMemo(() => {
    if (!user) return [];
    
    // Super admin can see all
    if (isSuperAdmin) {
      return allAnnouncements;
    }

    return allAnnouncements.filter((item) => {
      // If broadcast to all
      if (item.type === 'broadcast') return true;
      // If targeted to this business
      if (business && item.targetBusinessId === business.id) return true;
      // If targeted to this user's email
      if (user.email && item.targetEmail?.toLowerCase() === user.email.toLowerCase()) return true;
      return false;
    });
  }, [allAnnouncements, user, business, isSuperAdmin]);

  // Compute unread count for current merchant
  const currentIdentifier = business?.id || user?.id || '';
  const unreadCount = React.useMemo(() => {
    if (!currentIdentifier) return 0;
    return announcements.filter((a) => !a.readBy?.includes(currentIdentifier)).length;
  }, [announcements, currentIdentifier]);

  // Active top banner: most recent unread urgent or important announcement that hasn't been dismissed
  const activeBanner = React.useMemo(() => {
    if (isSuperAdmin) return null; // Admin doesn't need self-announcement banners
    return (
      announcements.find(
        (a) =>
          (a.priority === 'urgent' || a.priority === 'important') &&
          !dismissedBannerIds.includes(a.id) &&
          !a.readBy?.includes(currentIdentifier)
      ) || null
    );
  }, [announcements, dismissedBannerIds, currentIdentifier, isSuperAdmin]);

  const markAsRead = async (id: string) => {
    if (!currentIdentifier) return;
    
    // Optimistic local update
    setAllAnnouncements((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              readBy: item.readBy ? Array.from(new Set([...item.readBy, currentIdentifier])) : [currentIdentifier],
            }
          : item
      )
    );

    try {
      const docRef = doc(db, 'platform_announcements', id);
      await updateDoc(docRef, {
        readBy: arrayUnion(currentIdentifier),
      });
    } catch (error) {
      console.warn('Could not update read status in Firestore:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!currentIdentifier) return;

    // Optimistic update
    setAllAnnouncements((prev) =>
      prev.map((item) => ({
        ...item,
        readBy: item.readBy ? Array.from(new Set([...item.readBy, currentIdentifier])) : [currentIdentifier],
      }))
    );

    for (const a of announcements) {
      if (!a.readBy?.includes(currentIdentifier)) {
        try {
          const docRef = doc(db, 'platform_announcements', a.id);
          await updateDoc(docRef, {
            readBy: arrayUnion(currentIdentifier),
          });
        } catch {
          // ignore individual fails
        }
      }
    }
  };

  const dismissBanner = (id: string) => {
    const next = [...dismissedBannerIds, id];
    setDismissedBannerIds(next);
    try {
      localStorage.setItem(DISMISSED_BANNERS_KEY, JSON.stringify(next));
    } catch {
      // storage error fallback
    }
    // Also mark as read
    markAsRead(id);
  };

  // Super Admin action: Send a new announcement/broadcast
  const sendAnnouncement = async (data: {
    title: string;
    content: string;
    type: MessageTargetType;
    targetBusinessId?: string;
    targetBusinessName?: string;
    targetEmail?: string;
    channel: MessageChannel;
    priority: MessagePriority;
    actionUrl?: string;
    actionLabel?: string;
  }): Promise<{ success: boolean; id?: string; error?: string }> => {
    try {
      const id = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newDoc: PlatformAnnouncement = {
        id,
        title: data.title.trim(),
        content: data.content.trim(),
        type: data.type,
        targetBusinessId: data.targetBusinessId || undefined,
        targetBusinessName: data.targetBusinessName || undefined,
        targetEmail: data.targetEmail ? data.targetEmail.trim() : undefined,
        channel: data.channel,
        priority: data.priority,
        senderEmail: user?.email || SUPER_ADMIN_CONFIG.email,
        senderName: user?.fullName || 'MarketMate Admin',
        actionUrl: data.actionUrl?.trim() || undefined,
        actionLabel: data.actionLabel?.trim() || undefined,
        createdAt: new Date().toISOString(),
        readBy: [],
        emailSentCount: data.channel === 'email' || data.channel === 'both' ? 1 : 0,
      };

      const docRef = doc(db, 'platform_announcements', id);
      await setDoc(docRef, newDoc);

      // Local state update
      setAllAnnouncements((prev) => [newDoc, ...prev]);

      return { success: true, id };
    } catch (error: any) {
      console.error('Failed to publish announcement:', error);
      return { success: false, error: error.message || 'Failed to dispatch broadcast message' };
    }
  };

  // Super Admin action: Delete an announcement
  const deleteAnnouncement = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const docRef = doc(db, 'platform_announcements', id);
      await deleteDoc(docRef);
      setAllAnnouncements((prev) => prev.filter((a) => a.id !== id));
      return { success: true };
    } catch (error: any) {
      console.error('Failed to delete announcement:', error);
      return { success: false, error: error.message || 'Failed to delete message' };
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        announcements,
        allAnnouncements,
        unreadCount,
        activeBanner,
        isLoading,
        markAsRead,
        markAllAsRead,
        dismissBanner,
        sendAnnouncement,
        deleteAnnouncement,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
