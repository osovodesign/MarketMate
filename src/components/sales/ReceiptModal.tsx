import React, { useState } from 'react';
import {
  Printer,
  Copy,
  Check,
  Share2,
  Receipt,
  Store,
  Calendar,
  CreditCard,
  User,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { MarketMateLogo } from '../common/MarketMateLogo';
import { formatCurrency, formatPercent, formatDateFriendly } from '../../lib/formatters';
import { Sale } from '../../types';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, sale }) => {
  const { business } = useAuth();
  const currency = business?.currency || 'NGN';
  const [copied, setCopied] = useState(false);
  const [showProfitNote, setShowProfitNote] = useState(false);

  if (!sale) return null;

  const receiptNumber = `REC-${sale.id.slice(-6).toUpperCase()}`;

  // Generate WhatsApp formatted text
  const generateWhatsAppText = () => {
    const lines = [
      `🧾 *OFFICIAL RECEIPT / INVOICE*`,
      `🏪 *${business?.businessName || 'Merchant'}*`,
      `📅 *Date:* ${formatDateFriendly(sale.saleDate)}`,
      `🔢 *Receipt #:* ${receiptNumber}`,
      sale.customerName ? `👤 *Customer:* ${sale.customerName}` : '',
      ``,
      `📦 *Items:*`,
      `• ${sale.quantity}x ${sale.productName} @ ${formatCurrency(sale.unitPrice, currency)} = *${formatCurrency(sale.revenue, currency)}*`,
      ``,
      `💳 *Payment Method:* ${sale.paymentMethod}`,
      `💰 *TOTAL AMOUNT PAID:* *${formatCurrency(sale.revenue, currency)}*`,
      ``,
      `🙏 *Thank you for your patronage!*`,
      business?.phone ? `📞 Contact: ${business.phone}` : '',
    ].filter(Boolean);

    return lines.join('\n');
  };

  const handleCopyWhatsApp = () => {
    const text = generateWhatsAppText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    const text = encodeURIComponent(generateWhatsAppText());
    const waUrl = `https://wa.me/?text=${text}`;
    window.open(waUrl, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Digital Customer Receipt"
      description="Print an invoice or share a formatted WhatsApp receipt directly to your customer."
      maxWidth="max-w-xl"
    >
      <div className="space-y-6 pt-2">
        {/* Printable Receipt Card */}
        <div
          id="marketmate-receipt"
          className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-5 text-slate-800"
        >
          {/* Header */}
          <div className="text-center border-b border-dashed border-slate-300 pb-4 space-y-1">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-2">
              <Store className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              {business?.businessName || 'Business Receipt'}
            </h3>
            <p className="text-xs text-slate-500">{business?.businessType}</p>
            {business?.phone && <p className="text-xs text-slate-500">Tel: {business.phone}</p>}
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs py-1 border-b border-slate-100">
            <div>
              <span className="text-slate-400">Receipt No:</span>
              <p className="font-bold text-slate-800">{receiptNumber}</p>
            </div>
            <div className="text-right">
              <span className="text-slate-400">Date:</span>
              <p className="font-bold text-slate-800">{formatDateFriendly(sale.saleDate)}</p>
            </div>
            {sale.customerName && (
              <div className="col-span-2 pt-1">
                <span className="text-slate-400">Customer:</span>
                <p className="font-bold text-slate-800">{sale.customerName}</p>
              </div>
            )}
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="text-left py-1.5">Description</th>
                  <th className="text-center py-1.5">Qty</th>
                  <th className="text-right py-1.5">Unit Price</th>
                  <th className="text-right py-1.5">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                <tr>
                  <td className="py-2 text-slate-900 font-bold">{sale.productName}</td>
                  <td className="py-2 text-center text-slate-600">{sale.quantity}</td>
                  <td className="py-2 text-right text-slate-600">
                    {formatCurrency(sale.unitPrice, currency)}
                  </td>
                  <td className="py-2 text-right font-bold text-slate-900">
                    {formatCurrency(sale.revenue, currency)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Summary / Total */}
          <div className="pt-3 border-t border-dashed border-slate-300 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Payment Channel:</span>
              <Badge variant="neutral" size="sm">
                {sale.paymentMethod}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-base font-black text-slate-900 pt-1">
              <span>Total Paid:</span>
              <span className="text-emerald-700">{formatCurrency(sale.revenue, currency)}</span>
            </div>
          </div>

          {/* Private Merchant Margin Note */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowProfitNote(!showProfitNote)}
                className="text-[11px] text-slate-400 hover:text-slate-700 flex items-center gap-1 font-semibold"
              >
                <Lock className="w-3 h-3" />
                <span>{showProfitNote ? 'Hide Merchant Profit Note' : 'Show Internal Profit (Merchant Only)'}</span>
              </button>
            </div>

            {showProfitNote && (
              <div className="mt-2 p-2.5 bg-slate-50 rounded-lg text-xs flex items-center justify-between text-slate-600 border border-slate-200">
                <span>Unit Cost: {formatCurrency(sale.unitCost, currency)}</span>
                <span className="font-bold text-emerald-700">
                  Gross Profit: +{formatCurrency(sale.profit, currency)} ({formatPercent(sale.profitMargin)})
                </span>
              </div>
            )}
          </div>

          {/* Footer message */}
          <div className="pt-3 border-t border-slate-100 flex flex-col items-center justify-center gap-1.5">
            <MarketMateLogo size="xs" variant="light" />
            <p className="text-[10px] text-center text-slate-400">
              Thank you for your patronage! Digital store receipt powered by MarketMate™.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handleCopyWhatsApp}
            leftIcon={copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            className="w-full"
          >
            {copied ? 'Copied WhatsApp Text!' : 'Copy WhatsApp Receipt'}
          </Button>

          <Button
            type="button"
            size="md"
            onClick={handleOpenWhatsApp}
            leftIcon={<Share2 className="w-4 h-4" />}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Send to WhatsApp
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
            className="w-full bg-white border border-slate-200 hover:bg-slate-50"
          >
            Print Receipt
          </Button>
        </div>
      </div>
    </Modal>
  );
};
