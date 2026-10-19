import React, { useState } from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Receipt,
  BarChart3,
  Bot,
  Plus,
  X,
  ArrowLeftRight,
  FileText,
  Users,
  Package,
  Settings,
  LogOut,
  Menu,
  ShoppingCart,
  Calculator,
} from 'lucide-react';
import { AppView } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { useBusinessData } from '../../context/BusinessDataContext';

interface MobileBottomNavProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onOpenAddSale: () => void;
  onOpenAddExpense: () => void;
  onLogout?: () => void;
  onOpenMobileMenu?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onNavigate,
  onOpenAddSale,
  onOpenAddExpense,
  onLogout,
  onOpenMobileMenu,
}) => {
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const { debts } = useBusinessData();
  const activeDebtorsCount = debts.filter((d) => d.status !== 'settled').length;

  const leftNavItems: { id: AppView; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'sales', label: 'Sales', icon: TrendingUp },
  ];

  const rightNavItems: { id: AppView; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  return (
    <>
      {/* Quick Action Floating Hub Backdrop */}
      <AnimatePresence>
        {showQuickMenu && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQuickMenu(false)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute bottom-22 left-4 right-4 bg-white dark:bg-[#001A35] rounded-2xl p-4 shadow-2xl border border-slate-200 dark:border-slate-800 z-50 flex flex-col gap-2.5 max-h-[82vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Quick Actions & Operations
                </span>
                {onOpenMobileMenu && (
                  <button
                    onClick={() => {
                      setShowQuickMenu(false);
                      onOpenMobileMenu();
                    }}
                    className="text-xs font-bold text-[#059669] dark:text-[#34D399] flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Menu className="w-3.5 h-3.5" />
                    <span>All Features</span>
                  </button>
                )}
              </div>

              {/* High Frequency Actions */}
              <button
                onClick={() => {
                  setShowQuickMenu(false);
                  onNavigate('pos');
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-[#059669] text-[#FEFEFE] hover:bg-[#047857] transition-colors shadow-xs cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#001A35] text-[#FEFEFE] flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 text-[#34D399]" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-[#FEFEFE]">POS Register & Barcode Scanner</p>
                    <p className="text-xs text-[#FEFEFE]/80">Fast checkout, receipts & scanner</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#001A35] bg-[#FEFEFE] px-2 py-1 rounded shadow-2xs">Launch</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setShowQuickMenu(false);
                    onOpenAddSale();
                  }}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B]/40 text-[#059669] dark:text-[#34D399] border border-[#059669]/20 text-xs font-bold cursor-pointer"
                >
                  <TrendingUp className="w-4 h-4 text-[#059669] dark:text-[#34D399] shrink-0" />
                  <span className="truncate">+ Record Sale</span>
                </button>

                <button
                  onClick={() => {
                    setShowQuickMenu(false);
                    onOpenAddExpense();
                  }}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border border-rose-200/70 dark:border-rose-800/60 text-xs font-bold cursor-pointer"
                >
                  <Receipt className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="truncate">+ Add Expense</span>
                </button>
              </div>

              {/* Direct Access to Financial Books */}
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pt-1">
                Records & Ledgers
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setShowQuickMenu(false);
                    onNavigate('debts');
                  }}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <Users className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    {activeDebtorsCount > 0 && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300">
                        {activeDebtorsCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">Customer Credit</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Debts & IOUs</p>
                </button>

                <button
                  onClick={() => {
                    setShowQuickMenu(false);
                    onNavigate('transactions');
                  }}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left transition-colors cursor-pointer"
                >
                  <ArrowLeftRight className="w-4 h-4 text-blue-600 dark:text-blue-400 mb-1" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">Transactions</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Full audit trail</p>
                </button>

                <button
                  onClick={() => {
                    setShowQuickMenu(false);
                    onNavigate('reports');
                  }}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left transition-colors cursor-pointer"
                >
                  <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400 mb-1" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">Profit & Loss</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">P&L & Analytics</p>
                </button>

                <button
                  onClick={() => {
                    setShowQuickMenu(false);
                    onNavigate('products');
                  }}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left transition-colors cursor-pointer"
                >
                  <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mb-1" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">Catalog & Stock</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Inventory items</p>
                </button>
              </div>

              {/* Settings & Sign Out in Quick Menu */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 mt-1">
                <button
                  onClick={() => {
                    setShowQuickMenu(false);
                    onNavigate('settings');
                  }}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>

                {onLogout && (
                  <button
                    onClick={() => {
                      setShowQuickMenu(false);
                      onLogout();
                    }}
                    className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/70 dark:hover:bg-rose-900/70 text-rose-700 dark:text-rose-300 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FEFEFE]/95 dark:bg-[#001A35]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 px-2 py-1 shadow-lg safe-area-pb transition-colors">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {/* Home & Sales */}
          {leftNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              currentView === item.id ||
              (item.id === 'sales' && currentView === 'record-sale');
            return (
              <button
                key={item.id}
                onClick={() => {
                  setShowQuickMenu(false);
                  onNavigate(item.id);
                }}
                className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 transition-colors cursor-pointer ${
                  isActive
                    ? 'text-[#059669] dark:text-[#34D399] font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                <span className="text-[11px] mt-0.5 tracking-tight">{item.label}</span>
              </button>
            );
          })}

          {/* Central Quick Actions Button */}
          <div className="relative -top-3">
            <button
              onClick={() => setShowQuickMenu(!showQuickMenu)}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95 cursor-pointer ${
                showQuickMenu ? 'bg-slate-800 dark:bg-slate-700 rotate-45' : 'bg-[#059669] hover:bg-[#047857]'
              }`}
              aria-label="Quick Actions & Hub"
              title="Quick Actions Hub"
            >
              {showQuickMenu ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
            </button>
          </div>

          {/* Reports & Expenses */}
          {rightNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              currentView === item.id ||
              (item.id === 'expenses' && currentView === 'record-expense');
            return (
              <button
                key={item.id}
                onClick={() => {
                  setShowQuickMenu(false);
                  onNavigate(item.id);
                }}
                className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 transition-colors relative cursor-pointer ${
                  isActive
                    ? 'text-[#059669] dark:text-[#34D399] font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                <span className="text-[11px] mt-0.5 tracking-tight">{item.label}</span>
              </button>
            );
          })}

          {/* Menu Drawer Toggle Button (Hamburger / More) */}
          {onOpenMobileMenu && (
            <button
              onClick={onOpenMobileMenu}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium transition-colors cursor-pointer relative ${
                currentView === 'debts' || currentView === 'invoices' || currentView === 'contacts' || currentView === 'transactions' || currentView === 'products'
                  ? 'text-[#059669] dark:text-[#34D399] font-bold'
                  : ''
              }`}
              title="More Features (Menu)"
            >
              <div className="relative">
                <Menu className="w-5 h-5 stroke-2" />
                {activeDebtorsCount > 0 && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center">
                    {activeDebtorsCount > 9 ? '9+' : activeDebtorsCount}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight">More</span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
};
