import React from 'react';
import {
  X,
  Printer,
  Share2,
  CheckCircle2,
  Receipt,
  MessageCircle,
  Copy,
  Check,
} from 'lucide-react';
import { Sale, CurrencyCode } from '../../types';
import { formatMoney } from '../../lib/calculations';
import { CURRENCIES } from '../../lib/currencies';
import { useAuth } from '../../context/AuthContext';
import { MarketMateLogo } from '../common/MarketMateLogo';
import { printThermalReceipt } from '../../lib/printUtils';

interface POSReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptNumber: string;
  sales: Sale[];
  amountTendered?: number;
  change?: number;
  customerName?: string;
  paymentMethod?: string;
  currency?: CurrencyCode;
}

export const POSReceiptModal: React.FC<POSReceiptModalProps> = ({
  isOpen,
  onClose,
  receiptNumber,
  sales,
  amountTendered = 0,
  change = 0,
  customerName = 'Walk-in Customer',
  paymentMethod = 'Cash',
  currency = 'NGN',
}) => {
  const { business } = useAuth();
  const [copied, setCopied] = React.useState(false);
  const [isPrinting, setIsPrinting] = React.useState(false);

  if (!isOpen || sales.length === 0) return null;

  const totalRevenue = sales.reduce((sum, s) => sum + s.revenue, 0);
  const totalItems = sales.reduce((sum, s) => sum + s.quantity, 0);
  const saleDate = sales[0]?.saleDate || new Date().toISOString().split('T')[0];
  const cashierName = sales[0]?.staffName || 'Cashier';
  const currMeta = CURRENCIES[currency] || CURRENCIES.NGN;

  const handlePrint = async () => {
    setIsPrinting(true);
    await printThermalReceipt('marketmate-printable-receipt', {
      title: `Receipt-${receiptNumber}`,
      width: '80mm',
    });
    setIsPrinting(false);
  };

  const generateReceiptText = (): string => {
    const lines = [
      `*${business?.businessName || 'MarketMate Store'}*`,
      `Official Sales Receipt`,
      `Receipt #: ${receiptNumber}`,
      `Date: ${saleDate}`,
      `Cashier: ${cashierName}`,
      `Customer: ${customerName}`,
      `Payment: ${paymentMethod}`,
      `----------------------------`,
    ];

    sales.forEach((s, idx) => {
      lines.push(`${idx + 1}. ${s.productName}`);
      lines.push(`   ${s.quantity} x ${currMeta.symbol}${s.sellingPrice.toLocaleString()} = ${currMeta.symbol}${s.revenue.toLocaleString()}`);
    });

    lines.push(`----------------------------`);
    lines.push(`*TOTAL: ${currMeta.symbol}${totalRevenue.toLocaleString()}*`);
    if (amountTendered > 0) {
      lines.push(`Amount Tendered: ${currMeta.symbol}${amountTendered.toLocaleString()}`);
      lines.push(`Change Returned: ${currMeta.symbol}${change.toLocaleString()}`);
    }
    lines.push(`----------------------------`);
    lines.push(`Thank you for your patronage!`);
    lines.push(`Powered by MarketMate`);

    return lines.join('\n');
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(generateReceiptText());
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generateReceiptText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-emerald-700 text-white">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            <div>
              <h2 className="text-sm font-bold leading-tight">Sale Completed!</h2>
              <p className="text-[11px] text-emerald-100">Receipt #{receiptNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-emerald-100 hover:text-white hover:bg-emerald-600 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Receipt Preview Area */}
        <div className="p-6 bg-slate-50 overflow-y-auto flex-1 flex flex-col items-center">
          <div
            id="marketmate-printable-receipt"
            className="w-full bg-white p-5 rounded-xl border border-slate-200 shadow-2xs font-mono text-xs text-slate-900 space-y-3"
          >
            {/* Store Header */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-400">
              {business?.logoUrl ? (
                <div className="flex justify-center pb-1">
                  <img
                    src={business.logoUrl}
                    alt={business.businessName || 'Store Logo'}
                    className="max-h-14 max-w-[160px] object-contain mx-auto"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white font-bold flex items-center justify-center mx-auto mb-1 text-sm">
                  {business?.businessName?.charAt(0) || 'M'}
                </div>
              )}
              <h3 className="font-extrabold text-sm tracking-tight text-slate-950 uppercase">
                {business?.businessName || 'Ada Fashion & Fabrics'}
              </h3>
              <p className="text-[11px] text-slate-600 font-sans font-medium">{business?.businessType || 'Retail & Wholesale'}</p>
              {business?.cacNumber && (
                <p className="text-[10px] text-emerald-800 font-sans font-bold">CAC Reg No: {business.cacNumber}</p>
              )}
              {business?.phone && (
                <p className="text-[10px] text-slate-600 font-sans">Tel: {business.phone}</p>
              )}
              {business?.address && (
                <p className="text-[10px] text-slate-500 font-sans">{business.address}</p>
              )}
            </div>

            {/* Receipt Meta */}
            <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-700 py-1 border-b border-dashed border-slate-300">
              <span>Receipt: <strong className="text-slate-950 font-bold">{receiptNumber}</strong></span>
              <span className="text-right">Date: {saleDate}</span>
              <span>Cashier: {cashierName}</span>
              <span className="text-right">Method: {paymentMethod}</span>
              <span className="col-span-2 text-slate-800 pt-0.5">Customer: <strong>{customerName}</strong></span>
            </div>

            {/* Items List */}
            <div className="py-1 space-y-2">
              <div className="flex justify-between font-bold text-[11px] text-slate-800 pb-1 border-b border-slate-300">
                <span className="text-left">ITEM / QTY</span>
                <span className="text-right">AMOUNT</span>
              </div>
              {sales.map((s, idx) => (
                <div key={s.id || idx} className="space-y-0.5 pb-1 border-b border-dotted border-slate-200">
                  <div className="flex justify-between text-slate-950 font-bold">
                    <span className="truncate pr-2">{idx + 1}. {s.productName}</span>
                    <span className="tabular-nums shrink-0">{currMeta.symbol}{s.revenue.toLocaleString()}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 flex justify-between">
                    <span>{s.quantity} @ {currMeta.symbol}{s.sellingPrice.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations & Totals */}
            <div className="space-y-1.5 pt-1 text-xs border-t border-dashed border-slate-400">
              <div className="flex justify-between text-slate-700">
                <span>Total Items:</span>
                <span className="font-bold tabular-nums">{totalItems}</span>
              </div>
              <div className="flex justify-between font-black text-sm text-slate-950 pt-1 border-t border-slate-400">
                <span>TOTAL AMOUNT:</span>
                <span className="tabular-nums">{currMeta.symbol}{totalRevenue.toLocaleString()}</span>
              </div>
              {amountTendered > 0 && (
                <>
                  <div className="flex justify-between text-[11px] text-slate-700">
                    <span>Amount Tendered:</span>
                    <span className="tabular-nums">{currMeta.symbol}{amountTendered.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-bold text-emerald-800">
                    <span>Change Returned:</span>
                    <span className="tabular-nums">{currMeta.symbol}{change.toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>

            {/* Barcode & Footer note */}
            <div className="text-center pt-3 border-t border-dashed border-slate-400 space-y-2 flex flex-col items-center">
              <div className="font-mono text-[11px] tracking-widest text-slate-600 font-bold select-none">
                ||||| | |||| ||| |||||| | ||||
              </div>
              <p className="text-[10px] text-slate-600 font-sans leading-tight">
                Thank you for your patronage! Items in good condition are covered under store policy.
              </p>
              <div className="pt-2 flex flex-col items-center justify-center gap-1 border-t border-dotted border-slate-300 w-full">
                <MarketMateLogo size="xs" variant="light" mode="icon" />
                <div className="text-center font-sans">
                  <p className="text-[9px] font-bold text-slate-800 tracking-tight">
                    Powered by MarketMate Technologies Limited
                  </p>
                  <p className="text-[8px] text-slate-500 font-medium">
                    CAC Reg. No: 9931755 • getmarketmate.online
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-slate-100 bg-white grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={handlePrint}
            disabled={isPrinting}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Printer className={`w-3.5 h-3.5 ${isPrinting ? 'animate-spin' : ''}`} />
            <span>{isPrinting ? 'Printing...' : 'Print'}</span>
          </button>
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5 text-white" />
            <span>WhatsApp</span>
          </button>
          <button
            type="button"
            onClick={handleCopyText}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
