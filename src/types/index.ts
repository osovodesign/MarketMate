export type CurrencyCode =
  | 'NGN'
  | 'USD'
  | 'GBP'
  | 'EUR'
  | 'GHS'
  | 'XOF'
  | 'KES'
  | 'CAD'
  | 'CNY';

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flag: string;
  decimals: number;
}

export interface ExchangeRateConfig {
  baseCurrency: CurrencyCode;
  rates: Record<CurrencyCode, number>;
  lastUpdated: string;
  marketType: 'parallel' | 'official';
}

export type StaffRole = 'owner' | 'manager' | 'cashier' | 'inventory' | 'accountant';

export interface StaffPermissions {
  // Financial & Cost Protection (Confidential)
  showCostPrice: boolean;
  showProfitAndMargins: boolean;
  canViewExpenses: boolean;
  // Sales & Cashier Controls (Fraud Prevention)
  canProcessSales: boolean;
  canGiveDiscount: boolean;
  maxDiscountPercent: number; // e.g. 5 for 5%, 0 for none, 100 for unlimited
  canRecordDebt: boolean;
  canEditDeleteSales: boolean;
  // Inventory & Product Catalog
  canViewProducts: boolean;
  canEditProducts: boolean;
  canAdjustStock: boolean;
  // Data Protection & Settings
  canExportData: boolean;
  canAccessSettings: boolean;
}

export interface StaffShiftRecord {
  id: string;
  businessId: string;
  staffId: string;
  staffName: string;
  role: StaffRole;
  startedAt: string; // ISO string
  endedAt?: string; // ISO string
  status: 'active' | 'closed';
  openingFloat: number; // in NGN/base currency
  expectedCash: number;
  actualCashCounted?: number;
  cashDifference?: number; // actual - expected
  totalSalesCount: number;
  totalSalesAmount: number;
  cashSalesAmount: number;
  transferSalesAmount: number;
  posCardSalesAmount: number;
  notes?: string;
  createdAt: string;
}

export interface StaffMember {
  id: string;
  businessId: string;
  name: string;
  role: StaffRole;
  pin: string; // 4-digit PIN
  phone?: string;
  email?: string;
  isActive: boolean;
  permissions?: StaffPermissions;
  currentShiftId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface StaffSession {
  currentRole: StaffRole;
  staffId?: string;
  staffName: string;
  isLocked: boolean;
  permissions?: StaffPermissions;
  activeShift?: StaffShiftRecord | null;
}

export type PaymentMethod = 'Cash' | 'Transfer' | 'POS' | 'Other';

export type BusinessCategory =
  | 'Fashion & Apparel'
  | 'Food & Catering'
  | 'Beauty & Cosmetics'
  | 'Phone & Accessories'
  | 'Electronics & Gadgets'
  | 'Mini Supermarket & Provisions'
  | 'Hair & Barbing Salon'
  | 'Home & Decor'
  | 'Tailoring & Crafts'
  | 'Pharmacy & Healthcare'
  | 'General Merchant';

export type ExpenseCategory =
  | 'Transport'
  | 'Rent'
  | 'Electricity'
  | 'Internet'
  | 'Marketing'
  | 'Supplies'
  | 'Staff'
  | 'Packaging'
  | 'Other';

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface BusinessProfile {
  id: string;
  userId: string;
  businessName: string;
  businessType: BusinessCategory;
  currency: CurrencyCode;
  phone?: string;
  ownerName?: string;
  address?: string;
  email?: string;
  cacNumber?: string;
  logoUrl?: string;
  logoDarkUrl?: string;
  bankDetails?: BankDetails;
  invoiceTerms?: string;
  isSubscribed?: boolean;
  subscriptionPlan?: string;
  subscribedAt?: string;
  subscriptionDiscountPercent?: number;
  hasDismissedGuide?: boolean;
  hasCompletedTour?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  defaultCostPrice: number;
  defaultSellingPrice: number;
  foreignCurrency?: CurrencyCode;
  foreignCostPrice?: number;
  foreignSellingPrice?: number;
  category?: string;
  stockQuantity?: number;
  lowStockThreshold?: number;
  createdAt: string;
}

export interface Sale {
  id: string;
  businessId: string;
  productId?: string;
  productName: string;
  barcode?: string;
  quantity: number;
  sellingPrice: number;
  costPrice: number;
  revenue: number;
  cost: number;
  profit: number;
  paymentMethod: PaymentMethod;
  customerName?: string;
  notes?: string;
  saleDate: string; // YYYY-MM-DD
  staffId?: string;
  staffName?: string;
  currency?: CurrencyCode;
  foreignAmount?: number;
  exchangeRate?: number;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discount: number;
}

export interface Expense {
  id: string;
  businessId: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  expenseDate: string; // YYYY-MM-DD
  createdAt: string;
}

export type TransactionType = 'sale' | 'expense';

export interface UnifiedTransaction {
  id: string;
  type: TransactionType;
  title: string;
  subtitle?: string;
  amount: number;
  cost?: number;
  profit?: number;
  paymentMethod: PaymentMethod;
  category?: string;
  date: string;
  createdAt: string;
  rawSale?: Sale;
  rawExpense?: Expense;
}

export interface FinancialPeriodSummary {
  revenue: number;
  productCosts: number;
  operatingExpenses: number;
  grossProfit: number;
  operatingProfit: number;
  profitMargin: number;
  salesCount: number;
  expensesCount: number;
}

export interface DashboardMetrics {
  today: FinancialPeriodSummary;
  thisWeek: FinancialPeriodSummary;
  thisMonth: FinancialPeriodSummary;
  recentTransactions: UnifiedTransaction[];
  salesTrend: { date: string; label: string; revenue: number; profit: number; expenses: number }[];
  expenseCategoryBreakdown: { category: ExpenseCategory; amount: number; percentage: number }[];
  topSellingProducts: { name: string; quantity: number; revenue: number; profit: number }[];
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  suggestedFollowUps?: string[];
  keyDataPoints?: { label: string; value: string }[];
}

export interface AIConversation {
  id: string;
  businessId: string;
  title: string;
  messages: AIMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface DebtRepayment {
  id: string;
  amount: number;
  paymentMethod: PaymentMethod;
  date: string;
  notes?: string;
}

export type DebtStatus = 'unpaid' | 'partial' | 'settled';

export interface CustomerDebt {
  id: string;
  businessId: string;
  customerName: string;
  customerPhone?: string;
  description: string;
  totalAmount: number;
  amountPaid: number;
  remainingBalance: number;
  status: DebtStatus;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  repayments: DebtRepayment[];
}

export interface BusinessTarget {
  monthlyRevenueTarget: number;
  monthlyProfitTarget: number;
}

export type InvoiceType = 'invoice' | 'quote';
export type InvoiceStatus = 'draft' | 'sent' | 'partial' | 'paid' | 'overdue';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  businessId: string;
  invoiceNumber: string;
  type: InvoiceType;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  taxRate: number; // e.g. 7.5 for 7.5%
  taxAmount: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  status: InvoiceStatus;
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  notes?: string;
  bankDetails?: BankDetails;
  saleId?: string; // Linked sale when converted/paid
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  businessId: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  marketLocation?: string; // e.g. Balogun Market, Lagos Island
  supplyCategory?: string; // e.g. Fabrics, Raw Silk, Packaging
  notes?: string;
  createdAt: string;
}

export type MessageTargetType =
  | 'broadcast'
  | 'direct'
  | 'zero_sales'
  | 'dormant'
  | 'transacting';
export type MessageChannel = 'in_app' | 'email' | 'both';
export type MessagePriority = 'normal' | 'important' | 'urgent';

export interface PlatformAnnouncement {
  id: string;
  title: string;
  content: string;
  type: MessageTargetType; // 'broadcast' for all, 'direct' for single merchant
  targetBusinessId?: string; // specific business ID if direct
  targetBusinessIds?: string[]; // specific business IDs if segment targeted
  targetBusinessName?: string;
  targetEmail?: string;
  channel: MessageChannel;
  priority: MessagePriority;
  senderEmail: string;
  senderName: string;
  actionUrl?: string;
  actionLabel?: string;
  createdAt: string;
  readBy?: string[]; // Array of business IDs or user IDs that have read it
  emailSentCount?: number;
}

export interface ReferralRecord {
  id: string;
  referrerCode: string;
  referrerUserId?: string;
  referrerEmail?: string;
  referrerBusinessName?: string;
  referredUserId: string;
  referredUserEmail?: string;
  referredBusinessName?: string;
  discountPercent: number; // 5%
  campaign: string; // 'MarketMate Pioneer Referral Campaign'
  validFrom: string; // '2026-10-12'
  validUntil: string; // '2026-10-30'
  status: 'pending_subscription' | 'qualified' | 'redeemed' | 'active';
  referredSubscribed: boolean; // Must be TRUE (merchant registered & subscribed) to earn 5% discount
  subscribedAt?: string;
  subscriptionPlan?: string;
  createdAt: string;
}

export interface PlatformBankConfig {
  bankName: string;
  accountNumber: string;
  accountName: string;
  instructions?: string;
  monthlyPlanPrice: number; // in NGN (₦1,000 promo through Dec 31, 2026)
  annualPlanPrice: number;  // in NGN (₦3,000 for Q4 3-Month Pass)
  q4PassPrice?: number;     // ₦3,000 flat (Oct, Nov, Dec 2026)
  supportPhone?: string;
  supportEmail?: string;
  updatedAt?: string;
}

export interface SubscriptionRequest {
  id: string;
  businessId: string;
  businessName: string;
  userId: string;
  userEmail: string;
  ownerName?: string;
  phone?: string;
  planId: 'monthly' | 'annual' | 'q4_pass' | 'pioneer_launch';
  planName: string;
  planOriginalPrice: number;
  discountPercent: number;
  finalAmount: number;
  currency: string;
  senderBank: string;
  senderAccountName: string;
  paymentReference: string;
  proofNote?: string;
  proofImageUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type SupportTicketCategory =
  | 'general'
  | 'payment_subscription'
  | 'pos_sales'
  | 'inventory_catalog'
  | 'bug_report'
  | 'feature_request'
  | 'account_security';

export type SupportTicketPriority = 'normal' | 'urgent';
export type SupportTicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  businessId?: string;
  businessName?: string;
  whatsappPhone?: string;
  category: SupportTicketCategory;
  subject: string;
  message: string;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  adminReply?: string;
  repliedAt?: string;
  repliedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type AppView =
  | 'landing'
  | 'login'
  | 'signup'
  | 'onboarding'
  | 'dashboard'
  | 'pos'
  | 'sales'
  | 'expenses'
  | 'invoices'
  | 'contacts'
  | 'products'
  | 'debts'
  | 'transactions'
  | 'reports'
  | 'ai'
  | 'settings'
  | 'admin'
  | 'staff'
  | 'record-sale'
  | 'record-expense'
  | 'pricing-calc'
  | 'profit-sim'
  | 'fx-calc'
  | 'create-invoice'
  | 'record-debt'
  | 'create-contact';


