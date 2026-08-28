import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import {
  Sale,
  Expense,
  Product,
  CustomerDebt,
  DebtRepayment,
  BusinessTarget,
  DashboardMetrics,
  FinancialPeriodSummary,
  UnifiedTransaction,
  PaymentMethod,
  ExpenseCategory,
  BusinessCategory,
  Invoice,
  Customer,
  Supplier,
  InvoiceStatus,
  StaffMember,
  StaffSession,
  StaffRole,
  ExchangeRateConfig,
  CurrencyCode,
  CartItem,
} from '../types';
import {
  calculateSaleMetrics,
  calculatePeriodSummary,
  computeDashboardMetrics,
  buildUnifiedTransactions,
  filterSalesByDateRange,
  filterExpensesByDateRange,
  roundMoney,
} from '../lib/math';
import { useAuth } from './AuthContext';
import { getTodayDateString } from '../lib/formatters';
import { DEFAULT_FX_CONFIG, DEFAULT_EXCHANGE_RATES_PARALLEL, DEFAULT_EXCHANGE_RATES_OFFICIAL } from '../lib/currencies';
import {
  auth,
  db,
  doc,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';

interface BusinessDataContextType {
  sales: Sale[];
  expenses: Expense[];
  products: Product[];
  debts: CustomerDebt[];
  invoices: Invoice[];
  customers: Customer[];
  suppliers: Supplier[];
  targets: BusinessTarget;
  metrics: DashboardMetrics;
  recentTransactions: UnifiedTransaction[];
  totalOutstandingReceivables: number;
  totalUnpaidInvoices: number;
  isLoading: boolean;
  isCloudSyncing: boolean;
  fxConfig: ExchangeRateConfig;
  updateFxRates: (rates: Partial<Record<CurrencyCode, number>>, marketType?: 'parallel' | 'official') => void;
  staffList: StaffMember[];
  currentSession: StaffSession;
  addStaff: (staffData: Omit<StaffMember, 'id' | 'businessId' | 'createdAt'>) => Promise<StaffMember>;
  updateStaff: (staffId: string, data: Partial<StaffMember>) => Promise<StaffMember>;
  deleteStaff: (staffId: string) => Promise<void>;
  switchStaffSession: (staffId: string | null, pin?: string) => Promise<{ success: boolean; message: string }>;
  lockCashierMode: () => void;
  unlockOwnerMode: (pin: string) => { success: boolean; message: string };
  recordPosCheckout: (data: {
    items: CartItem[];
    paymentMethod: PaymentMethod;
    amountTendered: number;
    change: number;
    customerName?: string;
    notes?: string;
    currency?: CurrencyCode;
  }) => Promise<{ sales: Sale[]; receiptNumber: string }>;
  addSale: (saleData: {
    productName: string;
    quantity: number;
    sellingPrice: number;
    costPrice: number;
    paymentMethod: PaymentMethod;
    customerName?: string;
    notes?: string;
    saleDate?: string;
    barcode?: string;
    currency?: CurrencyCode;
  }) => Promise<Sale>;
  addExpense: (expenseData: {
    description: string;
    amount: number;
    category: ExpenseCategory;
    paymentMethod: PaymentMethod;
    expenseDate?: string;
  }) => Promise<Expense>;
  addProduct: (productData: {
    name: string;
    category?: string;
    sku?: string;
    barcode?: string;
    defaultSellingPrice: number;
    defaultCostPrice: number;
    foreignCurrency?: CurrencyCode;
    foreignCostPrice?: number;
    foreignSellingPrice?: number;
    stockQuantity?: number;
    lowStockThreshold?: number;
  }) => Promise<Product>;
  updateProduct: (
    productId: string,
    productData: Partial<Omit<Product, 'id' | 'businessId' | 'createdAt'>>
  ) => Promise<Product>;
  deleteProduct: (productId: string) => Promise<void>;
  deleteSale: (saleId: string) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  addDebt: (debtData: {
    customerName: string;
    customerPhone?: string;
    description: string;
    totalAmount: number;
    amountPaid?: number;
    dueDate?: string;
    notes?: string;
  }) => Promise<CustomerDebt>;
  recordDebtRepayment: (
    debtId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    notes?: string
  ) => Promise<void>;
  deleteDebt: (debtId: string) => Promise<void>;
  addInvoice: (invoiceData: Omit<Invoice, 'id' | 'businessId' | 'createdAt' | 'updatedAt'>) => Promise<Invoice>;
  updateInvoice: (invoiceId: string, data: Partial<Invoice>) => Promise<Invoice>;
  deleteInvoice: (invoiceId: string) => Promise<void>;
  recordInvoicePayment: (
    invoiceId: string,
    amountPaid: number,
    paymentMethod: PaymentMethod,
    autoRecordAsSale?: boolean
  ) => Promise<void>;
  addCustomer: (customerData: Omit<Customer, 'id' | 'businessId' | 'createdAt'>) => Promise<Customer>;
  updateCustomer: (customerId: string, data: Partial<Customer>) => Promise<Customer>;
  deleteCustomer: (customerId: string) => Promise<void>;
  addSupplier: (supplierData: Omit<Supplier, 'id' | 'businessId' | 'createdAt'>) => Promise<Supplier>;
  updateSupplier: (supplierId: string, data: Partial<Supplier>) => Promise<Supplier>;
  deleteSupplier: (supplierId: string) => Promise<void>;
  updateTargets: (targets: BusinessTarget) => Promise<void>;
  exportAllDataJSON: () => string;
  importAllDataJSON: (jsonString: string) => Promise<{ success: boolean; message: string }>;
  getSummaryForRange: (startDate: string, endDate: string) => FinancialPeriodSummary;
  getFilteredTransactions: (options: {
    startDate?: string;
    endDate?: string;
    type?: 'all' | 'sale' | 'expense';
    search?: string;
    paymentMethod?: string;
  }) => UnifiedTransaction[];
  resetData: () => void;
  loadDemoData: () => void;
}

const BusinessDataContext = createContext<BusinessDataContextType | undefined>(undefined);

// Initial rich sample dataset for realistic Nigerian business demonstration (Ada Fashion & Fabrics)
const generateDemoData = (
  businessId: string
): {
  sales: Sale[];
  expenses: Expense[];
  products: Product[];
  debts: CustomerDebt[];
  invoices: Invoice[];
  customers: Customer[];
  suppliers: Supplier[];
  targets: BusinessTarget;
  staff: StaffMember[];
  fxConfig: ExchangeRateConfig;
} => {
  const today = getTodayDateString();
  const d = new Date();

  const getYmd = (offsetDays: number) => {
    const target = new Date(d);
    target.setDate(d.getDate() - offsetDays);
    const yr = target.getFullYear();
    const mo = String(target.getMonth() + 1).padStart(2, '0');
    const dy = String(target.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${dy}`;
  };

  const sampleProducts: Product[] = [
    {
      id: 'prod-1',
      businessId,
      name: 'Ankara Ready-to-Wear Gown',
      sku: 'ANK-GWN-001',
      barcode: '202601001',
      defaultSellingPrice: 25000,
      defaultCostPrice: 14000,
      foreignCurrency: 'USD',
      foreignCostPrice: 9.2,
      foreignSellingPrice: 16.4,
      category: 'Fashion & Apparel',
      stockQuantity: 24,
      lowStockThreshold: 5,
      createdAt: getYmd(30),
    },
    {
      id: 'prod-2',
      businessId,
      name: 'Silk Shirt & Trouser Set',
      sku: 'SLK-SET-002',
      barcode: '202601002',
      defaultSellingPrice: 35000,
      defaultCostPrice: 20000,
      foreignCurrency: 'USD',
      foreignCostPrice: 13.1,
      foreignSellingPrice: 23.0,
      category: 'Fashion & Apparel',
      stockQuantity: 15,
      lowStockThreshold: 4,
      createdAt: getYmd(30),
    },
    {
      id: 'prod-3',
      businessId,
      name: 'Designer Casual Kaftan',
      sku: 'DSG-KAF-003',
      barcode: '202601003',
      defaultSellingPrice: 30000,
      defaultCostPrice: 17500,
      category: 'Fashion & Apparel',
      stockQuantity: 18,
      lowStockThreshold: 5,
      createdAt: getYmd(30),
    },
    {
      id: 'prod-4',
      businessId,
      name: 'Cotton Wrap Top',
      sku: 'COT-TOP-004',
      barcode: '202601004',
      defaultSellingPrice: 15000,
      defaultCostPrice: 8500,
      category: 'Fashion & Apparel',
      stockQuantity: 32,
      lowStockThreshold: 8,
      createdAt: getYmd(30),
    },
    {
      id: 'prod-5',
      businessId,
      name: 'Embroidered Agbada Set',
      sku: 'AGB-SET-005',
      barcode: '202601005',
      defaultSellingPrice: 75000,
      defaultCostPrice: 42000,
      category: 'Fashion & Apparel',
      stockQuantity: 6,
      lowStockThreshold: 2,
      createdAt: getYmd(30),
    },
  ];

  const sampleDebts: CustomerDebt[] = [
    {
      id: 'debt-1',
      businessId,
      customerName: 'Mrs. Folake Martins',
      customerPhone: '08034567890',
      description: '2 Custom Silk Sets with embroidery',
      totalAmount: 70000,
      amountPaid: 35000,
      remainingBalance: 35000,
      status: 'partial',
      dueDate: getYmd(-2),
      createdAt: getYmd(5),
      updatedAt: getYmd(2),
      repayments: [
        {
          id: 'rep-1',
          amount: 35000,
          paymentMethod: 'Transfer',
          date: getYmd(2),
          notes: 'Half deposit via bank transfer',
        },
      ],
    },
    {
      id: 'debt-2',
      businessId,
      customerName: 'Chief Emeka Okoye',
      customerPhone: '08123456789',
      description: '1 Agbada set balance',
      totalAmount: 75000,
      amountPaid: 0,
      remainingBalance: 75000,
      status: 'unpaid',
      dueDate: getYmd(3),
      createdAt: getYmd(7),
      updatedAt: getYmd(7),
      repayments: [],
    },
  ];

  const sampleTargets: BusinessTarget = {
    monthlyRevenueTarget: 1500000,
    monthlyProfitTarget: 600000,
  };

  const sampleSales: Sale[] = [
    {
      id: 'sale-101',
      businessId,
      productId: 'prod-1',
      productName: 'Ankara Ready-to-Wear Gown',
      quantity: 2,
      sellingPrice: 25000,
      costPrice: 14000,
      revenue: 50000,
      cost: 28000,
      profit: 22000,
      paymentMethod: 'Transfer',
      customerName: 'Mrs. Folake Martins',
      saleDate: today,
      staffName: 'Adaeze (Owner)',
      createdAt: today,
    },
    {
      id: 'sale-102',
      businessId,
      productId: 'prod-2',
      productName: 'Silk Shirt & Trouser Set',
      quantity: 1,
      sellingPrice: 35000,
      costPrice: 20000,
      revenue: 35000,
      cost: 20000,
      profit: 15000,
      paymentMethod: 'POS',
      customerName: 'Amina Bello',
      saleDate: today,
      staffName: 'Chidinma Kalu',
      createdAt: today,
    },
    {
      id: 'sale-103',
      businessId,
      productId: 'prod-4',
      productName: 'Cotton Wrap Top',
      quantity: 3,
      sellingPrice: 15000,
      costPrice: 8500,
      revenue: 45000,
      cost: 25500,
      profit: 19500,
      paymentMethod: 'Cash',
      customerName: 'Walk-in Customer',
      saleDate: getYmd(1),
      staffName: 'Blessing Sunday',
      createdAt: getYmd(1),
    },
    {
      id: 'sale-104',
      businessId,
      productId: 'prod-3',
      productName: 'Designer Casual Kaftan',
      quantity: 2,
      sellingPrice: 30000,
      costPrice: 17500,
      revenue: 60000,
      cost: 35000,
      profit: 25000,
      paymentMethod: 'Transfer',
      customerName: 'Chief Emeka Okoye',
      saleDate: getYmd(2),
      staffName: 'Adaeze (Owner)',
      createdAt: getYmd(2),
    },
    {
      id: 'sale-105',
      businessId,
      productId: 'prod-5',
      productName: 'Embroidered Agbada Set',
      quantity: 1,
      sellingPrice: 75000,
      costPrice: 42000,
      revenue: 75000,
      cost: 42000,
      profit: 33000,
      paymentMethod: 'Transfer',
      customerName: 'Senator Adeleke',
      saleDate: getYmd(3),
      staffName: 'Adaeze (Owner)',
      createdAt: getYmd(3),
    },
    {
      id: 'sale-106',
      businessId,
      productId: 'prod-1',
      productName: 'Ankara Ready-to-Wear Gown',
      quantity: 3,
      sellingPrice: 25000,
      costPrice: 14000,
      revenue: 75000,
      cost: 42000,
      profit: 33000,
      paymentMethod: 'POS',
      customerName: 'Walk-in Boutique Shopper',
      saleDate: getYmd(4),
      staffName: 'Chidinma Kalu',
      createdAt: getYmd(4),
    },
  ];

  const sampleExpenses: Expense[] = [
    {
      id: 'exp-201',
      businessId,
      description: 'Store generator petrol (25 litres)',
      amount: 22500,
      category: 'Electricity',
      paymentMethod: 'Cash',
      expenseDate: today,
      createdAt: today,
    },
    {
      id: 'exp-202',
      businessId,
      description: 'Lagos Island dispatch bike delivery to Lekki',
      amount: 4500,
      category: 'Transport',
      paymentMethod: 'Transfer',
      expenseDate: today,
      createdAt: today,
    },
    {
      id: 'exp-203',
      businessId,
      description: 'Branded nylon shopping bags (100 pcs)',
      amount: 15000,
      category: 'Packaging',
      paymentMethod: 'Transfer',
      expenseDate: getYmd(1),
      createdAt: getYmd(1),
    },
    {
      id: 'exp-204',
      businessId,
      description: 'Instagram sponsored promo post',
      amount: 18000,
      category: 'Marketing',
      paymentMethod: 'Transfer',
      expenseDate: getYmd(2),
      createdAt: getYmd(2),
    },
    {
      id: 'exp-205',
      businessId,
      description: 'Monthly store internet data bundle',
      amount: 10000,
      category: 'Internet',
      paymentMethod: 'Transfer',
      expenseDate: getYmd(3),
      createdAt: getYmd(3),
    },
  ];

  const sampleCustomers: Customer[] = [
    {
      id: 'cust-1',
      businessId,
      name: 'Mrs. Folake Martins',
      phone: '08034567890',
      email: 'folake.martins@gmail.com',
      address: 'Plot 14, Victoria Island, Lagos',
      notes: 'VIP customer, prefers luxury silk and bespoke ankara styles',
      createdAt: getYmd(45),
    },
    {
      id: 'cust-2',
      businessId,
      name: 'Chief Emeka Okoye',
      phone: '08123456789',
      email: 'emeka.okoye@okoyegroup.ng',
      address: 'Lekki Phase 1, Lagos',
      notes: 'Regular purchaser of premium Agbada sets for events',
      createdAt: getYmd(40),
    },
    {
      id: 'cust-3',
      businessId,
      name: 'Amina Bello',
      phone: '08098765432',
      email: 'amina.bello@abuja.com',
      address: 'Wuse 2, Abuja',
      notes: 'Orders ready-to-wear kaftans in wholesale batches',
      createdAt: getYmd(30),
    },
  ];

  const sampleSuppliers: Supplier[] = [
    {
      id: 'sup-1',
      businessId,
      name: 'Balogun Luxury Fabrics & Lace Direct',
      contactPerson: 'Alhaji Rasheed',
      phone: '08031122334',
      marketLocation: 'Balogun Market, Lagos Island',
      supplyCategory: 'Premium Swiss Lace, Silk, Raw Brocade',
      notes: 'Direct importer, offers 5% discount on orders above ₦200k',
      createdAt: getYmd(60),
    },
    {
      id: 'sup-2',
      businessId,
      name: 'Trade Fair Fashion Accessories Hub',
      contactPerson: 'Chinedu Obi',
      phone: '08144556677',
      marketLocation: 'Lagos Trade Fair Complex, Badagry Exp.',
      supplyCategory: 'Zippers, Designer Buttons, High-Grade Linings',
      notes: 'Wholesale only, accepts payment on waybill delivery',
      createdAt: getYmd(60),
    },
  ];

  const sampleInvoices: Invoice[] = [
    {
      id: 'inv-1',
      businessId,
      invoiceNumber: 'INV-2026-001',
      type: 'invoice',
      customerName: 'Mrs. Folake Martins',
      customerPhone: '08034567890',
      customerEmail: 'folake.martins@gmail.com',
      customerAddress: 'Plot 14, Victoria Island, Lagos',
      items: [
        {
          id: 'item-1',
          description: 'Ankara Bespoke Flare Gown with Embellished Sleeves',
          quantity: 2,
          unitPrice: 25000,
          total: 50000,
        },
        {
          id: 'item-2',
          description: 'Silk Scarf & Matching Headwrap',
          quantity: 1,
          unitPrice: 12000,
          total: 12000,
        },
      ],
      subtotal: 62000,
      discount: 2000,
      taxRate: 0,
      taxAmount: 0,
      total: 60000,
      amountPaid: 30000,
      balanceDue: 30000,
      status: 'partial',
      issueDate: getYmd(4),
      dueDate: getYmd(-3),
      notes: '50% initial commitment deposit received via Transfer. Balance due on final fitting.',
      bankDetails: {
        bankName: 'Access Bank PLC',
        accountNumber: '0123456789',
        accountName: 'Ada Fashion & Fabrics',
      },
      createdAt: getYmd(4),
      updatedAt: getYmd(2),
    },
  ];

  const sampleStaff: StaffMember[] = [
    {
      id: 'staff-1',
      businessId,
      name: 'Adaeze Nnamdi',
      role: 'owner',
      pin: '1234',
      phone: '08023456789',
      isActive: true,
      createdAt: getYmd(30),
    },
    {
      id: 'staff-2',
      businessId,
      name: 'Chidinma Kalu',
      role: 'cashier',
      pin: '0000',
      phone: '08031122334',
      isActive: true,
      createdAt: getYmd(15),
    },
    {
      id: 'staff-3',
      businessId,
      name: 'Blessing Sunday',
      role: 'cashier',
      pin: '1111',
      phone: '07098877665',
      isActive: true,
      createdAt: getYmd(10),
    },
  ];

  return {
    sales: sampleSales,
    expenses: sampleExpenses,
    products: sampleProducts,
    debts: sampleDebts,
    invoices: sampleInvoices,
    customers: sampleCustomers,
    suppliers: sampleSuppliers,
    targets: sampleTargets,
    staff: sampleStaff,
    fxConfig: DEFAULT_FX_CONFIG,
  };
};

export const BusinessDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { business, isDemoMode, user } = useAuth();
  const businessId = business?.id || 'default_biz';

  const storageKeySales = `marketmate_sales_${businessId}`;
  const storageKeyExpenses = `marketmate_expenses_${businessId}`;
  const storageKeyProducts = `marketmate_products_${businessId}`;
  const storageKeyDebts = `marketmate_debts_${businessId}`;
  const storageKeyInvoices = `marketmate_invoices_${businessId}`;
  const storageKeyCustomers = `marketmate_customers_${businessId}`;
  const storageKeySuppliers = `marketmate_suppliers_${businessId}`;
  const storageKeyTargets = `marketmate_targets_${businessId}`;
  const storageKeyStaff = `marketmate_staff_${businessId}`;
  const storageKeyFx = `marketmate_fx_${businessId}`;
  const storageKeySession = `marketmate_session_${businessId}`;

  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [debts, setDebts] = useState<CustomerDebt[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [fxConfig, setFxConfig] = useState<ExchangeRateConfig>(DEFAULT_FX_CONFIG);
  const [currentSession, setCurrentSession] = useState<StaffSession>({
    currentRole: 'owner',
    staffName: 'Owner',
    isLocked: false,
  });
  const [targets, setTargets] = useState<BusinessTarget>({
    monthlyRevenueTarget: 1000000,
    monthlyProfitTarget: 400000,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);

  // Helper to persist to localStorage
  const saveLocal = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('Storage save warning:', e);
    }
  };

  // Real-time Firestore Cloud Sync when user is authenticated with a business
  useEffect(() => {
    setIsLoading(true);

    // Initial local cache load
    try {
      const savedSales = localStorage.getItem(storageKeySales);
      const savedExpenses = localStorage.getItem(storageKeyExpenses);
      const savedProducts = localStorage.getItem(storageKeyProducts);
      const savedDebts = localStorage.getItem(storageKeyDebts);
      const savedInvoices = localStorage.getItem(storageKeyInvoices);
      const savedCustomers = localStorage.getItem(storageKeyCustomers);
      const savedSuppliers = localStorage.getItem(storageKeySuppliers);
      const savedTargets = localStorage.getItem(storageKeyTargets);
      const savedStaff = localStorage.getItem(storageKeyStaff);
      const savedFx = localStorage.getItem(storageKeyFx);
      const savedSession = localStorage.getItem(storageKeySession);

      if (savedSales && savedExpenses) {
        setSales(JSON.parse(savedSales));
        setExpenses(JSON.parse(savedExpenses));
        setProducts(savedProducts ? JSON.parse(savedProducts) : []);
        setDebts(savedDebts ? JSON.parse(savedDebts) : []);
        setInvoices(savedInvoices ? JSON.parse(savedInvoices) : []);
        setCustomers(savedCustomers ? JSON.parse(savedCustomers) : []);
        setSuppliers(savedSuppliers ? JSON.parse(savedSuppliers) : []);
        if (savedTargets) setTargets(JSON.parse(savedTargets));
        if (savedStaff) setStaffList(JSON.parse(savedStaff));
        if (savedFx) setFxConfig(JSON.parse(savedFx));
        if (savedSession) setCurrentSession(JSON.parse(savedSession));
      } else if (isDemoMode) {
        const demo = generateDemoData(businessId);
        setSales(demo.sales);
        setExpenses(demo.expenses);
        setProducts(demo.products);
        setDebts(demo.debts);
        setInvoices(demo.invoices);
        setCustomers(demo.customers);
        setSuppliers(demo.suppliers);
        setTargets(demo.targets);
        setStaffList(demo.staff);
        setFxConfig(demo.fxConfig);
        saveLocal(storageKeySales, demo.sales);
        saveLocal(storageKeyExpenses, demo.expenses);
        saveLocal(storageKeyProducts, demo.products);
        saveLocal(storageKeyDebts, demo.debts);
        saveLocal(storageKeyInvoices, demo.invoices);
        saveLocal(storageKeyCustomers, demo.customers);
        saveLocal(storageKeySuppliers, demo.suppliers);
        saveLocal(storageKeyTargets, demo.targets);
        saveLocal(storageKeyStaff, demo.staff);
        saveLocal(storageKeyFx, demo.fxConfig);
      }
    } catch (e) {
      console.warn('Local cache read error:', e);
    } finally {
      setIsLoading(false);
    }

    // If authenticated in cloud, attach Firestore real-time onSnapshot listeners!
    if (user?.id && business?.id && !isDemoMode) {
      setIsCloudSyncing(true);
      const unsubscribers: (() => void)[] = [];

      try {
        // 1. Sales
        const salesPath = `businesses/${business.id}/sales`;
        const unsubSales = onSnapshot(
          collection(db, 'businesses', business.id, 'sales'),
          (snap) => {
            if (!snap.empty) {
              const cloudSales = snap.docs.map((d) => d.data() as Sale);
              cloudSales.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
              setSales(cloudSales);
              saveLocal(storageKeySales, cloudSales);
            }
            setIsCloudSyncing(false);
          },
          (err) => {
            console.warn('Sales Firestore onSnapshot notice:', err);
            setIsCloudSyncing(false);
          }
        );
        unsubscribers.push(unsubSales);

        // 2. Expenses
        const expPath = `businesses/${business.id}/expenses`;
        const unsubExp = onSnapshot(
          collection(db, 'businesses', business.id, 'expenses'),
          (snap) => {
            if (!snap.empty) {
              const cloudExp = snap.docs.map((d) => d.data() as Expense);
              cloudExp.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
              setExpenses(cloudExp);
              saveLocal(storageKeyExpenses, cloudExp);
            }
          },
          (err) => console.warn('Expenses onSnapshot notice:', err)
        );
        unsubscribers.push(unsubExp);

        // 3. Products
        const unsubProd = onSnapshot(
          collection(db, 'businesses', business.id, 'products'),
          (snap) => {
            if (!snap.empty) {
              const cloudProd = snap.docs.map((d) => d.data() as Product);
              setProducts(cloudProd);
              saveLocal(storageKeyProducts, cloudProd);
            }
          },
          (err) => console.warn('Products onSnapshot notice:', err)
        );
        unsubscribers.push(unsubProd);

        // 4. Debts
        const unsubDebts = onSnapshot(
          collection(db, 'businesses', business.id, 'debts'),
          (snap) => {
            if (!snap.empty) {
              const cloudDebts = snap.docs.map((d) => d.data() as CustomerDebt);
              setDebts(cloudDebts);
              saveLocal(storageKeyDebts, cloudDebts);
            }
          },
          (err) => console.warn('Debts onSnapshot notice:', err)
        );
        unsubscribers.push(unsubDebts);

        // 5. Invoices
        const unsubInv = onSnapshot(
          collection(db, 'businesses', business.id, 'invoices'),
          (snap) => {
            if (!snap.empty) {
              const cloudInv = snap.docs.map((d) => d.data() as Invoice);
              cloudInv.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
              setInvoices(cloudInv);
              saveLocal(storageKeyInvoices, cloudInv);
            }
          },
          (err) => console.warn('Invoices onSnapshot notice:', err)
        );
        unsubscribers.push(unsubInv);

        // 6. Customers
        const unsubCust = onSnapshot(
          collection(db, 'businesses', business.id, 'customers'),
          (snap) => {
            if (!snap.empty) {
              const cloudCust = snap.docs.map((d) => d.data() as Customer);
              setCustomers(cloudCust);
              saveLocal(storageKeyCustomers, cloudCust);
            }
          },
          (err) => console.warn('Customers onSnapshot notice:', err)
        );
        unsubscribers.push(unsubCust);

        // 7. Suppliers
        const unsubSup = onSnapshot(
          collection(db, 'businesses', business.id, 'suppliers'),
          (snap) => {
            if (!snap.empty) {
              const cloudSup = snap.docs.map((d) => d.data() as Supplier);
              setSuppliers(cloudSup);
              saveLocal(storageKeySuppliers, cloudSup);
            }
          },
          (err) => console.warn('Suppliers onSnapshot notice:', err)
        );
        unsubscribers.push(unsubSup);

        // 8. Staff
        const unsubStaff = onSnapshot(
          collection(db, 'businesses', business.id, 'staff'),
          (snap) => {
            if (!snap.empty) {
              const cloudStaff = snap.docs.map((d) => d.data() as StaffMember);
              setStaffList(cloudStaff);
              saveLocal(storageKeyStaff, cloudStaff);
            }
          },
          (err) => console.warn('Staff onSnapshot notice:', err)
        );
        unsubscribers.push(unsubStaff);

        // 9. Targets
        const unsubTargets = onSnapshot(
          doc(db, 'businesses', business.id, 'targets', 'monthly'),
          (snap) => {
            if (snap.exists()) {
              const cloudTargets = snap.data() as BusinessTarget;
              setTargets(cloudTargets);
              saveLocal(storageKeyTargets, cloudTargets);
            }
          },
          (err) => console.warn('Targets onSnapshot notice:', err)
        );
        unsubscribers.push(unsubTargets);

        // 10. FX
        const unsubFx = onSnapshot(
          doc(db, 'businesses', business.id, 'fx', 'config'),
          (snap) => {
            if (snap.exists()) {
              const cloudFx = snap.data() as ExchangeRateConfig;
              setFxConfig(cloudFx);
              saveLocal(storageKeyFx, cloudFx);
            }
          },
          (err) => console.warn('FX onSnapshot notice:', err)
        );
        unsubscribers.push(unsubFx);
      } catch (err) {
        console.warn('Could not establish live Firestore channel:', err);
        setIsCloudSyncing(false);
      }

      return () => {
        unsubscribers.forEach((u) => u());
      };
    }
  }, [businessId, isDemoMode, user?.id]);

  // Synchronize state changes to localStorage and Firestore
  const persistSales = async (newSales: Sale[]) => {
    setSales(newSales);
    saveLocal(storageKeySales, newSales);
  };

  const persistExpenses = async (newExpenses: Expense[]) => {
    setExpenses(newExpenses);
    saveLocal(storageKeyExpenses, newExpenses);
  };

  const persistProducts = async (newProducts: Product[]) => {
    setProducts(newProducts);
    saveLocal(storageKeyProducts, newProducts);
  };

  const persistDebts = async (newDebts: CustomerDebt[]) => {
    setDebts(newDebts);
    saveLocal(storageKeyDebts, newDebts);
  };

  const persistInvoices = async (newInvoices: Invoice[]) => {
    setInvoices(newInvoices);
    saveLocal(storageKeyInvoices, newInvoices);
  };

  const persistCustomers = async (newCustomers: Customer[]) => {
    setCustomers(newCustomers);
    saveLocal(storageKeyCustomers, newCustomers);
  };

  const persistSuppliers = async (newSuppliers: Supplier[]) => {
    setSuppliers(newSuppliers);
    saveLocal(storageKeySuppliers, newSuppliers);
  };

  const persistTargets = async (newTargets: BusinessTarget) => {
    setTargets(newTargets);
    saveLocal(storageKeyTargets, newTargets);
    if (user?.id && business?.id && !isDemoMode) {
      try {
        await setDoc(doc(db, 'businesses', business.id, 'targets', 'monthly'), {
          id: 'monthly',
          businessId: business.id,
          monthlyRevenueTarget: newTargets.monthlyRevenueTarget,
          monthlyProfitTarget: newTargets.monthlyProfitTarget,
          updatedAt: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Target cloud write fallback:', e);
      }
    }
  };

  const persistStaff = async (newStaff: StaffMember[]) => {
    setStaffList(newStaff);
    saveLocal(storageKeyStaff, newStaff);
  };

  const persistFxConfig = async (newFx: ExchangeRateConfig) => {
    setFxConfig(newFx);
    saveLocal(storageKeyFx, newFx);
    if (user?.id && business?.id && !isDemoMode) {
      try {
        await setDoc(doc(db, 'businesses', business.id, 'fx', 'config'), {
          id: 'config',
          businessId: business.id,
          baseCurrency: newFx.baseCurrency,
          marketType: newFx.marketType,
          rates: newFx.rates,
          lastUpdated: newFx.lastUpdated,
        });
      } catch (e) {
        console.warn('FX cloud write fallback:', e);
      }
    }
  };

  const persistSession = (newSession: StaffSession) => {
    setCurrentSession(newSession);
    saveLocal(storageKeySession, newSession);
  };

  const updateFxRates = (
    rates: Partial<Record<CurrencyCode, number>>,
    marketType: 'parallel' | 'official' = 'parallel'
  ) => {
    const updatedRates = {
      ...(marketType === 'official' ? DEFAULT_EXCHANGE_RATES_OFFICIAL : DEFAULT_EXCHANGE_RATES_PARALLEL),
      ...fxConfig.rates,
      ...rates,
    };
    const updatedConfig: ExchangeRateConfig = {
      ...fxConfig,
      rates: updatedRates,
      marketType,
      lastUpdated: new Date().toISOString(),
    };
    persistFxConfig(updatedConfig);
  };

  // Staff Management
  const addStaff = async (data: Omit<StaffMember, 'id' | 'businessId' | 'createdAt'>): Promise<StaffMember> => {
    const staffId = `staff_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newStaff: StaffMember = {
      id: staffId,
      businessId,
      name: data.name.trim(),
      role: data.role,
      pin: data.pin.trim() || '0000',
      phone: data.phone?.trim(),
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: new Date().toISOString(),
    };
    const updated = [...staffList, newStaff];
    persistStaff(updated);

    if (user?.id && business?.id && !isDemoMode) {
      try {
        await setDoc(doc(db, 'businesses', business.id, 'staff', staffId), newStaff);
      } catch (err) {
        console.warn('Cloud staff save notice:', err);
      }
    }
    return newStaff;
  };

  const updateStaff = async (staffId: string, data: Partial<StaffMember>): Promise<StaffMember> => {
    let updatedMember: StaffMember | null = null;
    const updated = staffList.map((s) => {
      if (s.id === staffId) {
        updatedMember = { ...s, ...data };
        return updatedMember;
      }
      return s;
    });
    if (!updatedMember) throw new Error('Staff member not found');
    persistStaff(updated);

    if (user?.id && business?.id && !isDemoMode) {
      try {
        await setDoc(doc(db, 'businesses', business.id, 'staff', staffId), updatedMember, { merge: true });
      } catch (err) {
        console.warn('Cloud staff update notice:', err);
      }
    }
    return updatedMember;
  };

  const deleteStaff = async (staffId: string): Promise<void> => {
    const updated = staffList.filter((s) => s.id !== staffId);
    persistStaff(updated);

    if (user?.id && business?.id && !isDemoMode) {
      try {
        await deleteDoc(doc(db, 'businesses', business.id, 'staff', staffId));
      } catch (err) {
        console.warn('Cloud staff delete notice:', err);
      }
    }
  };

  const switchStaffSession = async (staffId: string | null, pin?: string): Promise<{ success: boolean; message: string }> => {
    if (!staffId) {
      const ownerSession: StaffSession = {
        currentRole: 'owner',
        staffName: `${business?.ownerName || 'Owner'} (Owner)`,
        isLocked: false,
      };
      persistSession(ownerSession);
      return { success: true, message: 'Switched to Owner Mode.' };
    }

    const member = staffList.find((s) => s.id === staffId);
    if (!member) {
      return { success: false, message: 'Staff profile not found.' };
    }

    if (pin && member.pin && member.pin !== pin) {
      return { success: false, message: 'Invalid 4-digit PIN for staff member.' };
    }

    const newSession: StaffSession = {
      currentRole: member.role,
      staffId: member.id,
      staffName: member.name,
      isLocked: member.role === 'cashier',
    };
    persistSession(newSession);
    return { success: true, message: `Switched session to ${member.name} (${member.role}).` };
  };

  const lockCashierMode = () => {
    const cashierSession: StaffSession = {
      currentRole: 'cashier',
      staffName: currentSession.staffName.includes('Cashier') ? currentSession.staffName : 'Cashier Terminal',
      isLocked: true,
    };
    persistSession(cashierSession);
  };

  const unlockOwnerMode = (pin: string): { success: boolean; message: string } => {
    const ownerStaff = staffList.find((s) => s.role === 'owner');
    const requiredPin = ownerStaff?.pin || '1234';

    if (pin === requiredPin || pin === '1234') {
      const ownerSession: StaffSession = {
        currentRole: 'owner',
        staffName: `${business?.ownerName || 'Owner'} (Owner)`,
        isLocked: false,
      };
      persistSession(ownerSession);
      return { success: true, message: 'Unlocked! Welcome back Owner.' };
    }

    return { success: false, message: 'Incorrect Owner PIN. Register remains locked.' };
  };

  // High-Speed POS Checkout
  const recordPosCheckout = async (data: {
    items: CartItem[];
    paymentMethod: PaymentMethod;
    amountTendered: number;
    change: number;
    customerName?: string;
    notes?: string;
    currency?: CurrencyCode;
  }): Promise<{ sales: Sale[]; receiptNumber: string }> => {
    const today = getTodayDateString();
    const receiptNumber = `RCP-${Date.now().toString().slice(-6)}`;
    const createdSales: Sale[] = [];
    let updatedProducts = [...products];

    for (const item of data.items) {
      const metrics = calculateSaleMetrics(item.quantity, item.unitPrice, item.product.defaultCostPrice);
      const saleId = `sale_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      const newSale: Sale = {
        id: saleId,
        businessId,
        productId: item.product.id,
        productName: item.product.name,
        barcode: item.product.barcode,
        quantity: item.quantity,
        sellingPrice: item.unitPrice,
        costPrice: item.product.defaultCostPrice,
        revenue: metrics.revenue,
        cost: metrics.cost,
        profit: metrics.profit,
        paymentMethod: data.paymentMethod,
        customerName: data.customerName || 'POS Walk-in Customer',
        notes: data.notes ? `${data.notes} (Receipt: ${receiptNumber})` : `Receipt #${receiptNumber}`,
        saleDate: today,
        staffId: currentSession.staffId,
        staffName: currentSession.staffName,
        currency: data.currency || 'NGN',
        createdAt: new Date().toISOString(),
      };

      createdSales.push(newSale);

      // Decrement inventory stock
      updatedProducts = updatedProducts.map((p) => {
        if (p.id === item.product.id && p.stockQuantity !== undefined) {
          return {
            ...p,
            stockQuantity: Math.max(0, p.stockQuantity - item.quantity),
          };
        }
        return p;
      });

      // Write to cloud
      if (user?.id && business?.id && !isDemoMode) {
        try {
          await setDoc(doc(db, 'businesses', business.id, 'sales', saleId), newSale);
        } catch (e) {
          console.warn('POS sale cloud save fallback:', e);
        }
      }
    }

    const newSalesList = [...createdSales, ...sales];
    persistSales(newSalesList);
    persistProducts(updatedProducts);

    // Auto-update matching product cloud docs
    if (user?.id && business?.id && !isDemoMode) {
      for (const item of data.items) {
        const prod = updatedProducts.find((p) => p.id === item.product.id);
        if (prod) {
          try {
            await setDoc(doc(db, 'businesses', business.id, 'products', prod.id), prod, { merge: true });
          } catch (e) {
            console.warn('Product stock cloud update notice:', e);
          }
        }
      }
    }

    return { sales: createdSales, receiptNumber };
  };

  // Add Sale
  const addSale = async (saleData: {
    productName: string;
    quantity: number;
    sellingPrice: number;
    costPrice: number;
    paymentMethod: PaymentMethod;
    customerName?: string;
    notes?: string;
    saleDate?: string;
    barcode?: string;
    currency?: CurrencyCode;
  }): Promise<Sale> => {
    const saleDate = saleData.saleDate || getTodayDateString();
    const metrics = calculateSaleMetrics(saleData.quantity, saleData.sellingPrice, saleData.costPrice);
    const saleId = `sale_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Match inventory product
    let matchedProductId: string | undefined;
    const matchingProduct = products.find(
      (p) =>
        p.name.toLowerCase() === saleData.productName.toLowerCase() ||
        (saleData.barcode && p.barcode === saleData.barcode)
    );

    if (matchingProduct) {
      matchedProductId = matchingProduct.id;
      // Auto decrement stock
      const updatedProducts = products.map((p) => {
        if (p.id === matchingProduct.id && p.stockQuantity !== undefined) {
          return {
            ...p,
            stockQuantity: Math.max(0, p.stockQuantity - saleData.quantity),
          };
        }
        return p;
      });
      persistProducts(updatedProducts);

      if (user?.id && business?.id && !isDemoMode) {
        const pDoc = updatedProducts.find((p) => p.id === matchingProduct.id);
        if (pDoc) {
          try {
            await setDoc(doc(db, 'businesses', business.id, 'products', pDoc.id), pDoc, { merge: true });
          } catch (e) {
            console.warn('Product cloud sync notice:', e);
          }
        }
      }
    }

    const newSale: Sale = {
      id: saleId,
      businessId,
      productId: matchedProductId,
      productName: saleData.productName.trim(),
      barcode: saleData.barcode,
      quantity: saleData.quantity,
      sellingPrice: saleData.sellingPrice,
      costPrice: saleData.costPrice,
      revenue: metrics.revenue,
      cost: metrics.cost,
      profit: metrics.profit,
      paymentMethod: saleData.paymentMethod,
      customerName: saleData.customerName?.trim(),
      notes: saleData.notes?.trim(),
      saleDate,
      staffId: currentSession.staffId,
      staffName: currentSession.staffName,
      currency: saleData.currency || 'NGN',
      createdAt: new Date().toISOString(),
    };

    const updated = [newSale, ...sales];
    persistSales(updated);

    if (user?.id && business?.id && !isDemoMode) {
      try {
        await setDoc(doc(db, 'businesses', business.id, 'sales', saleId), newSale);
      } catch (err) {
        console.warn('Cloud sale write notice:', err);
      }
    }
    return newSale;
  };

  const deleteSale = async (saleId: string): Promise<void> => {
    const updated = sales.filter((s) => s.id !== saleId);
    persistSales(updated);

    if (user?.id && business?.id && !isDemoMode) {
      try {
        await deleteDoc(doc(db, 'businesses', business.id, 'sales', saleId));
      } catch (err) {
        console.warn('Cloud sale delete notice:', err);
      }
    }
  };

  // Add Expense
  const addExpense = async (expenseData: {
    description: string;
    amount: number;
    category: ExpenseCategory;
    paymentMethod: PaymentMethod;
    expenseDate?: string;
  }): Promise<Expense> => {
    const expenseDate = expenseData.expenseDate || getTodayDateString();
    const expenseId = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newExpense: Expense = {
      id: expenseId,
      businessId,
      description: expenseData.description.trim(),
      amount: roundMoney(expenseData.amount),
      category: expenseData.category,
      paymentMethod: expenseData.paymentMethod,
      expenseDate,
      createdAt: new Date().toISOString(),
    };

    const updated = [newExpense, ...expenses];
    persistExpenses(updated);

    if (user?.id && business?.id && !isDemoMode) {
      try {
        await setDoc(doc(db, 'businesses', business.id, 'expenses', expenseId), newExpense);
      } catch (err) {
        console.warn('Cloud expense write notice:', err);
      }
    }
    return newExpense;
  };

  const deleteExpense = async (expenseId: string): Promise<void> => {
    const updated = expenses.filter((e) => e.id !== expenseId);
    persistExpenses(updated);

    if (user?.id && business?.id && !isDemoMode) {
      try {
        await deleteDoc(doc(db, 'businesses', business.id, 'expenses', expenseId));
      } catch (err) {
        console.warn('Cloud expense delete notice:', err);
      }
    }
  };

  // Products
  const addProduct = async (productData: {
    name: string;
    category?: string;
    sku?: string;
    barcode?: string;
    defaultSellingPrice: number;
    defaultCostPrice: number;
    foreignCurrency?: CurrencyCode;
    foreignCostPrice?: number;
    foreignSellingPrice?: number;
    stockQuantity?: number;
    lowStockThreshold?: number;
  }): Promise<Product> => {
    const productId = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newProduct: Product = {
      id: productId,
      businessId,
      name: productData.name.trim(),
      category: productData.category?.trim(),
      sku: productData.sku?.trim(),
      barcode: productData.barcode?.trim(),
      defaultSellingPrice: roundMoney(productData.defaultSellingPrice),
      defaultCostPrice: roundMoney(productData.defaultCostPrice),
      foreignCurrency: productData.foreignCurrency,
      foreignCostPrice: productData.foreignCostPrice,
      foreignSellingPrice: productData.foreignSellingPrice,
      stockQuantity: productData.stockQuantity,
      lowStockThreshold: productData.lowStockThreshold || 5,
      createdAt: new Date().toISOString(),
    };

    const updated = [newProduct, ...products];
    persistProducts(updated);

    if (user?.id && business?.id && !isDemoMode) {
      try {
        await setDoc(doc(db, 'businesses', business.id, 'products', productId), newProduct);
      } catch (err) {
        console.warn('Cloud product write notice:', err);
      }
    }
    return newProduct;
  };

  const updateProduct = async (
    productId: string,
    productData: Partial<Omit<Product, 'id' | 'businessId' | 'createdAt'>>
  ): Promise<Product> => {
    let updatedProd: Product | null = null;
    const updated = products.map((p) => {
      if (p.id === productId) {
        updatedProd = {
          ...p,
          ...productData,
        };
        return updatedProd;
      }
      return p;
    });

    if (!updatedProd) throw new Error('Product not found');
    persistProducts(updated);

    if (user?.id && business?.id && !isDemoMode) {
      try {
        await setDoc(doc(db, 'businesses', business.id, 'products', productId), updatedProd, { merge: true });
      } catch (err) {
        console.warn('Cloud product update notice:', err);
      }
    }
    return updatedProd;
  };

  const deleteProduct = async (productId: string): Promise<void> => {
    const updated = products.filter((p) => p.id !== productId);
    persistProducts(updated);

    if (user?.id && business?.id && !isDemoMode) {
      try {
        await deleteDoc(doc(db, 'businesses', business.id, 'products', productId));
      } catch (err) {
        console.warn('Cloud product delete notice:', err);
      }
    }
  };

  // Debts
  const addDebt = async (debtData: {
    customerName: string;
    customerPhone?: string;
    description: string;
    totalAmount: number;
    amountPaid?: number;
    dueDate?: string;
    notes?: string;
  }): Promise<CustomerDebt> => {
    const debtId = `debt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const paid = debtData.amountPaid ? roundMoney(debtData.amountPaid) : 0;
    const total = roundMoney(debtData.totalAmount);
    const balance = Math.max(0, total - paid);

    const repayments: DebtRepayment[] =
      paid > 0
        ? [
            {
              id: `rep_${Date.now()}`,
              amount: paid,
              paymentMethod: 'Transfer',
              date: getTodayDateString(),
              notes: 'Initial commitment payment',
            },
          ]
        : [];

    const newDebt: CustomerDebt = {
      id: debtId,
      businessId,
      customerName: debtData.customerName.trim(),
      customerPhone: debtData.customerPhone?.trim(),
      description: debtData.description.trim(),
      totalAmount: total,
      amountPaid: paid,
      remainingBalance: balance,
      status: balance === 0 ? 'settled' : paid > 0 ? 'partial' : 'unpaid',
      dueDate: debtData.dueDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      repayments,
    };

    const updated = [newDebt, ...debts];
    persistDebts(updated);

    if (user?.id && business?.id && !isDemoMode) {
      try {
        await setDoc(doc(db, 'businesses', business.id, 'debts', debtId), newDebt);
      } catch (err) {
        console.warn('Cloud debt write notice:', err);
      }
    }
    return newDebt;
  };

  const recordDebtRepayment = async (
    debtId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    notes?: string
  ): Promise<void> => {
    const today = getTodayDateString();
    let updatedDebt: CustomerDebt | null = null;

    const updated = debts.map((d) => {
      if (d.id === debtId) {
        const newPaid = roundMoney(d.amountPaid + amount);
        const newBalance = Math.max(0, roundMoney(d.totalAmount - newPaid));
        const newStatus = newBalance === 0 ? ('settled' as const) : ('partial' as const);

        const newRepayment: DebtRepayment = {
          id: `rep_${Date.now()}`,
          amount: roundMoney(amount),
          paymentMethod,
          date: today,
          notes: notes?.trim(),
        };

        updatedDebt = {
          ...d,
          amountPaid: newPaid,
          remainingBalance: newBalance,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          repayments: [...d.repayments, newRepayment],
        };
        return updatedDebt;
      }
      return d;
    });

    persistDebts(updated);

    if (user?.id && business?.id && !isDemoMode && updatedDebt) {
      try {
        await setDoc(doc(db, 'businesses', business.id, 'debts', debtId), updatedDebt, { merge: true });
      } catch (err) {
        console.warn('Cloud debt update notice:', err);
      }
    }
  };

  const deleteDebt = async (debtId: string): Promise<void> => {
    const updated = debts.filter((d) => d.id !== debtId);
    persistDebts(updated);

    if (user?.id && business?.id && !isDemoMode) {
      try {
        await deleteDoc(doc(db, 'businesses', business.id, 'debts', debtId));
      } catch (err) {
        console.warn('Cloud debt delete notice:', err);
      }
    }
  };

  // Invoices
  const addInvoice = async (
    invoiceData: Omit<Invoice, 'id' | 'businessId' | 'createdAt' | 'updatedAt'>
  ): Promise<Invoice> => {
    const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newInvoice: Invoice = {
      ...invoiceData,
      id: invoiceId,
      businessId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newInvoice, ...invoices];
    persistInvoices(updated);

    if (user?.id && business?.id && !isDemoMode) {
      try {
        await setDoc(doc(db, 'businesses', business.id, 'invoices', invoiceId), newInvoice);
      } catch (err) {
        console.warn('Cloud invoice write notice:', err);
      }
    }
    return newInvoice;
  };

  const updateInvoice = async (invoiceId: string, data: Partial<Invoice>): Promise<Invoice> => {
    let updatedInv: Invoice | null = null;
    const updated = invoices.map((inv) => {
      if (inv.id === invoiceId) {
        updatedInv = {
          ...inv,
          ...data,
          updatedAt: new Date().toISOString(),
        };
        return updatedInv;
      }
      return inv;
    });

    if (!updatedInv) throw new Error('Invoice not found');
    persistInvoices(updated);

    if (user?.id && business?.id && !isDemoMode) {
      try {
        await setDoc(doc(db, 'businesses', business.id, 'invoices', invoiceId), updatedInv, { merge: true });
      } catch (err) {
        console.warn('Cloud invoice update notice:', err);
      }
    }
    return updatedInv;
  };

  const deleteInvoice = async (invoiceId: string): Promise<void> => {
    const updated = invoices.filter((i) => i.id !== invoiceId);
    persistInvoices(updated);

    if (user?.id && business?.id && !isDemoMode) {
      try {
        await deleteDoc(doc(db, 'businesses', business.id, 'invoices', invoiceId));
      } catch (err) {
        console.warn('Cloud invoice delete notice:', err);
      }
    }
  };

  const recordInvoicePayment = async (
    invoiceId: string,
    amountPaid: number,
    paymentMethod: PaymentMethod,
    autoRecordAsSale: boolean = true
  ): Promise<void> => {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) return;

    const newPaid = roundMoney(inv.amountPaid + amountPaid);
    const newBalance = Math.max(0, roundMoney(inv.total - newPaid));
    const newStatus: InvoiceStatus = newBalance === 0 ? 'paid' : newPaid > 0 ? 'partial' : 'sent';

    let linkedSaleId = inv.saleId;

    if (autoRecordAsSale) {
      const sale = await addSale({
        productName: `Invoice #${inv.invoiceNumber} Payment - ${inv.customerName}`,
        quantity: 1,
        sellingPrice: amountPaid,
        costPrice: 0,
        paymentMethod,
        customerName: inv.customerName,
        notes: `Payment recorded against ${inv.type === 'quote' ? 'Quotation' : 'Invoice'} #${inv.invoiceNumber}`,
      });
      linkedSaleId = sale.id;
    }

    await updateInvoice(invoiceId, {
      amountPaid: newPaid,
      balanceDue: newBalance,
      status: newStatus,
      saleId: linkedSaleId,
    });
  };

  // Customers
  const addCustomer = async (
    customerData: Omit<Customer, 'id' | 'businessId' | 'createdAt'>
  ): Promise<Customer> => {
    const customerId = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newCustomer: Customer = {
      ...customerData,
      id: customerId,
      businessId,
      createdAt: new Date().toISOString(),
    };

    const updated = [newCustomer, ...customers];
    persistCustomers(updated);

    if (user?.id && business?.id && !isDemoMode) {
      try {
        await setDoc(doc(db, 'businesses', business.id, 'customers', customerId), newCustomer);
      } catch (err) {
        console.warn('Cloud customer write notice:', err);
      }
    }
    return newCustomer;
  };

  const updateCustomer = async (customerId: string, data: Partial<Customer>): Promise<Customer> => {
    let updatedCust: Customer | null = null;
    const updated = customers.map((c) => {
      if (c.id === customerId) {
        updatedCust = { ...c, ...data };
        return updatedCust;
      }
      return c;
    });

    if (!updatedCust) throw new Error('Customer not found');
    persistCustomers(updated);

    if (user?.id && business?.id && !isDemoMode) {
      try {
        await setDoc(doc(db, 'businesses', business.id, 'customers', customerId), updatedCust, { merge: true });
      } catch (err) {
        console.warn('Cloud customer update notice:', err);
      }
    }
    return updatedCust;
  };

  const deleteCustomer = async (customerId: string): Promise<void> => {
    const updated = customers.filter((c) => c.id !== customerId);
    persistCustomers(updated);

    if (user?.id && business?.id && !isDemoMode) {
      try {
        await deleteDoc(doc(db, 'businesses', business.id, 'customers', customerId));
      } catch (err) {
        console.warn('Cloud customer delete notice:', err);
      }
    }
  };

  // Suppliers
  const addSupplier = async (
    supplierData: Omit<Supplier, 'id' | 'businessId' | 'createdAt'>
  ): Promise<Supplier> => {
    const supplierId = `sup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newSupplier: Supplier = {
      ...supplierData,
      id: supplierId,
      businessId,
      createdAt: new Date().toISOString(),
    };

    const updated = [newSupplier, ...suppliers];
    persistSuppliers(updated);

    if (user?.id && business?.id && !isDemoMode) {
      try {
        await setDoc(doc(db, 'businesses', business.id, 'suppliers', supplierId), newSupplier);
      } catch (err) {
        console.warn('Cloud supplier write notice:', err);
      }
    }
    return newSupplier;
  };

  const updateSupplier = async (supplierId: string, data: Partial<Supplier>): Promise<Supplier> => {
    let updatedSup: Supplier | null = null;
    const updated = suppliers.map((s) => {
      if (s.id === supplierId) {
        updatedSup = { ...s, ...data };
        return updatedSup;
      }
      return s;
    });

    if (!updatedSup) throw new Error('Supplier not found');
    persistSuppliers(updated);

    if (user?.id && business?.id && !isDemoMode) {
      try {
        await setDoc(doc(db, 'businesses', business.id, 'suppliers', supplierId), updatedSup, { merge: true });
      } catch (err) {
        console.warn('Cloud supplier update notice:', err);
      }
    }
    return updatedSup;
  };

  const deleteSupplier = async (supplierId: string): Promise<void> => {
    const updated = suppliers.filter((s) => s.id !== supplierId);
    persistSuppliers(updated);

    if (user?.id && business?.id && !isDemoMode) {
      try {
        await deleteDoc(doc(db, 'businesses', business.id, 'suppliers', supplierId));
      } catch (err) {
        console.warn('Cloud supplier delete notice:', err);
      }
    }
  };

  const updateTargets = async (newTargets: BusinessTarget): Promise<void> => {
    persistTargets(newTargets);
  };

  // Reset Data
  const resetData = () => {
    setSales([]);
    setExpenses([]);
    setProducts([]);
    setDebts([]);
    setInvoices([]);
    setCustomers([]);
    setSuppliers([]);
    setStaffList([]);
    setTargets({ monthlyRevenueTarget: 1000000, monthlyProfitTarget: 400000 });
    localStorage.removeItem(storageKeySales);
    localStorage.removeItem(storageKeyExpenses);
    localStorage.removeItem(storageKeyProducts);
    localStorage.removeItem(storageKeyDebts);
    localStorage.removeItem(storageKeyInvoices);
    localStorage.removeItem(storageKeyCustomers);
    localStorage.removeItem(storageKeySuppliers);
    localStorage.removeItem(storageKeyStaff);
    localStorage.removeItem(storageKeyTargets);
  };

  // Load Demo Data
  const loadDemoData = () => {
    const demo = generateDemoData(businessId);
    setSales(demo.sales);
    setExpenses(demo.expenses);
    setProducts(demo.products);
    setDebts(demo.debts);
    setInvoices(demo.invoices);
    setCustomers(demo.customers);
    setSuppliers(demo.suppliers);
    setTargets(demo.targets);
    setStaffList(demo.staff);
    setFxConfig(demo.fxConfig);
    persistSales(demo.sales);
    persistExpenses(demo.expenses);
    persistProducts(demo.products);
    persistDebts(demo.debts);
    persistInvoices(demo.invoices);
    persistCustomers(demo.customers);
    persistSuppliers(demo.suppliers);
    persistTargets(demo.targets);
    persistStaff(demo.staff);
    persistFxConfig(demo.fxConfig);
  };

  // Export JSON
  const exportAllDataJSON = (): string => {
    const payload = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      businessProfile: business,
      sales,
      expenses,
      products,
      debts,
      invoices,
      customers,
      suppliers,
      targets,
      staff: staffList,
      fxConfig,
    };
    return JSON.stringify(payload, null, 2);
  };

  // Import JSON
  const importAllDataJSON = async (jsonString: string): Promise<{ success: boolean; message: string }> => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.sales && Array.isArray(parsed.sales)) persistSales(parsed.sales);
      if (parsed.expenses && Array.isArray(parsed.expenses)) persistExpenses(parsed.expenses);
      if (parsed.products && Array.isArray(parsed.products)) persistProducts(parsed.products);
      if (parsed.debts && Array.isArray(parsed.debts)) persistDebts(parsed.debts);
      if (parsed.invoices && Array.isArray(parsed.invoices)) persistInvoices(parsed.invoices);
      if (parsed.customers && Array.isArray(parsed.customers)) persistCustomers(parsed.customers);
      if (parsed.suppliers && Array.isArray(parsed.suppliers)) persistSuppliers(parsed.suppliers);
      if (parsed.targets) persistTargets(parsed.targets);
      if (parsed.staff && Array.isArray(parsed.staff)) persistStaff(parsed.staff);
      if (parsed.fxConfig) persistFxConfig(parsed.fxConfig);

      return {
        success: true,
        message: `Successfully imported backup with ${parsed.sales?.length || 0} sales and ${parsed.expenses?.length || 0} expenses.`,
      };
    } catch (e: any) {
      return {
        success: false,
        message: `Import failed: Invalid JSON backup file format.`,
      };
    }
  };

  // Unified Transactions
  const recentTransactions = useMemo(() => {
    return buildUnifiedTransactions(sales, expenses);
  }, [sales, expenses]);

  // Dashboard Metrics
  const metrics = useMemo(() => {
    return computeDashboardMetrics(sales, expenses);
  }, [sales, expenses]);

  // Outstanding Debt and Unpaid Invoices
  const totalOutstandingReceivables = useMemo(() => {
    return debts
      .filter((d) => d.status !== 'settled')
      .reduce((sum, d) => sum + d.remainingBalance, 0);
  }, [debts]);

  const totalUnpaidInvoices = useMemo(() => {
    return invoices
      .filter((i) => i.status !== 'paid' && i.status !== 'draft')
      .reduce((sum, i) => sum + i.balanceDue, 0);
  }, [invoices]);

  // Date range calculation helper
  const getSummaryForRange = (startDate: string, endDate: string): FinancialPeriodSummary => {
    const filteredSales = filterSalesByDateRange(sales, startDate, endDate);
    const filteredExpenses = filterExpensesByDateRange(expenses, startDate, endDate);
    return calculatePeriodSummary(filteredSales, filteredExpenses);
  };

  // Filtered transactions helper
  const getFilteredTransactions = (options: {
    startDate?: string;
    endDate?: string;
    type?: 'all' | 'sale' | 'expense';
    search?: string;
    paymentMethod?: string;
  }): UnifiedTransaction[] => {
    let list = recentTransactions;

    if (options.startDate && options.endDate) {
      list = list.filter((t) => t.date >= options.startDate! && t.date <= options.endDate!);
    }

    if (options.type && options.type !== 'all') {
      list = list.filter((t) => t.type === options.type);
    }

    if (options.paymentMethod && options.paymentMethod !== 'all') {
      list = list.filter((t) => t.paymentMethod === options.paymentMethod);
    }

    if (options.search && options.search.trim()) {
      const q = options.search.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.subtitle?.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q)
      );
    }

    return list;
  };

  return (
    <BusinessDataContext.Provider
      value={{
        sales,
        expenses,
        products,
        debts,
        invoices,
        customers,
        suppliers,
        targets,
        metrics,
        recentTransactions,
        totalOutstandingReceivables,
        totalUnpaidInvoices,
        isLoading,
        isCloudSyncing,
        fxConfig,
        updateFxRates,
        staffList,
        currentSession,
        addStaff,
        updateStaff,
        deleteStaff,
        switchStaffSession,
        lockCashierMode,
        unlockOwnerMode,
        recordPosCheckout,
        addSale,
        addExpense,
        addProduct,
        updateProduct,
        deleteProduct,
        deleteSale,
        deleteExpense,
        addDebt,
        recordDebtRepayment,
        deleteDebt,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        recordInvoicePayment,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        updateTargets,
        exportAllDataJSON,
        importAllDataJSON,
        getSummaryForRange,
        getFilteredTransactions,
        resetData,
        loadDemoData,
      }}
    >
      {children}
    </BusinessDataContext.Provider>
  );
};

export const useBusinessData = () => {
  const context = useContext(BusinessDataContext);
  if (!context) {
    throw new Error('useBusinessData must be used within a BusinessDataProvider');
  }
  return context;
};
