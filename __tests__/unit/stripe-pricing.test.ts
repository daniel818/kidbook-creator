// ============================================
// Stripe Pricing Tests
// ============================================

import { calculatePrice, formatPrice, BookPricing } from '@/lib/stripe/server';

describe('Stripe Pricing', () => {
    describe('calculatePrice', () => {
        it('should calculate softcover 7.5x7.5 price correctly', () => {
            const options: BookPricing = {
                format: 'softcover',
                size: '7.5x7.5',
                pageCount: 20,
                quantity: 1,
            };

            const result = calculatePrice(options);

            // Base: 899 cents + 20 pages * 35 cents = 899 + 700 = 1599 cents
            expect(result.subtotal).toBe(1599);
            expect(result.shipping).toBe(499);
            expect(result.total).toBe(2098);
        });

        it('should calculate hardcover 8x8 price correctly', () => {
            const options: BookPricing = {
                format: 'hardcover',
                size: '8x8',
                pageCount: 24,
                quantity: 1,
            };

            const result = calculatePrice(options);

            // Base: 2499 cents + 24 pages * 55 cents = 2499 + 1320 = 3819 cents
            expect(result.subtotal).toBe(3819);
            expect(result.shipping).toBe(499);
            expect(result.total).toBe(4318);
        });

        it('should multiply by quantity', () => {
            const options: BookPricing = {
                format: 'softcover',
                size: '7.5x7.5',
                pageCount: 10,
                quantity: 3,
            };

            const result = calculatePrice(options);

            // Single book: 899 + 10*35 = 1249 cents
            // Times 3 = 3747 cents
            expect(result.subtotal).toBe(3747);
            expect(result.total).toBe(3747 + 499);
        });

        it('should handle 8x10 hardcover (largest option)', () => {
            const options: BookPricing = {
                format: 'hardcover',
                size: '8x10',
                pageCount: 40,
                quantity: 2,
            };

            const result = calculatePrice(options);

            // Base: 2999 cents + 40 pages * 65 cents = 2999 + 2600 = 5599 cents
            // Times 2 = 11198 cents
            expect(result.subtotal).toBe(11198);
        });

        it('should handle zero pages', () => {
            const options: BookPricing = {
                format: 'softcover',
                size: '7.5x7.5',
                pageCount: 0,
                quantity: 1,
            };

            const result = calculatePrice(options);

            // Just base price
            expect(result.subtotal).toBe(899);
        });
    });

    describe('formatPrice', () => {
        it('should format cents to dollar string', () => {
            expect(formatPrice(1599)).toBe('$15.99');
            expect(formatPrice(2499)).toBe('$24.99');
            expect(formatPrice(100)).toBe('$1.00');
            expect(formatPrice(99)).toBe('$0.99');
        });

        it('should handle zero', () => {
            expect(formatPrice(0)).toBe('$0.00');
        });
    });
});
