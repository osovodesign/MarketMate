import React from 'react';
import {
  PlusCircle,
  ShoppingCart,
  Shield,
  Image as ImageIcon,
  Headphones,
} from 'lucide-react';
import { AppView } from '../../types';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useAuth } from '../../context/AuthContext';
import { isSuperAdminEmail } from '../../lib/adminConfig';
import { SocialMediaLinks } from '../common/SocialMediaLinks';
import { PWAInstallButton } from '../common/PWAInstallButton';
import {
  NAV_GROUPS,
  SHARED_NAV_ITEMS,
  isNavItemVisible,
  isNavItemActive,
} from '../../lib/navigationConfig';
import { hasPermission } from '../../lib/staffPermissions';

interface SidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onOpenAddSale: () => void;
  onOpenAddExpense: () => void;
  onOpenPricingCalculator?: () => void;
  onOpenProfitSimulator?: () => void;
  onOpenGoalsModal?: () => void;
  onOpenBackupModal?: () => void;
  onOpenFxModal?: () => void;
  onOpenStaffModal?: () => void;
  onOpenLogoExportModal?: () => void;
  onOpenReferralModal?: () => void;
  onOpenSupportModal?: () => void;
  businessName?: string;
  businessType?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  onOpenAddSale,
  onOpenAddExpense,
  onOpenLogoExportModal,
  onOpenSupportModal,
  businessName = 'My Business',
  businessType = 'Small Business',
}) => {
  const { debts, invoices, products, currentSession } = useBusinessData();
  const { user, isSuperAdmin, isSubscribed } = useAuth();

  const activeDebtorsCount = debts.filter((d) => d.status !== 'settled').length;
  const unpaidInvoicesCount = invoices.filter(
    (i) => i.type === 'invoice' && i.status !== 'paid' && i.status !== 'draft'
  ).length;
  const lowStockCount = products.filter(
    (p) =>
      p.stockQuantity !== undefined &&
      p.stockQuantity <= (p.lowStockThreshold ?? 5)
  ).length;

  const isCashier = currentSession?.currentRole === 'cashier';
  const canAddExpense = hasPermission(currentSession, 'canViewExpenses');

  const getBadgeCount = (badgeKey?: 'debts' | 'invoices' | 'lowStock'): number => {
    if (badgeKey === 'debts') return activeDebtorsCount;
    if (badgeKey === 'invoices') return unpaidInvoicesCount;
    if (badgeKey === 'lowStock') return lowStockCount;
    return 0;
  };

  return (
    <aside
      aria-label="Main navigation"
      className="hidden lg:flex flex-col w-64 border-r border-slate-800 bg-[#001A35] text-white shrink-0 sticky top-14 sm:top-16 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] overflow-y-auto z-20 transition-colors scrollbar-thin scrollbar-thumb-slate-700/60 scrollbar-track-transparent hover:scrollbar-thumb-slate-600"
    >
      {/* Business Profile Summary */}
      <div className="px-4 py-3.5 border-b border-slate-800 bg-[#082F4B]/90 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#059669] text-white font-bold text-xs flex items-center justify-center shrink-0">
            {businessName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-white truncate leading-tight">
                {businessName}
              </p>
              {isCashier && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-amber-950/90 text-amber-300 rounded border border-amber-700/70 shrink-0">
                  Cashier
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300 truncate leading-tight mt-0.5">
              {businessType}
            </p>
          </div>
        </div>
      </div>

      {/* Primary Quick Actions */}
      <div className="p-3.5 space-y-2 border-b border-slate-800 bg-[#001A35] shrink-0">
        <button
          onClick={onOpenAddSale}
          className="w-full flex items-center justify-center gap-2 bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold py-2.5 px-3 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
        >
          <PlusCircle className="w-4 h-4 shrink-0" />
          <span>Record Sale</span>
        </button>

        <div className={`grid ${canAddExpense && !isCashier ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
          <button
            onClick={() => onNavigate('pos')}
            className="flex items-center justify-center gap-1.5 bg-[#082F4B] hover:bg-[#0F2744] text-slate-100 border border-slate-700 text-xs font-semibold py-2 px-2.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-[#34D399] shrink-0" />
            <span>Checkout</span>
          </button>
          {canAddExpense && !isCashier && (
            <button
              onClick={onOpenAddExpense}
              className="flex items-center justify-center gap-1.5 bg-[#082F4B] hover:bg-[#0F2744] text-slate-100 border border-slate-700 text-xs font-semibold py-2 px-2.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Add Expense</span>
            </button>
          )}
        </div>
      </div>

      {/* Grouped Navigation Links from Single Source of Truth */}
      <nav className="flex-1 px-3 py-3 space-y-4">
        {NAV_GROUPS.map((group) => {
          const groupItems = SHARED_NAV_ITEMS.filter(
            (item) => item.group === group.id && isNavItemVisible(item, currentSession)
          );
          if (groupItems.length === 0) return null;

          return (
            <div key={group.id} className="space-y-0.5">
              <div className="px-3 pb-1 text-[11px] font-semibold text-slate-400 tracking-wide">
                {group.label}
              </div>
              {groupItems.map((item) => {
                const Icon = item.icon;
                const isActive = isNavItemActive(item, currentView);
                const badgeCount = getBadgeCount(item.badgeKey);

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === 'help-support' && onOpenSupportModal) {
                        onOpenSupportModal();
                      } else {
                        onNavigate(item.id);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer group ${
                      isActive
                        ? 'bg-[#059669] text-white font-semibold'
                        : 'text-slate-200 hover:text-white hover:bg-white/5 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive
                            ? 'text-white'
                            : 'text-slate-400 group-hover:text-slate-200'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
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

        {/* Super Admin Portal Link (Protected for Administrators Only) */}
        {(isSuperAdmin || isSuperAdminEmail(user?.email)) && (
          <div className="pt-2 border-t border-slate-800/80">
            <button
              onClick={() => onNavigate('admin')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                currentView === 'admin'
                  ? 'bg-[#059669] text-white'
                  : 'bg-[#059669]/20 text-[#34D399] border border-[#059669]/40 hover:bg-[#059669]/30'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 shrink-0" />
                <span>Admin Portal</span>
              </div>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#059669] text-white">
                Admin
              </span>
            </button>
          </div>
        )}
      </nav>

      {/* Footer Tray */}
      <div className="p-3 border-t border-slate-800 bg-[#082F4B]/90 space-y-2 text-slate-300 shrink-0">
        <PWAInstallButton variant="primary" className="w-full justify-center text-xs py-2" />

        <div className="flex items-center justify-between gap-2">
          {onOpenSupportModal && (
            <button
              onClick={onOpenSupportModal}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border border-slate-700/70 bg-[#082F4B] hover:bg-[#0F2744] text-slate-200 text-xs font-medium transition-colors cursor-pointer"
              title="Open Help & Support"
            >
              <Headphones className="w-3.5 h-3.5 text-[#34D399] shrink-0" />
              <span className="text-[11px] truncate">Help & Support</span>
            </button>
          )}
          {onOpenLogoExportModal && (
            <button
              onClick={onOpenLogoExportModal}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg border border-slate-700/60 bg-white/5 text-xs font-medium text-slate-200 hover:text-[#34D399] hover:bg-white/10 transition-colors cursor-pointer"
              title="Official MarketMate Logos"
            >
              <ImageIcon className="w-3.5 h-3.5 text-[#34D399] shrink-0" />
              <span className="text-[11px]">Logos</span>
            </button>
          )}
        </div>

        <div className="pt-1 text-slate-300 [&_a]:text-slate-300 [&_a:hover]:text-[#34D399] [&_a:hover]:bg-white/10">
          <SocialMediaLinks variant="sidebar" />
        </div>
      </div>
    </aside>
  );
};
