import React from 'react';
import {
  TrendingUp,
  Receipt,
  BarChart3,
  Bot,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Sparkles,
  HelpCircle,
  Globe,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { MarketMateLogo } from '../common/MarketMateLogo';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface LandingPageProps {
  onStartFree: () => void;
  onLogin: () => void;
  onExploreDemo: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartFree,
  onLogin,
  onExploreDemo,
}) => {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Navigation Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100/90 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-3">
          {/* Logo with tagline visible on desktop/tablet and hidden on mobile */}
          <div className="flex items-center min-w-0 shrink">
            <MarketMateLogo size="md" showSubtitle={true} hideSubtitleOnMobile={true} />
          </div>

          {/* Action Buttons arranged properly with zero mobile overflow */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Install App: compact icon on mobile, full labeled badge on desktop */}
            <div className="hidden sm:block">
              <PWAInstallButton variant="compact" />
            </div>
            <div className="sm:hidden">
              <PWAInstallButton
                variant="icon"
                className="w-8 h-8 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 flex items-center justify-center shrink-0"
              />
            </div>

            <button
              onClick={onLogin}
              className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-950 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap"
            >
              Log In
            </button>
            <Button
              onClick={onStartFree}
              size="sm"
              className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-bold whitespace-nowrap shrink-0"
            >
              Start Free
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Built for Nigerian Micro & Small Businesses</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.15]">
            Know Your Numbers. <br className="hidden sm:block" />
            <span className="text-emerald-700">Grow Your Business.</span>
          </h1>

          {/* Subheading */}
          <p className="mt-5 text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Track your sales, control your expenses and understand your profit in one simple place—with AI-powered insights to help you make better business decisions.
          </p>

          {/* CTA Group */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto">
            <Button onClick={onStartFree} size="lg" fullWidth rightIcon={<ArrowRight className="w-4 h-4" />}>
              Start Free Today
            </Button>
            <Button onClick={onExploreDemo} variant="outline" size="lg" fullWidth>
              Explore Live Demo
            </Button>
          </div>

          <p className="mt-3 text-xs text-slate-400">No complicated setup. Designed for mobile, tablet, and PC.</p>

          {/* Product Preview Mock Card */}
          <div className="mt-12 max-w-4xl mx-auto rounded-2xl border border-slate-200/80 bg-slate-50 p-2 sm:p-4 shadow-xl">
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-6 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Today's Summary</span>
                  <h3 className="text-xl font-bold text-slate-900 mt-0.5">Ada Fashion & Fabrics</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-medium">Currency: ₦ NGN</span>
                  <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-md font-semibold">Active Store</span>
                </div>
              </div>

              {/* 3 Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 my-4">
                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-medium text-slate-500">Today's Sales</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">₦85,000</p>
                  <p className="text-[11px] text-emerald-600 mt-1 font-medium">6 items sold</p>
                </div>
                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-medium text-slate-500">Today's Expenses</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">₦18,500</p>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">Transport & Packaging</p>
                </div>
                <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-50/70 border border-emerald-100">
                  <p className="text-xs font-semibold text-emerald-800">Today's Profit</p>
                  <p className="text-xl sm:text-2xl font-bold text-emerald-700 mt-1">₦38,500</p>
                  <p className="text-[11px] text-emerald-700 mt-1 font-medium">Margin: 45.3%</p>
                </div>
              </div>

              {/* Sample AI Callout */}
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/60 flex items-start gap-3">
                <Bot className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 leading-relaxed">
                  <span className="font-bold">MarketMate AI Insight:</span> "Your best seller today was{' '}
                  <span className="font-semibold underline">Ankara Ready-to-Wear (₦45,000 revenue)</span>. Transport took 65% of your daily operating expenses."
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem & Solution Section */}
      <section className="py-16 bg-slate-50/70 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Stop guessing your business profit
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base">
              Many business owners count money in their bank account or jot in paper notebooks without knowing their actual net profit after costs and expenses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
            {/* The Old Way */}
            <div className="bg-white p-6 rounded-2xl border border-rose-100 shadow-2xs">
              <div className="text-rose-600 font-bold text-sm uppercase tracking-wider mb-2">The Old Way</div>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Writing daily sales on paper that gets lost or damaged</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Confusing bank alert balance with actual profit</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Unrecorded transport, POS fees, and packaging eating your capital</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>No clear idea which product makes the most money</span>
                </li>
              </ul>
            </div>

            {/* The MarketMate Way */}
            <div className="bg-white p-6 rounded-2xl border border-emerald-200/80 shadow-2xs">
              <div className="text-emerald-700 font-bold text-sm uppercase tracking-wider mb-2">The MarketMate Way</div>
              <ul className="space-y-3 text-sm text-slate-700">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Record sales in 10 seconds with automatic cost & profit calculation</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Instant separation of sales revenue, item cost, and real take-home profit</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Clear expense categories (Transport, Rent, Electricity, Internet, Supplies)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>MarketMate AI to answer questions in plain, friendly language</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Core Features */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Everything you need to manage your business numbers
            </h2>
            <p className="mt-2 text-slate-600 text-sm sm:text-base">
              No complex accounting jargon. Built specifically for everyday commerce in Nigeria.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl border border-slate-200/80 bg-white hover:border-emerald-300 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">Record Sales</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Log products sold with selling price, cost price, and payment method (Cash, Transfer, POS). Revenue and profit calculate automatically.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200/80 bg-white hover:border-emerald-300 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4">
                <Receipt className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">Track Expenses</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Track where money leaks—from dispatch rider fees to diesel, data bundles, rent, and packaging materials.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200/80 bg-white hover:border-emerald-300 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">Clear Reports</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                View your business performance for today, this week, this month, or custom date ranges with clean charts and margin percentages.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200/80 bg-white hover:border-emerald-300 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-4">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">MarketMate AI</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ask questions like "What was my most profitable product?" or "Why did my profit drop?" and get straightforward answers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Assistant Spotlight */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Your Personal Business Advisor</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Software calculates your numbers. <br />
              <span className="text-emerald-400">MarketMate AI explains them.</span>
            </h2>
            <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
              No need to struggle analyzing spreadsheets. Just ask questions in everyday English and get clear advice grounded strictly in your real sales and costs.
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-xl mx-auto text-xs">
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200">
                💬 "How did my business perform this week?"
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200">
                💬 "What was my most profitable product?"
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200">
                💬 "Where am I spending the most money?"
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200">
                💬 "How can I improve my profit margin?"
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-emerald-700 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            See where your money is going. <br />
            Know what you're making.
          </h2>
          <p className="mt-4 text-emerald-100 text-sm sm:text-base max-w-xl mx-auto">
            Join other Nigerian merchants taking control of their business growth today.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={onStartFree}
              size="lg"
              variant="secondary"
              className="bg-white text-emerald-900 hover:bg-slate-100 font-bold"
            >
              Start Free with MarketMate
            </Button>
            <button
              onClick={onExploreDemo}
              className="text-white text-sm font-semibold hover:underline px-4 py-2"
            >
              Try Instant Demo Mode →
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          {/* Top Row: Website link at top-left, CAC Reg. No. in a straight line at top-right */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* Top Left: Website link & Logo */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <a
                href="https://getmarketmate.online"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors whitespace-nowrap text-xs shadow-2xs"
                title="Official MarketMate Website"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>getmarketmate.online</span>
              </a>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
              <div className="flex items-center gap-2">
                <MarketMateLogo size="sm" />
                <span className="text-slate-500 dark:text-slate-400 text-xs hidden md:inline">
                  — Know Your Numbers. Grow Your Business.
                </span>
              </div>
            </div>

            {/* Top Right: CAC Reg No in a guaranteed straight line */}
            <div className="flex items-center shrink-0">
              <span className="whitespace-nowrap font-semibold text-emerald-900 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-3 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 text-xs inline-flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                <span className="whitespace-nowrap">CAC Reg. No: 9931755</span>
              </span>
            </div>
          </div>

          {/* Bottom Row: © 2026 arranged properly */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs text-center sm:text-left flex-wrap justify-center sm:justify-start">
              <span className="font-semibold text-slate-800 dark:text-slate-200">© 2026</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">MarketMate Technologies Limited.</span>
              <span className="text-slate-400 dark:text-slate-500">All rights reserved.</span>
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center sm:text-right">
              Built for Nigerian Micro, Small, and Growing Businesses.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

