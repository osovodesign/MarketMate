import React, { useState } from 'react';
import { Store, ShoppingBag, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { MarketMateLogo } from '../common/MarketMateLogo';
import { BusinessCategory, CurrencyCode } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface OnboardingProps {
  onCompleted: () => void;
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

export const Onboarding: React.FC<OnboardingProps> = ({ onCompleted }) => {
  const { user, createBusiness, isLoading } = useAuth();
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState<BusinessCategory>('Fashion & Apparel');
  const [currency, setCurrency] = useState<CurrencyCode>('NGN');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) {
      setError('Please enter your business or shop name.');
      return;
    }

    try {
      await createBusiness({
        businessName: businessName.trim(),
        businessType,
        currency,
        phone,
      });
      onCompleted();
    } catch (err) {
      setError('Failed to setup your business profile. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center flex flex-col items-center">
        <div className="mb-4 flex justify-center">
          <MarketMateLogo size="xl" showSubtitle={true} />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
          Set up your business profile
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Welcome to MarketMate, <span className="font-semibold text-slate-900">{user?.fullName || 'Partner'}</span>! Tell us about your business so MarketMate can tailor your calculations and AI advice.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/80 rounded-2xl sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            <Input
              label="Business or Brand Name"
              type="text"
              placeholder="e.g. Chisom Fashion Hub, Lagos Provisions"
              value={businessName}
              onChange={(e) => {
                setBusinessName(e.target.value);
                setError(null);
              }}
              required
              helperText="The public name of your store, shop, or online brand"
              leftAddon={<Store className="w-4 h-4" />}
            />

            <Select
              label="Business Category"
              options={BUSINESS_CATEGORIES}
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value as BusinessCategory)}
              required
              helperText="Helps MarketMate categorize common product margins & expenses"
            />

            <Select
              label="Default Currency"
              options={CURRENCIES}
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              required
              helperText="MarketMate defaults to ₦ Nigerian Naira (NGN)"
            />

            <Input
              label="Business Phone / WhatsApp (Optional)"
              type="tel"
              placeholder="e.g. +234 802 345 6789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              helperText="Used for optional customer receipts and records"
            />

            {/* Benefit reassurance box */}
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-start gap-2.5 text-xs text-emerald-900">
              <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Next step:</span> You will reach your business dashboard to record your first sale or expense in seconds.
              </div>
            </div>

            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
              size="lg"
              className="mt-4"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Launch My Business Dashboard
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
