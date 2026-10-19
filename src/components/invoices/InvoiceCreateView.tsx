import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  FileText,
  Plus,
  Trash2,
  Building2,
  Calendar,
  User,
  Package,
  Percent,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Send,
} from 'lucide-react';
import { Invoice, InvoiceItem, InvoiceType, BankDetails, Customer } from '../../types';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, getTodayDateString } from '../../lib/formatters';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface InvoiceCreateViewProps {
  onBack: () => void;
  onSuccess?: () => void;
  initialInvoice?: Invoice | null;
  defaultType?: InvoiceType;
}

export const InvoiceCreateView: React.FC<InvoiceCreateViewProps> = ({
  onBack,
  onSuccess,
  initialInvoice,
  defaultType = 'invoice',
}) => {
  const { business } = useAuth();
  const { products, customers, invoices, addInvoice, updateInvoice, addCustomer } = useBusinessData();
  const currency = business?.currency || 'NGN';

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
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-generate invoice/quotation number
  const generateNewDocNumber = (docType: InvoiceType) => {
    const year = new Date().getFullYear();
    const prefix = docType === 'quote' ? 'QUO' : 'INV';
    const count = invoices.filter((i) => i.type === docType).length + 1;
    return `${prefix}-${year}-${String(count).padStart(3, '0')}`;
  };

  useEffect(() => {
    if (initialInvoice) {
      setType(initialInvoice.type);
      setInvoiceNumber(initialInvoice.invoiceNumber);
      setCustomerName(initialInvoice.customerName);
      setCustomerPhone(initialInvoice.customerPhone || '');
      setCustomerEmail(initialInvoice.customerEmail || '');
      setCustomerAddress(initialInvoice.customerAddress || '');
      setIssueDate(initialInvoice.issueDate);
      setDueDate(initialInvoice.dueDate);
      setItems(
        initialInvoice.items && initialInvoice.items.length > 0
          ? initialInvoice.items
          : [{ id: '1', description: '', quantity: 1, unitPrice: 0, total: 0 }]
      );
      setDiscount(initialInvoice.discount || 0);
      setEnableVat((initialInvoice.taxRate || 0) > 0);
      setTaxRate(initialInvoice.taxRate || 7.5);
      setNotes(initialInvoice.notes || '');
      if (initialInvoice.bankDetails) {
        setBankDetails(initialInvoice.bankDetails);
      }
    } else {
      const newType: InvoiceType = (defaultType as InvoiceType) || 'invoice';
      setType(newType);
      setInvoiceNumber(generateNewDocNumber(newType));
      const today = new Date();
      const inTwoWeeks = new Date(today);
      inTwoWeeks.setDate(today.getDate() + 14);
      setDueDate(inTwoWeeks.toISOString().split('T')[0]);
    }
  }, [initialInvoice, defaultType]);

  // When type changes on a new document, update document number prefix
  const handleTypeChange = (newType: InvoiceType) => {
    setType(newType);
    if (!initialInvoice) {
      setInvoiceNumber(generateNewDocNumber(newType));
    }
  };

  // Customer Selection Auto-fill
  const handleSelectCustomer = (customerId: string) => {
    if (!customerId) return;
    const found = customers.find((c) => c.id === customerId);
    if (found) {
      setCustomerName(found.name);
      setCustomerPhone(found.phone || '');
      setCustomerEmail(found.email || '');
      setCustomerAddress(found.address || '');
    }
  };

  // Add Item from Product Catalog
  const handleAddCatalogProduct = (prodId: string) => {
    if (!prodId) return;
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;

    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: prod.name,
      quantity: 1,
      unitPrice: prod.defaultSellingPrice,
      total: prod.defaultSellingPrice,
    };

    if (items.length === 1 && !items[0].description) {
      setItems([newItem]);
    } else {
      setItems([...items, newItem]);
    }
    setSelectedProductId('');
  };

  const handleUpdateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    const current = { ...updated[index] };

    if (field === 'quantity') {
      const qty = Math.max(1, Number(value) || 0);
      current.quantity = qty;
      current.total = qty * current.unitPrice;
    } else if (field === 'unitPrice') {
      const price = Math.max(0, Number(value) || 0);
      current.unitPrice = price;
      current.total = current.quantity * price;
    } else if (field === 'description') {
      current.description = value;
    }

    updated[index] = current;
    setItems(updated);
  };

  const handleAddItemRow = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0, total: 0 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = enableVat ? (subtotal * taxRate) / 100 : 0;
  const grandTotal = Math.max(0, subtotal - discount + taxAmount);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!customerName.trim()) {
      errs.customerName = 'Customer name is required';
    }
    if (!issueDate) {
      errs.issueDate = 'Issue date is required';
    }
    if (!dueDate) {
      errs.dueDate = 'Due date is required';
    }
    const hasValidItem = items.some((item) => item.description.trim() && item.total > 0);
    if (!hasValidItem) {
      errs.items = 'Please add at least one line item with description and price';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (saveAsNewCustomer && customerName.trim()) {
        const existingCust = customers.find(
          (c) => c.name.toLowerCase() === customerName.toLowerCase()
        );
        if (!existingCust) {
          await addCustomer({
            name: customerName.trim(),
            phone: customerPhone.trim() || undefined,
            email: customerEmail.trim() || undefined,
            address: customerAddress.trim() || undefined,
          });
        }
      }

      const invoiceData = {
        type,
        invoiceNumber,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        customerEmail: customerEmail.trim() || undefined,
        customerAddress: customerAddress.trim() || undefined,
        issueDate,
        dueDate,
        items: items.filter((item) => item.description.trim()),
        subtotal,
        discount,
        taxRate: enableVat ? taxRate : 0,
        taxAmount,
        total: grandTotal,
        amountPaid: initialInvoice ? initialInvoice.amountPaid : 0,
        balanceDue: initialInvoice
          ? Math.max(0, grandTotal - initialInvoice.amountPaid)
          : grandTotal,
        notes: notes.trim() || undefined,
        bankDetails,
      };

      if (initialInvoice) {
        await updateInvoice(initialInvoice.id, invoiceData);
      } else {
        await addInvoice(invoiceData);
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
      setErrors({ form: err.message || 'Failed to save invoice document' });
    } finally {
      setIsSubmitting(false);
    }
  };

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
                Invoices & Billing
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-mono">{invoiceNumber}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {initialInvoice
                ? `Edit ${type === 'quote' ? 'Quotation' : 'Invoice'}`
                : `Create New ${type === 'quote' ? 'Price Quotation' : 'Official Invoice'}`}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Generate branded professional bills with verified Nigerian bank details & WhatsApp delivery
            </p>
          </div>
        </div>

        {/* Document Type Selector Toggle */}
        {!initialInvoice && (
          <div className="inline-flex p-1 bg-slate-100 rounded-xl self-start sm:self-auto border border-slate-200/80">
            <button
              type="button"
              onClick={() => handleTypeChange('invoice')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                type === 'invoice'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Invoice (Bill)
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('quote')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                type === 'quote'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Price Quote
            </button>
          </div>
        )}
      </div>

      {/* Main Centered Form Card */}
      <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 sm:p-7">
        {isSuccess ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {type === 'quote' ? 'Quotation Saved Successfully!' : 'Invoice Created Successfully!'}
            </h2>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Document <strong className="text-slate-800 font-mono">{invoiceNumber}</strong> is ready for review, PDF download, and WhatsApp dispatch.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.form && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errors.form}</span>
              </div>
            )}

            {/* Document Header & Meta */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Document Number
                </label>
                <Input
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="font-mono font-bold text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Issue Date</span>
                </label>
                <Input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{type === 'quote' ? 'Valid Until' : 'Payment Due Date'}</span>
                </label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Customer Details */}
            <div className="space-y-3.5 p-4 rounded-xl bg-slate-50/70 border border-slate-200/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <User className="w-4 h-4 text-emerald-800" />
                  <span>Bill To (Customer Information)</span>
                </div>
                {customers.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">Quick Fill from CRM:</span>
                    <select
                      onChange={(e) => handleSelectCustomer(e.target.value)}
                      className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Choose Customer...
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Customer / Business Name *
                  </label>
                  <Input
                    placeholder="e.g. Chief Emeka or Prime Ventures"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    error={errors.customerName}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    WhatsApp / Phone Number
                  </label>
                  <Input
                    placeholder="e.g. 0803 123 4567"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Email Address (Optional)
                  </label>
                  <Input
                    type="email"
                    placeholder="customer@email.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Billing / Delivery Address
                  </label>
                  <Input
                    placeholder="e.g. Shop 14, Alaba Int'l Market, Lagos"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                  />
                </div>
              </div>

              {!initialInvoice && (
                <label className="flex items-center gap-2 text-xs text-slate-600 font-medium cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={saveAsNewCustomer}
                    onChange={(e) => setSaveAsNewCustomer(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-800 border-slate-300 focus:ring-emerald-700"
                  />
                  <span>Save this contact to my Customer CRM Directory automatically</span>
                </label>
              )}
            </div>

            {/* Line Items Table */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <Package className="w-4 h-4 text-emerald-800" />
                  <span>Items & Services</span>
                </div>

                {products.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">Pick from Catalog:</span>
                    <select
                      value={selectedProductId}
                      onChange={(e) => handleAddCatalogProduct(e.target.value)}
                      className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    >
                      <option value="">+ Add Product...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({formatCurrency(p.defaultSellingPrice, currency)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {errors.items && (
                <p className="text-xs text-rose-600 font-semibold">{errors.items}</p>
              )}

              <div className="border border-slate-200/90 rounded-xl overflow-hidden divide-y divide-slate-100">
                <div className="bg-slate-50 grid grid-cols-12 gap-2 p-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <div className="col-span-6 sm:col-span-6">Description</div>
                  <div className="col-span-2 sm:col-span-2 text-center">Qty</div>
                  <div className="col-span-2 sm:col-span-2 text-right">Unit Price</div>
                  <div className="col-span-2 sm:col-span-2 text-right">Total</div>
                </div>

                {items.map((item, idx) => (
                  <div key={item.id || idx} className="p-2.5 grid grid-cols-12 gap-2 items-center bg-white">
                    <div className="col-span-6 sm:col-span-6">
                      <Input
                        placeholder="Item or service name..."
                        value={item.description}
                        onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-2">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(idx, 'quantity', e.target.value)}
                        className="text-xs text-center"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-2">
                      <Input
                        type="number"
                        min="0"
                        value={item.unitPrice || ''}
                        onChange={(e) => handleUpdateItem(idx, 'unitPrice', e.target.value)}
                        className="text-xs text-right font-mono"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-2 flex items-center justify-end gap-1.5">
                      <span className="text-xs font-mono font-bold text-slate-800 tabular-nums">
                        {formatCurrency(item.total, currency)}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItemRow}
                className="w-full text-xs font-semibold text-slate-700 border-dashed"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Another Line Item
              </Button>
            </div>

            {/* Totals & Adjustments Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              {/* Payment Details & Notes */}
              <div className="space-y-3.5">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <CreditCard className="w-4 h-4 text-emerald-800" />
                    <span>Payment Destination (Bank Details)</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <Input
                      label="Bank Name"
                      value={bankDetails.bankName}
                      onChange={(e) =>
                        setBankDetails({ ...bankDetails, bankName: e.target.value })
                      }
                      placeholder="e.g. Zenith Bank PLC"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        label="Account Number"
                        value={bankDetails.accountNumber}
                        onChange={(e) =>
                          setBankDetails({ ...bankDetails, accountNumber: e.target.value })
                        }
                        placeholder="0123456789"
                        className="font-mono"
                      />
                      <Input
                        label="Account Name"
                        value={bankDetails.accountName}
                        onChange={(e) =>
                          setBankDetails({ ...bankDetails, accountName: e.target.value })
                        }
                        placeholder="Company name"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Terms & Payment Notes
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Payment due within 14 days. Thank you for your business!"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                </div>
              </div>

              {/* Math Summary Box */}
              <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3">
                <div className="flex justify-between items-center text-xs text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold text-slate-800 tabular-nums">
                    {formatCurrency(subtotal, currency)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-600">
                  <span>Discount ({currency}):</span>
                  <input
                    type="number"
                    min="0"
                    value={discount || ''}
                    onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                    placeholder="0"
                    className="w-28 text-right font-mono text-xs p-1.5 border border-slate-200 rounded-lg bg-white"
                  />
                </div>

                <div className="flex justify-between items-center text-xs text-slate-600">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableVat}
                      onChange={(e) => setEnableVat(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-emerald-800 border-slate-300 focus:ring-emerald-700"
                    />
                    <span>Add VAT (7.5%):</span>
                  </label>
                  <span className="font-mono text-slate-700 tabular-nums">
                    {formatCurrency(taxAmount, currency)}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-900">Total Due:</span>
                  <span className="text-xl font-black text-emerald-800 font-mono tabular-nums">
                    {formatCurrency(grandTotal, currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions: Cancel & Submit Buttons */}
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
                <Send className="w-4 h-4 mr-2" />
                {initialInvoice
                  ? 'Update Document'
                  : type === 'quote'
                  ? 'Save Quotation'
                  : 'Issue Invoice'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
