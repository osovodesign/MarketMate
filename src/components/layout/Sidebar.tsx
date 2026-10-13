import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  TrendingUp,
  Receipt,
  Package,
  Users,
  ArrowLeftRight,
  BarChart3,
  Bot,
  Settings,
  PlusCircle,
  Sparkles,
  Calculator,
  Sliders,
  Target,
  Database,
  FileText,
  BookUser,
  Ship,
  Shield,
  Image as ImageIcon,
  Gift,
  Headphones,
} from 'lucide-react';
import { AppView } from '../../types';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useAuth } from '../../context/AuthContext';
import { isSuperAdminEmail } from '../../lib/adminConfig';
import { SocialMediaLinks } from '../common/SocialMediaLinks';
import { PWAInstallButton } from '../common/PWAInstallButton';

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
  onOpenPricingCalculator,
  onOpenProfitSimulator,
  onOpenGoalsModal,
  onOpenBackupModal,
  onOpenFxModal,
  onOpenStaffModal,
  onOpenLogoExportModal,
  onOpenReferralModal,
  onOpenSupportModal,
  businessName = 'My Business',
  businessType = 'Micro Enterprise',
}) => {
  const { debts, invoices, currentSession, staffList } = useBusinessData();
  const { user, business, isSuperAdmin, isDemoMode, isSubscribed } = useAuth();
  const activeDebtorsCount = debts.filter((d) => d.status !== 'settled').length;
  const unpaidInvoicesCount = invoices.filter(
    (i) => i.type === 'invoice' && i.status !== 'paid' && i.status !== 'draft'
  ).length;

  const isCashier = currentSession.currentRole === 'cashier';

  const navItems: {
    id: AppView;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    hideForCashier?: boolean;
    isPro?: boolean;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'POS Register Terminal', icon: ShoppingCart },
    { id: 'sales', label: 'Sales Records', icon: TrendingUp },
    { id: 'expenses', label: 'Expenses & Costs', icon: Receipt, hideForCashier: isCashier },
    { id: 'invoices', label: 'Invoices & Quotes', icon: FileText, badge: unpaidInvoicesCount, isPro: true },
    { id: 'contacts', label: 'Contacts & CRM', icon: BookUser, isPro: true },
    { id: 'debts', label: 'Debt & Credit Book', icon: Users, badge: activeDebtorsCount, isPro: true },
    { id: 'products', label: 'Catalog & Inventory', icon: Package, isPro: true },
    { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
    { id: 'reports', label: 'Reports & P&L', icon: BarChart3, hideForCashier: isCashier, isPro: true },
    { id: 'staff', label: 'Staff & Team Access', icon: Shield, isPro: true },
    { id: 'ai', label: 'MarketMate AI', icon: Bot, isPro: true },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-slate-800 bg-[#001A35] text-white shrink-0 sticky top-14 sm:top-16 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] overflow-y-auto z-20 transition-colors scrollbar-thin scrollbar-thumb-slate-700/60 scrollbar-track-transparent hover:scrollbar-thumb-slate-600">
      {/* Business Switcher / Profile Badge */}
      <div className="px-4 py-3.5 border-b border-slate-800 bg-[#082F4B]/90 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#059669] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
            {businessName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-white truncate leading-tight">{businessName}</p>
              {isCashier && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-950/90 text-amber-300 rounded border border-amber-700/70 shrink-0">
                  Cashier
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300 truncate leading-tight mt-0.5">{businessType}</p>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="p-3.5 space-y-2 border-b border-slate-800 bg-[#001A35] shrink-0">
        <button
          onClick={() => onNavigate('pos')}
          className="w-full flex items-center justify-center gap-2 bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold py-2.5 px-3 rounded-xl shadow-2xs transition-colors cursor-pointer"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Launch POS Register</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onOpenAddSale}
            className="flex items-center justify-center gap-1.5 bg-[#059669]/20 hover:bg-[#059669]/30 text-[#34D399] border border-[#059669]/40 text-xs font-semibold py-2 px-2.5 rounded-lg transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#34D399]" />
            <span>Add Sale</span>
          </button>
          {!isCashier && (
            <button
              onClick={onOpenAddExpense}
              className="flex items-center justify-center gap-1.5 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/80 text-xs font-semibold py-2 px-2.5 rounded-lg transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Expense</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        <div className="px-3 pb-1.5 pt-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
          Main Menu
        </div>
        {navItems
          .filter((item) => !item.hideForCashier)
          .map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer group ${
                  isActive
                    ? 'bg-[#059669]/20 text-[#34D399] font-bold border border-[#059669]/60 shadow-[0_0_12px_rgba(5,150,105,0.25)]'
                    : 'text-slate-200 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#34D399]' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        item.id === 'debts'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-[#064E3B] text-[#34D399] border border-[#059669]/40'
                      }`}
                    >
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

        {/* Business Tools Section */}
        <div className="px-3 pb-1 pt-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
          Smart Tools
        </div>

        {onOpenFxModal && (
          <button
            onClick={onOpenFxModal}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-200 hover:text-white hover:bg-white/5 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
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
            onClick={onOpenStaffModal}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-200 hover:text-white hover:bg-white/5 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-purple-400" />
              <span>Staff & Cashier PINs</span>
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
            onClick={onOpenGoalsModal}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-200 hover:text-white hover:bg-white/5 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
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

        {onOpenPricingCalculator && (
          <button
            onClick={onOpenPricingCalculator}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-200 hover:text-white hover:bg-white/5 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <Calculator className="w-4 h-4 text-[#34D399]" />
              <span>Pricing Calculator</span>
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
            onClick={onOpenProfitSimulator}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-200 hover:text-white hover:bg-white/5 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Profit Simulator</span>
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
            onClick={onOpenBackupModal}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-slate-200 hover:text-white hover:bg-white/5 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-slate-400" />
              <span>Backup & Restore Vault</span>
            </div>
            {!isSubscribed && (
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-950/90 text-amber-300 border border-amber-700/70">
                PRO
              </span>
            )}
          </button>
        )}

        {/* Refer & Earn 5% Off Campaign Trigger */}
        {onOpenReferralModal && (
          <button
            onClick={onOpenReferralModal}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-[#34D399] bg-[#059669]/20 border border-[#059669]/40 hover:bg-[#059669]/30 transition-all cursor-pointer shadow-2xs group"
          >
            <div className="flex items-center gap-2.5">
              <Gift className="w-4 h-4 text-[#34D399] group-hover:scale-110 transition-transform" />
              <span>Refer & Earn 5%</span>
            </div>
            <span className="px-1.5 py-0.5 rounded font-bold text-[10px] bg-[#059669] text-white">
              5% Off
            </span>
          </button>
        )}

        {/* Super Admin Owner Link */}
        {(isSuperAdmin || isSuperAdminEmail(user?.email)) && (
          <div className="pt-2">
            <button
              onClick={() => onNavigate('admin')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                currentView === 'admin'
                  ? 'bg-[#059669] text-white shadow-xs'
                  : 'bg-[#059669]/20 text-[#34D399] border border-[#059669]/40 hover:bg-[#059669]/30'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-[#34D399]" />
                <span>Owner Admin Portal</span>
              </div>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#059669] text-white">
                Owner
              </span>
            </button>
          </div>
        )}
      </nav>

      {/* Footer Support & Brand Tray */}
      <div className="p-3 border-t border-slate-800 bg-[#082F4B]/90 space-y-2 text-slate-300 shrink-0">
        {/* PWA Install Trigger */}
        <PWAInstallButton variant="primary" className="w-full justify-center text-xs py-2 shadow-xs" />

        {/* Help & Support Desk Trigger */}
        {onOpenSupportModal && (
          <button
            onClick={onOpenSupportModal}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-slate-700/70 bg-[#082F4B] hover:bg-[#0F2744] text-slate-200 text-xs font-semibold transition-colors cursor-pointer shadow-2xs group"
            title="Chat with MarketMate Admin on WhatsApp or Submit Inquiry"
          >
            <div className="flex items-center gap-2">
              <Headphones className="w-3.5 h-3.5 text-[#34D399] group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold">Help & Support Desk</span>
            </div>
            <span className="text-[9px] font-bold px-1.5 py-0.2 bg-[#059669] text-white rounded">
              WhatsApp
            </span>
          </button>
        )}

        <div className="flex items-center justify-between gap-2">
          {/* Export Brand Logo Trigger */}
          {onOpenLogoExportModal && (
            <button
              onClick={onOpenLogoExportModal}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border border-slate-700/60 bg-white/5 text-xs font-medium text-slate-200 hover:text-[#34D399] hover:bg-white/10 transition-colors cursor-pointer"
              title="Export & Download MarketMate Official Logos"
            >
              <ImageIcon className="w-3.5 h-3.5 text-[#34D399]" />
              <span className="text-[11px]">Brand Assets</span>
            </button>
          )}
        </div>

        {/* Official Channels Quick Strip */}
        <div className="pt-1 text-slate-300 [&_a]:text-slate-300 [&_a:hover]:text-[#34D399] [&_a:hover]:bg-white/10">
          <SocialMediaLinks variant="sidebar" />
        </div>

        <div className="text-center text-[10px] text-slate-400">
          <p className="font-medium">MarketMate™ • Financial OS</p>
        </div>
      </div>
    </aside>
  );
};
