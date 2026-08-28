import React, { useRef } from 'react';
import {
  X,
  Printer,
  Share2,
  CheckCircle,
  CreditCard,
  Building2,
  Calendar,
  Phone,
  Mail,
  MapPin,
  FileText,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Invoice, PaymentMethod } from '../../types';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onRecordPayment?: (invoice: Invoice) => void;
  onConvertToInvoice?: (quote: Invoice) => void;
}

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onRecordPayment,
  onConvertToInvoice,
}) => {
  const { business } = useAuth();
  const printableRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !invoice) return null;

  const isQuote = invoice.type === 'quote';
  const isPaid = invoice.status === 'paid';
  const isPartial = invoice.status === 'partial';

  const handlePrint = () => {
    window.print();
  };

  // Generate WhatsApp message copy
  const handleWhatsAppShare = () => {
    const bizName = business?.businessName || 'Our Store';
    const totalFormatted = formatCurrency(invoice.total);
    const balanceFormatted = formatCurrency(invoice.balanceDue);
    const bank = invoice.bankDetails || business?.bankDetails;

    let text = `*${isQuote ? 'PRICE QUOTATION' : 'INVOICE'} from ${bizName}*\n`;
    text += `📄 *Doc No:* ${invoice.invoiceNumber}\n`;
    text += `👤 *Customer:* ${invoice.customerName}\n`;
    text += `📅 *Date:* ${formatDate(invoice.issueDate)}\n`;
    text += `⏱ *Due Date:* ${formatDate(invoice.dueDate)}\n\n`;
    text += `*ITEMS:*\n`;
    invoice.items.forEach((item, idx) => {
      text += `${idx + 1}. ${item.description} (x${item.quantity}) - ${formatCurrency(item.total)}\n`;
    });
    text += `\n*Total Amount:* ${totalFormatted}\n`;
    if (invoice.amountPaid > 0) {
      text += `*Amount Paid:* ${formatCurrency(invoice.amountPaid)}\n`;
      text += `*Balance Due:* ${balanceFormatted}\n`;
    }

    if (bank && bank.accountNumber) {
      text += `\n*PAYMENT DETAILS:*\n`;
      text += `🏦 *Bank:* ${bank.bankName}\n`;
      text += `💳 *Account No:* ${bank.accountNumber}\n`;
      text += `🏷 *Account Name:* ${bank.accountName}\n`;
    }

    if (invoice.notes) {
      text += `\n*Note:* ${invoice.notes}\n`;
    }

    text += `\nThank you for your business! 🙏`;

    const encoded = encodeURIComponent(text);
    const cleanPhone = invoice.customerPhone ? invoice.customerPhone.replace(/[^0-9]/g, '') : '';
    const phoneFormatted = cleanPhone.startsWith('0')
      ? '234' + cleanPhone.substring(1)
      : cleanPhone;

    const url = phoneFormatted
      ? `https://wa.me/${phoneFormatted}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getStatusBadge = () => {
    switch (invoice.status) {
      case 'paid':
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold uppercase tracking-wider">Paid in Full</span>;
      case 'partial':
        return <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold uppercase tracking-wider">Partially Paid</span>;
      case 'sent':
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold uppercase tracking-wider">Sent / Pending</span>;
      case 'draft':
        return <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold uppercase tracking-wider">Draft</span>;
      case 'overdue':
        return <span className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-bold uppercase tracking-wider">Overdue</span>;
      default:
        return null;
    }
  };

  const activeBank = invoice.bankDetails || business?.bankDetails;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Toolbar (hidden during print) */}
        <div className="print:hidden p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${isQuote ? 'bg-amber-600' : 'bg-emerald-700'}`}>
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isQuote ? 'Quotation Preview' : 'Invoice Preview'} - {invoice.invoiceNumber}
              </h2>
              <p className="text-xs text-slate-500">
                Customer: <span className="font-semibold text-slate-700">{invoice.customerName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isQuote && onConvertToInvoice && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onConvertToInvoice(invoice)}
                className="hidden sm:inline-flex text-emerald-700 border-emerald-300 hover:bg-emerald-50"
              >
                <ArrowRight className="w-3.5 h-3.5 mr-1" />
                Convert to Invoice
              </Button>
            )}

            {!isPaid && !isQuote && onRecordPayment && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onRecordPayment(invoice)}
                className="bg-emerald-700 hover:bg-emerald-800"
              >
                <CreditCard className="w-3.5 h-3.5 mr-1" />
                Record Payment
              </Button>
            )}

            <button
              onClick={handleWhatsAppShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-colors"
              title="Share via WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-slate-700"
            >
              <Printer className="w-3.5 h-3.5 mr-1" />
              <span className="hidden sm:inline">Print / PDF</span>
            </Button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors ml-1"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-slate-100/50 print:bg-white print:p-0">
          <div
            ref={printableRef}
            className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-6 sm:p-10 max-w-3xl mx-auto print:shadow-none print:border-none print:p-0 print:max-w-none"
          >
            {/* Header: Business & Invoice Details */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-200 pb-8">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-800 text-white font-bold flex items-center justify-center text-lg">
                    {business?.businessName?.charAt(0) || 'M'}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                      {business?.businessName || 'Ada Fashion & Fabrics'}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">{business?.businessType || 'Micro Enterprise'}</p>
                  </div>
                </div>

                {business?.address && (
                  <p className="text-xs text-slate-600 flex items-center gap-1.5 pt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {business.address}
                  </p>
                )}
                {business?.phone && (
                  <p className="text-xs text-slate-600 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {business.phone}
                  </p>
                )}
                {business?.email && (
                  <p className="text-xs text-slate-600 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {business.email}
                  </p>
                )}
              </div>

              <div className="sm:text-right space-y-1">
                <div className="inline-block mb-1">{getStatusBadge()}</div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                  {isQuote ? 'PRICE QUOTATION' : 'TAX INVOICE'}
                </h1>
                <p className="text-sm font-bold text-emerald-800">#{invoice.invoiceNumber}</p>
                <div className="pt-2 text-xs text-slate-600 space-y-0.5">
                  <p>
                    <span className="text-slate-400">Issue Date:</span>{' '}
                    <span className="font-semibold text-slate-800">{formatDate(invoice.issueDate)}</span>
                  </p>
                  <p>
                    <span className="text-slate-400">Due Date:</span>{' '}
                    <span className="font-semibold text-slate-800">{formatDate(invoice.dueDate)}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Bill To Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-100">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Billed To / Customer
                </p>
                <h4 className="text-base font-bold text-slate-900">{invoice.customerName}</h4>
                {invoice.customerAddress && (
                  <p className="text-xs text-slate-600 mt-1">{invoice.customerAddress}</p>
                )}
                {invoice.customerPhone && (
                  <p className="text-xs text-slate-600 mt-0.5">Phone: {invoice.customerPhone}</p>
                )}
                {invoice.customerEmail && (
                  <p className="text-xs text-slate-600 mt-0.5">Email: {invoice.customerEmail}</p>
                )}
              </div>

              {activeBank && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 sm:text-right">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center sm:justify-end gap-1">
                    <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                    Payment Bank Details
                  </p>
                  <p className="text-sm font-bold text-slate-900">{activeBank.bankName}</p>
                  <p className="text-base font-extrabold text-emerald-800 tracking-wider my-0.5">
                    {activeBank.accountNumber}
                  </p>
                  <p className="text-xs text-slate-600">Name: {activeBank.accountName}</p>
                </div>
              )}
            </div>

            {/* Line Items Table */}
            <div className="py-6 overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="py-3 px-2 font-semibold">#</th>
                    <th className="py-3 px-2 font-semibold">Item & Description</th>
                    <th className="py-3 px-2 font-semibold text-center">Qty</th>
                    <th className="py-3 px-2 font-semibold text-right">Unit Price</th>
                    <th className="py-3 px-2 font-semibold text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {invoice.items.map((item, index) => (
                    <tr key={item.id || index} className="hover:bg-slate-50/50">
                      <td className="py-3 px-2 text-slate-400 text-xs">{index + 1}</td>
                      <td className="py-3 px-2 font-medium text-slate-900">{item.description}</td>
                      <td className="py-3 px-2 text-center font-medium">{item.quantity}</td>
                      <td className="py-3 px-2 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-3 px-2 text-right font-semibold text-slate-900">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations & Totals */}
            <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row justify-between items-start gap-6">
              <div className="max-w-xs space-y-2">
                {invoice.notes && (
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Notes & Payment Terms:
                    </p>
                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                      "{invoice.notes}"
                    </p>
                  </div>
                )}
              </div>

              <div className="w-full sm:w-72 space-y-2">
                <div className="flex justify-between text-xs text-slate-600 py-1">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(invoice.subtotal)}</span>
                </div>

                {invoice.discount > 0 && (
                  <div className="flex justify-between text-xs text-rose-600 py-1">
                    <span>Discount:</span>
                    <span className="font-semibold">-{formatCurrency(invoice.discount)}</span>
                  </div>
                )}

                {invoice.taxAmount > 0 && (
                  <div className="flex justify-between text-xs text-slate-600 py-1">
                    <span>VAT ({invoice.taxRate}%):</span>
                    <span className="font-semibold text-slate-800">+{formatCurrency(invoice.taxAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-base font-bold text-slate-900 border-t border-b border-slate-200 py-2.5 my-1 bg-slate-50 px-2 rounded-lg">
                  <span>Total Amount:</span>
                  <span className="text-emerald-800 font-extrabold">{formatCurrency(invoice.total)}</span>
                </div>

                {invoice.amountPaid > 0 && (
                  <div className="flex justify-between text-xs text-emerald-700 py-1">
                    <span>Amount Paid:</span>
                    <span className="font-semibold">{formatCurrency(invoice.amountPaid)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm font-bold text-slate-900 py-1 px-2 bg-amber-50/80 rounded-lg text-amber-900 border border-amber-200/60">
                  <span>Balance Due:</span>
                  <span className="font-extrabold">{formatCurrency(invoice.balanceDue)}</span>
                </div>
              </div>
            </div>

            {/* Document Footer Guarantee */}
            <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 gap-4">
              <p>Thank you for choosing {business?.businessName || 'Ada Fashion & Fabrics'}!</p>
              <div className="text-center sm:text-right">
                <div className="w-36 border-b border-slate-300 mb-1 mx-auto sm:ml-auto"></div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Authorized Signature
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
