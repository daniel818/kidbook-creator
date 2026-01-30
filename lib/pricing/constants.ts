/**
 * Pricing Configuration
 * 
 * Fixed pricing model for KidBook Creator products.
 * Lulu is our print provider (transparent to users), but pricing is controlled by us.
 */

export type Currency = 'USD' | 'EUR' | 'ILS';
export type ProductType = 'digital' | 'print';

export interface PricingConfig {
  currency: Currency;
  symbol: string;
  digital: number;
  print: number;
}

/**
 * Fixed pricing by currency
 * 
 * Digital Only: $14.99 USD
 * Print + Digital: $39.99 USD (before shipping)
 */
export const PRICING: Record<Currency, PricingConfig> = {
  USD: {
    currency: 'USD',
    symbol: '$',
    digital: 14.99,
    print: 39.99
  },
  EUR: {
    currency: 'EUR',
    symbol: '€',
    digital: 13.99,
    print: 36.99
  },
  ILS: {
    currency: 'ILS',
    symbol: '₪',
    digital: 54.99,
    print: 144.99
  }
};

/**
 * Get price for a product type in a specific currency
 */
export function getPrice(currency: Currency, productType: ProductType): number {
  return PRICING[currency][productType];
}

/**
 * Format price with currency symbol
 */
export function formatPrice(amount: number, currency: Currency): string {
  const config = PRICING[currency];
  return `${config.symbol}${amount.toFixed(2)}`;
}

/**
 * Get currency from locale string
 */
export function getCurrencyFromLocale(locale: string): Currency {
  if (locale.startsWith('de')) return 'EUR';
  if (locale.startsWith('he')) return 'ILS';
  return 'USD'; // Default
}
