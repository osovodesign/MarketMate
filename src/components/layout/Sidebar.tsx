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
} from 'lucide-react';
import { AppView } from '../../types';
import { useBusinessData } from '../../context/BusinessDataContext';
import { MarketMateLogo } from '../common/MarketMateLogo';

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
  businessName = 'My Business',
  businessType = 'Micro Enterprise',
}) => {
  const { debts, invoices, currentSession, staffList } = useBusinessData();
  const activeDebtorsCount = debts.filter((d) => d.status !== 'settled').length;
  const unpaidInvoicesCount = invoices.filter(
    (i) => i.type === 'invoice' && i.status !== 'paid' && i.status !== 'draft'
  ).length;

  const isCashier = currentSession.currentRole === 'cashier';

  const navItems: { id: AppView; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number; hideForCashier?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'POS Register Terminal', icon: ShoppingCart },
    { id: 'sales', label: 'Sales Records', icon: TrendingUp },
    { id: 'expenses', label: 'Expenses & Costs', icon: Receipt, hideForCashier: isCashier },
    { id: 'invoices', label: 'Invoices & Quotes', icon: FileText, badge: unpaidInvoicesCount },
    { id: 'contacts', label: 'Contacts & CRM', icon: BookUser },
    { id: 'debts', label: 'Debt & Credit Book', icon: Users, badge: activeDebtorsCount },
    { id: 'products', label: 'Catalog & Inventory', icon: Package },
    { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
    { id: 'reports', label: 'Reports & P&L', icon: BarChart3, hideForCashier: isCashier },
    { id: 'ai', label: 'MarketMate AI', icon: Bot },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-screen shrink-0 sticky top-0 h-screen z-30 transition-colors">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center text-left focus:outline-none group cursor-pointer"
        >
          <MarketMateLogo size="md" showSubtitle={true} />
        </button>
      </div>

      {/* Business Switcher / Profile Badge */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold text-xs flex items-center justify-center shrink-0 border border-emerald-200/60 dark:border-emerald-800/60">
            {businessName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate leading-tight">{businessName}</p>
              {isCashier && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded border border-amber-200/60 dark:border-amber-800/60">
                  Cashier
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate leading-tight">{businessType}</p>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="p-3.5 space-y-2 border-b border-slate-100 dark:border-slate-800">
        <button
          onClick={() => onNavigate('pos')}
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-3 rounded-lg shadow-2xs transition-colors cursor-pointer"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Launch POS Register</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onOpenAddSale}
            className="flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 text-xs font-semibold py-2 px-2.5 rounded-lg transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Sale</span>
          </button>
          {!isCashier && (
            <button
              onClick={onOpenAddExpense}
              className="flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-800 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/80 text-xs font-semibold py-2 px-2.5 rounded-lg transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Expense</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        <div className="px-3 pb-1.5 pt-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
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
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-semibold border-l-3 border-emerald-600 dark:border-emerald-500 shadow-2xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      item.id === 'debts'
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

        {/* Business Tools Section */}
        <div className="px-3 pb-1 pt-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Smart Tools
        </div>

        {onOpenFxModal && (
          <button
            onClick={onOpenFxModal}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Ship className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>FX & Landed Cost Import</span>
            </div>
          </button>
        )}

        {onOpenStaffModal && (
          <button
            onClick={onOpenStaffModal}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Staff & Cashier PINs</span>
            </div>
          </button>
        )}

        {onOpenGoalsModal && (
          <button
            onClick={onOpenGoalsModal}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Financial Goals & Targets</span>
            </div>
          </button>
        )}

        {onOpenPricingCalculator && (
          <button
            onClick={onOpenPricingCalculator}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Pricing Calculator</span>
            </div>
          </button>
        )}

        {onOpenProfitSimulator && (
          <button
            onClick={onOpenProfitSimulator}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Sliders className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Profit Simulator</span>
            </div>
          </button>
        )}

        {onOpenBackupModal && (
          <button
            onClick={onOpenBackupModal}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>Backup & Restore Vault</span>
            </div>
          </button>
        )}
      </nav>

      {/* Footer Support & Brand Tray */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2">
        <div className="flex items-center justify-between gap-2">
          {/* Export Brand Logo Trigger */}
          {onOpenLogoExportModal && (
            <button
              onClick={onOpenLogoExportModal}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:text-emerald-700 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Export & Download MarketMate Official Logos"
            >
              <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[11px]">Brand Assets</span>
            </button>
          )}
        </div>

        <div className="text-center text-[10px] text-slate-400">
          <p className="font-medium text-slate-500">MarketMate • Financial OS</p>
        </div>
      </div>
    </aside>
  );
};
