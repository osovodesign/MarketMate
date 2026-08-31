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
import { RecordSaleModal } from './components/sales/RecordSaleModal';
import { RecordExpenseModal } from './components/expenses/RecordExpenseModal';
import { PricingCalculatorModal } from './components/tools/PricingCalculatorModal';
import { ProfitSimulatorModal } from './components/tools/ProfitSimulatorModal';
import { DebtsView } from './components/debts/DebtsView';
import { FinancialGoalsModal } from './components/goals/FinancialGoalsModal';
import { BackupDataModal } from './components/backup/BackupDataModal';
import { MultiCurrencyCalculatorModal } from './components/currency/MultiCurrencyCalculatorModal';
import { StaffManagementModal } from './components/staff/StaffManagementModal';
import { LogoExportModal } from './components/common/LogoExportModal';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';
import { NotificationProvider } from './context/NotificationContext';
import { AppView } from './types';
import { Sparkles } from 'lucide-react';

function AppContent() {
  const { user, business, isAuthenticated, isOnboarded, isDemoMode, logout, activateDemoMode } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>('landing');
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

  // If unauthenticated or navigating public auth views
  if (!isAuthenticated && currentView === 'landing') {
    return (
      <LandingPage
        onStartFree={() => setCurrentView('signup')}
        onLogin={() => setCurrentView('login')}
        onExploreDemo={() => {
          activateDemoMode();
          setCurrentView('dashboard');
        }}
      />
    );
  }

  if (!isAuthenticated && currentView === 'login') {
    return (
      <Login
        onSuccess={() => setCurrentView('dashboard')}
        onNavigateToSignup={() => setCurrentView('signup')}
        onNavigateToForgotPassword={() => setCurrentView('forgot-password' as any)}
        onExit={() => setCurrentView('landing')}
        onExploreDemo={() => {
          activateDemoMode();
          setCurrentView('dashboard');
        }}
      />
    );
  }

  if (!isAuthenticated && currentView === 'signup') {
    return (
      <Signup
        onSuccess={() => setCurrentView('onboarding')}
        onNavigateToLogin={() => setCurrentView('login')}
        onExit={() => setCurrentView('landing')}
        onExploreDemo={() => {
          activateDemoMode();
          setCurrentView('dashboard');
        }}
      />
    );
  }

  if (!isAuthenticated && (currentView as any) === 'forgot-password') {
    return (
      <ForgotPassword
        onBackToLogin={() => setCurrentView('login')}
        onExit={() => setCurrentView('landing')}
      />
    );
  }

  // If authenticated but not onboarded yet
  if (isAuthenticated && !isOnboarded) {
    return (
      <Onboarding
        onCompleted={() => setCurrentView('dashboard')}
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
            onNavigate={(view) => setCurrentView(view)}
            onOpenAddSale={() => setIsAddSaleOpen(true)}
            onOpenAddExpense={() => setIsAddExpenseOpen(true)}
            onOpenPricingCalculator={() => setIsPricingCalcOpen(true)}
            onOpenProfitSimulator={() => setIsProfitSimOpen(true)}
            onOpenGoalsModal={() => setIsGoalsModalOpen(true)}
          />
        );
      case 'pos':
        return (
          <POSView
            onOpenStaffManagement={() => setIsStaffModalOpen(true)}
            onOpenFxCalculator={() => setIsFxModalOpen(true)}
          />
        );
      case 'sales':
        return <SalesView onOpenAddSale={() => setIsAddSaleOpen(true)} />;
      case 'expenses':
        return <ExpensesView onOpenAddExpense={() => setIsAddExpenseOpen(true)} />;
      case 'invoices':
        return <InvoicesView />;
      case 'contacts':
        return (
          <ContactsView
            onOpenRecordExpense={(desc) => setIsAddExpenseOpen(true)}
            onOpenRecordSale={(cust) => setIsAddSaleOpen(true)}
          />
        );
      case 'debts':
        return <DebtsView />;
      case 'products':
        return <ProductsView />;
      case 'transactions':
        return <TransactionsView />;
      case 'reports':
        return <ReportsView />;
      case 'ai':
        return <AIAssistantView />;
      case 'settings':
        return (
          <SettingsView
            onResetData={() => setCurrentView('dashboard')}
            onLoadDemo={() => setCurrentView('dashboard')}
            onOpenLogoExport={() => setIsLogoExportOpen(true)}
          />
        );
      case 'admin':
        return <AdminPortalView />;
      default:
        return (
          <DashboardView
            onNavigate={(view) => setCurrentView(view)}
            onOpenAddSale={() => setIsAddSaleOpen(true)}
            onOpenAddExpense={() => setIsAddExpenseOpen(true)}
            onOpenPricingCalculator={() => setIsPricingCalcOpen(true)}
            onOpenProfitSimulator={() => setIsProfitSimOpen(true)}
            onOpenGoalsModal={() => setIsGoalsModalOpen(true)}
          />
        );
    }
  };

  return (
    <Shell
      currentView={currentView}
      onNavigate={(view) => setCurrentView(view)}
      onOpenAddSale={() => setIsAddSaleOpen(true)}
      onOpenAddExpense={() => setIsAddExpenseOpen(true)}
      onOpenPricingCalculator={() => setIsPricingCalcOpen(true)}
      onOpenProfitSimulator={() => setIsProfitSimOpen(true)}
      onOpenGoalsModal={() => setIsGoalsModalOpen(true)}
      onOpenBackupModal={() => setIsBackupModalOpen(true)}
      onOpenFxModal={() => setIsFxModalOpen(true)}
      onOpenStaffModal={() => setIsStaffModalOpen(true)}
      onOpenLogoExportModal={() => setIsLogoExportOpen(true)}
      onOpenNotificationDrawer={() => setIsNotificationDrawerOpen(true)}
      businessName={business?.businessName}
      businessType={business?.businessType}
      currency={currency}
      onLogout={() => {
        logout();
        setCurrentView('landing');
      }}
    >
      {/* Demo Mode Notice Banner */}
      {isDemoMode && (
        <div className="mb-5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>Demo Mode:</strong> Exploring with sample data for <em>{business?.businessName}</em>.
            </span>
          </div>
          <button
            onClick={() => {
              logout();
              setCurrentView('signup');
            }}
            className="text-amber-800 dark:text-amber-300 underline font-bold text-xs ml-2 hover:text-amber-950 dark:hover:text-amber-100 cursor-pointer"
          >
            Create Your Real Business
          </button>
        </div>
      )}

      {/* Render Current View */}
      {renderActiveView()}

      {/* Persistent Global Modals & Drawers */}
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
      />
      <ProfitSimulatorModal
        isOpen={isProfitSimOpen}
        onClose={() => setIsProfitSimOpen(false)}
      />
      <FinancialGoalsModal
        isOpen={isGoalsModalOpen}
        onClose={() => setIsGoalsModalOpen(false)}
      />
      <BackupDataModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />
      <MultiCurrencyCalculatorModal
        isOpen={isFxModalOpen}
        onClose={() => setIsFxModalOpen(false)}
      />
      <StaffManagementModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
      />
      <LogoExportModal
        isOpen={isLogoExportOpen}
        onClose={() => setIsLogoExportOpen(false)}
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
          </NotificationProvider>
        </BusinessDataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}


