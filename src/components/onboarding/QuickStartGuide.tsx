import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Circle,
  ArrowRight,
  ShoppingCart,
  Receipt,
  Package,
  Share2,
  ChevronDown,
  ChevronUp,
  X,
  HelpCircle,
  Compass,
  Trophy,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../ui/Button';
import { AppView } from '../../types';
import { useBusinessData } from '../../context/BusinessDataContext';

interface QuickStartGuideProps {
  onNavigate: (view: AppView) => void;
  onOpenAddSale: () => void;
  onOpenAddExpense: () => void;
  onOpenTourModal: () => void;
}

const STORAGE_DISMISS_KEY = 'marketmate_quickstart_dismissed_v1';

export const QuickStartGuide: React.FC<QuickStartGuideProps> = ({
  onNavigate,
  onOpenAddSale,
  onOpenAddExpense,
  onOpenTourModal,
}) => {
  const { sales, expenses, products, business } = useBusinessData();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_DISMISS_KEY);
      if (stored === 'true') {
        setIsDismissed(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem(STORAGE_DISMISS_KEY, 'true');
    } catch {
      // ignore
    }
  };

  const handleRestore = () => {
    setIsDismissed(false);
    try {
      localStorage.removeItem(STORAGE_DISMISS_KEY);
    } catch {
      // ignore
    }
  };

  const hasSales = sales && sales.length > 0;
  const hasExpenses = expenses && expenses.length > 0;
  const hasProducts = products && products.length > 0;
  const hasTestedReceipt = hasSales; // When they record a sale, receipt is ready

  const steps = [
    {
      id: 'step_sale',
      title: 'Record your 1st Sale',
      desc: 'Ring up a quick sale in POS or Sales Log to see instant profit calculation.',
      isDone: hasSales,
      actionLabel: hasSales ? 'Completed' : 'Ring up Sale',
      icon: ShoppingCart,
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80',
      onClick: () => onOpenAddSale(),
    },
    {
      id: 'step_expense',
      title: 'Log a Store Expense',
      desc: 'Record fuel, transport, or packaging to separate real profit from gross revenue.',
      isDone: hasExpenses,
      actionLabel: hasExpenses ? 'Completed' : 'Log Expense',
      icon: Receipt,
      color: 'text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/80',
      onClick: () => onOpenAddExpense(),
    },
    {
      id: 'step_product',
      title: 'Add an Inventory Product',
      desc: 'Enter cost price & selling price to let MarketMate automate your profit margins.',
      isDone: hasProducts,
      actionLabel: hasProducts ? 'Completed' : 'Add Item',
      icon: Package,
      color: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/80',
      onClick: () => onNavigate('products'),
    },
    {
      id: 'step_receipt',
      title: 'Test Digital Receipt',
      desc: 'Send a formatted invoice or receipt via WhatsApp to delight customers.',
      isDone: hasTestedReceipt,
      actionLabel: hasTestedReceipt ? 'Completed' : 'View POS',
      icon: Share2,
      color: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/80',
      onClick: () => onNavigate('pos'),
    },
  ];

  const completedCount = steps.filter((s) => s.isDone).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);
  const isAllDone = completedCount === steps.length;

  if (isDismissed) {
    return (
      <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 text-xs">
        <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
          <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="font-semibold">Getting Started Guide:</span>
          <span>{completedCount} of {steps.length} milestones complete</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenTourModal}
            className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>App Tour</span>
          </button>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <button
            onClick={handleRestore}
            className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 underline cursor-pointer"
          >
            Show Checklist
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-linear-to-r from-emerald-900 via-slate-900 to-slate-900 text-white shadow-xl border border-emerald-700/40 p-4 sm:p-5 relative overflow-hidden transition-all">
      {/* Background ambient accents */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header bar */}
      <div className="relative z-10 flex items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
            {isAllDone ? <Trophy className="w-5 h-5 text-amber-300" /> : <Sparkles className="w-5 h-5 text-emerald-400" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                {isAllDone ? '🎉 All Set! Store Setup Complete' : 'Quick-Start Setup Guide'}
              </h3>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                {progressPercent}% Complete
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {isAllDone
                ? 'Great job! Your business numbers and profit tracking are now active.'
                : 'Follow these 4 simple steps to master your sales, expenses, and profit.'}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onOpenTourModal}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
            title="Open Interactive Visual Tour"
          >
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>Interactive Tour</span>
          </button>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand checklist' : 'Minimize checklist'}
            aria-label="Toggle checklist view"
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>

          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-rose-500/30 text-slate-300 hover:text-rose-200 transition-colors cursor-pointer"
            title="Dismiss guide"
            aria-label="Dismiss guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Track */}
      <div className="relative z-10 w-full bg-slate-800 rounded-full h-1.5 my-3 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full bg-linear-to-r from-emerald-400 to-emerald-300 rounded-full"
        />
      </div>

      {/* Step Cards Grid */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 pt-1"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.id}
                    onClick={step.onClick}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
                      step.isDone
                        ? 'bg-emerald-950/40 border-emerald-500/30 hover:bg-emerald-950/60'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-emerald-400/40 shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${step.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-[11px] font-bold text-slate-400">Step {idx + 1}</span>
                        </div>

                        {step.isDone ? (
                          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-900/60 px-2 py-0.5 rounded-full border border-emerald-500/40">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Done</span>
                          </div>
                        ) : (
                          <Circle className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                        {step.title}
                      </h4>
                      <p className="text-[11px] text-slate-300/80 mt-1 line-clamp-2 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        {step.isDone ? 'View / Manage' : step.actionLabel}
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile Tour Trigger */}
            <div className="mt-3 pt-2 sm:hidden flex items-center justify-between border-t border-white/10 text-xs">
              <span className="text-slate-300">Need a quick walkthrough?</span>
              <button
                onClick={onOpenTourModal}
                className="font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Interactive App Tour</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
