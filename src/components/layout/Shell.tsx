import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileNavDrawer } from './MobileNavDrawer';
import { AnnouncementBanner } from '../notifications/AnnouncementBanner';
import { FloatingSupportButton } from '../common/FloatingSupportButton';
import { HelpSupportModal } from '../common/HelpSupportModal';
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
  onOpenTourModal?: () => void;
  onOpenReferralModal?: () => void;
  onOpenSupportModal?: () => void;
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
  onOpenTourModal,
  onOpenReferralModal,
  onOpenSupportModal,
  businessName,
  businessType,
  currency,
  onLogout,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  const handleOpenSupport = () => {
    if (onOpenSupportModal) {
      onOpenSupportModal();
    } else {
      setIsSupportModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#FEFEFE] dark:bg-[#082F4B] flex flex-col text-[#001A35] dark:text-[#FEFEFE] font-sans antialiased selection:bg-[#059669]/20 selection:text-[#001A35] transition-colors">
      {/* Urgent/Important Announcement Banner */}
      <AnnouncementBanner onNavigate={onNavigate} />

      {/* Global App Full-Width Top Navbar */}
      <Header
        currentView={currentView}
        onNavigate={onNavigate}
        businessName={businessName}
        currency={currency}
        onLogout={onLogout}
        onOpenStaffModal={onOpenStaffModal}
        onOpenLogoExportModal={onOpenLogoExportModal}
        onOpenNotificationDrawer={onOpenNotificationDrawer}
        onOpenTourModal={onOpenTourModal}
        onOpenReferralModal={onOpenReferralModal}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onOpenSupportModal={handleOpenSupport}
      />

      {/* Body Area with Left Sidebar and Main Content */}
      <div className="flex-1 flex min-w-0 w-full relative">
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
          onOpenReferralModal={onOpenReferralModal}
          onOpenSupportModal={handleOpenSupport}
          businessName={businessName}
          businessType={businessType}
        />

        {/* Viewport Content Container */}
        <div className="flex-1 flex flex-col min-w-0 pb-24 lg:pb-8">
          <main className="flex-1 w-full max-w-7xl mx-auto p-3.5 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Full Navigation Drawer */}
      <MobileNavDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        currentView={currentView}
        onNavigate={onNavigate}
        onOpenPricingCalculator={onOpenPricingCalculator}
        onOpenProfitSimulator={onOpenProfitSimulator}
        onOpenGoalsModal={onOpenGoalsModal}
        onOpenBackupModal={onOpenBackupModal}
        onOpenFxModal={onOpenFxModal}
        onOpenStaffModal={onOpenStaffModal}
        onOpenReferralModal={onOpenReferralModal}
        onOpenSupportModal={handleOpenSupport}
        businessName={businessName}
        businessType={businessType}
      />

      {/* Mobile Sticky Bottom Navigation */}
      <MobileBottomNav
        currentView={currentView}
        onNavigate={onNavigate}
        onOpenAddSale={onOpenAddSale}
        onOpenAddExpense={onOpenAddExpense}
        onLogout={onLogout}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
      />

      {/* Persistent Global Floating Support Button (WhatsApp & Help Desk) */}
      <FloatingSupportButton onOpen={handleOpenSupport} />

      {/* Fallback Help & Support Hub Modal if not provided by parent App */}
      {!onOpenSupportModal && (
        <HelpSupportModal
          isOpen={isSupportModalOpen}
          onClose={() => setIsSupportModalOpen(false)}
          businessName={businessName}
        />
      )}
    </div>
  );
};


