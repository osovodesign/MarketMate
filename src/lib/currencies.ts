import { CurrencyCode, CurrencyInfo, ExchangeRateConfig } from '../types';

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  NGN: {
    code: 'NGN',
    symbol: '₦',
    name: 'Nigerian Naira',
    flag: '🇳🇬',
    decimals: 2,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    flag: '🇺🇸',
    decimals: 2,
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    flag: '🇬🇧',
    decimals: 2,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    flag: '🇪🇺',
    decimals: 2,
  },
  GHS: {
    code: 'GHS',
    symbol: 'GH₵',
    name: 'Ghanaian Cedi',
    flag: '🇬🇭',
    decimals: 2,
  },
  XOF: {
    code: 'XOF',
    symbol: 'CFA',
    name: 'West African CFA Franc',
    flag: '🇧🇯',
    decimals: 0,
  },
  KES: {
    code: 'KES',
    symbol: 'KSh',
    name: 'Kenyan Shilling',
    flag: '🇰🇪',
    decimals: 2,
  },
  CNY: {
    code: 'CNY',
    symbol: '¥',
    name: 'Chinese Yuan (RMB)',
    flag: '🇨🇳',
    decimals: 2,
  },
  CAD: {
    code: 'CAD',
    symbol: 'CA$',
    name: 'Canadian Dollar',
    flag: '🇨🇦',
    decimals: 2,
  },
};

export const CURRENCIES = SUPPORTED_CURRENCIES;
export const CURRENCY_LIST = Object.values(SUPPORTED_CURRENCIES);

/**
 * Standard baseline parallel & official FX benchmark rates (valued in NGN per 1 unit of foreign currency)
 */
export const DEFAULT_EXCHANGE_RATES_PARALLEL: Record<CurrencyCode, number> = {
  NGN: 1,
  USD: 1520,
  GBP: 1980,
  EUR: 1650,
  GHS: 102,
  XOF: 2.52,
  KES: 11.85,
  CNY: 216,
  CAD: 1110,
};

export const DEFAULT_EXCHANGE_RATES_OFFICIAL: Record<CurrencyCode, number> = {
  NGN: 1,
  USD: 1485,
  GBP: 1930,
  EUR: 1610,
  GHS: 98,
  XOF: 2.45,
  KES: 11.5,
  CNY: 210,
  CAD: 1080,
};

export const DEFAULT_FX_CONFIG: ExchangeRateConfig = {
  baseCurrency: 'NGN',
  rates: DEFAULT_EXCHANGE_RATES_PARALLEL,
  lastUpdated: new Date().toISOString(),
  marketType: 'parallel',
};

/**
 * Format any currency value with symbol and locale standards
 */
export function formatForeignCurrency(
  amount: number,
  currency: CurrencyCode = 'NGN',
  includeSymbol: boolean = true
): string {
  const info = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.NGN;
  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: info.decimals,
    maximumFractionDigits: info.decimals,
  }).format(amount || 0);

  if (!includeSymbol) return formattedNumber;
  return `${info.symbol}${formattedNumber}`;
}

/**
 * Convert value between any two currencies using the provided exchange rate table (relative to NGN)
 */
export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  customRates: Record<CurrencyCode, number> = DEFAULT_EXCHANGE_RATES_PARALLEL
): {
  convertedAmount: number;
  rateUsed: number;
  rateDescription: string;
} {
  if (from === to || !amount) {
    return {
      convertedAmount: amount,
      rateUsed: 1,
      rateDescription: `1 ${from} = 1 ${to}`,
    };
  }

  const rateFrom = customRates[from] || 1; // Value of 1 'from' in NGN
  const rateTo = customRates[to] || 1; // Value of 1 'to' in NGN

  // Amount in NGN = amount * rateFrom
  const amountInNgn = amount * rateFrom;
  // Converted to target currency = amountInNgn / rateTo
  const convertedAmount = amountInNgn / rateTo;

  // Rate of 1 from in to
  const rateUsed = rateFrom / rateTo;

  const infoFrom = SUPPORTED_CURRENCIES[from];
  const infoTo = SUPPORTED_CURRENCIES[to];

  return {
    convertedAmount: Number(convertedAmount.toFixed(4)),
    rateUsed: Number(rateUsed.toFixed(4)),
    rateDescription: `1 ${infoFrom.code} (${infoFrom.symbol}) = ${rateUsed.toFixed(2)} ${infoTo.code} (${infoTo.symbol})`,
  };
}

/**
 * Landed Cost Calculation for Importers (e.g. from China, USA, Turkey, UK, Dubai)
 */
export interface LandedCostInput {
  foreignCurrency: CurrencyCode;
  purchaseCostForeign?: number;
  foreignPurchasePrice?: number;
  quantity?: number;
  unitsQuantity?: number;
  exchangeRate: number;
  freightShippingNgn?: number;
  freightShippingCost?: number;
  customsDutyNgn?: number;
  customsClearingCost?: number;
  localTransportNgn?: number;
  localHandlingCost?: number;
  otherLeviesNgn?: number;
  desiredProfitMarginPct?: number;
  targetMarginPercent?: number;
}

export interface LandedCostResult {
  totalPurchaseCostNgn: number;
  purchasePriceNgn: number;
  totalLandedCostNgn: number;
  landedUnitCostNgn: number;
  unitLandedCostNgn: number;
  recommendedSellingPriceNgn: number;
  suggestedSellingPriceNgn: number;
  unitProfitNgn: number;
  profitPerUnitNgn: number;
  totalProjectedProfitNgn: number;
  effectiveMarkupPct: number;
}

export function calculateLandedCost(input: LandedCostInput): LandedCostResult {
  const purchaseCost = input.foreignPurchasePrice ?? input.purchaseCostForeign ?? 0;
  const qty = Math.max(1, input.unitsQuantity ?? input.quantity ?? 1);
  const rate = input.exchangeRate || 1;
  const freight = input.freightShippingCost ?? input.freightShippingNgn ?? 0;
  const customs = input.customsClearingCost ?? input.customsDutyNgn ?? 0;
  const local = input.localHandlingCost ?? input.localTransportNgn ?? 0;
  const levies = input.otherLeviesNgn ?? 0;
  const marginPct = input.targetMarginPercent ?? input.desiredProfitMarginPct ?? 30;

  const totalPurchaseCostNgn = purchaseCost * rate;
  const totalOverheadsNgn = freight + customs + local + levies;

  const totalLandedCostNgn = totalPurchaseCostNgn + totalOverheadsNgn;
  const landedUnitCostNgn = totalLandedCostNgn / qty;

  // Margin formula: Selling Price = Unit Cost / (1 - (margin% / 100))
  const marginFraction = Math.min(0.9, Math.max(0.01, marginPct / 100));
  const recommendedSellingPriceNgn = landedUnitCostNgn / (1 - marginFraction);
  const unitProfitNgn = recommendedSellingPriceNgn - landedUnitCostNgn;
  const totalProjectedProfitNgn = unitProfitNgn * qty;
  const effectiveMarkupPct = landedUnitCostNgn > 0 ? (unitProfitNgn / landedUnitCostNgn) * 100 : 0;

  const totalPurchase = Math.round(totalPurchaseCostNgn);
  const totalLanded = Math.round(totalLandedCostNgn);
  const landedUnit = Math.round(landedUnitCostNgn);
  const recSelling = Math.round(recommendedSellingPriceNgn);
  const profitUnit = Math.round(unitProfitNgn);

  return {
    totalPurchaseCostNgn: totalPurchase,
    purchasePriceNgn: totalPurchase,
    totalLandedCostNgn: totalLanded,
    landedUnitCostNgn: landedUnit,
    unitLandedCostNgn: landedUnit,
    recommendedSellingPriceNgn: recSelling,
    suggestedSellingPriceNgn: recSelling,
    unitProfitNgn: profitUnit,
    profitPerUnitNgn: profitUnit,
    totalProjectedProfitNgn: Math.round(totalProjectedProfitNgn),
    effectiveMarkupPct: Number(effectiveMarkupPct.toFixed(1)),
  };
}
