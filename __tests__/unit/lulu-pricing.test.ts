// ============================================
// Lulu Retail Pricing Tests
// ============================================

// Mock Lulu client
const mockCalculateCost = jest.fn();

jest.mock('@/lib/lulu/client', () => ({
    createLuluClient: jest.fn(() => ({
        calculateCost: mockCalculateCost,
    })),
}));

jest.mock('@/lib/lulu/fulfillment', () => ({
    getLuluProductId: jest.fn(() => '0850X0850FCPREPB080CW444GXX'),
}));

import { calculateRetailPricing, _clearPricingCache } from '@/lib/lulu/pricing';

describe('calculateRetailPricing', () => {
    const baseInput = {
        format: 'softcover' as const,
        size: '8x8' as const,
        pageCount: 32,
        quantity: 1,
    };

    const luluApiResponse = {
        productCost: 600,     // $6.00 wholesale
        shippingCost: 350,    // $3.50 shipping
        totalWholesale: 950,
        currency: 'USD',
    };

    beforeEach(() => {
        jest.clearAllMocks();
        _clearPricingCache();
        // Set env for Lulu credentials
        process.env.LULU_API_KEY = 'test-key';
        process.env.LULU_API_SECRET = 'test-secret';
    });

    afterAll(() => {
        delete process.env.LULU_API_KEY;
        delete process.env.LULU_API_SECRET;
    });

    describe('Lulu API path', () => {
        it('should call Lulu API and apply markup (cache miss, no shipping)', async () => {
            mockCalculateCost.mockResolvedValue(luluApiResponse);

            const result = await calculateRetailPricing(baseInput);

            expect(mockCalculateCost).toHaveBeenCalledTimes(1);
            // 600 cents wholesale * 3 = 1800 → round up = 1800 → floor $40 → 4000
            expect(result.subtotal).toBe(4000);
            expect(result.shipping).toBe(0); // no shipping without address
            expect(result.total).toBe(4000);
            expect(result.isEstimate).toBe(true); // no real address
        });

        it('should include shipping when address is provided', async () => {
            mockCalculateCost.mockResolvedValue(luluApiResponse);

            const result = await calculateRetailPricing({
                ...baseInput,
                shippingOption: 'MAIL',
                shipping: {
                    fullName: 'Test User',
                    addressLine1: '123 Main St',
                    city: 'New York',
                    state: 'NY',
                    postalCode: '10001',
                    country: 'US',
                },
            });

            expect(result.shipping).toBe(350);
            expect(result.total).toBe(4000 + 350);
            expect(result.isEstimate).toBe(false); // real address
        });

        it('should apply 3x markup and round up', async () => {
            // $10 wholesale → $30 markup → already at dollar boundary
            mockCalculateCost.mockResolvedValue({
                ...luluApiResponse,
                productCost: 1000,
            });

            const result = await calculateRetailPricing(baseInput);

            // 1000 * 3 = 3000 → round up to 3000 → floor $40 → 4000
            expect(result.subtotal).toBe(4000);
        });

        it('should round up to next dollar', async () => {
            // $15.50 wholesale → $46.50 markup → round up to $47
            mockCalculateCost.mockResolvedValue({
                ...luluApiResponse,
                productCost: 1550,
            });

            const result = await calculateRetailPricing(baseInput);

            // 1550 * 3 = 4650 → round up to 4700
            expect(result.subtotal).toBe(4700);
        });

        it('should enforce $40 minimum per book', async () => {
            // Very cheap book
            mockCalculateCost.mockResolvedValue({
                ...luluApiResponse,
                productCost: 300, // $3.00 wholesale
            });

            const result = await calculateRetailPricing(baseInput);

            // 300 * 3 = 900 → round up to 900 → floor $40 → 4000
            expect(result.subtotal).toBe(4000);
        });

        it('should enforce $40 minimum per book for multiple quantity', async () => {
            mockCalculateCost.mockResolvedValue({
                ...luluApiResponse,
                productCost: 600, // $6.00 total for 2 books
            });

            const result = await calculateRetailPricing({ ...baseInput, quantity: 2 });

            // 600 * 3 = 1800 → round up to 1800 → floor $80 (2 books) → 8000
            expect(result.subtotal).toBe(8000);
        });

        it('should enforce $45 minimum for hardcover', async () => {
            // Very cheap hardcover book
            mockCalculateCost.mockResolvedValue({
                ...luluApiResponse,
                productCost: 300, // $3.00 wholesale
            });

            const result = await calculateRetailPricing({
                ...baseInput,
                format: 'hardcover' as const,
            });

            // 300 * 3 = 900 → round up to 900 → floor $45 → 4500
            expect(result.subtotal).toBe(4500);
        });

        it('should enforce $45 minimum per hardcover book for multiple quantity', async () => {
            mockCalculateCost.mockResolvedValue({
                ...luluApiResponse,
                productCost: 600, // $6.00 total for 2 books
            });

            const result = await calculateRetailPricing({
                ...baseInput,
                format: 'hardcover' as const,
                quantity: 2,
            });

            // 600 * 3 = 1800 → round up to 1800 → floor $90 (2 × $45) → 9000
            expect(result.subtotal).toBe(9000);
        });
    });

    describe('Caching', () => {
        it('should skip Lulu API on cache hit when no shipping needed', async () => {
            mockCalculateCost.mockResolvedValue(luluApiResponse);

            // First call — cache miss
            await calculateRetailPricing(baseInput);
            expect(mockCalculateCost).toHaveBeenCalledTimes(1);

            // Second call — cache hit
            await calculateRetailPricing(baseInput);
            expect(mockCalculateCost).toHaveBeenCalledTimes(1); // no new call
        });

        it('should still call Lulu API for shipping even with cached product cost', async () => {
            mockCalculateCost.mockResolvedValue(luluApiResponse);

            // First call — cache product cost
            await calculateRetailPricing(baseInput);
            expect(mockCalculateCost).toHaveBeenCalledTimes(1);

            // Second call with shipping — must call API for shipping
            await calculateRetailPricing({
                ...baseInput,
                shippingOption: 'MAIL',
                shipping: {
                    fullName: 'Test',
                    addressLine1: '123 St',
                    city: 'LA',
                    state: 'CA',
                    postalCode: '90001',
                    country: 'US',
                },
            });
            expect(mockCalculateCost).toHaveBeenCalledTimes(2);
        });

        it('should use different cache keys for different configurations', async () => {
            mockCalculateCost.mockResolvedValue(luluApiResponse);

            await calculateRetailPricing(baseInput);
            await calculateRetailPricing({ ...baseInput, size: '8x10' as const });

            expect(mockCalculateCost).toHaveBeenCalledTimes(2);
        });

        it('should re-fetch after cache is cleared', async () => {
            mockCalculateCost.mockResolvedValue(luluApiResponse);

            await calculateRetailPricing(baseInput);
            _clearPricingCache();
            await calculateRetailPricing(baseInput);

            expect(mockCalculateCost).toHaveBeenCalledTimes(2);
        });
    });

    describe('Fallback', () => {
        it('should use fallback when Lulu API fails', async () => {
            mockCalculateCost.mockRejectedValue(new Error('API down'));

            const result = await calculateRetailPricing(baseInput);

            expect(result.isEstimate).toBe(true);
            expect(result.subtotal).toBeGreaterThanOrEqual(4000); // at least $40
            expect(result.total).toBe(result.subtotal); // no shipping on fallback
        });

        it('should use fallback when Lulu API fails', async () => {
            // With env validation, Lulu credentials are always present.
            // Test the fallback path by simulating an API failure instead.
            mockCalculateCost.mockRejectedValue(new Error('Lulu API unavailable'));

            const result = await calculateRetailPricing(baseInput);

            expect(result.isEstimate).toBe(true);
            expect(result.subtotal).toBeGreaterThanOrEqual(4000);
        });
    });

    describe('RetailPricingResult', () => {
        it('should not expose wholesale or margin in result', async () => {
            mockCalculateCost.mockResolvedValue(luluApiResponse);

            const result = await calculateRetailPricing(baseInput);

            // Verify the result only contains safe fields
            expect(result).toHaveProperty('subtotal');
            expect(result).toHaveProperty('shipping');
            expect(result).toHaveProperty('total');
            expect(result).toHaveProperty('isEstimate');
            expect(result).not.toHaveProperty('wholesale');
            expect(result).not.toHaveProperty('margin');
        });
    });
});
