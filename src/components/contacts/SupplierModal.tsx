import React, { useState, useEffect } from 'react';
import { X, Building2, Phone, Mail, MapPin, Tag } from 'lucide-react';
import { Supplier } from '../../types';
import { useBusinessData } from '../../context/BusinessDataContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier?: Supplier | null;
}

export const SupplierModal: React.FC<SupplierModalProps> = ({
  isOpen,
  onClose,
  supplier,
}) => {
  const { addSupplier, updateSupplier } = useBusinessData();
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [marketLocation, setMarketLocation] = useState('');
  const [supplyCategory, setSupplyCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (supplier) {
        setName(supplier.name);
        setContactPerson(supplier.contactPerson || '');
        setPhone(supplier.phone || '');
        setEmail(supplier.email || '');
        setMarketLocation(supplier.marketLocation || '');
        setSupplyCategory(supplier.supplyCategory || '');
        setNotes(supplier.notes || '');
      } else {
        setName('');
        setContactPerson('');
        setPhone('');
        setEmail('');
        setMarketLocation('');
        setSupplyCategory('');
        setNotes('');
      }
      setError('');
    }
  }, [isOpen, supplier]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Supplier/Vendor name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (supplier) {
        await updateSupplier(supplier.id, {
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
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save supplier');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {supplier ? 'Edit Supplier / Vendor' : 'Add New Supplier'}
              </h2>
              <p className="text-xs text-slate-500">
                Manage wholesale contacts, market hubs, and procurement details
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-semibold">
              {error}
            </div>
          )}

          <Input
            label="Supplier / Vendor Business Name"
            placeholder="e.g. Balogun Luxury Fabrics & Lace Direct"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Contact Person"
              placeholder="e.g. Alhaji Rasheed / Chinedu"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
            />
            <Input
              label="Phone Number (WhatsApp / Calls)"
              placeholder="e.g. 08031122334"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Market Location / Hub"
              placeholder="e.g. Balogun Market, Lagos Island"
              value={marketLocation}
              onChange={(e) => setMarketLocation(e.target.value)}
            />
            <Input
              label="Supply Category / Items"
              placeholder="e.g. Raw Brocade, Lace, Zippers"
              value={supplyCategory}
              onChange={(e) => setSupplyCategory(e.target.value)}
            />
          </div>

          <Input
            label="Email Address (Optional)"
            type="email"
            placeholder="e.g. info@balogunfabrics.ng"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Procurement Terms & Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 5% discount on orders above ₦200k. Accepts payment on waybill delivery."
              className="w-full text-xs font-medium p-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-600"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {supplier ? 'Update Supplier' : 'Save Supplier'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
