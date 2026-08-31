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
  BookUser,
  Settings,
  LogOut,
} from 'lucide-react';
import { AppView } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

interface MobileBottomNavProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onOpenAddSale: () => void;
  onOpenAddExpense: () => void;
  onLogout?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onNavigate,
  onOpenAddSale,
  onOpenAddExpense,
  onLogout,
}) => {
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  const navItems: { id: AppView; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'sales', label: 'Sales', icon: TrendingUp },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'ai', label: 'AI', icon: Bot },
  ];

  return (
    <>
      {/* Quick Action Floating Menu Backdrop */}
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
              className="absolute bottom-22 left-4 right-4 bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-xl border border-slate-200 dark:border-slate-800 z-50 flex flex-col gap-2 max-h-[80vh] overflow-y-auto"
            >
              <div className="text-center pb-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Quick Actions & Hub</span>
              </div>

              <button
                onClick={() => {
                  setShowQuickMenu(false);
                  onNavigate('pos');
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 transition-colors shadow-xs cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">POS Register & Scanner</p>
                    <p className="text-xs text-emerald-100">Live cart, barcode scan & receipts</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-white px-2 py-1 rounded shadow-2xs">Launch</span>
              </button>

              <button
                onClick={() => {
                  setShowQuickMenu(false);
                  onOpenAddSale();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200/60 dark:border-emerald-800/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Record Single Sale</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Calculate revenue & profit</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-white dark:bg-slate-800 px-2 py-1 rounded shadow-2xs">+ Sale</span>
              </button>

              <button
                onClick={() => {
                  setShowQuickMenu(false);
                  onOpenAddExpense();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200/60 dark:border-rose-800/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-700 text-white flex items-center justify-center">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Record Expense</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Fuel, rent, salaries & logistics</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-rose-800 dark:text-rose-300 bg-white dark:bg-slate-800 px-2 py-1 rounded shadow-2xs">+ Cost</span>
              </button>

              {/* Settings & Sign Out in Quick Menu */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 mt-1">
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
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 px-2 py-1 shadow-lg safe-area-pb transition-colors">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {navItems.slice(0, 2).map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setShowQuickMenu(false);
                  onNavigate(item.id);
                }}
                className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 transition-colors ${
                  isActive
                    ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                <span className="text-[11px] mt-0.5 tracking-tight">{item.label}</span>
              </button>
            );
          })}

          {/* Central Quick Add Action Button */}
          <div className="relative -top-3">
            <button
              onClick={() => setShowQuickMenu(!showQuickMenu)}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95 cursor-pointer ${
                showQuickMenu ? 'bg-slate-800 dark:bg-slate-700 rotate-45' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
              aria-label="Quick Add Menu"
            >
              {showQuickMenu ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
            </button>
          </div>

          {navItems.slice(2).map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setShowQuickMenu(false);
                  onNavigate(item.id);
                }}
                className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 transition-colors ${
                  isActive
                    ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                <span className="text-[11px] mt-0.5 tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

