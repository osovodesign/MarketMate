import React, { useState, useMemo } from 'react';
import {
  Users,
  Building2,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  FileText,
  CreditCard,
  Edit2,
  Trash2,
  ShoppingBag,
  ArrowRight,
  TrendingUp,
  Tag,
  Receipt,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { Customer, Supplier, Invoice } from '../../types';
import { useBusinessData } from '../../context/BusinessDataContext';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { CustomerModal } from './CustomerModal';
import { SupplierModal } from './SupplierModal';
import { InvoiceModal } from '../invoices/InvoiceModal';

interface ContactsViewProps {
  onOpenRecordExpense?: (prefillDescription?: string) => void;
  onOpenRecordSale?: (prefillCustomer?: string) => void;
  onOpenRecordDebt?: (prefillCustomer?: string, prefillPhone?: string) => void;
}

export const ContactsView: React.FC<ContactsViewProps> = ({
  onOpenRecordExpense,
  onOpenRecordSale,
  onOpenRecordDebt,
}) => {
  const {
    customers,
    suppliers,
    sales,
    invoices,
    debts,
    deleteCustomer,
    deleteSupplier,
  } = useBusinessData();

  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers'>('customers');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Invoice creation from customer card
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoicePrefillCustomer, setInvoicePrefillCustomer] = useState<Customer | null>(null);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchesName = c.name.toLowerCase().includes(q);
      const matchesPhone = c.phone ? c.phone.includes(q) : false;
      const matchesEmail = c.email ? c.email.toLowerCase().includes(q) : false;
      const matchesAddress = c.address ? c.address.toLowerCase().includes(q) : false;
      const matchesNotes = c.notes ? c.notes.toLowerCase().includes(q) : false;
      return matchesName || matchesPhone || matchesEmail || matchesAddress || matchesNotes;
    });
  }, [customers, searchQuery]);

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchesName = s.name.toLowerCase().includes(q);
      const matchesContact = s.contactPerson ? s.contactPerson.toLowerCase().includes(q) : false;
      const matchesMarket = s.marketLocation ? s.marketLocation.toLowerCase().includes(q) : false;
      const matchesCat = s.supplyCategory ? s.supplyCategory.toLowerCase().includes(q) : false;
      const matchesPhone = s.phone ? s.phone.includes(q) : false;
      return matchesName || matchesContact || matchesMarket || matchesCat || matchesPhone;
    });
  }, [suppliers, searchQuery]);

  // Helper to get customer analytics
  const getCustomerMetrics = (cust: Customer) => {
    const custSales = sales.filter(
      (s) => s.customerName && s.customerName.toLowerCase() === cust.name.toLowerCase()
    );
    const custInvoices = invoices.filter(
      (i) => i.customerName.toLowerCase() === cust.name.toLowerCase()
    );
    const custDebts = debts.filter(
      (d) => d.customerName.toLowerCase() === cust.name.toLowerCase()
    );

    const totalSalesVolume = custSales.reduce((sum, s) => sum + s.revenue, 0);
    const unpaidInvoiceBalance = custInvoices
      .filter((i) => i.type === 'invoice' && i.status !== 'paid')
      .reduce((sum, i) => sum + i.balanceDue, 0);
    const activeDebtBalance = custDebts
      .filter((d) => d.status !== 'settled')
      .reduce((sum, d) => sum + d.remainingBalance, 0);

    const totalOutstandingOwed = unpaidInvoiceBalance + activeDebtBalance;

    return {
      salesCount: custSales.length + custInvoices.length,
      totalSalesVolume,
      totalOutstandingOwed,
      invoiceCount: custInvoices.length,
    };
  };

  const handleOpenWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const phoneFormatted = cleanPhone.startsWith('0') ? '234' + cleanPhone.substring(1) : cleanPhone;
    const text = encodeURIComponent(`Hello ${name}, thank you for patronizing our business! How may we assist you today?`);
    window.open(`https://wa.me/${phoneFormatted}?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Contacts & Directory
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Organize customer relationships, client credit histories, and wholesale market vendor contacts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'customers' ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingCustomer(null);
                setIsCustomerModalOpen(true);
              }}
              className="bg-emerald-700 hover:bg-emerald-800 shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Customer
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingSupplier(null);
                setIsSupplierModalOpen(true);
              }}
              className="bg-amber-600 hover:bg-amber-700 shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Supplier / Vendor
            </Button>
          )}
        </div>
      </div>

      {/* Directory Tabs & Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center rounded-lg bg-slate-100 p-1 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('customers')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-colors ${
              activeTab === 'customers'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Customers & Clients ({customers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('suppliers')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-colors ${
              activeTab === 'suppliers'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Suppliers & Market Hubs ({suppliers.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder={
              activeTab === 'customers'
                ? 'Search customer name, phone...'
                : 'Search supplier, market location...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium"
          />
        </div>
      </div>

      {/* Tab 1: Customers Content */}
      {activeTab === 'customers' && (
        <>
          {filteredCustomers.length === 0 ? (
            <EmptyState
              title={searchQuery ? 'No matching customers found' : 'No customers saved yet'}
              description={
                searchQuery
                  ? 'Try searching with a different name, phone number, or address.'
                  : 'Add customer profiles to quickly issue invoices, record credit debts, and stay connected via WhatsApp.'
              }
              actionLabel="Add First Customer"
              onAction={() => {
                setEditingCustomer(null);
                setIsCustomerModalOpen(true);
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCustomers.map((cust) => {
                const metrics = getCustomerMetrics(cust);

                return (
                  <Card
                    key={cust.id}
                    className="p-5 bg-white border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Customer Top Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm shrink-0">
                            {cust.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-slate-900 leading-tight">
                              {cust.name}
                            </h3>
                            <p className="text-[11px] text-slate-400">
                              Added {formatDate(cust.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingCustomer(cust);
                              setIsCustomerModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit Customer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete customer ${cust.name}?`)) {
                                deleteCustomer(cust.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Contact Channels */}
                      <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                        {cust.phone && (
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-slate-700 font-semibold">
                              <Phone className="w-3.5 h-3.5 text-emerald-600" />
                              {cust.phone}
                            </span>
                            <button
                              onClick={() => handleOpenWhatsApp(cust.phone!, cust.name)}
                              className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold hover:underline"
                            >
                              <MessageCircle className="w-3 h-3" />
                              WhatsApp
                            </button>
                          </div>
                        )}

                        {cust.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{cust.email}</span>
                          </div>
                        )}

                        {cust.address && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{cust.address}</span>
                          </div>
                        )}

                        {cust.notes && (
                          <div className="p-2 bg-slate-50 rounded-lg text-[11px] text-slate-600 border border-slate-100 italic mt-2">
                            "{cust.notes}"
                          </div>
                        )}
                      </div>

                      {/* Relationship Stats Pill */}
                      <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">
                            Total Purchases
                          </span>
                          <span className="text-sm font-bold text-slate-900">
                            {formatCurrency(metrics.totalSalesVolume)}
                          </span>
                        </div>

                        <div className="bg-amber-50/60 p-2 rounded-lg border border-amber-100">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">
                            Outstanding Balance
                          </span>
                          <span
                            className={`text-sm font-extrabold ${
                              metrics.totalOutstandingOwed > 0
                                ? 'text-amber-900'
                                : 'text-slate-400'
                            }`}
                          >
                            {formatCurrency(metrics.totalOutstandingOwed)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Card Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        fullWidth
                        onClick={() => {
                          setInvoicePrefillCustomer(cust);
                          setInvoiceModalOpen(true);
                        }}
                        className="text-xs text-emerald-800 border-emerald-200 hover:bg-emerald-50"
                      >
                        <FileText className="w-3.5 h-3.5 mr-1 text-emerald-700" />
                        Invoice
                      </Button>

                      {onOpenRecordSale && (
                        <Button
                          variant="outline"
                          size="sm"
                          fullWidth
                          onClick={() => onOpenRecordSale(cust.name)}
                          className="text-xs text-slate-700 hover:bg-slate-50"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 mr-1 text-slate-500" />
                          Sale
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Tab 2: Suppliers Content */}
      {activeTab === 'suppliers' && (
        <>
          {filteredSuppliers.length === 0 ? (
            <EmptyState
              title={searchQuery ? 'No matching suppliers found' : 'No suppliers registered yet'}
              description={
                searchQuery
                  ? 'Try searching with a different market hub, supplier name, or product category.'
                  : 'Maintain a supplier directory for quick expense logging, restocking orders, and market negotiation.'
              }
              actionLabel="Add First Supplier"
              onAction={() => {
                setEditingSupplier(null);
                setIsSupplierModalOpen(true);
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSuppliers.map((sup) => (
                <Card
                  key={sup.id}
                  className="p-5 bg-white border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Supplier Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 font-bold flex items-center justify-center text-sm shrink-0 mt-0.5">
                          <Building2 className="w-4 h-4 text-amber-700" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900 leading-snug">
                            {sup.name}
                          </h3>
                          {sup.contactPerson && (
                            <p className="text-xs text-slate-500 font-medium">
                              Rep: {sup.contactPerson}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingSupplier(sup);
                            setIsSupplierModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Supplier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete supplier ${sup.name}?`)) {
                              deleteSupplier(sup.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Market Location & Supply Tag */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {sup.marketLocation && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {sup.marketLocation}
                        </span>
                      )}
                      {sup.supplyCategory && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60">
                          <Tag className="w-3 h-3 text-amber-600" />
                          {sup.supplyCategory}
                        </span>
                      )}
                    </div>

                    {/* Contact Details */}
                    <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                      {sup.phone && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 font-medium text-slate-800">
                            <Phone className="w-3.5 h-3.5 text-amber-700" />
                            {sup.phone}
                          </span>
                          <button
                            onClick={() => handleOpenWhatsApp(sup.phone!, sup.name)}
                            className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold hover:underline"
                          >
                            <MessageCircle className="w-3 h-3" />
                            WhatsApp
                          </button>
                        </div>
                      )}

                      {sup.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{sup.email}</span>
                        </div>
                      )}

                      {sup.notes && (
                        <div className="p-2 bg-slate-50 rounded-lg text-[11px] text-slate-600 border border-slate-100 italic mt-2">
                          "{sup.notes}"
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Supplier Bottom Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                    {onOpenRecordExpense && (
                      <Button
                        variant="outline"
                        size="sm"
                        fullWidth
                        onClick={() => onOpenRecordExpense(`Purchase from ${sup.name}`)}
                        className="text-xs text-amber-900 border-amber-200 hover:bg-amber-50"
                      >
                        <Receipt className="w-3.5 h-3.5 mr-1 text-amber-700" />
                        Log Expense
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Customer Modal */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        customer={editingCustomer}
      />

      {/* Supplier Modal */}
      <SupplierModal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        supplier={editingSupplier}
      />

      {/* Invoice Generator from Customer Card */}
      <InvoiceModal
        isOpen={invoiceModalOpen}
        onClose={() => {
          setInvoiceModalOpen(false);
          setInvoicePrefillCustomer(null);
        }}
        initialInvoice={
          invoicePrefillCustomer
            ? ({
                id: '',
                businessId: '',
                invoiceNumber: '',
                type: 'invoice',
                customerName: invoicePrefillCustomer.name,
                customerPhone: invoicePrefillCustomer.phone,
                customerEmail: invoicePrefillCustomer.email,
                customerAddress: invoicePrefillCustomer.address,
                items: [{ id: '1', description: '', quantity: 1, unitPrice: 0, total: 0 }],
                subtotal: 0,
                discount: 0,
                taxRate: 0,
                taxAmount: 0,
                total: 0,
                amountPaid: 0,
                balanceDue: 0,
                status: 'draft',
                issueDate: formatDate(new Date().toISOString()),
                dueDate: '',
                createdAt: '',
                updatedAt: '',
              } as Invoice)
            : null
        }
      />
    </div>
  );
};
