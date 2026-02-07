// ============================================
// Fallback Pricing Tests
// ============================================

import {
    FALLBACK_WHOLESALE,
    getFallbackWholesale,
    getStartingRetailPrice,
} from '@/lib/lulu/fallback-prices';

describe('Fallback Pricing', () => {
    describe('getFallbackWholesale', () => {
        it('should return correct wholesale for softcover 7.5x7.5', () => {
            const result = getFallbackWholesale('softcover', '7.5x7.5', 32);
            const expected = FALLBACK_WHOLESALE.softcover['7.5x7.5'].baseCost
                + FALLBACK_WHOLESALE.softcover['7.5x7.5'].perPage * 32;
            expect(result).toBe(expected);
        });

        it('should return correct wholesale for hardcover 8x10', () => {
            const result = getFallbackWholesale('hardcover', '8x10', 48);
            const expected = FALLBACK_WHOLESALE.hardcover['8x10'].baseCost
                + FALLBACK_WHOLESALE.hardcover['8x10'].perPage * 48;
            expect(result).toBe(expected);
        });

        it('should scale with page count', () => {
            const cost24 = getFallbackWholesale('softcover', '8x8', 24);
            const cost48 = getFallbackWholesale('softcover', '8x8', 48);
            expect(cost48).toBeGreaterThan(cost24);
            // Difference should be 24 pages * perPage rate
            expect(cost48 - cost24).toBe(24 * FALLBACK_WHOLESALE.softcover['8x8'].perPage);
        });

        it('should return all format/size combos without error', () => {
            const formats: Array<'softcover' | 'hardcover'> = ['softcover', 'hardcover'];
            const sizes: Array<'7.5x7.5' | '8x8' | '8x10'> = ['7.5x7.5', '8x8', '8x10'];

            for (const format of formats) {
                for (const size of sizes) {
                    const result = getFallbackWholesale(format, size, 32);
                    expect(result).toBeGreaterThan(0);
                }
            }
        });

        it('should throw for invalid format/size', () => {
            expect(() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                getFallbackWholesale('paperback' as any, '8x8', 32);
            }).toThrow('No fallback pricing');
        });
    });

    describe('getStartingRetailPrice', () => {
        it('should return a value >= $40 (4000 cents) for softcover', () => {
            const price = getStartingRetailPrice('softcover');
            expect(price).toBeGreaterThanOrEqual(4000);
        });

        it('should return a value >= $40 (4000 cents) for hardcover', () => {
            const price = getStartingRetailPrice('hardcover');
            expect(price).toBeGreaterThanOrEqual(4000);
        });

        it('should return hardcover price >= softcover price', () => {
            const softcover = getStartingRetailPrice('softcover');
            const hardcover = getStartingRetailPrice('hardcover');
            expect(hardcover).toBeGreaterThanOrEqual(softcover);
        });

        it('should be rounded to nearest dollar', () => {
            const softcover = getStartingRetailPrice('softcover');
            const hardcover = getStartingRetailPrice('hardcover');
            expect(softcover % 100).toBe(0);
            expect(hardcover % 100).toBe(0);
        });

        it('should apply 3x markup on wholesale', () => {
            // For the cheapest softcover (7.5x7.5 at 32 pages)
            const wholesale = getFallbackWholesale('softcover', '7.5x7.5', 32);
            const markedUp = wholesale * 3;
            const rounded = Math.ceil(markedUp / 100) * 100;
            const expected = Math.max(rounded, 4000);

            const result = getStartingRetailPrice('softcover');
            // Starting price should be <= expected (since it picks minimum across sizes)
            expect(result).toBeLessThanOrEqual(expected);
        });
    });
});
