import { CurrencyCode } from '../types';
import { formatCurrency, formatPercent, formatDate, formatDateFriendly, getTodayDateString } from './formatters';
import { roundMoney, calculateSaleMetrics, calculatePeriodSummary, filterSalesByDateRange, filterExpensesByDateRange, buildUnifiedTransactions, computeDashboardMetrics } from './math';

export {
  formatCurrency,
  formatPercent,
  formatDate,
  formatDateFriendly,
  getTodayDateString,
  roundMoney,
  calculateSaleMetrics,
  calculatePeriodSummary,
  filterSalesByDateRange,
  filterExpensesByDateRange,
  buildUnifiedTransactions,
  computeDashboardMetrics,
};

/**
 * Standard money formatting helper for quick display
 */
export function formatMoney(
  amount: number | undefined | null,
  currency: CurrencyCode = 'NGN',
  options?: { hideSymbol?: boolean; compact?: boolean }
): string {
  return formatCurrency(amount, currency, options);
}
