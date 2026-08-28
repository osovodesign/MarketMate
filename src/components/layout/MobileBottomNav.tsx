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
} from 'lucide-react';
import { AppView } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

interface MobileBottomNavProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onOpenAddSale: () => void;
  onOpenAddExpense: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onNavigate,
  onOpenAddSale,
  onOpenAddExpense,
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
          <div className="fixed inset-0 z-40 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQuickMenu(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute bottom-20 left-4 right-4 bg-white rounded-2xl p-4 shadow-xl border border-slate-200 z-50 flex flex-col gap-2 max-h-[80vh] overflow-y-auto"
            >
              <div className="text-center pb-1">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Quick Actions & Hub</span>
              </div>

              <button
                onClick={() => {
                  setShowQuickMenu(false);
                  onNavigate('pos');
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 transition-colors shadow-xs"
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
                className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-900">Record Single Sale</p>
                    <p className="text-xs text-slate-500">Calculate revenue & profit</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-emerald-800 bg-white px-2 py-1 rounded shadow-2xs">+ Sale</span>
              </button>

              <button
                onClick={() => {
                  setShowQuickMenu(false);
                  onOpenAddExpense();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-900">Record Expense</p>
                    <p className="text-xs text-slate-500">Transport, rent, supplies, etc.</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-amber-800 bg-white px-2 py-1 rounded shadow-2xs">+ Expense</span>
              </button>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                <button
                  onClick={() => {
                    setShowQuickMenu(false);
                    onNavigate('invoices');
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200"
                >
                  <FileText className="w-4 h-4 text-emerald-700" />
                  <span>Invoices & Quotes</span>
                </button>
                <button
                  onClick={() => {
                    setShowQuickMenu(false);
                    onNavigate('contacts');
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200"
                >
                  <BookUser className="w-4 h-4 text-amber-600" />
                  <span>Contacts & CRM</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1 shadow-lg safe-area-pb">
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
                  isActive ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800 font-medium'
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
              className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95 ${
                showQuickMenu ? 'bg-slate-800 rotate-45' : 'bg-emerald-700 hover:bg-emerald-800'
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
                  isActive ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800 font-medium'
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
