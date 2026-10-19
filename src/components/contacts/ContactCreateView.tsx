import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  Tag,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Customer, Supplier } from '../../types';
import { useBusinessData } from '../../context/BusinessDataContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface ContactCreateViewProps {
  onBack: () => void;
  onSuccess?: () => void;
  initialType?: 'customer' | 'supplier';
  initialCustomer?: Customer | null;
  initialSupplier?: Supplier | null;
}

export const ContactCreateView: React.FC<ContactCreateViewProps> = ({
  onBack,
  onSuccess,
  initialType = 'customer',
  initialCustomer,
  initialSupplier,
}) => {
  const { addCustomer, updateCustomer, addSupplier, updateSupplier } = useBusinessData();

  const [contactType, setContactType] = useState<'customer' | 'supplier'>(
    initialSupplier ? 'supplier' : initialType
  );

  // Common and customer fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Supplier-specific fields
  const [contactPerson, setContactPerson] = useState('');
  const [marketLocation, setMarketLocation] = useState('');
  const [supplyCategory, setSupplyCategory] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialCustomer) {
      setContactType('customer');
      setName(initialCustomer.name);
      setPhone(initialCustomer.phone || '');
      setEmail(initialCustomer.email || '');
      setAddress(initialCustomer.address || '');
      setNotes(initialCustomer.notes || '');
    } else if (initialSupplier) {
      setContactType('supplier');
      setName(initialSupplier.name);
      setContactPerson(initialSupplier.contactPerson || '');
      setPhone(initialSupplier.phone || '');
      setEmail(initialSupplier.email || '');
      setMarketLocation(initialSupplier.marketLocation || '');
      setSupplyCategory(initialSupplier.supplyCategory || '');
      setNotes(initialSupplier.notes || '');
    }
  }, [initialCustomer, initialSupplier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(
        contactType === 'customer'
          ? 'Customer name is required'
          : 'Supplier/Vendor name is required'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      if (contactType === 'customer') {
        if (initialCustomer) {
          await updateCustomer(initialCustomer.id, {
            name: name.trim(),
            phone: phone.trim() || undefined,
            email: email.trim() || undefined,
            address: address.trim() || undefined,
            notes: notes.trim() || undefined,
          });
        } else {
          await addCustomer({
            name: name.trim(),
            phone: phone.trim() || undefined,
            email: email.trim() || undefined,
            address: address.trim() || undefined,
            notes: notes.trim() || undefined,
          });
        }
      } else {
        if (initialSupplier) {
          await updateSupplier(initialSupplier.id, {
            name: name.trim(),
            contactPerson: contactPerson.trim() || undefined,
            phone: phone.trim() || undefined,
            email: email.trim() || undefined,
            marketLocation: marketLocation.trim() || undefined,
            supplyCategory: supplyCategory.trim() || undefined,
            notes: notes.trim() || undefined,
          });
        } else {
          await addSupplier({
            name: name.trim(),
            contactPerson: contactPerson.trim() || undefined,
            phone: phone.trim() || undefined,
            email: email.trim() || undefined,
            marketLocation: marketLocation.trim() || undefined,
            supplyCategory: supplyCategory.trim() || undefined,
            notes: notes.trim() || undefined,
          });
        }
      }

      setIsSuccess(true);
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          onBack();
        }
      }, 900);
    } catch (err: any) {
      setError(err.message || 'Failed to save contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = Boolean(initialCustomer || initialSupplier);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Bar with Back navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Return to previous screen"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                CRM & Directory
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500">
                {contactType === 'customer' ? 'Customer Profile' : 'Supplier Profile'}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {isEditing
                ? `Edit ${contactType === 'customer' ? 'Customer' : 'Supplier'}`
                : `Add New ${contactType === 'customer' ? 'Customer' : 'Wholesale Supplier'}`}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Keep customer lifetime records, wholesale vendor contacts, and WhatsApp links
            </p>
          </div>
        </div>

        {/* Contact Type Toggle */}
        {!isEditing && (
          <div className="inline-flex p-1 bg-slate-100 rounded-xl self-start sm:self-auto border border-slate-200/80">
            <button
              type="button"
              onClick={() => setContactType('customer')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                contactType === 'customer'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Customer</span>
            </button>
            <button
              type="button"
              onClick={() => setContactType('supplier')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                contactType === 'supplier'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Supplier / Vendor</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Centered Form Card */}
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 sm:p-7">
        {isSuccess ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {contactType === 'customer' ? 'Customer Saved Successfully!' : 'Supplier Saved Successfully!'}
            </h2>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              <strong className="text-slate-800">{name}</strong> has been added to your CRM directory.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {contactType === 'customer' ? (
              // Customer Form
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Customer / Business Name *
                  </label>
                  <Input
                    placeholder="e.g. Chief Emeka or Amaka Okafor"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      WhatsApp / Phone Number
                    </label>
                    <Input
                      placeholder="e.g. 0803 123 4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      helperText="Used for 1-click WhatsApp messaging and receipts"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Email Address (Optional)
                    </label>
                    <Input
                      type="email"
                      placeholder="customer@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Delivery Address / Location
                  </label>
                  <Input
                    placeholder="e.g. Shop 24, Zone D, Balogun Market, Lagos"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Customer Notes & Preferences
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Prefers morning delivery. Reliable repeat customer."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                </div>
              </div>
            ) : (
              // Supplier Form
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Company / Supplier Name *
                    </label>
                    <Input
                      placeholder="e.g. Golden Oil Depot or ABC Electronics Ltd"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Key Contact Person / Agent
                    </label>
                    <Input
                      placeholder="e.g. Alhaji Musa or Mr. Daniel"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      WhatsApp / Phone Number
                    </label>
                    <Input
                      placeholder="e.g. 0802 987 6543"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Supply Category
                    </label>
                    <Input
                      placeholder="e.g. Grains, Fashion Fabrics, Spare Parts"
                      value={supplyCategory}
                      onChange={(e) => setSupplyCategory(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Market Location / Warehouse
                    </label>
                    <Input
                      placeholder="e.g. Alaba Int'l Market, Lagos"
                      value={marketLocation}
                      onChange={(e) => setMarketLocation(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Supplier Email (Optional)
                    </label>
                    <Input
                      type="email"
                      placeholder="orders@supplier.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Payment Terms & Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Offers 14-day credit terms on orders above N500,000."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                </div>
              </div>
            )}

            {/* Bottom Actions: Cancel + Submit Button */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                onClick={onBack}
                disabled={isSubmitting}
                className="text-slate-600 hover:text-slate-900"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isSubmitting}
                size="md"
                className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold px-7"
              >
                {isEditing
                  ? 'Update Contact'
                  : contactType === 'customer'
                  ? 'Save Customer'
                  : 'Save Supplier'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
