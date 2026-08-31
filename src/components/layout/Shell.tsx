import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileBottomNav } from './MobileBottomNav';
import { AnnouncementBanner } from '../notifications/AnnouncementBanner';
import { AppView } from '../../types';

interface ShellProps {
  children: React.ReactNode;
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
  onOpenNotificationDrawer?: () => void;
  businessName?: string;
  businessType?: string;
  currency?: string;
  onLogout?: () => void;
}

export const Shell: React.FC<ShellProps> = ({
  children,
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
  onOpenNotificationDrawer,
  businessName,
  businessType,
  currency,
  onLogout,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f17] flex text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900 transition-colors">
      {/* Desktop Persistent Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={onNavigate}
        onOpenAddSale={onOpenAddSale}
        onOpenAddExpense={onOpenAddExpense}
        onOpenPricingCalculator={onOpenPricingCalculator}
        onOpenProfitSimulator={onOpenProfitSimulator}
        onOpenGoalsModal={onOpenGoalsModal}
        onOpenBackupModal={onOpenBackupModal}
        onOpenFxModal={onOpenFxModal}
        onOpenStaffModal={onOpenStaffModal}
        onOpenLogoExportModal={onOpenLogoExportModal}
        businessName={businessName}
        businessType={businessType}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        {/* Urgent/Important Announcement Banner */}
        <AnnouncementBanner onNavigate={onNavigate} />

        {/* Global App Header */}
        <Header
          currentView={currentView}
          onNavigate={onNavigate}
          businessName={businessName}
          currency={currency}
          onLogout={onLogout}
          onOpenStaffModal={onOpenStaffModal}
          onOpenLogoExportModal={onOpenLogoExportModal}
          onOpenNotificationDrawer={onOpenNotificationDrawer}
        />

        {/* Viewport Content Container */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Mobile Sticky Bottom Navigation */}
      <MobileBottomNav
        currentView={currentView}
        onNavigate={onNavigate}
        onOpenAddSale={onOpenAddSale}
        onOpenAddExpense={onOpenAddExpense}
      />
    </div>
  );
};

