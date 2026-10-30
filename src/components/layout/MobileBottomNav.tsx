import React, { useState } from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Receipt,
  Plus,
  X,
  FileText,
  Users,
  Package,
  Menu,
  ShoppingCart,
} from 'lucide-react';
import { AppView } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useAuth } from '../../context/AuthContext';
import { hasPermission } from '../../lib/staffPermissions';

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
  onOpenMobileMenu,
}) => {
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const { debts, currentSession } = useBusinessData();
  const { isSubscribed } = useAuth();

  const activeDebtorsCount = debts.filter((d) => d.status !== 'settled').length;
  const isCashier = currentSession?.currentRole === 'cashier';
  const canAddExpense = hasPermission(currentSession, 'canViewExpenses') && !isCashier;
  const canManageProducts = hasPermission(currentSession, 'canEditProducts');

  const isMoreActive =
    currentView !== 'dashboard' &&
    currentView !== 'sales' &&
    currentView !== 'record-sale' &&
    currentView !== 'pos';

  return (
    <>
      {/* Quick Action Bottom Sheet */}
      <AnimatePresence>
        {showQuickMenu && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setShowQuickMenu(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute bottom-20 left-4 right-4 bg-white dark:bg-[#001A35] rounded-2xl p-4 shadow-2xl border border-slate-200 dark:border-slate-800 z-50 flex flex-col gap-2.5 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  Quick Actions
                </span>
                <button
                  onClick={() => setShowQuickMenu(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  aria-label="Close quick actions"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Primary Action: Record Sale */}
              <button
                onClick={() => {
                  setShowQuickMenu(false);
                  onOpenAddSale();
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/15 text-white flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4.5 h-4.5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white">Record Sale</p>
                    <p className="text-xs text-white/85">Enter a sale and calculate profit</p>
                  </div>
                </div>
              </button>

              {/* Secondary Common Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {canAddExpense && (
                  <button
                    onClick={() => {
                      setShowQuickMenu(false);
                      onOpenAddExpense();
                    }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/70 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">
                        Add Expense
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        Record money spent by the business
                      </p>
                    </div>
                  </button>
                )}

                {canManageProducts && (
                  <button
                    onClick={() => {
                      setShowQuickMenu(false);
                      onNavigate(isSubscribed ? 'create-product' : 'products');
                    }}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/70 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-[#059669] dark:text-[#34D399] flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">
                          Add Product
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          Add item price and stock level
                        </p>
                      </div>
                    </div>
                    {!isSubscribed && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 shrink-0">
                        Pro
                      </span>
                    )}
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowQuickMenu(false);
                    onNavigate('debts');
                  }}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/70 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">
                        Customer Debts
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        Record customer debt or repayment
                      </p>
                    </div>
                  </div>
                  {!isSubscribed && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 shrink-0">
                      Pro
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setShowQuickMenu(false);
                    onNavigate(isSubscribed ? 'create-invoice' : 'invoices');
                  }}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/70 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">
                        Create Invoice or Quote
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        Prepare customer invoice or quotation
                      </p>
                    </div>
                  </div>
                  {!isSubscribed && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 shrink-0">
                      Pro
                    </span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Bottom Navigation Bar: Home | Sales | Add (+) | Checkout | More */}
      <nav
        aria-label="Mobile bottom navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#001A35]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1 shadow-lg safe-area-pb transition-colors"
      >
        <div className="grid grid-cols-5 items-center max-w-lg mx-auto">
          {/* 1. Home */}
          <button
            onClick={() => {
              setShowQuickMenu(false);
              onNavigate('dashboard');
            }}
            className={`flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors cursor-pointer ${
              currentView === 'dashboard'
                ? 'text-[#059669] dark:text-[#34D399] font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
            }`}
          >
            <LayoutDashboard
              className={`w-5 h-5 ${currentView === 'dashboard' ? 'stroke-[2.5px]' : 'stroke-2'}`}
            />
            <span className="text-[11px] mt-0.5">Home</span>
          </button>

          {/* 2. Sales */}
          <button
            onClick={() => {
              setShowQuickMenu(false);
              onNavigate('sales');
            }}
            className={`flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors cursor-pointer ${
              currentView === 'sales' || currentView === 'record-sale'
                ? 'text-[#059669] dark:text-[#34D399] font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
            }`}
          >
            <TrendingUp
              className={`w-5 h-5 ${
                currentView === 'sales' || currentView === 'record-sale'
                  ? 'stroke-[2.5px]'
                  : 'stroke-2'
              }`}
            />
            <span className="text-[11px] mt-0.5">Sales</span>
          </button>

          {/* 3. Centre Add (+) */}
          <div className="flex flex-col items-center justify-center">
            <button
              onClick={() => setShowQuickMenu(!showQuickMenu)}
              className={`w-11 h-11 rounded-full flex items-center justify-center text-white shadow-md transition-transform active:scale-95 cursor-pointer ${
                showQuickMenu
                  ? 'bg-slate-800 dark:bg-slate-700'
                  : 'bg-[#059669] hover:bg-[#047857]'
              }`}
              aria-label="Add sale, expense, or product"
              aria-expanded={showQuickMenu}
            >
              {showQuickMenu ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </button>
            <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 mt-0.5">
              Add
            </span>
          </div>

          {/* 4. Checkout */}
          <button
            onClick={() => {
              setShowQuickMenu(false);
              onNavigate('pos');
            }}
            className={`flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors cursor-pointer ${
              currentView === 'pos'
                ? 'text-[#059669] dark:text-[#34D399] font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
            }`}
          >
            <ShoppingCart
              className={`w-5 h-5 ${currentView === 'pos' ? 'stroke-[2.5px]' : 'stroke-2'}`}
            />
            <span className="text-[11px] mt-0.5">Checkout</span>
          </button>

          {/* 5. More */}
          <button
            onClick={() => {
              setShowQuickMenu(false);
              if (onOpenMobileMenu) onOpenMobileMenu();
            }}
            className={`flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors cursor-pointer relative ${
              isMoreActive
                ? 'text-[#059669] dark:text-[#34D399] font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
            }`}
            aria-label="Open full navigation menu"
          >
            <div className="relative">
              <Menu className={`w-5 h-5 ${isMoreActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              {activeDebtorsCount > 0 && (
                <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center tabular-nums">
                  {activeDebtorsCount > 9 ? '9+' : activeDebtorsCount}
                </span>
              )}
            </div>
            <span className="text-[11px] mt-0.5">More</span>
          </button>
        </div>
      </nav>
    </>
  );
};
