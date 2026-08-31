import React, { useState, useRef, useEffect } from 'react';
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
  ChevronDown,
  ChevronUp,
  UserCheck,
  Store,
  ShoppingCart,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
  const { isDemoMode, user, isSuperAdmin } = useAuth();
  const { unreadCount } = useNotifications();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isCashier = currentSession?.currentRole === 'cashier';

  // Close dropdown on outside click or Esc
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

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

  const handleAction = (callback?: () => void) => {
    setIsDropdownOpen(false);
    if (callback) callback();
  };

  const handleNavigateView = (view: AppView) => {
    setIsDropdownOpen(false);
    onNavigate(view);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-b border-slate-200/80 dark:border-slate-800 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between transition-colors">
      {/* Title / Current View */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        {/* Mobile Brand Logo */}
        <div className="lg:hidden flex items-center shrink-0">
          <button onClick={() => onNavigate('dashboard')} className="cursor-pointer">
            <MarketMateLogo size="sm" />
          </button>
        </div>

        <div className="min-w-0">
          <h1 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white leading-tight truncate">
            {viewMeta.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 hidden lg:block leading-tight truncate">
            {viewMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Action Tray */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Cloud Sync Status Pill (Desktop/Tablet) */}
        {!isDemoMode && user ? (
          <div
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs shrink-0"
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
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 shrink-0"
            title="Demo sample data mode"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span className="text-[11px]">Demo Mode</span>
          </div>
        )}

        {/* Staff Session Role Pill (Desktop) */}
        {onOpenStaffModal && (
          <button
            onClick={onOpenStaffModal}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer shrink-0 ${
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
            <span className="text-[11px] max-w-[90px] truncate">
              {currentSession?.staffName || (isCashier ? 'Cashier' : 'Owner')}
            </span>
          </button>
        )}

        {/* Super Admin Quick Access (Desktop) */}
        {(user?.isSuperAdmin || isSuperAdmin || user?.email === 'osovoyoronogheneovo@gmail.com') && (
          <button
            onClick={() => onNavigate('admin')}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
              currentView === 'admin'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/10'
            }`}
            title="Owner & Super Admin Portal"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Admin</span>
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
            <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>
        )}

        {/* Responsive User / Actions Dropdown with Chevron (All devices & especially mobile) */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`flex items-center gap-1 sm:gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border transition-all cursor-pointer shrink-0 ${
              isDropdownOpen
                ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 border-slate-200/90 dark:border-slate-700/80 text-slate-700 dark:text-slate-200'
            }`}
            aria-expanded={isDropdownOpen}
            aria-label="User account and options menu"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
              {currentSession?.staffName
                ? currentSession.staffName.charAt(0).toUpperCase()
                : (businessName ? businessName.charAt(0).toUpperCase() : 'M')}
            </div>

            <span className="text-xs font-semibold max-w-[70px] sm:max-w-[100px] truncate hidden xs:inline">
              {currentSession?.staffName || (isCashier ? 'Cashier' : 'Account')}
            </span>

            {isDropdownOpen ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0 transition-transform" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0 transition-transform" />
            )}
          </button>

          {/* Floating Dropdown Menu */}
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50 overflow-hidden"
              >
                {/* Profile / Store Header */}
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {businessName}
                    </p>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isCashier
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      }`}
                    >
                      {isCashier ? 'Cashier Mode' : 'Owner / Manager'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {user?.email || 'Active Session'}
                  </p>

                  {/* Sync Status Badge on Mobile */}
                  <div className="mt-2 flex items-center gap-1.5 text-[11px]">
                    {!isDemoMode && user ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                        {isCloudSyncing ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                        Cloud Synchronized (Firestore)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        Demo Sample Mode
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Actions List */}
                <div className="py-1.5 px-1 space-y-0.5">
                  {/* Switch Staff / Role */}
                  {onOpenStaffModal && (
                    <button
                      onClick={() => handleAction(onOpenStaffModal)}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                          <UserCheck className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-slate-900 dark:text-white">Switch Staff / Shift</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">Current: {currentSession?.staffName || 'Owner'}</p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-semibold">Change</span>
                    </button>
                  )}

                  {/* Settings & Profile */}
                  {!isCashier && (
                    <button
                      onClick={() => handleNavigateView('settings')}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
                        currentView === 'settings'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-bold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                        <Settings className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-slate-900 dark:text-white">Settings & Preferences</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Currencies, receipt footer & sync</p>
                      </div>
                    </button>
                  )}

                  {/* Super Admin Command Center (if authorized) */}
                  {(user?.isSuperAdmin || isSuperAdmin || user?.email === 'osovoyoronogheneovo@gmail.com') && (
                    <button
                      onClick={() => handleNavigateView('admin')}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
                        currentView === 'admin'
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-slate-900 dark:text-white">Super Admin Portal</p>
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-400">Merchant control & broadcast alerts</p>
                      </div>
                    </button>
                  )}

                  {/* Export Logos Trigger */}
                  {onOpenLogoExportModal && (
                    <button
                      onClick={() => handleAction(onOpenLogoExportModal)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-slate-900 dark:text-white">Brand Assets & Logos</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Download high-res PNG/SVG icons</p>
                      </div>
                    </button>
                  )}
                </div>

                {/* Sign Out Section (Clear & Accessible) */}
                {onLogout && (
                  <div className="pt-1 mt-1 border-t border-slate-100 dark:border-slate-800 px-1">
                    <button
                      onClick={() => handleAction(onLogout)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xl transition-colors cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 flex items-center justify-center">
                        <LogOut className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-rose-700 dark:text-rose-300">Sign Out</p>
                        <p className="text-[10px] text-rose-500/80 dark:text-rose-400/80">Safely log out of MarketMate</p>
                      </div>
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

