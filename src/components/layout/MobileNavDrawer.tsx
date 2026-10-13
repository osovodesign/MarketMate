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
import { PWAInstallButton } from '../common/PWAInstallButton';

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

          {/* Slide-out Drawer Menu (MarketMate Deep Midnight Navy Theme) */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 260 }}
            className="relative w-80 max-w-[85vw] h-full bg-[#001A35] text-white border-r border-slate-800 flex flex-col z-50 shadow-2xl overflow-hidden"
          >
            {/* Header with Brand and Close Button */}
            <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-[#082F4B]/90 backdrop-blur-xs">
              <button
                onClick={() => handleSelectView('dashboard')}
                className="flex items-center text-left focus:outline-none cursor-pointer"
              >
                <MarketMateLogo size="md" showSubtitle={true} variant="dark" />
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close navigation drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Business Badge */}
            <div className="px-4 py-3 border-b border-slate-800/80 bg-[#0F2744]/70 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#059669] text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                {businessName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-white truncate leading-tight">
                    {businessName}
                  </p>
                  {isCashier && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-950/90 text-amber-300 rounded border border-amber-700/70">
                      Cashier
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-300 truncate leading-tight mt-0.5">
                  {businessType}
                </p>
              </div>
            </div>

            {/* PWA Mobile 1-Tap App Install Trigger */}
            <div className="px-4 py-2 border-b border-slate-800/80 bg-[#064E3B]/20">
              <PWAInstallButton variant="primary" className="w-full justify-center text-xs py-2 shadow-xs" />
            </div>

            {/* Scrollable Navigation Sections */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* Core Operations */}
              <div>
                <p className="px-2 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
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
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer group ${
                            isActive
                              ? 'bg-[#059669]/20 text-[#34D399] font-bold border border-[#059669]/60 shadow-[0_0_12px_rgba(5,150,105,0.25)]'
                              : 'text-slate-200 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon
                              className={`w-4 h-4 shrink-0 transition-colors ${
                                isActive
                                  ? 'text-[#34D399]'
                                  : 'text-slate-400 group-hover:text-slate-200'
                              }`}
                            />
                            <span>{item.label}</span>
                          </div>
                          {item.isPro && !isSubscribed && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-950/90 text-amber-300 border border-amber-700/70">
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
                <p className="px-2 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
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
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer group ${
                            isActive
                              ? 'bg-[#059669]/20 text-[#34D399] font-bold border border-[#059669]/60 shadow-[0_0_12px_rgba(5,150,105,0.25)]'
                              : 'text-slate-200 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon
                              className={`w-4 h-4 shrink-0 transition-colors ${
                                isActive
                                  ? 'text-[#34D399]'
                                  : 'text-slate-400 group-hover:text-slate-200'
                              }`}
                            />
                            <span className="text-left">{item.label}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {item.badge !== undefined && item.badge > 0 && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                {item.badge}
                              </span>
                            )}
                            {item.isPro && !isSubscribed && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-950/90 text-amber-300 border border-amber-700/70">
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
                <p className="px-2 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Smart Financial Calculators
                </p>
                <div className="space-y-0.5">
                  {onOpenPricingCalculator && (
                    <button
                      onClick={() => handleOpenTool(onOpenPricingCalculator)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-200 hover:text-white hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <Calculator className="w-4 h-4 text-[#34D399]" />
                        <span>Interactive Pricing Calculator</span>
                      </div>
                      {!isSubscribed && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-950/90 text-amber-300 border border-amber-700/70">
                          PRO
                        </span>
                      )}
                    </button>
                  )}

                  {onOpenProfitSimulator && (
                    <button
                      onClick={() => handleOpenTool(onOpenProfitSimulator)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-200 hover:text-white hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <Sliders className="w-4 h-4 text-amber-400" />
                        <span>Profit Stress-Test Simulator</span>
                      </div>
                      {!isSubscribed && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-950/90 text-amber-300 border border-amber-700/70">
                          PRO
                        </span>
                      )}
                    </button>
                  )}

                  {onOpenGoalsModal && (
                    <button
                      onClick={() => handleOpenTool(onOpenGoalsModal)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-200 hover:text-white hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <Target className="w-4 h-4 text-[#34D399]" />
                        <span>Financial Goals & Targets</span>
                      </div>
                      {!isSubscribed && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-950/90 text-amber-300 border border-amber-700/70">
                          PRO
                        </span>
                      )}
                    </button>
                  )}

                  {onOpenFxModal && (
                    <button
                      onClick={() => handleOpenTool(onOpenFxModal)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-200 hover:text-white hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <Ship className="w-4 h-4 text-blue-400" />
                        <span>FX & Landed Cost Import</span>
                      </div>
                      {!isSubscribed && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-950/90 text-amber-300 border border-amber-700/70">
                          PRO
                        </span>
                      )}
                    </button>
                  )}

                  {onOpenStaffModal && (
                    <button
                      onClick={() => handleOpenTool(onOpenStaffModal)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-200 hover:text-white hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <Shield className="w-4 h-4 text-purple-400" />
                        <span>Staff Roles & Cashier PINs</span>
                      </div>
                      {!isSubscribed && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-950/90 text-amber-300 border border-amber-700/70">
                          PRO
                        </span>
                      )}
                    </button>
                  )}

                  {onOpenBackupModal && (
                    <button
                      onClick={() => handleOpenTool(onOpenBackupModal)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-200 hover:text-white hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <Database className="w-4 h-4 text-slate-400" />
                        <span>Encrypted Data Vault & Backup</span>
                      </div>
                      {!isSubscribed && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-950/90 text-amber-300 border border-amber-700/70">
                          PRO
                        </span>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* AI & Preferences */}
              <div>
                <p className="px-2 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
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
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer group ${
                            isActive
                              ? 'bg-[#059669]/20 text-[#34D399] font-bold border border-[#059669]/60 shadow-[0_0_12px_rgba(5,150,105,0.25)]'
                              : 'text-slate-200 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon
                              className={`w-4 h-4 shrink-0 transition-colors ${
                                isActive
                                  ? 'text-[#34D399]'
                                  : 'text-slate-400 group-hover:text-slate-200'
                              }`}
                            />
                            <span>{item.label}</span>
                          </div>
                          {item.isPro && !isSubscribed && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-950/90 text-amber-300 border border-amber-700/70">
                              PRO
                            </span>
                          )}
                        </button>
                      );
                    })}

                  {onOpenReferralModal && (
                    <button
                      onClick={() => handleOpenTool(onOpenReferralModal)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-[#34D399] bg-[#059669]/20 border border-[#059669]/40 hover:bg-[#059669]/30 transition-colors cursor-pointer mt-1 shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <Gift className="w-4 h-4 text-[#34D399]" />
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
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-200 bg-[#082F4B] hover:bg-[#0F2744] border border-slate-700/70 transition-colors cursor-pointer mt-1"
                    >
                      <div className="flex items-center gap-3">
                        <Headphones className="w-4 h-4 text-[#34D399]" />
                        <span className="font-bold">Contact Admin & Support</span>
                      </div>
                      <span className="text-[9px] bg-[#059669] text-[#FEFEFE] px-1.5 py-0.5 rounded font-bold">
                        WhatsApp
                      </span>
                    </button>
                  )}
                </div>

                {/* Official Community Handles */}
                <div className="pt-2 px-1 text-slate-300 [&_a]:text-slate-300 [&_a:hover]:text-[#34D399] [&_a:hover]:bg-white/10">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Official Community
                  </p>
                  <SocialMediaLinks variant="sidebar" />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-800 bg-[#082F4B]/90 flex items-center justify-between text-[11px] text-slate-300">
              <span className="font-medium">MarketMate™ • Financial OS</span>
              <span className="text-[10px] bg-[#064E3B] text-[#34D399] px-2 py-0.5 rounded-full font-bold border border-[#059669]/40">
                {isDemoMode ? 'Demo Pro Unlocked' : isSubscribed ? 'Pro Active' : 'Free Tier'}
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
