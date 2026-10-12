import { StaffPermissions, StaffRole, StaffSession, AppView } from '../types';

export const DEFAULT_OWNER_PERMISSIONS: StaffPermissions = {
  showCostPrice: true,
  showProfitAndMargins: true,
  canViewExpenses: true,
  canProcessSales: true,
  canGiveDiscount: true,
  maxDiscountPercent: 100,
  canRecordDebt: true,
  canEditDeleteSales: true,
  canViewProducts: true,
  canEditProducts: true,
  canAdjustStock: true,
  canExportData: true,
  canAccessSettings: true,
};

export const DEFAULT_MANAGER_PERMISSIONS: StaffPermissions = {
  showCostPrice: true,
  showProfitAndMargins: true,
  canViewExpenses: true,
  canProcessSales: true,
  canGiveDiscount: true,
  maxDiscountPercent: 20,
  canRecordDebt: true,
  canEditDeleteSales: true,
  canViewProducts: true,
  canEditProducts: true,
  canAdjustStock: true,
  canExportData: true,
  canAccessSettings: false,
};

export const DEFAULT_CASHIER_PERMISSIONS: StaffPermissions = {
  showCostPrice: false,
  showProfitAndMargins: false,
  canViewExpenses: false,
  canProcessSales: true,
  canGiveDiscount: true,
  maxDiscountPercent: 5,
  canRecordDebt: false,
  canEditDeleteSales: false,
  canViewProducts: true,
  canEditProducts: false,
  canAdjustStock: false,
  canExportData: false,
  canAccessSettings: false,
};

export const DEFAULT_INVENTORY_PERMISSIONS: StaffPermissions = {
  showCostPrice: true,
  showProfitAndMargins: false,
  canViewExpenses: false,
  canProcessSales: false,
  canGiveDiscount: false,
  maxDiscountPercent: 0,
  canRecordDebt: false,
  canEditDeleteSales: false,
  canViewProducts: true,
  canEditProducts: true,
  canAdjustStock: true,
  canExportData: false,
  canAccessSettings: false,
};

export const DEFAULT_ACCOUNTANT_PERMISSIONS: StaffPermissions = {
  showCostPrice: true,
  showProfitAndMargins: true,
  canViewExpenses: true,
  canProcessSales: false,
  canGiveDiscount: false,
  maxDiscountPercent: 0,
  canRecordDebt: true,
  canEditDeleteSales: false,
  canViewProducts: true,
  canEditProducts: false,
  canAdjustStock: false,
  canExportData: true,
  canAccessSettings: false,
};

export const ROLE_PERMISSIONS_PRESETS: Record<StaffRole, StaffPermissions> = {
  owner: DEFAULT_OWNER_PERMISSIONS,
  manager: DEFAULT_MANAGER_PERMISSIONS,
  cashier: DEFAULT_CASHIER_PERMISSIONS,
  inventory: DEFAULT_INVENTORY_PERMISSIONS,
  accountant: DEFAULT_ACCOUNTANT_PERMISSIONS,
};

export interface RoleInfo {
  role: StaffRole;
  label: string;
  shortDesc: string;
  badgeBg: string;
  badgeText: string;
  border: string;
}

export const ROLE_CONFIGS: Record<StaffRole, RoleInfo> = {
  owner: {
    role: 'owner',
    label: 'Store Owner',
    shortDesc: 'Full unrestricted command, financial profit visibility, bank settings & staff control',
    badgeBg: 'bg-purple-100 dark:bg-purple-950/80',
    badgeText: 'text-purple-800 dark:text-purple-300',
    border: 'border-purple-300 dark:border-purple-800',
  },
  manager: {
    role: 'manager',
    label: 'Store Manager',
    shortDesc: 'Operational authority, POS discounts up to 20%, restock adjustments & daily sales tracking',
    badgeBg: 'bg-blue-100 dark:bg-blue-950/80',
    badgeText: 'text-blue-800 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-800',
  },
  cashier: {
    role: 'cashier',
    label: 'Cashier / Sales Rep',
    shortDesc: 'POS register checkouts only. Cost prices, expenses, and store net profits remain 100% confidential',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/80',
    badgeText: 'text-emerald-800 dark:text-emerald-300',
    border: 'border-emerald-300 dark:border-emerald-800',
  },
  inventory: {
    role: 'inventory',
    label: 'Inventory Clerk',
    shortDesc: 'Receives supplier stock, counts physical inventory & updates product catalog. No sales checkout',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/80',
    badgeText: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-800',
  },
  accountant: {
    role: 'accountant',
    label: 'Auditor / Accountant',
    shortDesc: 'Financial reports, P&L analysis, expense ledgers and debt balances. No register checkout',
    badgeBg: 'bg-indigo-100 dark:bg-indigo-950/80',
    badgeText: 'text-indigo-800 dark:text-indigo-300',
    border: 'border-indigo-300 dark:border-indigo-800',
  },
};

export interface PermissionDefinition {
  key: keyof StaffPermissions;
  label: string;
  description: string;
  category: 'confidential' | 'fraud_prevention' | 'inventory' | 'data_protection';
  categoryTitle: string;
  badge: string;
}

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  // Confidential Financials (Red Zone)
  {
    key: 'showCostPrice',
    label: 'View Product Cost & Buying Prices',
    description: 'When disabled, staff only see selling price. Buying cost is masked with •••• across all screens.',
    category: 'confidential',
    categoryTitle: 'Confidential Financials (Red Zone)',
    badge: 'Confidential',
  },
  {
    key: 'showProfitAndMargins',
    label: 'View Gross Margins & Take-Home Profit',
    description: 'When disabled, hides profit numbers, net margin % and replaces dashboard profit cards with cashier shift stats.',
    category: 'confidential',
    categoryTitle: 'Confidential Financials (Red Zone)',
    badge: 'Confidential',
  },
  {
    key: 'canViewExpenses',
    label: 'Access Operating Expenses & Overhead',
    description: 'When disabled, staff cannot view shop expenses (generator fuel, rent, salaries, transport).',
    category: 'confidential',
    categoryTitle: 'Confidential Financials (Red Zone)',
    badge: 'Confidential',
  },

  // Fraud Prevention / Sales (Amber Zone)
  {
    key: 'canProcessSales',
    label: 'Process Sales at POS Register',
    description: 'Enables high-speed barcode checkout, ringing up walk-in customers and printing receipts.',
    category: 'fraud_prevention',
    categoryTitle: 'Sales & Fraud Controls (Amber Zone)',
    badge: 'Fraud Control',
  },
  {
    key: 'canGiveDiscount',
    label: 'Allow Giving Custom Customer Discounts',
    description: 'Staff can give discounts up to the allowed maximum % limit. Higher discounts require Manager PIN.',
    category: 'fraud_prevention',
    categoryTitle: 'Sales & Fraud Controls (Amber Zone)',
    badge: 'Fraud Control',
  },
  {
    key: 'canRecordDebt',
    label: 'Allow Recording Debt / Credit Sales',
    description: 'Prevents staff from letting customers or friends walk away with goods marked as unpaid debt.',
    category: 'fraud_prevention',
    categoryTitle: 'Sales & Fraud Controls (Amber Zone)',
    badge: 'Fraud Control',
  },
  {
    key: 'canEditDeleteSales',
    label: 'Allow Modifying or Deleting Completed Sales',
    description: 'Prevents cashiers from voiding or deleting completed receipts to pocket cash after the sale.',
    category: 'fraud_prevention',
    categoryTitle: 'Sales & Fraud Controls (Amber Zone)',
    badge: 'Fraud Control',
  },

  // Inventory & Stock (Blue Zone)
  {
    key: 'canViewProducts',
    label: 'View Product Catalog & Stock Quantities',
    description: 'Access the inventory list to check available quantities and barcodes.',
    category: 'inventory',
    categoryTitle: 'Inventory & Stock (Blue Zone)',
    badge: 'Stock Control',
  },
  {
    key: 'canEditProducts',
    label: 'Add New Products & Edit Selling Prices',
    description: 'Allows updating selling prices and registering new items into the store inventory.',
    category: 'inventory',
    categoryTitle: 'Inventory & Stock (Blue Zone)',
    badge: 'Stock Control',
  },
  {
    key: 'canAdjustStock',
    label: 'Record Stock Restocks & Damaged Goods',
    description: 'Allows recording incoming wholesale shipments or deducting spoiled/damaged items.',
    category: 'inventory',
    categoryTitle: 'Inventory & Stock (Blue Zone)',
    badge: 'Stock Control',
  },

  // Data & Settings (Purple Zone)
  {
    key: 'canExportData',
    label: 'Export Data to Excel / CSV Files',
    description: 'Prevents unauthorized copying or download of customer phone numbers and sales transaction records.',
    category: 'data_protection',
    categoryTitle: 'Data Protection (Purple Zone)',
    badge: 'Security',
  },
  {
    key: 'canAccessSettings',
    label: 'Access Business Settings & Bank Accounts',
    description: 'Restricts editing of store name, receipt templates, receiving bank details, and staff profiles.',
    category: 'data_protection',
    categoryTitle: 'Data Protection (Purple Zone)',
    badge: 'Security',
  },
];

/**
 * Ensures a staff object has complete permissions populated with safe defaults.
 */
export function ensureStaffPermissions(
  role: StaffRole = 'cashier',
  existingPermissions?: Partial<StaffPermissions>
): StaffPermissions {
  const preset = ROLE_PERMISSIONS_PRESETS[role] || DEFAULT_CASHIER_PERMISSIONS;
  if (!existingPermissions) {
    return { ...preset };
  }
  return {
    ...preset,
    ...existingPermissions,
    maxDiscountPercent:
      typeof existingPermissions.maxDiscountPercent === 'number'
        ? existingPermissions.maxDiscountPercent
        : preset.maxDiscountPercent,
  };
}

/**
 * Check if the active session has a specific permission.
 */
export function hasPermission(
  session: StaffSession | undefined | null,
  key: keyof StaffPermissions
): boolean {
  if (!session) return true; // Owner default when no session exists
  if (session.currentRole === 'owner') return true;

  const perms = session.permissions || ROLE_PERMISSIONS_PRESETS[session.currentRole] || DEFAULT_CASHIER_PERMISSIONS;
  return Boolean(perms[key]);
}

/**
 * Check if a session can view a specific AppView.
 */
export function canAccessView(
  session: StaffSession | undefined | null,
  view: AppView
): boolean {
  if (!session || session.currentRole === 'owner') return true;

  const perms = session.permissions || ROLE_PERMISSIONS_PRESETS[session.currentRole] || DEFAULT_CASHIER_PERMISSIONS;

  switch (view) {
    case 'expenses':
      return perms.canViewExpenses;
    case 'reports':
      return perms.showProfitAndMargins;
    case 'settings':
    case 'admin':
      return perms.canAccessSettings;
    case 'products':
      return perms.canViewProducts;
    case 'pos':
      return perms.canProcessSales;
    case 'debts':
      return perms.canRecordDebt || session.currentRole === 'accountant';
    default:
      return true;
  }
}
