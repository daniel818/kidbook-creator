// ============================================
// formatPrice Tests
// ============================================

import { formatPrice } from '@/lib/stripe/server';

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
