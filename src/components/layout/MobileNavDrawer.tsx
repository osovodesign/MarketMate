import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  TrendingUp,
  Receipt,
  FileText,
  BookUser,
  Users,
  Package,
  ArrowLeftRight,
  BarChart3,
  Bot,
  Settings,
  Ship,
  Shield,
  Target,
  Calculator,
  Sliders,
  Database,
  X,
  Sparkles,
  Gift,
  Headphones,
  MessageCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppView } from '../../types';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useAuth } from '../../context/AuthContext';
import { MarketMateLogo } from '../common/MarketMateLogo';
import { SUPPORT_CONFIG } from '../../lib/adminConfig';
import { SocialMediaLinks } from '../common/SocialMediaLinks';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onOpenPricingCalculator?: () => void;
  onOpenProfitSimulator?: () => void;
  onOpenGoalsModal?: () => void;
  onOpenBackupModal?: () => void;
  onOpenFxModal?: () => void;
  onOpenStaffModal?: () => void;
  onOpenReferralModal?: () => void;
  onOpenSupportModal?: () => void;
  businessName?: string;
  businessType?: string;
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({
  isOpen,
  onClose,
  currentView,
  onNavigate,
  onOpenPricingCalculator,
  onOpenProfitSimulator,
  onOpenGoalsModal,
  onOpenBackupModal,
  onOpenFxModal,
  onOpenStaffModal,
  onOpenReferralModal,
  onOpenSupportModal,
  businessName = 'My Business',
  businessType = 'Retail Enterprise',
}) => {
  const { debts, invoices, currentSession } = useBusinessData();
  const { user, business, isSuperAdmin, isDemoMode, isSubscribed } = useAuth();
  const isCashier = currentSession.currentRole === 'cashier';

  const activeDebtorsCount = debts.filter((d) => d.status !== 'settled').length;
  const unpaidInvoicesCount = invoices.filter(
    (i) => i.type === 'invoice' && i.status !== 'paid' && i.status !== 'draft'
  ).length;

  const navItems: {
    id: AppView;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
    hideForCashier?: boolean;
    isPro?: boolean;
    category: 'core' | 'finance' | 'tools';
  }[] = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard, category: 'core' },
    { id: 'pos', label: 'POS Register & Scanner', icon: ShoppingCart, category: 'core' },
    { id: 'sales', label: 'Sales Records', icon: TrendingUp, category: 'core' },
    { id: 'expenses', label: 'Expenses & Overhead', icon: Receipt, hideForCashier: isCashier, category: 'core' },
    { id: 'products', label: 'Catalog & Stock Inventory', icon: Package, isPro: true, category: 'core' },

    { id: 'debts', label: 'Customer Debt Book (Credit)', icon: Users, badge: activeDebtorsCount, isPro: true, category: 'finance' },
    { id: 'invoices', label: 'Invoices & Official Quotes', icon: FileText, badge: unpaidInvoicesCount, isPro: true, category: 'finance' },
    { id: 'reports', label: 'Reports & Profit & Loss (P&L)', icon: BarChart3, hideForCashier: isCashier, isPro: true, category: 'finance' },
    { id: 'transactions', label: 'Transactions Ledger (Full Audit)', icon: ArrowLeftRight, category: 'finance' },
    { id: 'contacts', label: 'Contacts CRM & Suppliers', icon: BookUser, isPro: true, category: 'finance' },

    { id: 'staff', label: 'Staff & Team Access', icon: Shield, isPro: true, category: 'tools' },
    { id: 'ai', label: 'MarketMate AI Advisor', icon: Bot, isPro: true, category: 'tools' },
    { id: 'settings', label: 'Business Settings & Profile', icon: Settings, hideForCashier: isCashier, category: 'tools' },
  ];

  const handleSelectView = (view: AppView) => {
    onClose();
    onNavigate(view);
  };

  const handleOpenTool = (fn?: () => void) => {
    onClose();
    if (fn) fn();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
          />

          {/* Slide-out Drawer Menu */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 260 }}
            className="relative w-80 max-w-[85vw] h-full bg-[#FEFEFE] dark:bg-[#001A35] border-r border-slate-200 dark:border-slate-800 flex flex-col z-50 shadow-2xl overflow-hidden"
          >
            {/* Header with Brand and Close Button */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/40">
              <button
                onClick={() => handleSelectView('dashboard')}
                className="flex items-center text-left focus:outline-none cursor-pointer"
              >
                <MarketMateLogo size="md" showSubtitle={true} />
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close navigation drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Business Badge */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#059669] text-[#FEFEFE] font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                {businessName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight">
                    {businessName}
                  </p>
                  {isCashier && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded border border-amber-200 dark:border-amber-800">
                      Cashier
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate leading-tight mt-0.5">
                  {businessType}
                </p>
              </div>
            </div>

            {/* Scrollable Navigation Sections */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* Core Operations */}
              <div>
                <p className="px-2 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Core Management
                </p>
                <div className="space-y-0.5">
                  {navItems
                    .filter((item) => item.category === 'core' && !item.hideForCashier)
                    .map((item) => {
                      const Icon = item.icon;
                      const isActive = currentView === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectView(item.id)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-[#ECFDF5] dark:bg-[#064E3B]/40 text-[#059669] dark:text-[#34D399] font-bold border border-[#059669]/30 shadow-2xs'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon
                              className={`w-4 h-4 ${
                                isActive
                                  ? 'text-[#059669] dark:text-[#34D399]'
                                  : 'text-slate-500 dark:text-slate-400'
                              }`}
                            />
                            <span>{item.label}</span>
                          </div>
                          {item.isPro && !isSubscribed && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60">
                              PRO
                            </span>
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Financial Records, Ledger & P&L */}
              <div>
                <p className="px-2 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Financial Records & Books
                </p>
                <div className="space-y-0.5">
                  {navItems
                    .filter((item) => item.category === 'finance' && !item.hideForCashier)
                    .map((item) => {
                      const Icon = item.icon;
                      const isActive = currentView === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectView(item.id)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-[#ECFDF5] dark:bg-[#064E3B]/40 text-[#059669] dark:text-[#34D399] font-bold border border-[#059669]/30 shadow-2xs'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon
                              className={`w-4 h-4 ${
                                isActive
                                  ? 'text-[#059669] dark:text-[#34D399]'
                                  : 'text-slate-500 dark:text-slate-400'
                              }`}
                            />
                            <span className="text-left">{item.label}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {item.badge !== undefined && item.badge > 0 && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                {item.badge}
                              </span>
                            )}
                            {item.isPro && !isSubscribed && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60">
                                PRO
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Smart Financial Tools */}
              <div>
                <p className="px-2 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Smart Financial Calculators
                </p>
                <div className="space-y-0.5">
                  {onOpenPricingCalculator && (
                    <button
                      onClick={() => handleOpenTool(onOpenPricingCalculator)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Calculator className="w-4 h-4 text-[#059669] dark:text-[#34D399]" />
                        <span>Interactive Pricing Calculator</span>
                      </div>
                      {!isSubscribed && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60">
                          PRO
                        </span>
                      )}
                    </button>
                  )}

                  {onOpenProfitSimulator && (
                    <button
                      onClick={() => handleOpenTool(onOpenProfitSimulator)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Sliders className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span>Profit Stress-Test Simulator</span>
                      </div>
                      {!isSubscribed && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60">
                          PRO
                        </span>
                      )}
                    </button>
                  )}

                  {onOpenGoalsModal && (
                    <button
                      onClick={() => handleOpenTool(onOpenGoalsModal)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Target className="w-4 h-4 text-[#059669] dark:text-[#34D399]" />
                        <span>Financial Goals & Targets</span>
                      </div>
                      {!isSubscribed && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60">
                          PRO
                        </span>
                      )}
                    </button>
                  )}

                  {onOpenFxModal && (
                    <button
                      onClick={() => handleOpenTool(onOpenFxModal)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Ship className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>FX & Landed Cost Import</span>
                      </div>
                      {!isSubscribed && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60">
                          PRO
                        </span>
                      )}
                    </button>
                  )}

                  {onOpenStaffModal && (
                    <button
                      onClick={() => handleOpenTool(onOpenStaffModal)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span>Staff Roles & Cashier PINs</span>
                      </div>
                      {!isSubscribed && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60">
                          PRO
                        </span>
                      )}
                    </button>
                  )}

                  {onOpenBackupModal && (
                    <button
                      onClick={() => handleOpenTool(onOpenBackupModal)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Database className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <span>Encrypted Data Vault & Backup</span>
                      </div>
                      {!isSubscribed && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60">
                          PRO
                        </span>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* AI & Preferences */}
              <div>
                <p className="px-2 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Intelligence & Preferences
                </p>
                <div className="space-y-0.5">
                  {navItems
                    .filter((item) => item.category === 'tools' && !item.hideForCashier)
                    .map((item) => {
                      const Icon = item.icon;
                      const isActive = currentView === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectView(item.id)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-[#ECFDF5] dark:bg-[#064E3B]/40 text-[#059669] dark:text-[#34D399] font-bold border border-[#059669]/30 shadow-2xs'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon
                              className={`w-4 h-4 ${
                                isActive
                                  ? 'text-[#059669] dark:text-[#34D399]'
                                  : 'text-slate-500 dark:text-slate-400'
                              }`}
                            />
                            <span>{item.label}</span>
                          </div>
                          {item.isPro && !isSubscribed && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60">
                              PRO
                            </span>
                          )}
                        </button>
                      );
                    })}

                  {onOpenReferralModal && (
                    <button
                      onClick={() => handleOpenTool(onOpenReferralModal)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-900 dark:text-white bg-[#ECFDF5] dark:bg-[#064E3B]/40 border border-[#059669]/25 hover:bg-[#D1FAE5] dark:hover:bg-[#064E3B]/70 transition-colors cursor-pointer mt-1"
                    >
                      <div className="flex items-center gap-3">
                        <Gift className="w-4 h-4 text-[#059669] dark:text-[#34D399]" />
                        <span className="font-bold">Refer & Earn 5% Off</span>
                      </div>
                      <span className="text-[9px] bg-[#059669] text-[#FEFEFE] px-1.5 py-0.5 rounded font-bold">
                        5%
                      </span>
                    </button>
                  )}

                  {onOpenSupportModal && (
                    <button
                      onClick={() => handleOpenTool(onOpenSupportModal)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer mt-1"
                    >
                      <div className="flex items-center gap-3">
                        <Headphones className="w-4 h-4 text-[#059669] dark:text-[#34D399]" />
                        <span className="font-bold">Contact Admin & Support</span>
                      </div>
                      <span className="text-[9px] bg-[#059669] text-[#FEFEFE] px-1.5 py-0.5 rounded font-bold">
                        WhatsApp
                      </span>
                    </button>
                  )}
                </div>

                {/* Official Community Handles */}
                <div className="pt-2 px-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                    Official Community
                  </p>
                  <SocialMediaLinks variant="sidebar" />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="font-medium">MarketMate™ • Financial OS</span>
              <span className="text-[10px] bg-[#ECFDF5] text-[#059669] dark:bg-[#064E3B] dark:text-[#34D399] px-2 py-0.5 rounded-full font-bold border border-[#059669]/20">
                {isDemoMode ? 'Demo Pro Unlocked' : isSubscribed ? 'Pro Active' : 'Free Tier'}
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
