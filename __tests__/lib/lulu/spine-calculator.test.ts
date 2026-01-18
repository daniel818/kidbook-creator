// ============================================
// Spine Calculator Tests
// ============================================
// TDD: These tests define the expected behavior

import { calculateSpineWidth, PAPER_THICKNESS } from '@/lib/lulu/spine-calculator';

describe('Spine Calculator', () => {
    describe('calculateSpineWidth', () => {
        it('calculates spine for 24 pages with standard paper', () => {
            // Lulu formula: pages × paper thickness
            // Standard paper: ~0.002252 inches per page
            const result = calculateSpineWidth(24, 'standard');

            // 24 pages = 12 sheets × 2 sides
            // Spine should be approximately 0.054 inches (24 × 0.002252)
            expect(result).toBeCloseTo(0.054, 2);
        });

        it('calculates spine for 100 pages with standard paper', () => {
            const result = calculateSpineWidth(100, 'standard');

            // 100 pages ≈ 0.225 inches
            expect(result).toBeCloseTo(0.225, 2);
        });

        it('calculates spine for 24 pages with premium paper', () => {
            const result = calculateSpineWidth(24, 'premium');

            // Premium paper is thicker (~0.0025 inches per page)
            expect(result).toBeCloseTo(0.06, 2);
        });

        it('handles minimum page count', () => {
            const result = calculateSpineWidth(12, 'standard');
            expect(result).toBeGreaterThan(0);
        });

        it('throws error for invalid page count', () => {
            expect(() => calculateSpineWidth(0, 'standard')).toThrow();
            expect(() => calculateSpineWidth(-1, 'standard')).toThrow();
        });
    });

    describe('PAPER_THICKNESS constants', () => {
        it('has correct standard paper thickness', () => {
            expect(PAPER_THICKNESS.standard).toBeCloseTo(0.002252, 4);
        });

        it('has correct premium paper thickness', () => {
            expect(PAPER_THICKNESS.premium).toBeCloseTo(0.0025, 4);
        });
    });
});
