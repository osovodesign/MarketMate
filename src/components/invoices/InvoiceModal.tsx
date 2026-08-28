import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  FileText,
  CreditCard,
  Building2,
  Calendar,
  User,
  Package,
  Percent,
} from 'lucide-react';
import { Invoice, InvoiceItem, InvoiceType, BankDetails, Customer } from '../../types';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, getTodayDateString } from '../../lib/formatters';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialInvoice?: Invoice | null;
  defaultType?: InvoiceType;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  initialInvoice,
  defaultType = 'invoice',
}) => {
  const { business } = useAuth();
  const { products, customers, invoices, addInvoice, updateInvoice, addCustomer } = useBusinessData();

  const [type, setType] = useState<InvoiceType>(defaultType);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [saveAsNewCustomer, setSaveAsNewCustomer] = useState(false);

  const [issueDate, setIssueDate] = useState(getTodayDateString());
  const [dueDate, setDueDate] = useState('');

  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0, total: 0 },
  ]);

  const [discount, setDiscount] = useState<number>(0);
  const [enableVat, setEnableVat] = useState(false);
  const [taxRate, setTaxRate] = useState<number>(7.5);
  const [notes, setNotes] = useState('');

  const [bankDetails, setBankDetails] = useState<BankDetails>({
    bankName: business?.bankDetails?.bankName || 'Access Bank PLC',
    accountNumber: business?.bankDetails?.accountNumber || '',
    accountName: business?.bankDetails?.accountName || business?.businessName || '',
  });

  const [selectedProductId, setSelectedProductId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-generate invoice/quotation number
  const generateNewDocNumber = (docType: InvoiceType) => {
    const year = new Date().getFullYear();
    const prefix = docType === 'quote' ? 'QUO' : 'INV';
    const count = invoices.filter((i) => i.type === docType).length + 1;
    return `${prefix}-${year}-${String(count).padStart(3, '0')}`;
  };

  useEffect(() => {
    if (isOpen) {
      if (initialInvoice) {
        setType(initialInvoice.type);
        setInvoiceNumber(initialInvoice.invoiceNumber);
        setCustomerName(initialInvoice.customerName);
        setCustomerPhone(initialInvoice.customerPhone || '');
        setCustomerEmail(initialInvoice.customerEmail || '');
        setCustomerAddress(initialInvoice.customerAddress || '');
        setIssueDate(initialInvoice.issueDate);
        setDueDate(initialInvoice.dueDate);
        setItems(initialInvoice.items && initialInvoice.items.length > 0 ? initialInvoice.items : [
          { id: '1', description: '', quantity: 1, unitPrice: 0, total: 0 },
        ]);
        setDiscount(initialInvoice.discount || 0);
        setEnableVat((initialInvoice.taxRate || 0) > 0);
        setTaxRate(initialInvoice.taxRate || 7.5);
        setNotes(initialInvoice.notes || '');
        if (initialInvoice.bankDetails) {
          setBankDetails(initialInvoice.bankDetails);
        }
      } else {
        // New invoice/quote
        const newType: InvoiceType = (defaultType as InvoiceType) || 'invoice';
        setType(newType);
        setInvoiceNumber(generateNewDocNumber(newType));
        setCustomerName('');
        setCustomerPhone('');
        setCustomerEmail('');
        setCustomerAddress('');
        setSaveAsNewCustomer(false);
        setIssueDate(getTodayDateString());

        // Default due date to +7 days
        const due = new Date();
        due.setDate(due.getDate() + 7);
        const y = due.getFullYear();
        const m = String(due.getMonth() + 1).padStart(2, '0');
        const d = String(due.getDate()).padStart(2, '0');
        setDueDate(`${y}-${m}-${d}`);

        setItems([{ id: `item_${Date.now()}`, description: '', quantity: 1, unitPrice: 0, total: 0 }]);
        setDiscount(0);
        setEnableVat(false);
        setTaxRate(7.5);
        setNotes(business?.invoiceTerms || 'Payment due on delivery / receipt. Thank you for your business!');
        if (business?.bankDetails) {
          setBankDetails(business.bankDetails);
        }
      }
      setErrors({});
    }
  }, [isOpen, initialInvoice, defaultType, business]);

  if (!isOpen) return null;

  // Handle customer auto-select
  const handleSelectCustomer = (customerId: string) => {
    if (!customerId) return;
    const selected = customers.find((c) => c.id === customerId);
    if (selected) {
      setCustomerName(selected.name);
      setCustomerPhone(selected.phone || '');
      setCustomerEmail(selected.email || '');
      setCustomerAddress(selected.address || '');
    }
  };

  // Line item handlers
  const handleItemChange = (
    index: number,
    field: 'description' | 'quantity' | 'unitPrice',
    value: any
  ) => {
    const newItems = [...items];
    const item = { ...newItems[index] };

    if (field === 'description') {
      item.description = value;
    } else if (field === 'quantity') {
      item.quantity = Math.max(1, Number(value) || 1);
      item.total = item.quantity * item.unitPrice;
    } else if (field === 'unitPrice') {
      item.unitPrice = Math.max(0, Number(value) || 0);
      item.total = item.quantity * item.unitPrice;
    }

    newItems[index] = item;
    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      { id: `item_${Date.now()}`, description: '', quantity: 1, unitPrice: 0, total: 0 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleAddProductAsItem = (prodId: string) => {
    if (!prodId) return;
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;

    // If first item is empty, replace it
    if (items.length === 1 && !items[0].description) {
      setItems([
        {
          id: `item_${Date.now()}`,
          description: prod.name,
          quantity: 1,
          unitPrice: prod.defaultSellingPrice,
          total: prod.defaultSellingPrice,
        },
      ]);
    } else {
      setItems([
        ...items,
        {
          id: `item_${Date.now()}`,
          description: prod.name,
          quantity: 1,
          unitPrice: prod.defaultSellingPrice,
          total: prod.defaultSellingPrice,
        },
      ]);
    }
    setSelectedProductId('');
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const discountAmount = Math.min(Number(discount) || 0, subtotal);
  const taxableSubtotal = Math.max(0, subtotal - discountAmount);
  const taxAmount = enableVat ? (taxableSubtotal * (Number(taxRate) || 0)) / 100 : 0;
  const total = taxableSubtotal + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!customerName.trim()) {
      newErrors.customerName = 'Customer name is required';
    }
    if (!invoiceNumber.trim()) {
      newErrors.invoiceNumber = 'Invoice/Quotation number is required';
    }
    if (items.some((it) => !it.description.trim())) {
      newErrors.items = 'All items must have a description';
    }
    if (items.some((it) => it.unitPrice <= 0)) {
      newErrors.items = 'Item prices must be greater than zero';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      // If requested, optionally save new customer to directory
      if (saveAsNewCustomer && customerName.trim()) {
        const exists = customers.some(
          (c) => c.name.toLowerCase() === customerName.trim().toLowerCase()
        );
        if (!exists) {
          await addCustomer({
            name: customerName.trim(),
            phone: customerPhone.trim() || undefined,
            email: customerEmail.trim() || undefined,
            address: customerAddress.trim() || undefined,
          });
        }
      }

      if (initialInvoice) {
        await updateInvoice(initialInvoice.id, {
          invoiceNumber: invoiceNumber.trim(),
          type,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim() || undefined,
          customerEmail: customerEmail.trim() || undefined,
          customerAddress: customerAddress.trim() || undefined,
          items,
          subtotal,
          discount: discountAmount,
          taxRate: enableVat ? Number(taxRate) : 0,
          taxAmount,
          total,
          balanceDue: Math.max(0, total - initialInvoice.amountPaid),
          issueDate,
          dueDate: dueDate || issueDate,
          notes: notes.trim() || undefined,
          bankDetails,
        });
      } else {
        await addInvoice({
          invoiceNumber: invoiceNumber.trim(),
          type,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim() || undefined,
          customerEmail: customerEmail.trim() || undefined,
          customerAddress: customerAddress.trim() || undefined,
          items,
          subtotal,
          discount: discountAmount,
          taxRate: enableVat ? Number(taxRate) : 0,
          taxAmount,
          total,
          amountPaid: 0,
          balanceDue: total,
          status: 'sent',
          issueDate,
          dueDate: dueDate || issueDate,
          notes: notes.trim() || undefined,
          bankDetails,
        });
      }

      onClose();
    } catch (err: any) {
      setErrors({ general: err.message || 'Failed to save document' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold ${type === 'quote' ? 'bg-amber-600' : 'bg-emerald-700'}`}>
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {initialInvoice ? `Edit ${type === 'quote' ? 'Quotation' : 'Invoice'}` : `Create ${type === 'quote' ? 'Price Quotation' : 'Invoice'}`}
              </h2>
              <p className="text-xs text-slate-500">
                Professional, ready-to-share billing documents with Nigerian bank details
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {errors.general && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-semibold">
              {errors.general}
            </div>
          )}

          {/* Top Config Row: Document Type & Numbering */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/80 p-4 rounded-xl border border-slate-200/60">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Document Type
              </label>
              <div className="flex rounded-lg bg-slate-200/70 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setType('invoice');
                    if (!initialInvoice) setInvoiceNumber(generateNewDocNumber('invoice'));
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${
                    type === 'invoice'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Invoice
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType('quote');
                    if (!initialInvoice) setInvoiceNumber(generateNewDocNumber('quote'));
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${
                    type === 'quote'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Quotation
                </button>
              </div>
            </div>

            <div>
              <Input
                label="Document Number"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                error={errors.invoiceNumber}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Issue Date"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                required
              />
              <Input
                label="Due Date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Customer Selection & Details */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">Customer / Billed To</h3>
              </div>

              {customers.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Pick saved customer:</span>
                  <select
                    onChange={(e) => handleSelectCustomer(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select from directory...
                    </option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <Input
                label="Customer Full Name / Business"
                placeholder="e.g. Mrs. Folake Martins / VI Boutique"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                error={errors.customerName}
                required
              />
              <Input
                label="Phone Number (WhatsApp)"
                placeholder="e.g. 08034567890"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Email Address"
                placeholder="e.g. customer@gmail.com"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
              <Input
                label="Delivery / Store Address"
                placeholder="e.g. Plot 14, Victoria Island, Lagos"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
              />
            </div>

            {!initialInvoice && (
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={saveAsNewCustomer}
                  onChange={(e) => setSaveAsNewCustomer(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600 w-4 h-4"
                />
                <span>Save this customer into your Directory for easy future invoices</span>
              </label>
            )}
          </div>

          {/* Line Items Section */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">Line Items & Pricing</h3>
              </div>

              {products.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Insert from catalog:</span>
                  <select
                    value={selectedProductId}
                    onChange={(e) => handleAddProductAsItem(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="">+ Add catalog product...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatCurrency(p.defaultSellingPrice)})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {errors.items && (
              <p className="text-xs text-rose-600 font-semibold">{errors.items}</p>
            )}

            {/* Items Table */}
            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={item.id || index}
                  className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200/70"
                >
                  <div className="col-span-12 sm:col-span-6">
                    <input
                      type="text"
                      placeholder="Item description / service"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      className="w-full text-xs font-medium bg-white border border-slate-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>

                  <div className="col-span-4 sm:col-span-2">
                    <div className="relative">
                      <span className="absolute left-2 top-2 text-[10px] text-slate-400 font-bold">QTY</span>
                      <input
                        type="number"
                        min="1"
                        placeholder="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        className="w-full text-xs font-semibold pl-9 pr-2 py-2 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-600 text-center"
                      />
                    </div>
                  </div>

                  <div className="col-span-5 sm:col-span-3">
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-bold">₦</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="Unit Price"
                        value={item.unitPrice || ''}
                        onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                        className="w-full text-xs font-semibold pl-6 pr-2 py-2 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-600 text-right"
                      />
                    </div>
                  </div>

                  <div className="col-span-3 sm:col-span-1 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      disabled={items.length <= 1}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md disabled:opacity-30"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItem}
              className="text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Another Line Item
            </Button>
          </div>

          {/* Totals & Tax / Discount Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/80 p-4 rounded-xl border border-slate-200/60">
            {/* Payment & Bank Details Configuration */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-200/60">
                <Building2 className="w-4 h-4 text-emerald-700" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Bank Details for Transfer
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Bank Name (e.g. GTBank)"
                  value={bankDetails.bankName}
                  onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                  className="text-xs bg-white border border-slate-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium"
                />
                <input
                  type="text"
                  placeholder="Account Number (10 digits)"
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                  className="text-xs bg-white border border-slate-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-bold"
                />
              </div>
              <input
                type="text"
                placeholder="Account Name (e.g. Ada Fashion Store)"
                value={bankDetails.accountName}
                onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                className="w-full text-xs bg-white border border-slate-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium"
              />

              <div className="pt-2">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Payment Terms & Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. 50% commitment deposit before tailoring; balance on delivery."
                  className="w-full text-xs bg-white border border-slate-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>

            {/* Calculations Column */}
            <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center text-xs text-slate-600">
                <span>Subtotal:</span>
                <span className="font-bold text-slate-900">{formatCurrency(subtotal)}</span>
              </div>

              {/* Discount Row */}
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-slate-600">Discount (₦):</span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={discount || ''}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                  className="w-28 text-xs font-semibold px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-right focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              {/* VAT Row */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={enableVat}
                    onChange={(e) => setEnableVat(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600 w-3.5 h-3.5"
                  />
                  <span>Add VAT ({taxRate}%)</span>
                </label>
                {enableVat && (
                  <span className="font-bold text-slate-900">+{formatCurrency(taxAmount)}</span>
                )}
              </div>

              {/* Grand Total */}
              <div className="flex justify-between items-center text-base font-extrabold text-slate-900 border-t-2 border-slate-200 pt-3 mt-2 bg-emerald-50/50 p-2.5 rounded-lg text-emerald-950">
                <span>Total Amount:</span>
                <span className="text-emerald-800 text-lg font-black">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className={type === 'quote' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-700 hover:bg-emerald-800'}
            >
              {initialInvoice ? 'Save Changes' : `Create ${type === 'quote' ? 'Quotation' : 'Invoice'}`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
