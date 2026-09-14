// Super Admin Configuration for MarketMate Owner & Company Administration
export const SUPER_ADMIN_CONFIG = {
  email: 'getmarketmate@gmail.com',
  name: 'MarketMate Official (Admin)',
  role: 'super_admin' as const,
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

