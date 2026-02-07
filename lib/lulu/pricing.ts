import { createLuluClient, CostCalculationOptions } from '@/lib/lulu/client';
import { getLuluProductId } from '@/lib/lulu/fulfillment';
import { getFallbackWholesale } from '@/lib/lulu/fallback-prices';

// ============================================
// Retail Pricing Engine
// ============================================
// Calculates customer-facing prices from Lulu wholesale costs.
// Includes: in-memory cache, fallback pricing, markup rules.

export interface RetailPricingInput {
    format: 'softcover' | 'hardcover';
    size: '7.5x7.5' | '8x8' | '8x10';
    pageCount: number;
    quantity: number;
    shippingOption?: CostCalculationOptions['shippingOption'];
    shipping?: {
        fullName?: string;
        addressLine1?: string;
        addressLine2?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
        phone?: string;
    };
    countryCode?: string;
    postalCode?: string;
    stateCode?: string;
}

export interface RetailPricingResult {
    subtotal: number;    // Retail price after markup (cents)
    shipping: number;    // Shipping cost (cents)
    total: number;       // subtotal + shipping (cents)
    isEstimate: boolean; // true when using fallback or dummy address
}

// --- Pricing Rules ---

const MARKUP_MULTIPLIER = 3; // 200% margin => wholesale * 3
const MIN_SUBTOTAL_PER_BOOK = 4000; // $40.00 in cents
const ROUND_TO = 100; // round up to nearest $1

function applyPricingRules(wholesale: number, quantity: number): number {
    const markedUp = wholesale * MARKUP_MULTIPLIER;
    const rounded = Math.ceil(markedUp / ROUND_TO) * ROUND_TO;
    const minSubtotal = MIN_SUBTOTAL_PER_BOOK * Math.max(1, quantity);
    return Math.max(rounded, minSubtotal);
}

// --- Product Cost Cache ---
// Product cost depends on format+size+pageCount only (not address).

interface CachedProductCost {
    /** Per-unit product cost in cents from Lulu */
    unitProductCost: number;
    /** Timestamp when this entry was cached */
    cachedAt: number;
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const productCostCache = new Map<string, CachedProductCost>();

function makeCacheKey(format: string, size: string, pageCount: number): string {
    return `${format}:${size}:${pageCount}`;
}

function getCachedProductCost(format: string, size: string, pageCount: number): number | null {
    const key = makeCacheKey(format, size, pageCount);
    const entry = productCostCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
        productCostCache.delete(key);
        return null;
    }
    return entry.unitProductCost;
}

function setCachedProductCost(format: string, size: string, pageCount: number, unitProductCost: number): void {
    const key = makeCacheKey(format, size, pageCount);
    productCostCache.set(key, { unitProductCost, cachedAt: Date.now() });
}

/** Clear cache — exposed for testing only */
export function _clearPricingCache(): void {
    productCostCache.clear();
}

// --- Helpers ---

function buildBaseOptions(input: RetailPricingInput): CostCalculationOptions {
    return {
        format: input.format,
        size: input.size,
        pageCount: input.pageCount,
        quantity: input.quantity,
        podPackageId: getLuluProductId(input.format, input.size, input.pageCount),
    };
}

// --- Main Pricing Function ---

export async function calculateRetailPricing(input: RetailPricingInput): Promise<RetailPricingResult> {
    const hasLuluCredentials = Boolean(process.env.LULU_API_KEY && process.env.LULU_API_SECRET);
    const shouldCalculateShipping = Boolean(input.shippingOption && input.shipping);

    let wholesale: number;
    let shipping = 0;
    let isEstimate = !shouldCalculateShipping; // dummy address = estimate

    // --- Try cache first (product cost only, address-independent) ---
    const cachedUnitCost = getCachedProductCost(input.format, input.size, input.pageCount);

    if (cachedUnitCost !== null && !shouldCalculateShipping) {
        // Cache hit + no shipping needed: skip Lulu API entirely
        wholesale = cachedUnitCost * input.quantity;
    } else if (hasLuluCredentials) {
        // Need Lulu API: either for shipping or cache miss
        try {
            const luluClient = createLuluClient();

            if (shouldCalculateShipping) {
                // Full calculation with real address
                const options: CostCalculationOptions = {
                    ...buildBaseOptions(input),
                    name: input.shipping?.fullName,
                    street1: input.shipping?.addressLine1,
                    street2: input.shipping?.addressLine2,
                    phoneNumber: input.shipping?.phone,
                    shippingCity: input.shipping?.city,
                    countryCode: input.countryCode || input.shipping?.country || 'US',
                    postalCode: input.postalCode || input.shipping?.postalCode || '10001',
                    stateCode: input.stateCode || input.shipping?.state || 'NY',
                    shippingOption: input.shippingOption,
                };

                const result = await luluClient.calculateCost(options);
                wholesale = result.productCost;
                shipping = result.shippingCost;

                // Cache per-unit product cost
                const unitCost = Math.round(result.productCost / input.quantity);
                setCachedProductCost(input.format, input.size, input.pageCount, unitCost);
            } else {
                // Product-only calculation (dummy address)
                const options: CostCalculationOptions = {
                    ...buildBaseOptions(input),
                    name: 'Pricing Estimate',
                    street1: '123 Main St',
                    shippingCity: 'New York',
                    countryCode: 'US',
                    postalCode: '10001',
                    stateCode: 'NY',
                    phoneNumber: '0000000000',
                };

                const result = await luluClient.calculateCost(options);
                wholesale = result.productCost;

                // Cache per-unit product cost
                const unitCost = Math.round(result.productCost / input.quantity);
                setCachedProductCost(input.format, input.size, input.pageCount, unitCost);
            }
        } catch (error) {
            // Lulu API failed — fall back to hardcoded prices
            console.warn('[Pricing] Lulu API failed, using fallback pricing:', error);
            wholesale = getFallbackWholesale(input.format, input.size, input.pageCount) * input.quantity;
            isEstimate = true;
        }
    } else {
        // No Lulu credentials (dev/test) — use fallback
        console.warn('[Pricing] No Lulu credentials, using fallback pricing');
        wholesale = getFallbackWholesale(input.format, input.size, input.pageCount) * input.quantity;
        isEstimate = true;
    }

    const subtotal = applyPricingRules(wholesale, input.quantity);
    const total = subtotal + shipping;

    return {
        subtotal,
        shipping,
        total,
        isEstimate,
    };
}
