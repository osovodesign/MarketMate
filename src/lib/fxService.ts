import { CurrencyCode, ExchangeRateConfig } from '../types';
import { DEFAULT_FX_CONFIG, DEFAULT_EXCHANGE_RATES_PARALLEL } from './currencies';

const FX_STORAGE_KEY = 'marketmate_live_fx_config_v2';

export interface LiveFxResponse {
  success: boolean;
  cached?: boolean;
  source: string;
  lastUpdated: string;
  ratesOfficial: Record<CurrencyCode, number>;
  ratesParallel: Record<CurrencyCode, number>;
}

/**
 * Fetch live exchange rates from server background engine (with fallback)
 */
export async function fetchLiveFxRates(
  force: boolean = false,
  marketType: 'official' | 'parallel' = 'parallel'
): Promise<{
  config: ExchangeRateConfig;
  ratesOfficial?: Record<CurrencyCode, number>;
  ratesParallel?: Record<CurrencyCode, number>;
  source: string;
  isLive: boolean;
}> {
  try {
    const res = await fetch(`/api/fx/live-rates${force ? '?force=true' : ''}`, {
      headers: { Accept: 'application/json' },
    });

    if (res.ok) {
      const data: LiveFxResponse = await res.json();
      if (data.success && data.ratesParallel && data.ratesOfficial) {
        const rates = marketType === 'official' ? data.ratesOfficial : data.ratesParallel;
        const config: ExchangeRateConfig = {
          baseCurrency: 'NGN',
          rates,
          lastUpdated: data.lastUpdated,
          marketType,
        };

        try {
          localStorage.setItem(
            FX_STORAGE_KEY,
            JSON.stringify({
              config,
              ratesOfficial: data.ratesOfficial,
              ratesParallel: data.ratesParallel,
              source: data.source,
              timestamp: Date.now(),
            })
          );
        } catch (_) {}

        return {
          config,
          ratesOfficial: data.ratesOfficial,
          ratesParallel: data.ratesParallel,
          source: data.source,
          isLive: true,
        };
      }
    }
  } catch (err) {
    console.warn('Network call to /api/fx/live-rates failed, attempting cached fallback:', err);
  }

  // Fallback to local storage if available
  try {
    const saved = localStorage.getItem(FX_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.config && parsed.config.rates) {
        return {
          config: parsed.config,
          ratesOfficial: parsed.ratesOfficial,
          ratesParallel: parsed.ratesParallel,
          source: parsed.source || 'Local Cached Rates',
          isLive: false,
        };
      }
    }
  } catch (_) {}

  return {
    config: DEFAULT_FX_CONFIG,
    source: 'MarketMate Calibrated Fallback Feed',
    isLive: false,
  };
}
