// Super Admin Configuration for MarketMate Owner
export const SUPER_ADMIN_CONFIG = {
  email: 'osovoyoronogheneovo@gmail.com',
  name: 'App Owner (Admin)',
  role: 'super_admin' as const,
};

export const isSuperAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return email.trim().toLowerCase() === SUPER_ADMIN_CONFIG.email.toLowerCase();
};
