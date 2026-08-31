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
  Image as ImageIcon,
} from 'lucide-react';
import { AppView } from '../../types';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useAuth } from '../../context/AuthContext';
import { MarketMateLogo } from '../common/MarketMateLogo';
import { useNotifications } from '../../context/NotificationContext';

interface HeaderProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  businessName?: string;
  currency?: string;
  onLogout?: () => void;
  onOpenStaffModal?: () => void;
  onOpenLogoExportModal?: () => void;
  onOpenNotificationDrawer?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  businessName = 'My Business',
  currency = 'NGN',
  onLogout,
  onOpenStaffModal,
  onOpenLogoExportModal,
  onOpenNotificationDrawer,
}) => {
  const { currentSession, isCloudSyncing } = useBusinessData();
  const { isDemoMode, user } = useAuth();
  const { unreadCount } = useNotifications();
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
    admin: { title: 'Super Admin Portal', subtitle: 'Owner command center, registered merchants & platform health' },
  };

  const viewMeta = titles[currentView] || { title: 'Dashboard', subtitle: '' };

  return (
    <header className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between transition-colors">
      {/* Title / Current View */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
        {/* Mobile Brand Logo */}
        <div className="lg:hidden flex items-center shrink-0">
          <button onClick={() => onNavigate('dashboard')} className="cursor-pointer">
            <MarketMateLogo size="sm" />
          </button>
        </div>

        <div className="hidden lg:block min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight truncate">
            {viewMeta.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block leading-tight truncate">
            {viewMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Action Tray */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Cloud Sync Status Pill */}
        {!isDemoMode && user ? (
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs shrink-0"
            title="Multi-Device Cloud Sync is active via Firebase Firestore"
          >
            {isCloudSyncing ? (
              <RefreshCw className="w-3 h-3 text-emerald-600 dark:text-emerald-400 animate-spin shrink-0" />
            ) : (
              <Cloud className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
            )}
            <span className="text-[11px]">{isCloudSyncing ? 'Syncing...' : 'Cloud Synced'}</span>
          </div>
        ) : (
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 shrink-0"
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
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer shrink-0 ${
              isCashier
                ? 'bg-amber-50 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900'
                : 'bg-purple-50 dark:bg-purple-950 text-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900'
            }`}
            title="Switch Active Staff or Lock Cashier Mode"
          >
            {isCashier ? (
              <Lock className="w-3 h-3 text-amber-700 dark:text-amber-400 shrink-0" />
            ) : (
              <ShieldCheck className="w-3 h-3 text-purple-700 dark:text-purple-400 shrink-0" />
            )}
            <span className="text-[10px] sm:text-[11px] max-w-[65px] sm:max-w-none truncate">
              {currentSession?.staffName || (isCashier ? 'Cashier' : 'Owner')}
            </span>
          </button>
        )}

        {/* MarketMate AI Quick Access Pill - Hidden on mobile because it's in bottom nav */}
        {currentView !== 'ai' && !isCashier && (
          <button
            onClick={() => onNavigate('ai')}
            className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200/80 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Ask AI</span>
          </button>
        )}

        {/* Super Admin Owner Quick Access */}
        {(user?.isSuperAdmin || user?.email === 'osovoyoronogheneovo@gmail.com') && (
          <button
            onClick={() => onNavigate('admin')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
              currentView === 'admin'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/10'
            }`}
            title="Owner & Super Admin Portal"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="hidden sm:inline">Admin</span>
          </button>
        )}

        {/* Notifications & Announcements Bell */}
        {onOpenNotificationDrawer && (
          <button
            onClick={onOpenNotificationDrawer}
            className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer relative shrink-0"
            title="Notifications & Announcements"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>
        )}

        {/* Brand Asset Export Modal Trigger (desktop/tablet only) */}
        {onOpenLogoExportModal && (
          <button
            onClick={onOpenLogoExportModal}
            className="hidden md:flex p-2 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
            title="Export & Download Brand Logos"
            aria-label="Export Logos"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        )}

        {/* Settings button */}
        {!isCashier && (
          <button
            onClick={() => onNavigate('settings')}
            className={`p-1.5 sm:p-2 rounded-lg transition-colors cursor-pointer shrink-0 ${
              currentView === 'settings'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
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
            className="hidden sm:flex p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer shrink-0"
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
