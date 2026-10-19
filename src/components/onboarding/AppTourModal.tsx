import React, { useState } from 'react';
import {
  X,
  ShoppingCart,
  Receipt,
  TrendingUp,
  ShieldCheck,
  Bot,
  Share2,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Store,
  DollarSign,
  BarChart3,
  Smartphone,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../ui/Button';
import { MarketMateLogo } from '../common/MarketMateLogo';
import { AppView } from '../../types';

interface AppTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: AppView) => void;
  onOpenAddSale: () => void;
  onOpenAddExpense: () => void;
  onCompleteTour?: () => void;
  businessName?: string;
}

interface TourSlide {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  points: { title: string; desc: string; icon: React.ComponentType<{ className?: string }> }[];
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  illustrationBg: string;
  previewGraphic: 'pos' | 'profit' | 'expense' | 'roles' | 'ai';
}

export const AppTourModal: React.FC<AppTourModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenAddSale,
  onOpenAddExpense,
  onCompleteTour,
  businessName = 'Your Business',
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  if (!isOpen) return null;

  const slides: TourSlide[] = [
    {
      id: 'slide_pos',
      badge: 'Step 1 • Point of Sale',
      title: 'Ring Up Sales & Generate Receipts in Seconds',
      subtitle: 'Fast checkout designed for busy counters and phone screens',
      description:
        'Whether you are using a phone camera to scan product barcodes or tapping custom items, ringing up a transaction takes under 5 seconds.',
      points: [
        {
          title: 'Multiple Payment Methods',
          desc: 'Accept Cash, Bank Transfer, POS Card, and track Customer Credit / Debts.',
          icon: ShoppingCart,
        },
        {
          title: 'Instant WhatsApp & Print Receipts',
          desc: 'Send professional digital receipts directly to your customer’s phone.',
          icon: Share2,
        },
        {
          title: 'Auto-Deduct Stock',
          desc: 'Inventory quantities automatically update with zero manual counting.',
          icon: Store,
        },
      ],
      primaryActionLabel: 'Try POS Terminal',
      onPrimaryAction: () => {
        onClose();
        onNavigate('pos');
      },
      illustrationBg: 'from-emerald-600/20 to-teal-700/20',
      previewGraphic: 'pos',
    },
    {
      id: 'slide_expense',
      badge: 'Step 2 • Cost Tracking',
      title: 'Log Every Daily Expense & Waybill',
      subtitle: 'Never wonder where your daily cash disappeared to',
      description:
        'Small hidden leakages—like generator fuel, dispatch rider waybills, packaging, and airtime—eat into retail businesses without owners noticing.',
      points: [
        {
          title: 'Categorized Overhead Logging',
          desc: 'Track logistics, staff stipends, generator fuel, shop rent, and packaging.',
          icon: Receipt,
        },
        {
          title: 'Separate Overheads from Stock Cost',
          desc: 'Keep daily operational expenses cleanly separated from inventory purchase cost.',
          icon: DollarSign,
        },
        {
          title: 'Instant Cost Audit',
          desc: 'See which expense categories are consuming the highest percentage of your revenue.',
          icon: BarChart3,
        },
      ],
      primaryActionLabel: 'Log First Expense',
      onPrimaryAction: () => {
        onClose();
        onOpenAddExpense();
      },
      illustrationBg: 'from-rose-600/20 to-amber-700/20',
      previewGraphic: 'expense',
    },
    {
      id: 'slide_profit',
      badge: 'Step 3 • Know Your Numbers',
      title: 'Know Your Real Take-Home Profit',
      subtitle: 'Sales Revenue ≠ True Profit',
      description:
        'High sales volume does not mean high profit if your margins are too thin. MarketMate calculates your true net profit automatically.',
      points: [
        {
          title: 'Automatic Profit Formula',
          desc: 'Gross Sales − (Wholesale Cost of Goods + Operating Overheads) = Real Net Profit.',
          icon: TrendingUp,
        },
        {
          title: 'Live Margin Percentages',
          desc: 'Track whether your business is hitting healthy retail margins (35%–50%).',
          icon: Sparkles,
        },
        {
          title: 'Top-Selling Revenue Rank',
          desc: 'Identify your 20% bestselling items that generate 80% of your earnings.',
          icon: BarChart3,
        },
      ],
      primaryActionLabel: 'Go to Dashboard',
      onPrimaryAction: () => {
        onClose();
        onNavigate('dashboard');
      },
      illustrationBg: 'from-blue-600/20 to-indigo-700/20',
      previewGraphic: 'profit',
    },
    {
      id: 'slide_roles',
      badge: 'Step 4 • Role Protection',
      title: 'Cashier Mode: Keep Your Costs & Profits Private',
      subtitle: 'Hand your phone or tablet to shop staff with total peace of mind',
      description:
        'Cashiers and sales reps can ring up sales and print receipts, but your wholesale supplier cost prices and overall profit margins remain locked.',
      points: [
        {
          title: '1-Tap Role Switcher',
          desc: 'Switch between Owner and Cashier mode right from the top header or settings.',
          icon: ShieldCheck,
        },
        {
          title: 'Wholesale Cost Protection',
          desc: 'Staff only see retail selling prices, preventing unauthorized profit auditing.',
          icon: Store,
        },
        {
          title: 'Cashier Shift Audit',
          desc: 'Audit each staff member’s total shift collections at closing time.',
          icon: Smartphone,
        },
      ],
      primaryActionLabel: 'Explore MarketMate',
      onPrimaryAction: () => {
        if (onCompleteTour) {
          onCompleteTour();
        }
        onClose();
      },
      illustrationBg: 'from-purple-600/20 to-emerald-700/20',
      previewGraphic: 'roles',
    },
  ];

  const currentSlide = slides[currentSlideIndex];
  const isLast = currentSlideIndex === slides.length - 1;

  const handleNext = () => {
    if (isLast) {
      if (onCompleteTour) {
        onCompleteTour();
      }
      onClose();
    } else {
      setCurrentSlideIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Top Header / Progress Indicator */}
        <div className="px-5 sm:px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <MarketMateLogo size="xs" />
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              {currentSlide.badge}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
              {currentSlideIndex + 1} of {slides.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Slide Dots */}
            <div className="hidden sm:flex items-center gap-1.5 mr-2">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === currentSlideIndex
                      ? 'w-6 bg-emerald-600 dark:bg-emerald-400'
                      : 'w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close tour"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Slide Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Graphic Banner Mockup */}
              <div
                className={`p-4 sm:p-5 rounded-2xl bg-linear-to-br ${currentSlide.illustrationBg} border border-slate-200/50 dark:border-slate-700/50 flex flex-col justify-center`}
              >
                <h3 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  {currentSlide.title}
                </h3>
                <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
                  {currentSlide.subtitle}
                </p>
              </div>

              {/* Description Paragraph */}
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {currentSlide.description}
              </p>

              {/* Feature Highlights Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {currentSlide.points.map((pt, i) => {
                  const Icon = pt.icon;
                  return (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                          {pt.title}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        {pt.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Navigation Controls */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
          <button
            onClick={handlePrev}
            disabled={currentSlideIndex === 0}
            className={`flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg transition-colors ${
              currentSlideIndex === 0
                ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-2">
            <Button
              onClick={currentSlide.onPrimaryAction}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              {currentSlide.primaryActionLabel}
            </Button>

            <Button
              onClick={handleNext}
              size="sm"
              rightIcon={isLast ? <CheckCircle2 className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            >
              {isLast ? 'Finish Tour' : 'Next Step'}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
