// ============================================
// Fallback Wholesale Prices
// ============================================
// Used when Lulu API is unreachable, and for
// deriving "starting at $X" display prices.
//
// Values are Lulu wholesale costs in cents.
// Calibrate by running a few real Lulu API calls
// and updating the numbers below.
//
// Last calibrated: 2025-01 (update after live calibration)

// Duplicated from pricing.ts to avoid circular dependency
const MARKUP_MULTIPLIER = 3;
const MIN_SUBTOTAL_PER_BOOK = 4000; // $40.00 in cents
const ROUND_TO = 100;

export type BookFormat = 'softcover' | 'hardcover';
export type BookSize = '7.5x7.5' | '8x8' | '8x10';

/**
 * Lulu wholesale cost structure: base + per-page.
 * All values in cents (USD).
 */
export const FALLBACK_WHOLESALE: Record<BookFormat, Record<BookSize, { baseCost: number; perPage: number }>> = {
    softcover: {
        '7.5x7.5': { baseCost: 475, perPage: 2 },
        '8x8':     { baseCost: 510, perPage: 3 },
        '8x10':    { baseCost: 565, perPage: 3 },
    },
    hardcover: {
        '7.5x7.5': { baseCost: 1050, perPage: 2 },
        '8x8':     { baseCost: 1125, perPage: 3 },
        '8x10':    { baseCost: 1200, perPage: 3 },
    },
};

const DEFAULT_PAGE_COUNT = 32;

/**
 * Calculate a fallback wholesale cost for a given product configuration.
 * @returns wholesale cost in cents
 */
export function getFallbackWholesale(format: BookFormat, size: BookSize, pageCount: number): number {
    const entry = FALLBACK_WHOLESALE[format]?.[size];
    if (!entry) {
        throw new Error(`No fallback pricing for ${format}/${size}`);
    }
    return entry.baseCost + (entry.perPage * pageCount);
}

/**
 * Apply the same markup rules used in calculateRetailPricing.
 * @returns retail price in cents (after markup, rounding, floor)
 */
function applyRetailMarkup(wholesalePerUnit: number): number {
    const markedUp = wholesalePerUnit * MARKUP_MULTIPLIER;
    const rounded = Math.ceil(markedUp / ROUND_TO) * ROUND_TO;
    return Math.max(rounded, MIN_SUBTOTAL_PER_BOOK);
}

/**
 * Get the "starting at" retail price for a format.
 * Uses the cheapest size at default page count with standard markup.
 * @returns retail price in cents
 */
export function getStartingRetailPrice(format: BookFormat): number {
    const sizes: BookSize[] = ['7.5x7.5', '8x8', '8x10'];
    let minRetail = Infinity;

    for (const size of sizes) {
        const wholesale = getFallbackWholesale(format, size, DEFAULT_PAGE_COUNT);
        const retail = applyRetailMarkup(wholesale);
        if (retail < minRetail) minRetail = retail;
    }

    return minRetail;
}
