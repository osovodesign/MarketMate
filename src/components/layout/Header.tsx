import React from 'react';
import {
  Bell,
  Search,
  Settings,
  Bot,
  User,
  LogOut,
  Sparkles,
  ShieldCheck,
  Lock,
  Cloud,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { AppView } from '../../types';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  businessName?: string;
  currency?: string;
  onLogout?: () => void;
  onOpenStaffModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  businessName = 'My Business',
  currency = 'NGN',
  onLogout,
  onOpenStaffModal,
}) => {
  const { currentSession, isCloudSyncing } = useBusinessData();
  const { isDemoMode, user } = useAuth();
  const isCashier = currentSession?.currentRole === 'cashier';

  const titles: Record<AppView, { title: string; subtitle: string }> = {
    landing: { title: 'MarketMate', subtitle: 'Know Your Numbers' },
    login: { title: 'Login', subtitle: 'Access your account' },
    signup: { title: 'Sign Up', subtitle: 'Start free with MarketMate' },
    onboarding: { title: 'Setup Business', subtitle: 'Tell us about your business' },
    dashboard: { title: 'Business Overview', subtitle: 'Today, this week & month performance' },
    pos: { title: 'POS Register & Scanner', subtitle: 'High-speed checkout, barcode scanning & instant receipts' },
    sales: { title: 'Sales Record', subtitle: 'Track your incoming revenue and item profits' },
    expenses: { title: 'Expenses & Costs', subtitle: 'Manage your operating expenses' },
    invoices: { title: 'Invoices & Quotations', subtitle: 'Generate PDF/WhatsApp bills, quotes & payment tracking' },
    contacts: { title: 'Contacts & Directory', subtitle: 'Manage customers CRM and wholesale market suppliers' },
    debts: { title: 'Customer Debt Book', subtitle: 'Track customer balances, payment reminders & credit' },
    products: { title: 'Inventory & Price Catalog', subtitle: 'Set standard unit costs, prices & margins' },
    transactions: { title: 'Transactions Ledger', subtitle: 'Full history of sales and expenses' },
    reports: { title: 'Financial Reports', subtitle: 'Detailed breakdown, profit trends & margins' },
    ai: { title: 'MarketMate AI Advisor', subtitle: 'Ask questions about your business numbers' },
    settings: { title: 'Settings & Profile', subtitle: 'Manage business details and preferences' },
  };

  const viewMeta = titles[currentView] || { title: 'Dashboard', subtitle: '' };

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-xs border-b border-slate-200/80 px-4 sm:px-6 py-3.5 flex items-center justify-between">
      {/* Title / Current View */}
      <div className="flex items-center gap-3">
        {/* Mobile Brand Logo */}
        <div className="lg:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
            M
          </div>
        </div>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
            {viewMeta.title}
          </h1>
          <p className="text-xs text-slate-500 hidden sm:block leading-tight">
            {viewMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Action Tray */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Cloud Sync Status Pill */}
        {!isDemoMode && user ? (
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs"
            title="Multi-Device Cloud Sync is active via Firebase Firestore"
          >
            {isCloudSyncing ? (
              <RefreshCw className="w-3 h-3 text-emerald-600 animate-spin shrink-0" />
            ) : (
              <Cloud className="w-3 h-3 text-emerald-600 shrink-0" />
            )}
            <span className="text-[11px]">{isCloudSyncing ? 'Syncing...' : 'Cloud Synced'}</span>
          </div>
        ) : (
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80"
            title="Demo sample data mode"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span className="text-[11px]">Demo Mode</span>
          </div>
        )}

        {/* Staff Session Role Pill */}
        {onOpenStaffModal && (
          <button
            onClick={onOpenStaffModal}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
              isCashier
                ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                : 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100'
            }`}
            title="Switch Active Staff or Lock Cashier Mode"
          >
            {isCashier ? <Lock className="w-3 h-3 text-amber-700" /> : <ShieldCheck className="w-3 h-3 text-purple-700" />}
            <span>{currentSession?.staffName || (isCashier ? 'Cashier' : 'Owner')}</span>
          </button>
        )}

        {/* MarketMate AI Quick Access Pill */}
        {currentView !== 'ai' && !isCashier && (
          <button
            onClick={() => onNavigate('ai')}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-amber-900 text-xs font-semibold transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Ask AI</span>
            <span className="sm:hidden">AI</span>
          </button>
        )}

        {/* Currency Pill */}
        <div className="hidden md:flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
          <span>Currency: ₦ ({currency})</span>
        </div>

        {/* Settings button */}
        {!isCashier && (
          <button
            onClick={() => onNavigate('settings')}
            className={`p-2 rounded-lg transition-colors ${
              currentView === 'settings'
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
            title="Settings"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}

        {/* Logout / User button */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Log Out"
            aria-label="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
