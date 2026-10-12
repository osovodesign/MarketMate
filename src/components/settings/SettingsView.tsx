import React, { useState, useRef } from 'react';
import {
  Building2,
  Store,
  User,
  Shield,
  CreditCard,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Users,
  Ship,
  Lock,
  DollarSign,
  Image as ImageIcon,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  FileImage,
  Compass,
  HelpCircle,
  Gift,
  Share2,
  Copy,
  Check,
  Clock,
  Headphones,
  MessageCircle,
  Phone,
  Scale,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useTheme } from '../../context/ThemeContext';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { BusinessCategory, CurrencyCode } from '../../types';
import { StaffManagementModal } from '../staff/StaffManagementModal';
import { MultiCurrencyCalculatorModal } from '../currency/MultiCurrencyCalculatorModal';
import { MarketMateLogo } from '../common/MarketMateLogo';
import { LogoExportModal } from '../common/LogoExportModal';
import { SubscribeModal } from '../subscription/SubscribeModal';
import { LegalModal } from '../legal/LegalModal';
import { SocialMediaLinks } from '../common/SocialMediaLinks';
import { SubscriptionRequest } from '../../types';
import { fetchSubscriptionRequests } from '../../lib/subscriptionService';
import { SUPPORT_CONFIG, getWhatsAppSupportUrl } from '../../lib/adminConfig';
import {
  getReferralCodeForUser,
  getReferralShareUrl,
  getWhatsAppShareMessage,
  REFERRAL_CAMPAIGN,
} from '../../lib/referralService';

interface SettingsViewProps {
  onResetData: () => void;
  onLoadDemo: () => void;
  onOpenLogoExport?: () => void;
  onOpenTour?: () => void;
  onOpenReferralModal?: () => void;
  onOpenSupportModal?: () => void;
}

const BUSINESS_CATEGORIES: { value: BusinessCategory; label: string }[] = [
  { value: 'Fashion & Apparel', label: 'Fashion & Apparel (Clothing, Fabrics, Shoes)' },
  { value: 'Food & Catering', label: 'Food, Restaurant & Catering' },
  { value: 'Beauty & Cosmetics', label: 'Beauty, Skincare & Cosmetics' },
  { value: 'Phone & Accessories', label: 'Phones & Phone Accessories' },
  { value: 'Electronics & Gadgets', label: 'Electronics, Appliances & Gadgets' },
  { value: 'Mini Supermarket & Provisions', label: 'Mini Supermarket & Provisions Store' },
  { value: 'Hair & Barbing Salon', label: 'Hair & Barbing Salon' },
  { value: 'Tailoring & Crafts', label: 'Tailoring, Fashion Design & Crafts' },
  { value: 'Home & Decor', label: 'Home, Bedding & Decor' },
  { value: 'Pharmacy & Healthcare', label: 'Pharmacy, Patent Medicine & Health' },
  { value: 'General Merchant', label: 'General Merchant / Other Business' },
];

const CURRENCIES: { value: CurrencyCode; label: string }[] = [
  { value: 'NGN', label: '₦ Nigerian Naira (NGN)' },
  { value: 'USD', label: '$ US Dollar (USD)' },
  { value: 'GBP', label: '£ British Pound (GBP)' },
  { value: 'EUR', label: '€ Euro (EUR)' },
  { value: 'GHS', label: 'GH₵ Ghanaian Cedi (GHS)' },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  onResetData,
  onLoadDemo,
  onOpenLogoExport,
  onOpenTour,
  onOpenReferralModal,
  onOpenSupportModal,
}) => {
  const { user, business, updateBusiness, activateSubscription, isDemoMode, isSubscribed } = useAuth();
  const {
    resetData,
    loadDemoData,
    staffList,
    fxConfig,
    currentSession,
    syncLiveFxRates,
    isSyncingFx,
    fxSource,
  } = useBusinessData();
  const {
    customLogoLight,
    customLogoDark,
    setCustomLogo,
    clearCustomLogo,
  } = useTheme();

  const [businessName, setBusinessName] = useState(business?.businessName || '');
  const [businessType, setBusinessType] = useState<BusinessCategory>(
    business?.businessType || 'Fashion & Apparel'
  );
  const [currency, setCurrency] = useState<CurrencyCode>(business?.currency || 'NGN');
  const [phone, setPhone] = useState(business?.phone || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [logoSuccessMsg, setLogoSuccessMsg] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isFxModalOpen, setIsFxModalOpen] = useState(false);
  const [isLogoExportModalOpen, setIsLogoExportModalOpen] = useState(false);
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  const [pendingSubRequest, setPendingSubRequest] = useState<SubscriptionRequest | null>(null);
  const [copiedField, setCopiedField] = useState<'link' | 'code' | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const [subSuccess, setSubSuccess] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'disclaimers' | 'terms' | 'privacy'>('disclaimers');

  const checkSubRequests = async () => {
    if (!user?.id) return;
    try {
      const reqs = await fetchSubscriptionRequests({
        businessId: business?.id,
        userId: user.id,
      });
      const pending = reqs.find((r) => r.status === 'pending');
      setPendingSubRequest(pending || null);
    } catch (err) {
      console.warn('Could not fetch subscription status for merchant:', err);
    }
  };

  React.useEffect(() => {
    checkSubRequests();
  }, [user?.id, business?.id, business?.isSubscribed]);

  const handleActivateSub = async () => {
    setSubscribing(true);
    try {
      await activateSubscription('MarketMate Pioneer Standard');
      setSubSuccess(true);
      setTimeout(() => setSubSuccess(false), 4000);
    } finally {
      setSubscribing(false);
    }
  };

  const userReferralCode = getReferralCodeForUser(user?.id);
  const userReferralLink = getReferralShareUrl(userReferralCode);

  const handleCopy = (type: 'link' | 'code', val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedField(type);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleShareWhatsApp = () => {
    const msg = getWhatsAppShareMessage(
      userReferralCode,
      business?.businessName || user?.fullName || 'a fellow merchant'
    );
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const lightFileInputRef = useRef<HTMLInputElement>(null);
  const darkFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, mode: 'light' | 'dark' | 'both') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (e.g. 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Logo file size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCustomLogo(dataUrl);
        updateBusiness({ logoUrl: dataUrl });
        setLogoSuccessMsg(`Logo uploaded successfully!`);
        setTimeout(() => setLogoSuccessMsg(null), 3500);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleResetLogos = () => {
    clearCustomLogo();
    updateBusiness({ logoUrl: undefined, logoDarkUrl: undefined });
    setLogoSuccessMsg('Restored official default logos.');
    setTimeout(() => setLogoSuccessMsg(null), 3000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) return;

    updateBusiness({
      businessName: businessName.trim(),
      businessType,
      currency,
      phone,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Business & Profile Settings
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Configure your business profile, official brand assets, and staff permissions.
        </p>
      </div>

      {/* Brand Assets & Logo Upload Card */}
      <Card padding="lg">
        <CardHeader>
          <div>
            <CardTitle>Brand Assets & Custom Logo</CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Upload your exact official logo or export brand assets for invoices, receipts, and headers.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(customLogoLight || customLogoDark) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetLogos}
                leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs"
              >
                Reset Default
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (onOpenLogoExport) {
                  onOpenLogoExport();
                } else {
                  setIsLogoExportModalOpen(true);
                }
              }}
              leftIcon={<Download className="w-3.5 h-3.5 text-emerald-600" />}
            >
              Export Assets
            </Button>
          </div>
        </CardHeader>

        {logoSuccessMsg && (
          <div className="mt-2 mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{logoSuccessMsg}</span>
          </div>
        )}

        {/* Hidden File Inputs */}
        <input
          ref={lightFileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/svg+xml, image/webp"
          className="hidden"
          onChange={(e) => handleFileUpload(e, 'light')}
        />
        <input
          ref={darkFileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/svg+xml, image/webp"
          className="hidden"
          onChange={(e) => handleFileUpload(e, 'dark')}
        />

        <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Light Mode Logo Preview & Upload */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col items-center justify-between gap-4 text-center">
            <div className="w-full flex items-center justify-between text-left">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Light Mode Logo
              </span>
              {customLogoLight && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                  Custom
                </span>
              )}
            </div>

            <div className="py-4 w-full flex items-center justify-center min-h-[90px] bg-slate-50/70 rounded-lg border border-dashed border-slate-200">
              <MarketMateLogo size="lg" variant="light" showSubtitle={true} />
            </div>

            <div className="w-full flex flex-col gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => lightFileInputRef.current?.click()}
                leftIcon={<Upload className="w-3.5 h-3.5 text-emerald-600" />}
                className="w-full text-xs"
              >
                {customLogoLight ? 'Replace Light Logo' : 'Upload Light Logo (.png, .svg)'}
              </Button>
              <p className="text-[11px] text-slate-500">For white backgrounds & receipts</p>
            </div>
          </div>

          {/* Dark Mode Logo Preview & Upload */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 flex flex-col items-center justify-between gap-4 text-center">
            <div className="w-full flex items-center justify-between text-left">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Dark Mode Logo
              </span>
              {customLogoDark && (
                <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold px-1.5 py-0.5 rounded">
                  Custom
                </span>
              )}
            </div>

            <div className="py-4 w-full flex items-center justify-center min-h-[90px] bg-slate-900/80 rounded-lg border border-dashed border-slate-800">
              <MarketMateLogo size="lg" variant="dark" showSubtitle={true} />
            </div>

            <div className="w-full flex flex-col gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => darkFileInputRef.current?.click()}
                leftIcon={<Upload className="w-3.5 h-3.5 text-emerald-400" />}
                className="w-full text-xs border-slate-800 text-slate-200 hover:bg-slate-900"
              >
                {customLogoDark ? 'Replace Dark Logo' : 'Upload Dark Logo (.png, .svg)'}
              </Button>
              <p className="text-[11px] text-slate-400">For dark backgrounds & night mode</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Business Profile Form */}
      <Card padding="lg">
        <CardHeader>
          <div>
            <CardTitle>Business Profile</CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Update your store details and category</p>
          </div>
        </CardHeader>

        <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Business settings saved successfully!</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Business Name"
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
              leftAddon={<Store className="w-4 h-4" />}
            />

            <Select
              label="Business Category"
              options={BUSINESS_CATEGORIES}
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value as BusinessCategory)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Default Currency"
              options={CURRENCIES}
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              required
            />

            <Input
              label="Business Phone / WhatsApp"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+234 800 000 0000"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" size="md">
              Save Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* Staff & Cashier Lock Mode (Phase 10) */}
      <Card padding="lg">
        <CardHeader>
          <div>
            <CardTitle>Staff & Cashier Permissions</CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Create 4-digit PINs for cashiers to restrict profit margins, analytics and expenses.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsStaffModalOpen(true)}
            leftIcon={<Users className="w-3.5 h-3.5 text-purple-700" />}
          >
            Manage Staff & PINs ({staffList.length})
          </Button>
        </CardHeader>

        <div className="pt-2 text-xs space-y-2">
          <div className="p-3 bg-purple-50/50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-purple-700 dark:text-purple-400" />
              <div>
                <p className="font-bold text-slate-900 dark:text-white">
                  Active Session: <span className="text-purple-800 dark:text-purple-300">{currentSession.staffName} ({currentSession.currentRole.toUpperCase()})</span>
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {currentSession.currentRole === 'cashier'
                    ? 'Cashier Mode: Sensitive financial reports and costs are currently hidden.'
                    : 'Owner Mode: Full access to all business metrics and configuration.'}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsStaffModalOpen(true)}
            >
              Switch Session
            </Button>
          </div>
        </div>
      </Card>

      {/* Multi-Currency & Cross-Border Landed Cost FX (Phase 9) */}
      <Card padding="lg">
        <CardHeader>
          <div>
            <CardTitle>Cross-Border Trade & Parallel FX Rates</CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live exchange rates for USD, CNY, EUR, GBP, GHS and import landed cost calculations.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSyncingFx}
              onClick={() => syncLiveFxRates(true)}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncingFx ? 'animate-spin' : ''}`} />}
            >
              {isSyncingFx ? 'Syncing...' : 'Sync Live'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsFxModalOpen(true)}
              leftIcon={<Ship className="w-3.5 h-3.5 text-emerald-700" />}
            >
              FX & Landed Cost Tool
            </Button>
          </div>
        </CardHeader>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 pb-2 flex-wrap gap-2">
          <span className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Market Feed: {fxSource || 'Global Interbank Feed'}
          </span>
          {fxConfig.lastUpdated && (
            <span className="text-[10px] text-slate-400">
              Synced: {new Date(fxConfig.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        <div className="pt-2 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 font-bold block">USD / NGN</span>
            <span className="text-xs font-bold text-slate-900 dark:text-white">₦{fxConfig.rates.USD.toLocaleString()}</span>
          </div>
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 font-bold block">CNY (Yuan)</span>
            <span className="text-xs font-bold text-slate-900 dark:text-white">₦{fxConfig.rates.CNY.toLocaleString()}</span>
          </div>
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 font-bold block">GBP (£)</span>
            <span className="text-xs font-bold text-slate-900 dark:text-white">₦{fxConfig.rates.GBP.toLocaleString()}</span>
          </div>
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 font-bold block">Market Type</span>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase">{fxConfig.marketType}</span>
          </div>
        </div>
      </Card>

      {/* User Account Info */}
      <Card padding="lg">
        <CardHeader>
          <div>
            <CardTitle>Account Details</CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Owner user credentials</p>
          </div>
        </CardHeader>

        <div className="space-y-3 pt-2 text-xs">
          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Full Name</span>
            <span className="font-bold text-slate-900 dark:text-white">{user?.fullName || 'Business Owner'}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Email Address</span>
            <span className="font-bold text-slate-900 dark:text-white">{user?.email || 'owner@business.ng'}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Security / Protection</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              <span>Firebase Cloud Auth & Firestore Security Rules</span>
            </span>
          </div>
        </div>
      </Card>

      {/* Modals */}
      <StaffManagementModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
      />
      <MultiCurrencyCalculatorModal
        isOpen={isFxModalOpen}
        onClose={() => setIsFxModalOpen(false)}
      />
      <LogoExportModal
        isOpen={isLogoExportModalOpen}
        onClose={() => setIsLogoExportModalOpen(false)}
      />
      <SubscribeModal
        isOpen={isSubscribeModalOpen}
        onClose={() => {
          setIsSubscribeModalOpen(false);
          checkSubRequests();
        }}
        onSuccess={() => {
          checkSubRequests();
        }}
      />
      <LegalModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        defaultTab={legalModalTab}
      />

      {/* User Guide & Walkthrough Card */}
      <Card padding="lg">
        <CardHeader>
          <div>
            <CardTitle className="text-slate-900 dark:text-white">Help & User Flow Guide</CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Learn how to record sales, track expenses, and use cashier permissions.
            </p>
          </div>
          {onOpenTour && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenTour}
              leftIcon={<Compass className="w-3.5 h-3.5 text-emerald-600" />}
            >
              Start Interactive Tour
            </Button>
          )}
        </CardHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center text-xs font-bold">1</span>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Recording Sales & POS</p>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pl-7">
              Use your phone camera or barcode gun to scan items, choose Cash/Transfer/POS, and send WhatsApp receipts.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 flex items-center justify-center text-xs font-bold">2</span>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Tracking True Net Profit</p>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pl-7">
              Log daily operating expenses (fuel, packaging, dispatch) so MarketMate automatically calculates real take-home margins.
            </p>
          </div>
        </div>
      </Card>

      {/* Referral Program & 5% Subscription Discount Card */}
      <Card padding="lg" className="border-emerald-200 dark:border-emerald-800/80 bg-gradient-to-br from-emerald-50/40 via-white to-teal-50/30 dark:from-emerald-950/20 dark:via-slate-900 dark:to-teal-950/20">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Gift className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Refer & Earn 5% Discount</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    {REFERRAL_CAMPAIGN.discountPercent}% OFF
                  </span>
                </CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Share your link with fellow retail merchants. When they register and subscribe to MarketMate, you receive 5% off your subscription!
                </p>
              </div>
            </div>

            {onOpenReferralModal && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onOpenReferralModal}
                className="self-start sm:self-auto shrink-0 border-emerald-300 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300"
              >
                View Full Stats
              </Button>
            )}
          </div>
        </CardHeader>

        <div className="space-y-4 pt-2">
          {/* Subscription Status & Referral Qualification */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800/90 border border-emerald-200/80 dark:border-emerald-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Your Store Subscription:
                  </span>
                  {isDemoMode ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      Free Demo Account • All Pro Features Unlocked
                    </span>
                  ) : business?.isSubscribed ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      <Check className="w-3 h-3 text-emerald-600" />
                      Active Subscribed ({business.subscriptionPlan || 'Standard Plan'})
                    </span>
                  ) : pendingSubRequest ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse">
                      <Clock className="w-3 h-3 text-amber-600" />
                      Payment Under Admin Verification
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                      Free Pioneer Tier (Pro Locked)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {isDemoMode
                    ? 'You are currently exploring MarketMate with Adaeze Okonkwo sample data. All Pro features (Invoices, CRM, Debt Book, Reports, AI Advisor, Staff Roles) are completely free to test. Real registered merchants must subscribe to unlock these features.'
                    : business?.isSubscribed
                    ? 'Your store is actively subscribed. Referral discounts will apply to subsequent renewal invoices.'
                    : pendingSubRequest
                    ? `Bank transfer proof of ₦${pendingSubRequest.finalAmount.toLocaleString()} submitted (Ref: ${pendingSubRequest.paymentReference}). Admin is verifying receipt in bank statement.`
                    : 'Subscribe to MarketMate via direct bank transfer to unlock Invoices, Debt Book, P&L Reports, AI Advisor, and Staff Management.'}
                </p>
                {subSuccess && (
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    ✓ Subscription activated! Any referral attribution is now qualified.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isDemoMode ? (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    Pro Features Unlocked
                  </span>
                ) : business?.isSubscribed ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setIsSubscribeModalOpen(true)}
                    className="text-xs font-bold"
                  >
                    View Renewal / Bank Details
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setIsSubscribeModalOpen(true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    >
                      {pendingSubRequest ? 'View / Update Transfer' : 'Subscribe via Bank Transfer'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleActivateSub}
                      disabled={subscribing}
                      className="text-slate-600 dark:text-slate-300 text-xs hidden sm:inline-flex"
                      title="Activate instant free trial tier during pioneer window"
                    >
                      {subscribing ? 'Activating...' : 'Instant Free Trial'}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {pendingSubRequest && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>
                    Pending transfer: <strong>₦{pendingSubRequest.finalAmount.toLocaleString()}</strong> from{' '}
                    <strong>{pendingSubRequest.senderBank}</strong> ({pendingSubRequest.senderAccountName}). Narration Ref:{' '}
                    <code className="font-mono font-bold">{pendingSubRequest.paymentReference}</code>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSubscribeModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-bold text-[11px] hover:bg-amber-300 transition-colors cursor-pointer shrink-0"
                >
                  Details
                </button>
              </div>
            )}
          </div>

          {/* Campaign Period Notice */}
          <div className="p-3 rounded-xl bg-emerald-100/60 dark:bg-emerald-950/60 border border-emerald-300/80 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
              <span>
                <strong>Campaign Period:</strong> {REFERRAL_CAMPAIGN.durationText}
              </span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
              Reward applies when referred stores register & subscribe
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Referral Code Field */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Your Referral Code
                </p>
                <p className="text-base font-black tracking-widest text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">
                  {userReferralCode}
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleCopy('code', userReferralCode)}
                leftIcon={copiedField === 'code' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {copiedField === 'code' ? 'Copied' : 'Copy'}
              </Button>
            </div>

            {/* Quick Share Buttons */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Share Referral Link
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 truncate mt-0.5 font-mono">
                  {userReferralLink}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleCopy('link', userReferralLink)}
                  title="Copy link"
                >
                  {copiedField === 'link' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleShareWhatsApp}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  title="Share on WhatsApp"
                  leftIcon={<Share2 className="w-3.5 h-3.5" />}
                >
                  WhatsApp
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Official Help & Support Desk Card */}
      <Card padding="lg" className="border-emerald-200/70 dark:border-emerald-900/60 bg-gradient-to-br from-white via-white to-emerald-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-slate-900 dark:text-white">
                  Help, Support & Contact Admin
                </CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Have questions, feature requests, or need billing help? Reach the admin team directly.
                </p>
              </div>
            </div>

            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              WhatsApp Online
            </span>
          </div>
        </CardHeader>

        <div className="space-y-4 pt-2">
          {/* WhatsApp Direct Chat Banner */}
          <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <p className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                  Instant WhatsApp Support ({SUPPORT_CONFIG.whatsappDisplay})
                </p>
              </div>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300/90 leading-relaxed">
                Chat directly with our administrative team on WhatsApp for real-time help, onboarding assistance, or payment inquiries.
              </p>
            </div>

            <a
              href={getWhatsAppSupportUrl(`Hello Admin, I am using MarketMate for "${business?.businessName || 'my store'}". I need assistance.`)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat on WhatsApp</span>
            </a>
          </div>

          {/* In-App Ticket & Email Support Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Headphones className="w-3.5 h-3.5 text-emerald-600" />
                  In-App Support Ticket
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Submit a structured assistance ticket and track replies directly inside MarketMate.
                </p>
              </div>

              {onOpenSupportModal && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onOpenSupportModal}
                  className="w-full justify-center"
                >
                  Open Support Hub
                </Button>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  Phone & Email Desk
                </p>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 space-y-0.5 font-mono">
                  <p>Line: <a href={`tel:${SUPPORT_CONFIG.phone}`} className="text-emerald-600 dark:text-emerald-400 hover:underline">{SUPPORT_CONFIG.phone}</a></p>
                  <p>Mail: <a href={`mailto:${SUPPORT_CONFIG.email}`} className="text-emerald-600 dark:text-emerald-400 hover:underline">{SUPPORT_CONFIG.email}</a></p>
                </div>
              </div>

              <span className="text-[10px] text-slate-400">
                Operating Hours: Mon – Sat, 8:00 AM – 8:00 PM WAT
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Official Community & Social Media Channels Card */}
      <Card padding="lg" className="border-slate-200 dark:border-slate-800">
        <SocialMediaLinks variant="cards" showTitle={true} />
      </Card>

      {/* Legal Disclaimers, Terms & NDPA Compliance Card */}
      <Card padding="lg" className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Legal, Compliance & Disclaimers</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    Version 2.0
                  </span>
                </CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Official Terms of Service, accounting & bank transfer disclaimers, and NDPA compliance notices.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setLegalModalTab('disclaimers');
                setIsLegalModalOpen(true);
              }}
              className="self-start sm:self-auto shrink-0"
              leftIcon={<Scale className="w-3.5 h-3.5 text-emerald-600" />}
            >
              Open Legal Center
            </Button>
          </div>
        </CardHeader>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              setLegalModalTab('disclaimers');
              setIsLegalModalOpen(true);
            }}
            className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-left hover:border-emerald-500/50 transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                🛡️ Legal Disclaimers
              </span>
              <span className="text-[10px] text-slate-400">View</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Accounting estimates, bank transfer reconciliation, and debt collection boundaries.
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              setLegalModalTab('terms');
              setIsLegalModalOpen(true);
            }}
            className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-left hover:border-emerald-500/50 transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                📜 Terms of Service
              </span>
              <span className="text-[10px] text-slate-400">View</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Founder limitation of liability, prohibited contraband, and dispute jurisdiction (Warri, Nigeria).
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              setLegalModalTab('privacy');
              setIsLegalModalOpen(true);
            }}
            className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-left hover:border-emerald-500/50 transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                🔒 Privacy & NDPA
              </span>
              <span className="text-[10px] text-slate-400">View</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Strict Nigerian Data Protection Act compliance. Merchant and customer data is never sold.
            </p>
          </button>
        </div>
      </Card>

      {/* Data Management Card (Reset & Demo dataset) */}
      <Card padding="lg" className="border-rose-100 dark:border-rose-950">
        <CardHeader>
          <div>
            <CardTitle className="text-slate-900 dark:text-white">Demo & Data Controls</CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Switch datasets or wipe transactions to start fresh.
            </p>
          </div>
        </CardHeader>

        <div className="space-y-4 pt-2">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Load Ada Fashion Demo Data</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Populates realistic sales and operating expenses to test all analytics and reports.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                loadDemoData();
                onLoadDemo();
              }}
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-emerald-600" />}
            >
              Load Sample Data
            </Button>
          </div>

          <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-rose-900 dark:text-rose-300">Clear All Transactions</p>
              <p className="text-[11px] text-rose-700 dark:text-rose-400 mt-0.5">
                Wipes all recorded sales and expenses to start with a blank clean ledger.
              </p>
            </div>

            {showResetConfirm ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    resetData();
                    onResetData();
                    setShowResetConfirm(false);
                  }}
                >
                  Yes, Wipe Everything
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowResetConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-rose-700 hover:bg-rose-100 border-rose-200 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950"
                onClick={() => setShowResetConfirm(true)}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Reset Ledger
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
