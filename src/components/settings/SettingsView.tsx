import React, { useState } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBusinessData } from '../../context/BusinessDataContext';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { BusinessCategory, CurrencyCode } from '../../types';
import { StaffManagementModal } from '../staff/StaffManagementModal';
import { MultiCurrencyCalculatorModal } from '../currency/MultiCurrencyCalculatorModal';

interface SettingsViewProps {
  onResetData: () => void;
  onLoadDemo: () => void;
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

export const SettingsView: React.FC<SettingsViewProps> = ({ onResetData, onLoadDemo }) => {
  const { user, business, updateBusinessProfile } = useAuth();
  const { resetData, loadDemoData, staffList, fxConfig, currentSession } = useBusinessData();

  const [businessName, setBusinessName] = useState(business?.businessName || '');
  const [businessType, setBusinessType] = useState<BusinessCategory>(
    business?.businessType || 'Fashion & Apparel'
  );
  const [currency, setCurrency] = useState<CurrencyCode>(business?.currency || 'NGN');
  const [phone, setPhone] = useState(business?.phone || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isFxModalOpen, setIsFxModalOpen] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) return;

    updateBusinessProfile({
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
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Business & Profile Settings
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Configure your business profile, default currency, and data management.
        </p>
      </div>

      {/* Business Profile Form */}
      <Card padding="lg">
        <CardHeader>
          <div>
            <CardTitle>Business Profile</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">Update your store details and category</p>
          </div>
        </CardHeader>

        <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
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
            <p className="text-xs text-slate-500 mt-0.5">
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
          <div className="p-3 bg-purple-50/50 border border-purple-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-purple-700" />
              <div>
                <p className="font-bold text-slate-900">
                  Active Session: <span className="text-purple-800">{currentSession.staffName} ({currentSession.currentRole.toUpperCase()})</span>
                </p>
                <p className="text-[11px] text-slate-500">
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
            <p className="text-xs text-slate-500 mt-0.5">
              Live exchange rates for USD, CNY, EUR, GBP, GHS and import landed cost calculations.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsFxModalOpen(true)}
            leftIcon={<Ship className="w-3.5 h-3.5 text-emerald-700" />}
          >
            FX & Landed Cost Tool
          </Button>
        </CardHeader>

        <div className="pt-2 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 font-bold block">USD / NGN</span>
            <span className="text-xs font-bold text-slate-900">₦{fxConfig.rates.USD.toLocaleString()}</span>
          </div>
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 font-bold block">CNY (Yuan)</span>
            <span className="text-xs font-bold text-slate-900">₦{fxConfig.rates.CNY.toLocaleString()}</span>
          </div>
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 font-bold block">GBP (£)</span>
            <span className="text-xs font-bold text-slate-900">₦{fxConfig.rates.GBP.toLocaleString()}</span>
          </div>
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 font-bold block">Market Type</span>
            <span className="text-xs font-bold text-emerald-700 uppercase">{fxConfig.marketType}</span>
          </div>
        </div>
      </Card>

      {/* User Account Info */}
      <Card padding="lg">
        <CardHeader>
          <div>
            <CardTitle>Account Details</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">Owner user credentials</p>
          </div>
        </CardHeader>

        <div className="space-y-3 pt-2 text-xs">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="font-semibold text-slate-500">Full Name</span>
            <span className="font-bold text-slate-900">{user?.fullName || 'Business Owner'}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="font-semibold text-slate-500">Email Address</span>
            <span className="font-bold text-slate-900">{user?.email || 'owner@business.ng'}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="font-semibold text-slate-500">Security / Protection</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              <span>Local Encryption & Session Storage</span>
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

      {/* Data Management Card (Reset & Demo dataset) */}
      <Card padding="lg" className="border-rose-100">
        <CardHeader>
          <div>
            <CardTitle className="text-slate-900">Demo & Data Controls</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Switch datasets or wipe transactions to start fresh.
            </p>
          </div>
        </CardHeader>

        <div className="space-y-4 pt-2">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-900">Load Ada Fashion Demo Data</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
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

          <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-rose-900">Clear All Transactions</p>
              <p className="text-[11px] text-rose-700 mt-0.5">
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
                className="text-rose-700 hover:bg-rose-100 border-rose-200"
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
