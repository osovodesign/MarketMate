import { SupportTicket, SupportTicketCategory, SupportTicketPriority, SupportTicketStatus } from '../types';
import {
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  cleanFirestoreData,
} from './firebase';
import { SUPER_ADMIN_CONFIG } from './adminConfig';

const STORAGE_SUPPORT_TICKETS_KEY = 'marketmate_support_tickets_v1';

/**
 * Generate a friendly Ticket ID like TKT-2026-9482
 */
export const generateTicketId = (): string => {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `TKT-${year}-${randomSuffix}`;
};

/**
 * Create and submit a new support inquiry or ticket
 */
export const createSupportTicket = async (ticketData: {
  userId: string;
  userEmail: string;
  userName?: string;
  businessId?: string;
  businessName?: string;
  whatsappPhone?: string;
  category: SupportTicketCategory;
  subject: string;
  message: string;
  priority?: SupportTicketPriority;
}): Promise<SupportTicket> => {
  const id = generateTicketId();
  const now = new Date().toISOString();

  const newTicket: SupportTicket = {
    id,
    userId: ticketData.userId,
    userEmail: ticketData.userEmail,
    userName: ticketData.userName || '',
    businessId: ticketData.businessId || '',
    businessName: ticketData.businessName || 'MarketMate Merchant',
    whatsappPhone: ticketData.whatsappPhone || '',
    category: ticketData.category,
    subject: ticketData.subject,
    message: ticketData.message,
    priority: ticketData.priority || 'normal',
    status: 'open',
    createdAt: now,
    updatedAt: now,
  };

  // 1. Try writing to Firestore
  try {
    const ticketDocRef = doc(db, 'support_tickets', id);
    const cleaned = cleanFirestoreData(newTicket);
    await setDoc(ticketDocRef, cleaned);
  } catch (err) {
    console.warn('Could not save support ticket to Firestore, fallback to local storage:', err);
  }

  // 2. Always maintain local storage cache for instant offline access
  try {
    const existingStr = localStorage.getItem(STORAGE_SUPPORT_TICKETS_KEY);
    const existingList: SupportTicket[] = existingStr ? JSON.parse(existingStr) : [];
    const updated = [newTicket, ...existingList.filter((t) => t.id !== id)];
    localStorage.setItem(STORAGE_SUPPORT_TICKETS_KEY, JSON.stringify(updated));
  } catch (localErr) {
    console.warn('Failed saving ticket to localStorage:', localErr);
  }

  return newTicket;
};

/**
 * Fetch tickets submitted by a specific user/merchant
 */
export const fetchUserSupportTickets = async (userId: string): Promise<SupportTicket[]> => {
  let remoteTickets: SupportTicket[] = [];

  try {
    const q = query(
      collection(db, 'support_tickets'),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      remoteTickets = snap.docs.map((d) => d.data() as SupportTicket);
    }
  } catch (err) {
    console.warn('Could not query user support tickets from Firestore:', err);
  }

  // Merge with local storage
  try {
    const localStr = localStorage.getItem(STORAGE_SUPPORT_TICKETS_KEY);
    const localTickets: SupportTicket[] = localStr ? JSON.parse(localStr) : [];
    const userLocal = localTickets.filter((t) => t.userId === userId);

    const mergedMap = new Map<string, SupportTicket>();
    userLocal.forEach((t) => mergedMap.set(t.id, t));
    remoteTickets.forEach((t) => mergedMap.set(t.id, t));

    const sorted = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return sorted;
  } catch {
    return remoteTickets.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
};

/**
 * Fetch all support tickets across the platform (Super Admin only)
 */
export const fetchAllSupportTickets = async (): Promise<SupportTicket[]> => {
  let remoteTickets: SupportTicket[] = [];

  try {
    const snap = await getDocs(collection(db, 'support_tickets'));
    if (!snap.empty) {
      remoteTickets = snap.docs.map((d) => d.data() as SupportTicket);
    }
  } catch (err) {
    console.warn('Could not fetch all support tickets from Firestore:', err);
  }

  try {
    const localStr = localStorage.getItem(STORAGE_SUPPORT_TICKETS_KEY);
    const localTickets: SupportTicket[] = localStr ? JSON.parse(localStr) : [];

    const mergedMap = new Map<string, SupportTicket>();
    localTickets.forEach((t) => mergedMap.set(t.id, t));
    remoteTickets.forEach((t) => mergedMap.set(t.id, t));

    const sorted = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return sorted;
  } catch {
    return remoteTickets.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
};

/**
 * Update support ticket status and optionally add admin reply
 */
export const updateSupportTicketStatus = async (
  ticketId: string,
  updatesOrStatus:
    | SupportTicketStatus
    | {
        status: SupportTicketStatus;
        adminReply?: string;
        adminEmail?: string;
      },
  replyMessage?: string,
  adminEmail?: string
): Promise<SupportTicket | null> => {
  const status: SupportTicketStatus =
    typeof updatesOrStatus === 'string' ? updatesOrStatus : updatesOrStatus.status;
  const adminReply: string | undefined =
    typeof updatesOrStatus === 'string' ? replyMessage : updatesOrStatus.adminReply;
  const resolvedAdminEmail: string | undefined =
    typeof updatesOrStatus === 'string' ? adminEmail : updatesOrStatus.adminEmail;

  const now = new Date().toISOString();
  const patchData: Partial<SupportTicket> = {
    status,
    updatedAt: now,
  };

  if (adminReply !== undefined && adminReply.trim() !== '') {
    patchData.adminReply = adminReply.trim();
    patchData.repliedAt = now;
    patchData.repliedBy = resolvedAdminEmail || SUPER_ADMIN_CONFIG.email;
  }

  let updatedTicket: SupportTicket | null = null;

  // Update in Firestore
  try {
    const ticketDocRef = doc(db, 'support_tickets', ticketId);
    await updateDoc(ticketDocRef, cleanFirestoreData(patchData));
  } catch (err) {
    console.warn(`Failed to update ticket ${ticketId} in Firestore:`, err);
  }

  // Update in localStorage
  try {
    const localStr = localStorage.getItem(STORAGE_SUPPORT_TICKETS_KEY);
    if (localStr) {
      const tickets: SupportTicket[] = JSON.parse(localStr);
      const updatedList = tickets.map((t) => {
        if (t.id === ticketId) {
          const merged = { ...t, ...patchData };
          updatedTicket = merged;
          return merged;
        }
        return t;
      });
      localStorage.setItem(STORAGE_SUPPORT_TICKETS_KEY, JSON.stringify(updatedList));
    }
  } catch (err) {
    console.warn('Failed to update ticket in localStorage:', err);
  }

  if (!updatedTicket) {
    // If not found in local, construct fallback
    updatedTicket = {
      id: ticketId,
      userId: '',
      userEmail: '',
      subject: '',
      message: '',
      category: 'general_inquiry',
      priority: 'medium',
      status,
      createdAt: now,
      updatedAt: now,
      ...patchData,
    } as SupportTicket;
  }

  return updatedTicket;
};

/**
 * Delete a support ticket (Super Admin)
 */
export const deleteSupportTicket = async (ticketId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'support_tickets', ticketId));
  } catch (err) {
    console.warn(`Failed to delete ticket ${ticketId} from Firestore:`, err);
  }

  try {
    const localStr = localStorage.getItem(STORAGE_SUPPORT_TICKETS_KEY);
    if (localStr) {
      const tickets: SupportTicket[] = JSON.parse(localStr);
      const updatedList = tickets.filter((t) => t.id !== ticketId);
      localStorage.setItem(STORAGE_SUPPORT_TICKETS_KEY, JSON.stringify(updatedList));
    }
  } catch (err) {
    console.warn('Failed to delete ticket in localStorage:', err);
  }
};
