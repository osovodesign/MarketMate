// Super Admin Configuration for MarketMate Owner & Company Administration
export const SUPER_ADMIN_CONFIG = {
  companyName: 'MarketMate Technologies',
  cacRegNo: '9931755',
  cacDisplay: 'CAC Reg No: 9931755',
  email: 'getmarketmate@gmail.com',
  name: 'Osovoyoron Ogheneovo Daniel',
  role: 'super_admin' as const,
  location: 'Warri, Nigeria',
};

// Authorized Super Admin Emails (Official company email + Founder email)
export const SUPER_ADMIN_EMAILS: string[] = [
  'getmarketmate@gmail.com',
  'osovoyoronogheneovo@gmail.com',
];

export const isSuperAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();
  return SUPER_ADMIN_EMAILS.some((adminEmail) => adminEmail.toLowerCase() === cleanEmail);
};

// Official Admin Support & Customer Hotline Configuration
export const SUPPORT_CONFIG = {
  // WhatsApp international format without '+' for direct wa.me link
  whatsappNumber: '2347089238728',
  whatsappDisplay: '0708 923 8728',
  whatsappInternational: '+234 708 923 8728',
  whatsappCommunityLink: 'https://chat.whatsapp.com/Jy4sdsOqxCf9YMnFsdn1Wm?s=cl&p=a&mlu=4&ilr=4',
  phone: '+234 708 923 8728',
  email: 'getmarketmate@gmail.com',
  adminDirectEmail: 'osovoyoronogheneovo@gmail.com',
  phoneDisplay: '+234 708 923 8728',
  callPhoneLink: 'tel:+2347089238728',
  hoursDisplay: 'Mon – Sat: 8:00 AM – 8:00 PM WAT (Instant WhatsApp responses)',
  responseTimeNotice: 'Typical response time: under 15 minutes during business hours',
};

/**
 * Generate a pre-filled WhatsApp click-to-chat URL with merchant context
 */
export const getWhatsAppSupportUrl = (options?: string | {
  businessName?: string;
  userEmail?: string;
  subject?: string;
  ticketId?: string;
}): string => {
  if (typeof options === 'string') {
    return `https://wa.me/${SUPPORT_CONFIG.whatsappNumber}?text=${encodeURIComponent(options)}`;
  }

  const storeText = options?.businessName ? `• Store: ${options.businessName}\n` : '';
  const emailText = options?.userEmail ? `• Email: ${options.userEmail}\n` : '';
  const ticketText = options?.ticketId ? `• Ticket ID: ${options.ticketId}\n` : '';
  const topicText = options?.subject ? `• Inquiry: ${options.subject}\n` : '';

  const message = `Hello MarketMate Admin,\n\nI am contacting you regarding MarketMate:\n${storeText}${emailText}${ticketText}${topicText}\nPlease assist me. Thank you!`;

  return `https://wa.me/${SUPPORT_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
};


