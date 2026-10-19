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
import { RecordSaleModal } from './components/sales/RecordSaleModal';
import { RecordExpenseModal } from './components/expenses/RecordExpenseModal';
import { PricingCalculatorModal } from './components/tools/PricingCalculatorModal';
import { ProfitSimulatorModal } from './components/tools/ProfitSimulatorModal';
import { DebtsView } from './components/debts/DebtsView';
import { FinancialGoalsModal } from './components/goals/FinancialGoalsModal';
import { BackupDataModal } from './components/backup/BackupDataModal';
import { MultiCurrencyCalculatorModal } from './components/currency/MultiCurrencyCalculatorModal';
import { StaffManagementModal } from './components/staff/StaffManagementModal';
import { StaffManagementView } from './components/staff/StaffManagementView';
import { LogoExportModal } from './components/common/LogoExportModal';
import { AppTourModal } from './components/onboarding/AppTourModal';
import { ReferralModal } from './components/referral/ReferralModal';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';
import { NotificationProvider } from './context/NotificationContext';
import { ProFeatureGate } from './components/subscription/ProFeatureGate';
import { SubscribeModal } from './components/subscription/SubscribeModal';
import { HelpSupportModal } from './components/common/HelpSupportModal';
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
      view === 'create-contact'
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

  const handleCloseRecordScreen = () => {
    setSalePrefillCustomer(undefined);
    setSalePrefillProduct(undefined);
    setInvoiceToEdit(null);
    setContactCustomerToEdit(null);
    setContactSupplierToEdit(null);
    setCurrentView(previousView || 'dashboard');
  };

  const [isAddSaleOpen, setIsAddSaleOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isPricingCalcOpen, setIsPricingCalcOpen] = useState(false);
  const [isProfitSimOpen, setIsProfitSimOpen] = useState(false);
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isFxModalOpen, setIsFxModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isLogoExportOpen, setIsLogoExportOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [isTourModalOpen, setIsTourModalOpen] = useState(false);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

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
            onOpenGoalsModal={() => setIsGoalsModalOpen(true)}
            onOpenTourModal={() => setIsTourModalOpen(true)}
          />
        );
      case 'pos':
        return (
          <POSView
            onOpenStaffManagement={() => setIsStaffModalOpen(true)}
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
            onSuccess={handleCloseRecordScreen}
            prefillCustomer={salePrefillCustomer}
            prefillProduct={salePrefillProduct}
          />
        );
      case 'record-expense':
        return (
          <RecordExpenseView
            onBack={handleCloseRecordScreen}
            onSuccess={handleCloseRecordScreen}
          />
        );
      case 'pricing-calc':
        return (
          <PricingCalculatorView
            onBack={handleCloseRecordScreen}
            onUpgrade={() => setIsSubscribeModalOpen(true)}
          />
        );
      case 'profit-sim':
        return (
          <ProfitSimulatorView
            onBack={handleCloseRecordScreen}
            onUpgrade={() => setIsSubscribeModalOpen(true)}
          />
        );
      case 'fx-calc':
        return (
          <MultiCurrencyView
            onBack={handleCloseRecordScreen}
            onUpgrade={() => setIsSubscribeModalOpen(true)}
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
      case 'invoices':
        if (!isSubscribed) {
          return (
            <ProFeatureGate
              title="Invoices & Official Quotations"
              subtitle="Generate professional, branded PDF and WhatsApp invoices, create official quotations, track partial payments, and issue merchant receipts."
              icon={FileText}
              benefits={[
                'Issue professional PDF & WhatsApp invoices with your store branding',
                'Send official price quotations and convert them to invoices in 1 click',
                'Track uncollected, overdue, and partial payments with audit trails',
                'Include verified Nigerian bank account details on every invoice',
              ]}
              onUpgrade={() => setIsSubscribeModalOpen(true)}
              onBack={() => setCurrentView('dashboard')}
            />
          );
        }
        return <InvoicesView onOpenCreateInvoice={openCreateInvoice} />;
      case 'contacts':
        if (!isSubscribed) {
          return (
            <ProFeatureGate
              title="CRM & Customer Directory"
              subtitle="Centralize your business address book, track individual customer lifetime spend, manage wholesale suppliers, and send WhatsApp alerts."
              icon={BookUser}
              benefits={[
                'Unlimited customer & supplier directory with instant search',
                'Track customer lifetime purchase histories and top buyers',
                '1-click direct WhatsApp messaging and customer account notes',
                'Track supplier payment terms, order histories, and deliveries',
              ]}
              onUpgrade={() => setIsSubscribeModalOpen(true)}
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
              title="Credit & Debit Ledger Book"
              subtitle="Stop losing money to forgotten credits. Track who owes your business, set due date reminders, and send friendly WhatsApp debt recovery prompts."
              icon={Users}
              benefits={[
                'Track total uncollected receivables and customer credit balances',
                'Set repayment due dates with overdue alert badges',
                'Send polite, pre-filled WhatsApp payment reminder templates',
                'Partial payment logging and automatic balance recalculations',
              ]}
              onUpgrade={() => setIsSubscribeModalOpen(true)}
              onBack={() => setCurrentView('dashboard')}
            />
          );
        }
        return <DebtsView onOpenRecordDebt={openRecordDebt} />;
      case 'products':
        if (!isSubscribed) {
          return (
            <ProFeatureGate
              title="Catalog & Stock Inventory"
              subtitle="Centralize your entire store inventory, barcode scanning, stock reorder alerts, batch pricing, and profit margin audits."
              icon={Package}
              benefits={[
                'Unlimited product catalog with SKUs, barcodes, and categories',
                'Live stock tracking with low-stock and out-of-stock warning alerts',
                'Batch cost and selling price updates with profit margin audits',
                'Barcode scanner integration for lightning-fast checkout',
              ]}
              onUpgrade={() => setIsSubscribeModalOpen(true)}
              onBack={() => setCurrentView('dashboard')}
            />
          );
        }
        return (
          <ProductsView
            onOpenAddSaleWithProduct={(prod) => openRecordSale({ product: prod })}
          />
        );
      case 'transactions':
        return <TransactionsView />;
      case 'reports':
        if (!isSubscribed) {
          return (
            <ProFeatureGate
              title="Reports & Profit and Loss (P&L)"
              subtitle="Detailed financial intelligence, automated Net Profit audits, expense leak detection, and tax-ready business reports."
              icon={BarChart3}
              benefits={[
                'Automated Profit & Loss (P&L) statements with gross & net margins',
                'Top-selling product analytics and customer retention insights',
                'Expense categorization and operational cost breakdown',
                'Exportable accounting summaries formatted for tax & bank audits',
              ]}
              onUpgrade={() => setIsSubscribeModalOpen(true)}
              onBack={() => setCurrentView('dashboard')}
            />
          );
        }
        return <ReportsView />;
      case 'ai':
        if (!isSubscribed) {
          return (
            <ProFeatureGate
              title="MarketMate AI Business Advisor"
              subtitle="Your 24/7 retail financial advisor trained on Nigerian commerce, currency inflation hedge strategies, and margin optimization."
              icon={Bot}
              benefits={[
                '24/7 retail financial advisor powered by Gemini AI',
                'Custom pricing and profitability recommendations for your catalog',
                'Actionable suggestions to reduce operating expenses and waste',
                'Market insights tailored to Nigerian trade and FX fluctuations',
              ]}
              onUpgrade={() => setIsSubscribeModalOpen(true)}
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
            onOpenLogoExport={() => setIsLogoExportOpen(true)}
            onOpenTour={() => setIsTourModalOpen(true)}
            onOpenReferralModal={() => setIsReferralModalOpen(true)}
            onOpenSupportModal={() => setIsSupportModalOpen(true)}
            onNavigateToFx={() => navigateTo('fx-calc')}
          />
        );
      case 'admin':
        return <AdminPortalView />;
      case 'staff':
        if (!isSubscribed) {
          return (
            <ProFeatureGate
              title="Staff, Roles & Permissions"
              subtitle="Hire cashiers, sales clerks, and branch managers with PIN-locked access, cash drawer shift handovers, and role-based permissions."
              icon={Shield}
              benefits={[
                'Multi-user PIN login and quick-switching between staff at the register',
                'Granular permissions: lock profit margins, cost prices, discounts, and deletions',
                'Opening cash float and end-of-shift drawer reconciliation audits',
                'Staff sales performance tracking and accountability logging',
              ]}
              onUpgrade={() => setIsSubscribeModalOpen(true)}
              onBack={() => setCurrentView('dashboard')}
            />
          );
        }
        return <StaffManagementView />;
      default:
        return (
          <DashboardView
            onNavigate={(view) => setCurrentView(view)}
            onOpenAddSale={() => openRecordSale()}
            onOpenAddExpense={() => openRecordExpense()}
            onOpenPricingCalculator={() => navigateTo('pricing-calc')}
            onOpenProfitSimulator={() => navigateTo('profit-sim')}
            onOpenGoalsModal={() => setIsGoalsModalOpen(true)}
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
      onOpenGoalsModal={() => setIsGoalsModalOpen(true)}
      onOpenBackupModal={() => setIsBackupModalOpen(true)}
      onOpenFxModal={() => navigateTo('fx-calc')}
      onOpenStaffModal={() => setIsStaffModalOpen(true)}
      onOpenLogoExportModal={() => setIsLogoExportOpen(true)}
      onOpenNotificationDrawer={() => setIsNotificationDrawerOpen(true)}
      onOpenTourModal={() => setIsTourModalOpen(true)}
      onOpenReferralModal={() => setIsReferralModalOpen(true)}
      onOpenSupportModal={() => setIsSupportModalOpen(true)}
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
      <RecordSaleModal
        isOpen={isAddSaleOpen}
        onClose={() => setIsAddSaleOpen(false)}
      />
      <RecordExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
      />
      <PricingCalculatorModal
        isOpen={isPricingCalcOpen}
        onClose={() => setIsPricingCalcOpen(false)}
        onUpgrade={() => setIsSubscribeModalOpen(true)}
      />
      <ProfitSimulatorModal
        isOpen={isProfitSimOpen}
        onClose={() => setIsProfitSimOpen(false)}
        onUpgrade={() => setIsSubscribeModalOpen(true)}
      />
      <FinancialGoalsModal
        isOpen={isGoalsModalOpen}
        onClose={() => setIsGoalsModalOpen(false)}
        onUpgrade={() => setIsSubscribeModalOpen(true)}
      />
      <BackupDataModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onUpgrade={() => setIsSubscribeModalOpen(true)}
      />
      <MultiCurrencyCalculatorModal
        isOpen={isFxModalOpen}
        onClose={() => setIsFxModalOpen(false)}
        onUpgrade={() => setIsSubscribeModalOpen(true)}
      />
      <StaffManagementModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        onUpgrade={() => setIsSubscribeModalOpen(true)}
        onNavigateToFullView={() => setCurrentView('staff')}
      />
      <LogoExportModal
        isOpen={isLogoExportOpen}
        onClose={() => setIsLogoExportOpen(false)}
      />
      <ReferralModal
        isOpen={isReferralModalOpen}
        onClose={() => setIsReferralModalOpen(false)}
      />
      <SubscribeModal
        isOpen={isSubscribeModalOpen}
        onClose={() => setIsSubscribeModalOpen(false)}
      />
      <HelpSupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
        businessName={business?.businessName}
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


