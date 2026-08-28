import { CurrencyCode } from '../types';

/**
 * Formats a numeric currency amount with proper Nigerian Naira (₦) conventions or selected currency.
 */
export function formatCurrency(
  amount: number | undefined | null,
  currency: CurrencyCode = 'NGN',
  options?: { hideSymbol?: boolean; compact?: boolean }
): string {
  const value = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  
  const symbolMap: Record<CurrencyCode, string> = {
    NGN: '₦',
    USD: '$',
    GBP: '£',
    EUR: '€',
    GHS: 'GH₵',
    XOF: 'CFA',
    KES: 'KSh',
    CAD: 'CA$',
    CNY: '¥',
  };

  const symbol = options?.hideSymbol ? '' : symbolMap[currency] || '₦';

  if (options?.compact && Math.abs(value) >= 1_000_000) {
    const millions = (value / 1_000_000).toFixed(1);
    return `${symbol}${millions.endsWith('.0') ? millions.slice(0, -2) : millions}M`;
  }

  if (options?.compact && Math.abs(value) >= 100_000) {
    const thousands = (value / 1_000).toFixed(0);
    return `${symbol}${thousands}k`;
  }

  // Format with standard Nigerian/international comma grouping
  const formattedNumber = new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);

  return `${symbol}${formattedNumber}`;
}

/**
 * Formats a percentage number with 1 or 2 decimals
 */
export function formatPercent(value: number | undefined | null, decimals = 1): string {
  const num = typeof value === 'number' && !isNaN(value) ? value : 0;
  return `${num.toFixed(decimals)}%`;
}

/**
 * Formats dates friendly for Nigerian small businesses (e.g., "Today", "Yesterday", "27 Aug 2026")
 */
export function formatDateFriendly(dateStr: string): string {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);

  const isToday =
    now.getFullYear() === date.getFullYear() &&
    now.getMonth() === date.getMonth() &&
    now.getDate() === date.getDate();

  if (isToday) return 'Today';

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    yesterday.getFullYear() === date.getFullYear() &&
    yesterday.getMonth() === date.getMonth() &&
    yesterday.getDate() === date.getDate();

  if (isYesterday) return 'Yesterday';

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: now.getFullYear() === date.getFullYear() ? undefined : 'numeric',
  }).format(date);
}

/**
 * Standard formatted date (e.g. "12 Mar 2026")
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);
  if (isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Returns ISO date string YYYY-MM-DD for today in local time
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
