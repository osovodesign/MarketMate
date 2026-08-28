import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Share2,
  Printer,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  MoreVertical,
  Edit2,
  Trash2,
  ArrowRight,
  TrendingUp,
  Building2,
  Eye,
  Send,
} from 'lucide-react';
import { Invoice, InvoiceType, InvoiceStatus } from '../../types';
import { useBusinessData } from '../../context/BusinessDataContext';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { InvoiceModal } from './InvoiceModal';
import { InvoicePreviewModal } from './InvoicePreviewModal';
import { RecordInvoicePaymentModal } from './RecordInvoicePaymentModal';

export const InvoicesView: React.FC = () => {
  const { invoices, deleteInvoice, updateInvoice, addInvoice } = useBusinessData();

  const [activeTypeFilter, setActiveTypeFilter] = useState<'all' | 'invoice' | 'quote'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createDefaultType, setCreateDefaultType] = useState<InvoiceType>('invoice');
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [previewingInvoice, setPreviewingInvoice] = useState<Invoice | null>(null);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);

  // Top Statistics
  const stats = useMemo(() => {
    const onlyInvoices = invoices.filter((i) => i.type === 'invoice');
    const onlyQuotes = invoices.filter((i) => i.type === 'quote');

    const totalInvoiced = onlyInvoices.reduce((sum, i) => sum + i.total, 0);
    const totalCollected = onlyInvoices.reduce((sum, i) => sum + i.amountPaid, 0);
    const totalOutstanding = onlyInvoices
      .filter((i) => i.status !== 'paid')
      .reduce((sum, i) => sum + i.balanceDue, 0);
    const totalQuotesValue = onlyQuotes.reduce((sum, i) => sum + i.total, 0);

    return {
      totalInvoiced,
      totalCollected,
      totalOutstanding,
      totalQuotesValue,
      invoiceCount: onlyInvoices.length,
      quoteCount: onlyQuotes.length,
    };
  }, [invoices]);

  // Filtered List
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Type filter
      if (activeTypeFilter !== 'all' && inv.type !== activeTypeFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && inv.status !== statusFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = inv.customerName.toLowerCase().includes(q);
        const matchesNumber = inv.invoiceNumber.toLowerCase().includes(q);
        const matchesItem = inv.items.some((it) => it.description.toLowerCase().includes(q));
        const matchesPhone = inv.customerPhone ? inv.customerPhone.includes(q) : false;
        return matchesName || matchesNumber || matchesItem || matchesPhone;
      }

      return true;
    });
  }, [invoices, activeTypeFilter, statusFilter, searchQuery]);

  // Convert Quote to Invoice
  const handleConvertToInvoice = async (quote: Invoice) => {
    const year = new Date().getFullYear();
    const count = invoices.filter((i) => i.type === 'invoice').length + 1;
    const newNumber = `INV-${year}-${String(count).padStart(3, '0')}`;

    await addInvoice({
      invoiceNumber: newNumber,
      type: 'invoice',
      customerName: quote.customerName,
      customerPhone: quote.customerPhone,
      customerEmail: quote.customerEmail,
      customerAddress: quote.customerAddress,
      items: quote.items,
      subtotal: quote.subtotal,
      discount: quote.discount,
      taxRate: quote.taxRate,
      taxAmount: quote.taxAmount,
      total: quote.total,
      amountPaid: 0,
      balanceDue: quote.total,
      status: 'sent',
      issueDate: quote.issueDate,
      dueDate: quote.dueDate,
      notes: `Converted from Quotation #${quote.invoiceNumber}. ${quote.notes || ''}`.trim(),
      bankDetails: quote.bankDetails,
    });

    // Mark quote as converted / paid or keep
    await updateInvoice(quote.id, { status: 'paid' });
    setPreviewingInvoice(null);
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
            <CheckCircle className="w-3 h-3" /> Paid
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3" /> Partial
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
            <Send className="w-3 h-3" /> Sent
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            Draft
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
            <AlertCircle className="w-3 h-3" /> Overdue
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Invoices & Quotations
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Create professional invoices, send PDF/WhatsApp bills, and track customer payments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingInvoice(null);
              setCreateDefaultType('quote');
              setIsCreateModalOpen(true);
            }}
            className="text-amber-800 border-amber-300 hover:bg-amber-50"
          >
            <Plus className="w-4 h-4 mr-1 text-amber-600" />
            New Quote
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingInvoice(null);
              setCreateDefaultType('invoice');
              setIsCreateModalOpen(true);
            }}
            className="bg-emerald-700 hover:bg-emerald-800 shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            New Invoice
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Invoiced</span>
            <FileText className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-lg sm:text-2xl font-bold text-slate-900">
            {formatCurrency(stats.totalInvoiced)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">{stats.invoiceCount} issued invoices</p>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Payments Collected</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-lg sm:text-2xl font-bold text-emerald-700">
            {formatCurrency(stats.totalCollected)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Directly received revenue</p>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Unpaid / Due</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-lg sm:text-2xl font-bold text-amber-800">
            {formatCurrency(stats.totalOutstanding)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Pending customer remittances</p>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Quotations</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-lg sm:text-2xl font-bold text-blue-900">
            {formatCurrency(stats.totalQuotesValue)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">{stats.quoteCount} price quotes</p>
        </Card>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
        {/* Type Tabs */}
        <div className="flex items-center rounded-lg bg-slate-100 p-1 w-full sm:w-auto">
          <button
            onClick={() => setActiveTypeFilter('all')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
              activeTypeFilter === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Docs ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTypeFilter('invoice')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
              activeTypeFilter === 'invoice'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Invoices ({stats.invoiceCount})
          </button>
          <button
            onClick={() => setActiveTypeFilter('quote')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
              activeTypeFilter === 'quote'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Quotations ({stats.quoteCount})
          </button>
        </div>

        {/* Search & Status Controls */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer, #no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 font-medium"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-600 shrink-0"
          >
            <option value="all">All Statuses</option>
            <option value="sent">Sent / Pending</option>
            <option value="partial">Partially Paid</option>
            <option value="paid">Paid</option>
            <option value="draft">Draft</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Invoices List / Table */}
      {filteredInvoices.length === 0 ? (
        <EmptyState
          title={searchQuery || statusFilter !== 'all' ? 'No matching documents' : 'No invoices or quotes yet'}
          description={
            searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search terms or filters to find what you are looking for.'
              : 'Generate clean, branded invoices and quotations in seconds with bank transfer details and WhatsApp sharing.'
          }
          actionLabel="Create First Invoice"
          onAction={() => {
            setEditingInvoice(null);
            setCreateDefaultType('invoice');
            setIsCreateModalOpen(true);
          }}
        />
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map((inv) => {
            const isQuote = inv.type === 'quote';
            const isPaid = inv.status === 'paid';

            return (
              <Card
                key={inv.id}
                className="p-4 sm:p-5 hover:border-slate-300 transition-all bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Left: Document Info */}
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shrink-0 ${
                      isQuote ? 'bg-amber-600' : 'bg-emerald-700'
                    }`}
                  >
                    <FileText className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-900">{inv.invoiceNumber}</span>
                      <span
                        className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                          isQuote
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isQuote ? 'Quotation' : 'Invoice'}
                      </span>
                      {getStatusBadge(inv.status)}
                    </div>

                    <h4 className="text-base font-bold text-slate-900 mt-1">{inv.customerName}</h4>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                      <span>Issued: {formatDate(inv.issueDate)}</span>
                      <span>•</span>
                      <span>Due: {formatDate(inv.dueDate)}</span>
                      {inv.customerPhone && (
                        <>
                          <span>•</span>
                          <span>{inv.customerPhone}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{inv.items.length} {inv.items.length === 1 ? 'item' : 'items'}</span>
                    </div>
                  </div>
                </div>

                {/* Middle: Financials */}
                <div className="flex items-center gap-6 border-t lg:border-t-0 border-slate-100 pt-3 lg:pt-0">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Total Amount
                    </span>
                    <span className="text-base font-extrabold text-slate-900">
                      {formatCurrency(inv.total)}
                    </span>
                  </div>

                  {!isQuote && (
                    <>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Paid
                        </span>
                        <span className="text-sm font-bold text-emerald-700">
                          {formatCurrency(inv.amountPaid)}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Balance Due
                        </span>
                        <span
                          className={`text-sm font-extrabold ${
                            inv.balanceDue > 0 ? 'text-amber-900' : 'text-slate-400'
                          }`}
                        >
                          {formatCurrency(inv.balanceDue)}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 border-t lg:border-t-0 border-slate-100 pt-3 lg:pt-0 justify-end">
                  {isQuote && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleConvertToInvoice(inv)}
                      className="text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                      title="Convert to standard Tax Invoice"
                    >
                      <ArrowRight className="w-3.5 h-3.5 mr-1" />
                      Convert
                    </Button>
                  )}

                  {!isQuote && !isPaid && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setPayingInvoice(inv)}
                      className="text-xs bg-emerald-700 hover:bg-emerald-800"
                    >
                      <CreditCard className="w-3.5 h-3.5 mr-1" />
                      Pay
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewingInvoice(inv)}
                    className="text-xs text-slate-700 hover:bg-slate-50"
                    title="Preview / Print / Share"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    Preview
                  </Button>

                  <button
                    onClick={() => {
                      setEditingInvoice(inv);
                      setIsCreateModalOpen(true);
                    }}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Edit Invoice"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete ${inv.invoiceNumber}?`)) {
                        deleteInvoice(inv.id);
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <InvoiceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        initialInvoice={editingInvoice}
        defaultType={createDefaultType}
      />

      {/* Preview / Print / WhatsApp Share Modal */}
      <InvoicePreviewModal
        isOpen={!!previewingInvoice}
        onClose={() => setPreviewingInvoice(null)}
        invoice={previewingInvoice}
        onRecordPayment={(inv) => {
          setPreviewingInvoice(null);
          setPayingInvoice(inv);
        }}
        onConvertToInvoice={(quote) => handleConvertToInvoice(quote)}
      />

      {/* Record Payment Modal */}
      <RecordInvoicePaymentModal
        isOpen={!!payingInvoice}
        onClose={() => setPayingInvoice(null)}
        invoice={payingInvoice}
      />
    </div>
  );
};
