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
} from 'lucide-react';
import { AppView } from '../../types';
import { useBusinessData } from '../../context/BusinessDataContext';

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
    <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200 bg-white min-h-screen shrink-0 sticky top-0 h-screen z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2.5 text-left focus:outline-none group"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:bg-emerald-800 transition-colors">
            M
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 text-base tracking-tight leading-none">MarketMate</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 leading-none">
                V1
              </span>
            </div>
            <span className="text-xs text-slate-500 font-normal leading-tight block mt-0.5">Know Your Numbers</span>
          </div>
        </button>
      </div>

      {/* Business Switcher / Profile Badge */}
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-semibold text-xs flex items-center justify-center shrink-0">
            {businessName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-slate-900 truncate leading-tight">{businessName}</p>
              {isCashier && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded">
                  Cashier
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 truncate leading-tight">{businessType}</p>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="p-3.5 space-y-2 border-b border-slate-100">
        <button
          onClick={() => onNavigate('pos')}
          className="w-full flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2.5 px-3 rounded-lg shadow-2xs transition-colors"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Launch POS Register</span>
        </button>
        <button
          onClick={onOpenAddSale}
          className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold py-2 px-3 rounded-lg transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5 text-emerald-700" />
          <span>+ Quick Sale Entry</span>
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems
          .filter((item) => !item.hideForCashier)
          .map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            const isAI = item.id === 'ai';
            const isPOS = item.id === 'pos';

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {isPOS && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                      Scan
                    </span>
                  )}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded-full font-bold">
                      {item.badge}
                    </span>
                  )}
                  {isAI && (
                    <span className="flex items-center gap-1 text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-semibold">
                      <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                      AI
                    </span>
                  )}
                </div>
              </button>
            );
          })}

        {/* Smart Calculators & Tools */}
        <div className="pt-4 pb-2 px-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
            Smart Financial Tools
          </p>
        </div>

        {onOpenFxModal && (
          <button
            onClick={onOpenFxModal}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Ship className="w-4 h-4 text-emerald-600" />
              <span>FX & Landed Cost Import</span>
            </div>
          </button>
        )}

        {onOpenStaffModal && (
          <button
            onClick={onOpenStaffModal}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-purple-600" />
              <span>Staff & Cashier PINs</span>
            </div>
          </button>
        )}

        {onOpenGoalsModal && (
          <button
            onClick={onOpenGoalsModal}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Target className="w-4 h-4 text-emerald-600" />
              <span>Financial Goals & Targets</span>
            </div>
          </button>
        )}

        {onOpenPricingCalculator && (
          <button
            onClick={onOpenPricingCalculator}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Calculator className="w-4 h-4 text-emerald-600" />
              <span>Pricing Calculator</span>
            </div>
          </button>
        )}

        {onOpenProfitSimulator && (
          <button
            onClick={onOpenProfitSimulator}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Sliders className="w-4 h-4 text-amber-600" />
              <span>Profit Simulator</span>
            </div>
          </button>
        )}

        {onOpenBackupModal && (
          <button
            onClick={onOpenBackupModal}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-slate-500" />
              <span>Backup & Restore Vault</span>
            </div>
          </button>
        )}
      </nav>

      {/* Footer Support Tagline */}
      <div className="p-4 border-t border-slate-100 text-xs text-slate-400 text-center">
        <p className="font-medium text-slate-500">MarketMate for Nigeria</p>
        <p className="text-[11px] text-slate-400">Sales • Expenses • Profit</p>
      </div>
    </aside>
  );
};
