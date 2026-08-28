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

export type StaffRole = 'owner' | 'manager' | 'cashier';

export interface StaffMember {
  id: string;
  businessId: string;
  name: string;
  role: StaffRole;
  pin: string; // 4-digit PIN
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface StaffSession {
  currentRole: StaffRole;
  staffId?: string;
  staffName: string;
  isLocked: boolean;
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
  bankDetails?: BankDetails;
  invoiceTerms?: string;
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
  | 'settings';

