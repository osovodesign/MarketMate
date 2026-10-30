import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BusinessDataProvider, useBusinessData } from './context/BusinessDataContext';
import { Shell } from './components/layout/Shell';
import { LandingPage } from './components/landing/LandingPage';
import { Login } from './components/auth/Login';
import { Signup } from './components/auth/Signup';
import { ForgotPassword } from './components/auth/ForgotPassword';
import { Onboarding } from './components/onboarding/Onboarding';
import { DashboardView } from './components/dashboard/DashboardView';
import { POSView } from './components/pos/POSView';
import { SalesView } from './components/sales/SalesView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { TransactionsView } from './components/transactions/TransactionsView';
import { ReportsView } from './components/reports/ReportsView';
import { ProductsView } from './components/products/ProductsView';
import { AIAssistantView } from './components/ai/AIAssistantView';
import { SettingsView } from './components/settings/SettingsView';
import { AdminPortalView } from './components/admin/AdminPortalView';
import { InvoicesView } from './components/invoices/InvoicesView';
import { ContactsView } from './components/contacts/ContactsView';
import { RecordSaleView } from './components/sales/RecordSaleView';
import { RecordExpenseView } from './components/expenses/RecordExpenseView';
import { PricingCalculatorView } from './components/tools/PricingCalculatorView';
import { ProfitSimulatorView } from './components/tools/ProfitSimulatorView';
import { MultiCurrencyView } from './components/currency/MultiCurrencyView';
import { InvoiceCreateView } from './components/invoices/InvoiceCreateView';
import { RecordDebtView } from './components/debts/RecordDebtView';
import { ContactCreateView } from './components/contacts/ContactCreateView';
import { ProductCreateView } from './components/products/ProductCreateView';
import { FinancialGoalsView } from './components/goals/FinancialGoalsView';
import { BackupDataView } from './components/backup/BackupDataView';
import { ReferralView } from './components/referral/ReferralView';
import { HelpSupportView } from './components/common/HelpSupportView';
import { LogoExportView } from './components/common/LogoExportView';
import { SubscribeView } from './components/subscription/SubscribeView';
import { BulkProductImportView } from './components/products/BulkProductImportView';
import { LegalView } from './components/legal/LegalView';
import { DebtsView } from './components/debts/DebtsView';
import { StaffManagementView } from './components/staff/StaffManagementView';
import { AppTourModal } from './components/onboarding/AppTourModal';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';
import { NotificationProvider } from './context/NotificationContext';
import { ProFeatureGate } from './components/subscription/ProFeatureGate';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { AppView, Product, Invoice, InvoiceType, Customer, Supplier } from './types';
import {
  Sparkles,
  FileText,
  BarChart3,
  BookUser,
  Package,
  Users,
  Bot,
  Shield,
  Building2,
} from 'lucide-react';

function AppContent() {
  const {
    user,
    business,
    isAuthenticated,
    isOnboarded,
    isDemoMode,
    isLoading,
    logout,
    activateDemoMode,
    isSuperAdmin,
    isSubscribed,
    updateBusiness,
  } = useAuth();

  const isTransientCreationView = (view: AppView) => {
    return (
      view === 'record-sale' ||
      view === 'record-expense' ||
      view === 'pricing-calc' ||
      view === 'profit-sim' ||
      view === 'fx-calc' ||
      view === 'create-invoice' ||
      view === 'record-debt' ||
      view === 'create-contact' ||
      view === 'create-product' ||
      view === 'financial-goals' ||
      view === 'backup-vault' ||
      view === 'referral' ||
      view === 'help-support' ||
      view === 'logo-export' ||
      view === 'subscribe' ||
      view === 'bulk-import' ||
      view === 'legal'
    );
  };

  const [currentView, setCurrentView] = useState<AppView>(() => {
    try {
      const saved = localStorage.getItem('marketmate_current_view');
      if (
        saved &&
        saved !== 'landing' &&
        saved !== 'login' &&
        saved !== 'signup' &&
        saved !== 'onboarding' &&
        !isTransientCreationView(saved as AppView)
      ) {
        return saved as AppView;
      }
      const savedUser = localStorage.getItem('marketmate_auth_user');
      const savedDemo = localStorage.getItem('marketmate_is_demo') === 'true';
      if (savedUser || savedDemo) {
        return 'dashboard';
      }
    } catch {}
    return 'landing';
  });

  const [previousView, setPreviousView] = useState<AppView>('dashboard');
  const [salePrefillCustomer, setSalePrefillCustomer] = useState<string | undefined>(undefined);
  const [salePrefillProduct, setSalePrefillProduct] = useState<Product | undefined>(undefined);

  const [invoicePrefillType, setInvoicePrefillType] = useState<InvoiceType>('invoice');
  const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(null);

  const [contactPrefillType, setContactPrefillType] = useState<'customer' | 'supplier'>('customer');
  const [contactCustomerToEdit, setContactCustomerToEdit] = useState<Customer | null>(null);
  const [contactSupplierToEdit, setContactSupplierToEdit] = useState<Supplier | null>(null);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const navigateTo = (view: AppView) => {
    if (!isTransientCreationView(view) && !isTransientCreationView(currentView)) {
      setPreviousView(currentView);
    }
    setCurrentView(view);
    try {
      if (
        view !== 'landing' &&
        view !== 'login' &&
        view !== 'signup' &&
        view !== 'onboarding' &&
        !isTransientCreationView(view)
      ) {
        localStorage.setItem('marketmate_current_view', view);
      }
    } catch {}
  };

  const openRecordSale = (options?: { customer?: string; product?: Product }) => {
    if (!isTransientCreationView(currentView)) {
      setPreviousView(currentView);
    }
    setSalePrefillCustomer(options?.customer);
    setSalePrefillProduct(options?.product);
    setCurrentView('record-sale');
  };

  const openRecordExpense = () => {
    if (!isTransientCreationView(currentView)) {
      setPreviousView(currentView);
    }
    setCurrentView('record-expense');
  };

  const openCreateInvoice = (defaultType?: InvoiceType, invoice?: Invoice | null) => {
    if (!isTransientCreationView(currentView)) {
      setPreviousView(currentView);
    }
    setInvoicePrefillType(defaultType || 'invoice');
    setInvoiceToEdit(invoice || null);
    setCurrentView('create-invoice');
  };

  const openRecordDebt = () => {
    if (!isTransientCreationView(currentView)) {
      setPreviousView(currentView);
    }
    setCurrentView('record-debt');
  };

  const openCreateContact = (
    type?: 'customer' | 'supplier',
    customer?: Customer | null,
    supplier?: Supplier | null
  ) => {
    if (!isTransientCreationView(currentView)) {
      setPreviousView(currentView);
    }
    setContactPrefillType(type || (supplier ? 'supplier' : 'customer'));
    setContactCustomerToEdit(customer || null);
    setContactSupplierToEdit(supplier || null);
    setCurrentView('create-contact');
  };

  const openCreateProduct = (product?: Product | null) => {
    if (!isTransientCreationView(currentView)) {
      setPreviousView(currentView);
    }
    setProductToEdit(product || null);
    setCurrentView('create-product');
  };

  const handleCloseRecordScreen = () => {
    setSalePrefillCustomer(undefined);
    setSalePrefillProduct(undefined);
    setInvoiceToEdit(null);
    setContactCustomerToEdit(null);
    setContactSupplierToEdit(null);
    setProductToEdit(null);
    setCurrentView(previousView || 'dashboard');
  };

  const [legalTab, setLegalTab] = useState<'disclaimers' | 'terms' | 'privacy'>('disclaimers');
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [isTourModalOpen, setIsTourModalOpen] = useState(false);

  const openLegalView = (tab: 'disclaimers' | 'terms' | 'privacy' = 'disclaimers') => {
    if (!isTransientCreationView(currentView)) {
      setPreviousView(currentView);
    }
    setLegalTab(tab);
    setCurrentView('legal');
  };

  // While restoring auth & business session from cloud, show branded splash screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 select-none">
        <div className="relative mb-5">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-2xl shadow-emerald-600/30">
            <Building2 className="w-8 h-8" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
          </div>
        </div>
        <h1 className="text-xl font-black text-white tracking-tight mb-2">MarketMate</h1>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
          <span className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span>Restoring store session...</span>
        </div>
      </div>
    );
  }

  // If unauthenticated or navigating public auth views
  if (!isAuthenticated) {
    if (currentView === 'login') {
      return (
        <Login
          onSuccess={() => navigateTo('dashboard')}
          onNavigateToSignup={() => navigateTo('signup')}
          onNavigateToForgotPassword={() => navigateTo('forgot-password' as any)}
          onExit={() => navigateTo('landing')}
          onExploreDemo={() => {
            activateDemoMode();
            navigateTo('dashboard');
          }}
        />
      );
    }

    if (currentView === 'signup') {
      return (
        <Signup
          onSuccess={() => navigateTo('onboarding')}
          onNavigateToLogin={() => navigateTo('login')}
          onExit={() => navigateTo('landing')}
          onExploreDemo={() => {
            activateDemoMode();
            navigateTo('dashboard');
          }}
        />
      );
    }

    if ((currentView as any) === 'forgot-password') {
      return (
        <ForgotPassword
          onBackToLogin={() => navigateTo('login')}
          onExit={() => navigateTo('landing')}
        />
      );
    }

    return (
      <LandingPage
        onStartFree={() => navigateTo('signup')}
        onLogin={() => navigateTo('login')}
        onExploreDemo={() => {
          activateDemoMode();
          navigateTo('dashboard');
        }}
      />
    );
  }

  // If authenticated but not onboarded yet
  if (isAuthenticated && !isOnboarded) {
    return (
      <Onboarding
        onCompleted={() => navigateTo('dashboard')}
      />
    );
  }

  // Main Authenticated App Shell with full views
  const currency = business?.currency || 'NGN';

  const renderActiveView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView
            onNavigate={(view) => navigateTo(view)}
            onOpenAddSale={() => openRecordSale()}
            onOpenAddExpense={() => openRecordExpense()}
            onOpenPricingCalculator={() => navigateTo('pricing-calc')}
            onOpenProfitSimulator={() => navigateTo('profit-sim')}
            onOpenGoalsModal={() => navigateTo('financial-goals')}
            onOpenTourModal={() => setIsTourModalOpen(true)}
          />
        );
      case 'pos':
        return (
          <POSView
            onOpenStaffManagement={() => navigateTo('staff')}
            onOpenFxCalculator={() => navigateTo('fx-calc')}
          />
        );
      case 'sales':
        return <SalesView onOpenAddSale={() => openRecordSale()} />;
      case 'expenses':
        return <ExpensesView onOpenAddExpense={() => openRecordExpense()} />;
      case 'record-sale':
        return (
          <RecordSaleView
            onBack={handleCloseRecordScreen}
            onSuccess={() => navigateTo('sales')}
            prefillCustomer={salePrefillCustomer}
            prefillProduct={salePrefillProduct}
          />
        );
      case 'record-expense':
        return (
          <RecordExpenseView
            onBack={handleCloseRecordScreen}
            onSuccess={() => navigateTo('expenses')}
          />
        );
      case 'pricing-calc':
        return (
          <PricingCalculatorView
            onBack={handleCloseRecordScreen}
            onUpgrade={() => navigateTo('subscribe')}
          />
        );
      case 'profit-sim':
        return (
          <ProfitSimulatorView
            onBack={handleCloseRecordScreen}
            onUpgrade={() => navigateTo('subscribe')}
          />
        );
      case 'fx-calc':
        return (
          <MultiCurrencyView
            onBack={handleCloseRecordScreen}
            onUpgrade={() => navigateTo('subscribe')}
          />
        );
      case 'create-invoice':
        return (
          <InvoiceCreateView
            onBack={handleCloseRecordScreen}
            onSuccess={handleCloseRecordScreen}
            defaultType={invoicePrefillType}
            initialInvoice={invoiceToEdit}
          />
        );
      case 'record-debt':
        return (
          <RecordDebtView
            onBack={handleCloseRecordScreen}
            onSuccess={handleCloseRecordScreen}
          />
        );
      case 'create-contact':
        return (
          <ContactCreateView
            onBack={handleCloseRecordScreen}
            onSuccess={handleCloseRecordScreen}
            initialType={contactPrefillType}
            initialCustomer={contactCustomerToEdit}
            initialSupplier={contactSupplierToEdit}
          />
        );
      case 'create-product':
        return (
          <ProductCreateView
            onBack={handleCloseRecordScreen}
            onSuccess={handleCloseRecordScreen}
            initialProduct={productToEdit}
          />
        );
      case 'financial-goals':
        return (
          <FinancialGoalsView
            onBack={handleCloseRecordScreen}
            onUpgrade={() => navigateTo('subscribe')}
          />
        );
      case 'backup-vault':
        return (
          <BackupDataView
            onBack={handleCloseRecordScreen}
            onUpgrade={() => navigateTo('subscribe')}
          />
        );
      case 'referral':
        return <ReferralView onBack={handleCloseRecordScreen} />;
      case 'help-support':
        return (
          <HelpSupportView
            onBack={handleCloseRecordScreen}
            businessName={business?.businessName}
          />
        );
      case 'logo-export':
        return <LogoExportView onBack={handleCloseRecordScreen} />;
      case 'subscribe':
        return <SubscribeView onBack={handleCloseRecordScreen} />;
      case 'bulk-import':
        return <BulkProductImportView onBack={() => setCurrentView('products')} />;
      case 'legal':
        return <LegalView onBack={handleCloseRecordScreen} defaultTab={legalTab} />;
      case 'invoices':
        if (!isSubscribed) {
          return (
            <ProFeatureGate
              title="Invoices & Quotes"
              subtitle="Prepare and track customer invoices and price quotations, record partial payments, and share receipts."
              icon={FileText}
              benefits={[
                'Create PDF and WhatsApp invoices with your business details',
                'Send price quotes and convert them to invoices',
                'Track unpaid, partly paid, and overdue invoices',
                'Include your business bank account details on every invoice',
              ]}
              onUpgrade={() => navigateTo('subscribe')}
              onBack={() => setCurrentView('dashboard')}
            />
          );
        }
        return <InvoicesView onOpenCreateInvoice={openCreateInvoice} />;
      case 'contacts':
        if (!isSubscribed) {
          return (
            <ProFeatureGate
              title="Customers & Suppliers"
              subtitle="Keep your customer and supplier contact details organised in one place and review their purchase history."
              icon={BookUser}
              benefits={[
                'Save customer and supplier names, phone numbers, and notes',
                'See total purchases and unpaid balances for each customer',
                'Send quick WhatsApp messages to customers and suppliers',
                'Keep supplier items and payment records organised',
              ]}
              onUpgrade={() => navigateTo('subscribe')}
              onBack={() => setCurrentView('dashboard')}
            />
          );
        }
        return (
          <ContactsView
            onOpenRecordExpense={() => openRecordExpense()}
            onOpenRecordSale={(cust) => openRecordSale({ customer: cust })}
            onOpenRecordDebt={() => openRecordDebt()}
            onOpenCreateContact={openCreateContact}
            onOpenCreateInvoice={openCreateInvoice}
          />
        );
      case 'debts':
        if (!isSubscribed) {
          return (
            <ProFeatureGate
              title="Customer Debts"
              subtitle="Know who owes your business, how much remains unpaid, and send polite payment reminders."
              icon={Users}
              benefits={[
                'See total outstanding customer balances at a glance',
                'Set due dates and spot overdue customer debts',
                'Send payment reminders via WhatsApp',
                'Record partial payments and automatically update remaining balances',
              ]}
              onUpgrade={() => navigateTo('subscribe')}
              onBack={() => setCurrentView('dashboard')}
            />
          );
        }
        return <DebtsView onOpenRecordDebt={openRecordDebt} />;
      case 'products':
        if (!isSubscribed) {
          return (
            <ProFeatureGate
              title="Products & Stock"
              subtitle="Manage the products you sell, set cost and selling prices, and see when stock is running low."
              icon={Package}
              benefits={[
                'Save your product list with cost price and selling price',
                'Track available stock and see Low Stock and Out of Stock alerts',
                'Update stock quantities when new goods arrive',
                'Use barcode scanning for faster checkout',
              ]}
              onUpgrade={() => navigateTo('subscribe')}
              onBack={() => setCurrentView('dashboard')}
            />
          );
        }
        return (
          <ProductsView
            onOpenAddSaleWithProduct={(prod) => openRecordSale({ product: prod })}
            onOpenCreateProduct={openCreateProduct}
            onOpenBulkImport={() => navigateTo('bulk-import')}
          />
        );
      case 'transactions':
        return <TransactionsView />;
      case 'reports':
        if (!isSubscribed) {
          return (
            <ProFeatureGate
              title="Reports"
              subtitle="Understand how your business is performing with clear sales, expense, and profit reports."
              icon={BarChart3}
              benefits={[
                'Clear sales, expense, and profit summaries by date range',
                'See which products bring in the most sales and profit',
                'Review where your business money was spent by category',
                'Download reports for your business records',
              ]}
              onUpgrade={() => navigateTo('subscribe')}
              onBack={() => setCurrentView('dashboard')}
            />
          );
        }
        return <ReportsView />;
      case 'ai':
        if (!isSubscribed) {
          return (
            <ProFeatureGate
              title="Business Assistant"
              subtitle="Ask questions about your business sales, expenses, and products and get clear answers."
              icon={Bot}
              benefits={[
                'Ask plain-language questions about your recorded sales and expenses',
                'Get practical suggestions to review product prices and costs',
                'Spot high expense categories and slow-moving stock',
                'Tailored for small businesses in Nigeria',
              ]}
              onUpgrade={() => navigateTo('subscribe')}
              onBack={() => setCurrentView('dashboard')}
            />
          );
        }
        return <AIAssistantView />;
      case 'settings':
        return (
          <SettingsView
            onResetData={() => setCurrentView('dashboard')}
            onLoadDemo={() => setCurrentView('dashboard')}
            onOpenLogoExport={() => navigateTo('logo-export')}
            onOpenTour={() => setIsTourModalOpen(true)}
            onOpenReferralModal={() => navigateTo('referral')}
            onOpenSupportModal={() => navigateTo('help-support')}
            onNavigateToFx={() => navigateTo('fx-calc')}
            onNavigateToStaff={() => navigateTo('staff')}
            onOpenSubscribe={() => navigateTo('subscribe')}
            onOpenLegal={(tab) => openLegalView(tab)}
          />
        );
      case 'admin':
        return <AdminPortalView />;
      case 'staff':
        if (!isSubscribed) {
          return (
            <ProFeatureGate
              title="Staff & Permissions"
              subtitle="Control who can use your business account, set staff PINs, and manage shifts."
              icon={Shield}
              benefits={[
                'Add cashiers, managers, and stock staff with individual PINs',
                'Control who can see business profit, reports, or settings',
                'Track staff shifts and opening/closing cash',
                'See which staff member recorded each sale',
              ]}
              onUpgrade={() => navigateTo('subscribe')}
              onBack={() => setCurrentView('dashboard')}
            />
          );
        }
        return <StaffManagementView onBack={handleCloseRecordScreen} />;
      default:
        return (
          <DashboardView
            onNavigate={(view) => setCurrentView(view)}
            onOpenAddSale={() => openRecordSale()}
            onOpenAddExpense={() => openRecordExpense()}
            onOpenPricingCalculator={() => navigateTo('pricing-calc')}
            onOpenProfitSimulator={() => navigateTo('profit-sim')}
            onOpenGoalsModal={() => navigateTo('financial-goals')}
            onOpenTourModal={() => setIsTourModalOpen(true)}
          />
        );
    }
  };

  return (
    <Shell
      currentView={currentView}
      onNavigate={(view) => navigateTo(view)}
      onOpenAddSale={() => openRecordSale()}
      onOpenAddExpense={() => openRecordExpense()}
      onOpenPricingCalculator={() => navigateTo('pricing-calc')}
      onOpenProfitSimulator={() => navigateTo('profit-sim')}
      onOpenGoalsModal={() => navigateTo('financial-goals')}
      onOpenBackupModal={() => navigateTo('backup-vault')}
      onOpenFxModal={() => navigateTo('fx-calc')}
      onOpenStaffModal={() => navigateTo('staff')}
      onOpenLogoExportModal={() => navigateTo('logo-export')}
      onOpenNotificationDrawer={() => setIsNotificationDrawerOpen(true)}
      onOpenTourModal={() => setIsTourModalOpen(true)}
      onOpenReferralModal={() => navigateTo('referral')}
      onOpenSupportModal={() => navigateTo('help-support')}
      businessName={business?.businessName}
      businessType={business?.businessType}
      currency={currency}
      onLogout={() => {
        logout();
        try {
          localStorage.removeItem('marketmate_current_view');
        } catch {}
        navigateTo('landing');
      }}
    >
      {/* Demo Mode Notice Banner */}
      {isDemoMode && (
        <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/50 dark:from-emerald-950/60 dark:via-slate-900 dark:to-emerald-900/40 border border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">
                Free Demo Explorer Account • All Pro Features Unlocked
              </p>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300/90 mt-0.5">
                Exploring as <strong>Adaeze Okonkwo ({business?.businessName})</strong>. Test Invoices, Reports & P&L, Debt Book, POS, and AI Advisor freely! Real registered accounts remain locked until subscription.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                logout();
                setCurrentView('signup');
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
            >
              Sign Up For Real Store
            </button>
            <button
              onClick={() => {
                logout();
                setCurrentView('landing');
              }}
              className="px-2.5 py-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer"
            >
              Exit Demo
            </button>
          </div>
        </div>
      )}

      {/* Render Current View */}
      {renderActiveView()}

      {/* Persistent Global Modals & Drawers */}
      <AppTourModal
        isOpen={isTourModalOpen}
        onClose={() => setIsTourModalOpen(false)}
        onNavigate={(view) => setCurrentView(view)}
        onOpenAddSale={() => openRecordSale()}
        onOpenAddExpense={() => openRecordExpense()}
        onCompleteTour={() => {
          if (updateBusiness) {
            updateBusiness({ hasCompletedTour: true, hasDismissedGuide: true });
          }
          if (user?.id) {
            try {
              localStorage.setItem(`marketmate_guide_dismissed_${user.id}`, 'true');
            } catch {}
          }
        }}
        businessName={business?.businessName}
      />
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        onNavigate={(view) => setCurrentView(view)}
      />
    </Shell>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BusinessDataProvider>
          <NotificationProvider>
            <AppContent />
            <OfflineIndicator />
          </NotificationProvider>
        </BusinessDataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}


