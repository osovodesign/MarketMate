import React from 'react';
import { Shield, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppView } from '../../types';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useAuth } from '../../context/AuthContext';
import { isSuperAdminEmail } from '../../lib/adminConfig';
import { MarketMateLogo } from '../common/MarketMateLogo';
import { SocialMediaLinks } from '../common/SocialMediaLinks';
import { PWAInstallButton } from '../common/PWAInstallButton';
import {
  NAV_GROUPS,
  SHARED_NAV_ITEMS,
  isNavItemVisible,
  isNavItemActive,
} from '../../lib/navigationConfig';

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
  onOpenSupportModal,
  businessName = 'My Business',
  businessType = 'Small Business',
}) => {
  const { debts, invoices, products, currentSession } = useBusinessData();
  const { user, isSuperAdmin, isDemoMode, isSubscribed } = useAuth();
  const isCashier = currentSession?.currentRole === 'cashier';

  const activeDebtorsCount = debts.filter((d) => d.status !== 'settled').length;
  const unpaidInvoicesCount = invoices.filter(
    (i) => i.type === 'invoice' && i.status !== 'paid' && i.status !== 'draft'
  ).length;
  const lowStockCount = products.filter(
    (p) =>
      p.stockQuantity !== undefined &&
      p.stockQuantity <= (p.lowStockThreshold ?? 5)
  ).length;

  const getBadgeCount = (badgeKey?: 'debts' | 'invoices' | 'lowStock'): number => {
    if (badgeKey === 'debts') return activeDebtorsCount;
    if (badgeKey === 'invoices') return unpaidInvoicesCount;
    if (badgeKey === 'lowStock') return lowStockCount;
    return 0;
  };

  const handleSelectView = (view: AppView) => {
    onClose();
    if (view === 'help-support' && onOpenSupportModal) {
      onOpenSupportModal();
    } else {
      onNavigate(view);
    }
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
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
          />

          {/* Slide-out Drawer Menu */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-80 max-w-[85vw] h-full bg-[#001A35] text-white border-r border-slate-800 flex flex-col z-50 shadow-2xl overflow-hidden"
          >
            {/* Header with Brand and Close Button */}
            <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-[#082F4B]/90">
              <button
                onClick={() => handleSelectView('dashboard')}
                className="flex items-center text-left focus:outline-none cursor-pointer"
              >
                <MarketMateLogo size="md" showSubtitle={true} variant="dark" />
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Business Summary */}
            <div className="px-4 py-3 border-b border-slate-800/80 bg-[#0F2744]/70 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#059669] text-white font-bold text-sm flex items-center justify-center shrink-0">
                {businessName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-white truncate leading-tight">
                    {businessName}
                  </p>
                  {isCashier && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-amber-950/90 text-amber-300 rounded border border-amber-700/70">
                      Cashier
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-300 truncate leading-tight mt-0.5">
                  {businessType}
                </p>
              </div>
            </div>

            {/* PWA Install Trigger */}
            <div className="px-4 py-2 border-b border-slate-800/80 bg-[#064E3B]/20">
              <PWAInstallButton variant="primary" className="w-full justify-center text-xs py-2" />
            </div>

            {/* Shared Grouped Navigation Sections */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {NAV_GROUPS.map((group) => {
                const groupItems = SHARED_NAV_ITEMS.filter(
                  (item) => item.group === group.id && isNavItemVisible(item, currentSession)
                );
                if (groupItems.length === 0) return null;

                return (
                  <div key={group.id} className="space-y-0.5">
                    <p className="px-2 pb-1 text-[11px] font-semibold text-slate-400 tracking-wide">
                      {group.label}
                    </p>
                    {groupItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = isNavItemActive(item, currentView);
                      const badgeCount = getBadgeCount(item.badgeKey);

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectView(item.id)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-colors cursor-pointer group ${
                            isActive
                              ? 'bg-[#059669] text-white font-semibold'
                              : 'text-slate-200 hover:text-white hover:bg-white/5 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Icon
                              className={`w-4 h-4 shrink-0 transition-colors ${
                                isActive
                                  ? 'text-white'
                                  : 'text-slate-400 group-hover:text-slate-200'
                              }`}
                            />
                            <span className="truncate text-left">{item.label}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            {badgeCount > 0 && (
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md tabular-nums ${
                                  isActive
                                    ? 'bg-white/20 text-white'
                                    : item.badgeKey === 'debts'
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                    : item.badgeKey === 'lowStock'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    : 'bg-[#064E3B] text-[#34D399] border border-[#059669]/40'
                                }`}
                              >
                                {badgeCount}
                              </span>
                            )}
                            {item.isPro && !isSubscribed && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-950/90 text-amber-300 border border-amber-700/70">
                                Pro
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}

              {/* Super Admin Link (Protected for Administrators Only) */}
              {(isSuperAdmin || isSuperAdminEmail(user?.email)) && (
                <div className="pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => handleSelectView('admin')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      currentView === 'admin'
                        ? 'bg-[#059669] text-white'
                        : 'bg-[#059669]/20 text-[#34D399] border border-[#059669]/40 hover:bg-[#059669]/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Shield className="w-4 h-4 shrink-0" />
                      <span>Admin Portal</span>
                    </div>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#059669] text-white">
                      Admin
                    </span>
                  </button>
                </div>
              )}

              {/* Official Community Links */}
              <div className="pt-2 px-1 text-slate-300 [&_a]:text-slate-300 [&_a:hover]:text-[#34D399] [&_a:hover]:bg-white/10">
                <p className="text-[11px] font-semibold text-slate-400 mb-1.5">
                  Community
                </p>
                <SocialMediaLinks variant="sidebar" />
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-800 bg-[#082F4B]/90 flex items-center justify-between text-[11px] text-slate-300">
              <span className="font-medium">MarketMate</span>
              <span className="text-[11px] text-[#34D399] font-semibold">
                {isDemoMode ? 'Demo Account' : isSubscribed ? 'Pro Active' : 'Free Plan'}
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
