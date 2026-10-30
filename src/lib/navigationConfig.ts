import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  TrendingUp,
  Receipt,
  Package,
  Users,
  ArrowLeftRight,
  BarChart3,
  Bot,
  Settings,
  Calculator,
  Sliders,
  Target,
  Database,
  FileText,
  BookUser,
  Ship,
  Shield,
  CreditCard,
  Headphones,
  Gift,
  LucideIcon,
} from 'lucide-react';
import { AppView, StaffSession, StaffPermissions } from '../types';
import { hasPermission } from './staffPermissions';

export type NavGroupId =
  | 'business'
  | 'sell'
  | 'products'
  | 'money'
  | 'people'
  | 'tools'
  | 'management'
  | 'account';

export interface SharedNavItem {
  id: AppView;
  label: string;
  shortLabel?: string;
  subtitle: string;
  icon: LucideIcon;
  group: NavGroupId;
  isPro?: boolean;
  hideForCashier?: boolean;
  requiredPermission?: keyof StaffPermissions;
  activeMatches?: AppView[];
  badgeKey?: 'debts' | 'invoices' | 'lowStock';
}

export interface NavGroupDefinition {
  id: NavGroupId;
  label: string;
}

export const NAV_GROUPS: NavGroupDefinition[] = [
  { id: 'business', label: 'Business' },
  { id: 'sell', label: 'Sell' },
  { id: 'products', label: 'Products' },
  { id: 'money', label: 'Money' },
  { id: 'people', label: 'People' },
  { id: 'tools', label: 'Business Tools' },
  { id: 'management', label: 'Management' },
  { id: 'account', label: 'Account' },
];

export const SHARED_NAV_ITEMS: SharedNavItem[] = [
  // BUSINESS
  {
    id: 'dashboard',
    label: 'Home',
    shortLabel: 'Home',
    subtitle: 'Your sales, expenses, profit, and daily business summary',
    icon: LayoutDashboard,
    group: 'business',
  },

  // SELL
  {
    id: 'pos',
    label: 'Checkout',
    shortLabel: 'Checkout',
    subtitle: 'Complete customer sales, accept payments, and issue receipts',
    icon: ShoppingCart,
    group: 'sell',
  },
  {
    id: 'sales',
    label: 'Sales',
    shortLabel: 'Sales',
    subtitle: 'Review recorded sales, item costs, and receipts',
    icon: TrendingUp,
    group: 'sell',
    activeMatches: ['record-sale'],
  },
  {
    id: 'transactions',
    label: 'Transactions',
    shortLabel: 'Transactions',
    subtitle: 'Complete history of money coming in and going out',
    icon: ArrowLeftRight,
    group: 'sell',
  },

  // PRODUCTS
  {
    id: 'products',
    label: 'Products & Stock',
    shortLabel: 'Products',
    subtitle: 'Manage products, selling prices, cost prices, and available stock',
    icon: Package,
    group: 'products',
    isPro: true,
    activeMatches: ['create-product', 'bulk-import'],
    badgeKey: 'lowStock',
  },

  // MONEY
  {
    id: 'expenses',
    label: 'Expenses',
    shortLabel: 'Expenses',
    subtitle: 'Record and review money spent to run your business',
    icon: Receipt,
    group: 'money',
    hideForCashier: true,
    requiredPermission: 'canViewExpenses',
    activeMatches: ['record-expense'],
  },
  {
    id: 'debts',
    label: 'Customer Debts',
    shortLabel: 'Debts',
    subtitle: 'Track customers who owe your business and record repayments',
    icon: Users,
    group: 'money',
    isPro: true,
    activeMatches: ['record-debt'],
    badgeKey: 'debts',
  },
  {
    id: 'invoices',
    label: 'Invoices & Quotes',
    shortLabel: 'Invoices',
    subtitle: 'Prepare invoices and price quotes for your customers',
    icon: FileText,
    group: 'money',
    isPro: true,
    activeMatches: ['create-invoice'],
    badgeKey: 'invoices',
  },
  {
    id: 'reports',
    label: 'Reports',
    shortLabel: 'Reports',
    subtitle: 'Understand your sales, expenses, and profit over time',
    icon: BarChart3,
    group: 'money',
    hideForCashier: true,
    requiredPermission: 'showProfitAndMargins',
    isPro: true,
  },

  // PEOPLE
  {
    id: 'contacts',
    label: 'Customers & Suppliers',
    shortLabel: 'Customers',
    subtitle: 'Keep customer and supplier contact details organised',
    icon: BookUser,
    group: 'people',
    isPro: true,
    activeMatches: ['create-contact'],
  },

  // BUSINESS TOOLS
  {
    id: 'ai',
    label: 'Business Assistant',
    shortLabel: 'Assistant',
    subtitle: 'Ask questions about your business numbers and get helpful answers',
    icon: Bot,
    group: 'tools',
    isPro: true,
  },
  {
    id: 'pricing-calc',
    label: 'Product Pricing Calculator',
    shortLabel: 'Pricing',
    subtitle: 'Understand product cost and choose a profitable selling price',
    icon: Calculator,
    group: 'tools',
    isPro: true,
  },
  {
    id: 'profit-sim',
    label: 'Profit Planner',
    shortLabel: 'Profit Planner',
    subtitle: 'Explore how changes in sales, costs, or prices affect your profit',
    icon: Sliders,
    group: 'tools',
    isPro: true,
  },
  {
    id: 'fx-calc',
    label: 'Import Cost Calculator',
    shortLabel: 'Import Cost',
    subtitle: 'Calculate landed cost for imported goods using exchange rates',
    icon: Ship,
    group: 'tools',
    isPro: true,
  },

  // MANAGEMENT
  {
    id: 'staff',
    label: 'Staff & Permissions',
    shortLabel: 'Staff',
    subtitle: 'Control staff access, PINs, shifts, and permissions',
    icon: Shield,
    group: 'management',
    isPro: true,
  },
  {
    id: 'financial-goals',
    label: 'Business Goals',
    shortLabel: 'Goals',
    subtitle: 'Set monthly sales and profit targets and track progress',
    icon: Target,
    group: 'management',
    isPro: true,
  },

  // ACCOUNT
  {
    id: 'subscribe',
    label: 'Subscription',
    shortLabel: 'Subscription',
    subtitle: 'View your current plan, expiry date, and payment options',
    icon: CreditCard,
    group: 'account',
    hideForCashier: true,
  },
  {
    id: 'backup-vault',
    label: 'Data & Backup',
    shortLabel: 'Backup',
    subtitle: 'Download a backup copy of your business records',
    icon: Database,
    group: 'account',
    hideForCashier: true,
    isPro: true,
  },
  {
    id: 'referral',
    label: 'Refer & Earn',
    shortLabel: 'Referrals',
    subtitle: 'Invite as many business owners as you want. Your referral link never expires.',
    icon: Gift,
    group: 'account',
    hideForCashier: true,
  },
  {
    id: 'settings',
    label: 'Settings',
    shortLabel: 'Settings',
    subtitle: 'Update your business profile, bank details, and app preferences',
    icon: Settings,
    group: 'account',
    hideForCashier: true,
    requiredPermission: 'canAccessSettings',
  },
  {
    id: 'help-support',
    label: 'Help & Support',
    shortLabel: 'Help',
    subtitle: 'Get help with common tasks or contact the MarketMate team',
    icon: Headphones,
    group: 'account',
  },
];

export const VIEW_TITLES: Record<AppView, { title: string; subtitle: string }> = {
  landing: { title: 'MarketMate', subtitle: 'Know Your Numbers. Grow Your Business.' },
  login: { title: 'Log In', subtitle: 'Access your business account' },
  signup: { title: 'Create Account', subtitle: 'Start managing your business with MarketMate' },
  onboarding: { title: 'Business Setup', subtitle: 'Tell us a few details about your business' },
  dashboard: { title: 'Home', subtitle: 'Your sales, expenses, profit, and daily business summary' },
  pos: { title: 'Checkout', subtitle: 'Complete a sale, receive payment, and issue a receipt' },
  sales: { title: 'Sales', subtitle: 'Find, review, and understand your recorded sales' },
  expenses: { title: 'Expenses', subtitle: 'Record and review money spent by your business' },
  invoices: { title: 'Invoices & Quotes', subtitle: 'Prepare and track customer invoices and quotations' },
  contacts: { title: 'Customers & Suppliers', subtitle: 'Keep your customer and supplier contacts organised' },
  debts: { title: 'Customer Debts', subtitle: 'Know who owes your business and record repayments' },
  products: { title: 'Products & Stock', subtitle: 'Manage what you sell and check available stock' },
  transactions: { title: 'Transactions', subtitle: 'Clear history of all money-related activity' },
  reports: { title: 'Reports', subtitle: 'Understand how your business is performing' },
  ai: { title: 'Business Assistant', subtitle: 'Ask questions about your business numbers' },
  settings: { title: 'Settings', subtitle: 'Manage your business profile and app preferences' },
  admin: { title: 'Admin Portal', subtitle: 'Manage merchants, subscription approvals, and platform settings' },
  staff: { title: 'Staff & Permissions', subtitle: 'Control who can use your business account and what they can do' },
  'record-sale': { title: 'Record Sale', subtitle: 'Enter what was sold and how the customer paid' },
  'record-expense': { title: 'Add Expense', subtitle: 'Record money spent by your business' },
  'pricing-calc': { title: 'Product Pricing Calculator', subtitle: 'Understand product cost and choose a selling price' },
  'profit-sim': { title: 'Profit Planner', subtitle: 'Explore how sales, costs, or prices affect your results' },
  'fx-calc': { title: 'Import Cost Calculator', subtitle: 'Estimate landed cost for imported products' },
  'create-invoice': { title: 'Create Invoice or Quote', subtitle: 'Prepare an invoice or price quote for a customer' },
  'record-debt': { title: 'Record Customer Debt', subtitle: 'Record an unpaid customer balance and due date' },
  'create-contact': { title: 'Add Contact', subtitle: 'Save a customer or supplier contact' },
  'create-product': { title: 'Add Product', subtitle: 'Enter product information, pricing, and stock level' },
  'financial-goals': { title: 'Business Goals', subtitle: 'Set and track your sales and profit targets' },
  'backup-vault': { title: 'Data & Backup', subtitle: 'Export or restore your business records' },
  referral: { title: 'MarketMate Referral Programme', subtitle: 'Invite as many business owners as you want. Your referral link never expires.' },
  'help-support': { title: 'Help & Support', subtitle: 'Get answers to common questions or contact support' },
  'logo-export': { title: 'Brand Assets', subtitle: 'Download official MarketMate logos and icons' },
  subscribe: { title: 'Subscription', subtitle: 'Manage your MarketMate Pro plan and payment status' },
  'bulk-import': { title: 'Import Products', subtitle: 'Upload a spreadsheet to add multiple products at once' },
  legal: { title: 'Terms & Privacy', subtitle: 'Terms of service, disclaimers, and privacy notice' },
};

export function isNavItemVisible(
  item: SharedNavItem,
  session?: StaffSession | null
): boolean {
  const isCashier = session?.currentRole === 'cashier';
  if (isCashier && item.hideForCashier) {
    return false;
  }
  if (item.requiredPermission && session) {
    return hasPermission(session, item.requiredPermission);
  }
  return true;
}

export function isNavItemActive(item: SharedNavItem, currentView: AppView): boolean {
  if (currentView === item.id) return true;
  if (item.activeMatches && item.activeMatches.includes(currentView)) return true;
  return false;
}
