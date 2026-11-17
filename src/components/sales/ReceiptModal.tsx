import React, { useState } from 'react';
import {
  Printer,
  Copy,
  Check,
  Share2,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBusinessData } from '../../context/BusinessDataContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { MarketMateLogo } from '../common/MarketMateLogo';
import { formatCurrency, formatPercent, formatDateFriendly } from '../../lib/formatters';
import { getSaleItems, roundMoney } from '../../lib/math';
import { hasPermission } from '../../lib/staffPermissions';
import { Sale } from '../../types';
import { printThermalReceipt } from '../../lib/printUtils';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, sale }) => {
  const { business } = useAuth();
  const { currentSession } = useBusinessData();
  const currency = business?.currency || 'NGN';
  const [copied, setCopied] = useState(false);
  const [showProfitNote, setShowProfitNote] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  if (!sale) return null;

  const canShowProfit = hasPermission(currentSession, 'showProfitAndMargins');
  const canShowCost = hasPermission(currentSession, 'showCostPrice');

  const receiptNumber = sale.receiptNumber || `REC-${sale.id.slice(-6).toUpperCase()}`;
  const lineItems = getSaleItems(sale);
  const totalUnits = lineItems.reduce((sum, item) => sum + item.quantity, 0);
  const grossSubtotal =
    sale.subtotal !== undefined
      ? sale.subtotal
      : roundMoney(lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0));
  const totalDiscount =
    sale.discount !== undefined
      ? sale.discount
      : roundMoney(Math.max(0, grossSubtotal - sale.revenue));
  const profitMargin = sale.revenue > 0 ? roundMoney((sale.profit / sale.revenue) * 100) : 0;

  // Generate WhatsApp formatted text supporting 1 or many products
  const generateWhatsAppText = () => {
    const itemLines = lineItems.map(
      (item, idx) =>
        `${idx + 1}. ${item.quantity}x ${item.productName} @ ${formatCurrency(
          item.unitPrice,
          currency
        )} = *${formatCurrency(item.subtotal, currency)}*`
    );

    const lines = [
      `🧾 *OFFICIAL RECEIPT / INVOICE*`,
      `🏪 *${business?.businessName || 'Merchant'}*`,
      `📅 *Date:* ${formatDateFriendly(sale.saleDate)}`,
      `🔢 *Receipt #:* ${receiptNumber}`,
      sale.customerName ? `👤 *Customer:* ${sale.customerName}` : '',
      ``,
      `📦 *Items (${lineItems.length} ${lineItems.length === 1 ? 'product' : 'products'}, ${totalUnits} ${totalUnits === 1 ? 'unit' : 'units'}):*`,
      ...itemLines,
      ``,
      totalDiscount > 0 ? `🏷️ *Subtotal:* ${formatCurrency(grossSubtotal, currency)}` : '',
      totalDiscount > 0 ? `🎁 *Discount:* -${formatCurrency(totalDiscount, currency)}` : '',
      `💳 *Payment Method:* ${sale.paymentMethod}`,
      `💰 *TOTAL AMOUNT PAID:* *${formatCurrency(sale.revenue, currency)}*`,
      sale.notes ? `📝 *Note:* ${sale.notes}` : '',
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

  const handlePrint = async () => {
    setIsPrinting(true);
    await printThermalReceipt('marketmate-receipt', {
      title: `Receipt-${receiptNumber}`,
      width: '80mm',
    });
    setIsPrinting(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Digital Customer Receipt"
      description="Print an itemized receipt or share a formatted WhatsApp receipt directly to your customer."
      maxWidth="max-w-xl"
    >
      <div className="space-y-6 pt-2">
        {/* Printable Receipt Card */}
        <div
          id="marketmate-receipt"
          className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4 text-slate-900 font-mono text-xs"
        >
          {/* Header */}
          <div className="text-center border-b border-dashed border-slate-300 pb-3 space-y-1">
            {business?.logoUrl ? (
              <div className="flex justify-center pb-1">
                <img
                  src={business.logoUrl}
                  alt={business.businessName || 'Store Logo'}
                  className="max-h-14 max-w-[160px] object-contain mx-auto"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white font-bold flex items-center justify-center mx-auto mb-2 text-sm">
                {business?.businessName?.charAt(0) || 'M'}
              </div>
            )}
            <h3 className="text-base font-black text-slate-950 tracking-tight uppercase">
              {business?.businessName || 'Business Receipt'}
            </h3>
            <p className="text-xs text-slate-600 font-sans font-medium">{business?.businessType}</p>
            {business?.cacNumber && (
              <p className="text-[11px] font-bold text-emerald-800 font-sans">
                CAC Reg No: {business.cacNumber}
              </p>
            )}
            {business?.phone && (
              <p className="text-xs text-slate-600 font-sans">Tel: {business.phone}</p>
            )}
            {business?.address && (
              <p className="text-xs text-slate-500 font-sans">{business.address}</p>
            )}
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
              <div>
                <span className="text-slate-400">Customer:</span>
                <p className="font-bold text-slate-800">{sale.customerName}</p>
              </div>
            )}
            {sale.staffName && (
              <div className={sale.customerName ? 'text-right' : 'col-span-2'}>
                <span className="text-slate-400">Attendant:</span>
                <p className="font-bold text-slate-800">{sale.staffName}</p>
              </div>
            )}
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="text-left py-1.5">Item</th>
                  <th className="text-center py-1.5">Qty</th>
                  <th className="text-right py-1.5">Unit Price</th>
                  <th className="text-right py-1.5">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {lineItems.map((item, idx) => (
                  <tr key={`${item.productName}_${idx}`}>
                    <td className="py-2 text-slate-900 font-bold pr-2">
                      <div>{item.productName}</div>
                      {(item.discount || 0) > 0 && (
                        <div className="text-[10px] text-amber-700 font-normal">
                          Disc: -{formatCurrency(item.discount || 0, currency)}
                        </div>
                      )}
                    </td>
                    <td className="py-2 text-center text-slate-600 tabular-nums">{item.quantity}</td>
                    <td className="py-2 text-right text-slate-600 tabular-nums">
                      {formatCurrency(item.unitPrice, currency)}
                    </td>
                    <td className="py-2 text-right font-bold text-slate-900 tabular-nums">
                      {formatCurrency(item.subtotal, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary / Total */}
          <div className="pt-3 border-t border-dashed border-slate-300 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Items Summary:</span>
              <span className="font-bold text-slate-800">
                {lineItems.length} {lineItems.length === 1 ? 'item' : 'items'} ({totalUnits}{' '}
                {totalUnits === 1 ? 'unit' : 'units'})
              </span>
            </div>

            {totalDiscount > 0 && (
              <>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Subtotal:</span>
                  <span className="tabular-nums">{formatCurrency(grossSubtotal, currency)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-amber-700 font-semibold">
                  <span>Discount:</span>
                  <span className="tabular-nums">-{formatCurrency(totalDiscount, currency)}</span>
                </div>
              </>
            )}

            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Payment Channel:</span>
              <Badge variant="neutral" size="sm">
                {sale.paymentMethod}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-base font-black text-slate-900 pt-1 border-t border-slate-200">
              <span>Total Paid:</span>
              <span className="text-emerald-700 tabular-nums">
                {formatCurrency(sale.revenue, currency)}
              </span>
            </div>

            {sale.notes && (
              <div className="pt-1 text-[11px] text-slate-500 font-sans italic">
                Note: {sale.notes}
              </div>
            )}
          </div>

          {/* Private Merchant Margin Note (Hidden on Print & Guarded by Role Permission) */}
          {canShowProfit && (
            <div className="pt-2 border-t border-slate-100 print:hidden">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowProfitNote(!showProfitNote)}
                  className="text-[11px] text-slate-400 hover:text-slate-700 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Lock className="w-3 h-3" />
                  <span>
                    {showProfitNote
                      ? 'Hide Merchant Profit Note'
                      : 'Show Internal Profit (Merchant Only)'}
                  </span>
                </button>
              </div>

              {showProfitNote && (
                <div className="mt-2 p-2.5 bg-slate-50 rounded-lg text-xs flex items-center justify-between text-slate-600 border border-slate-200">
                  {canShowCost && (
                    <span>Total Cost: {formatCurrency(sale.cost, currency)}</span>
                  )}
                  <span className="font-bold text-emerald-700">
                    Gross Profit: +{formatCurrency(sale.profit, currency)} (
                    {formatPercent(profitMargin)})
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Footer message */}
          <div className="pt-3 border-t border-dashed border-slate-300 flex flex-col items-center justify-center gap-2">
            <p className="text-[10px] text-center text-slate-600 font-sans leading-tight">
              Thank you for your patronage! Items in good condition are covered under store policy.
            </p>
            <div className="pt-2 flex flex-col items-center justify-center gap-1 border-t border-dotted border-slate-300 w-full">
              <MarketMateLogo size="xs" variant="light" mode="icon" />
              <div className="text-center font-sans">
                <p className="text-[9px] font-bold text-slate-800 tracking-tight whitespace-nowrap">
                  Powered by MarketMate Technologies Limited
                </p>
                <p className="text-[8px] text-slate-500 font-medium whitespace-nowrap">
                  CAC Reg. No: 9931755 • getmarketmate.online
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handleCopyWhatsApp}
            leftIcon={
              copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />
            }
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
            disabled={isPrinting}
            leftIcon={<Printer className={`w-4 h-4 ${isPrinting ? 'animate-spin' : ''}`} />}
            className="w-full bg-white border border-slate-200 hover:bg-slate-50"
          >
            {isPrinting ? 'Printing...' : 'Print Receipt'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
