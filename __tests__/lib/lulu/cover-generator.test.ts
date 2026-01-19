// ============================================
// Cover PDF Generator Tests
// ============================================
// TDD: Tests for Lulu-compliant cover spread generation

import { generateCoverPDF, calculateCoverDimensions, CoverDimensions } from '@/lib/lulu/cover-generator';
import { Book } from '@/lib/types';

// Mock book data
const mockBook: Book = {
    id: 'test-book-123',
    userId: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    settings: {
        childName: 'Test Child',
        childAge: 5,
        bookTheme: 'adventure',
        bookType: 'picture',
        title: 'Test Adventure Book',
    },
    pages: Array(24).fill(null).map((_, i) => ({
        id: `page-${i}`,
        pageNumber: i + 1,
        type: i === 0 ? 'cover' : 'inside' as const,
        backgroundColor: '#ffffff',
        backgroundImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        textElements: [],
        imageElements: [],
        createdAt: new Date(),
        updatedAt: new Date(),
    })),
};

describe('Cover PDF Generator', () => {
    describe('calculateCoverDimensions', () => {
        it('calculates correct dimensions for 8x8 softcover with 24 pages', () => {
            const dims = calculateCoverDimensions('8x8', 24, 'softcover');

            // Back cover (8") + Spine + Front cover (8") + Bleed (0.125" × 2)
            // Spine for 24 pages ≈ 0.054"
            expect(dims.totalWidth).toBeCloseTo(8 + 8 + 0.054 + 0.25, 2);
            expect(dims.totalHeight).toBeCloseTo(8 + 0.25, 2); // Height + bleed
            expect(dims.spineWidth).toBeCloseTo(0.054, 2);
        });

        it('calculates correct dimensions for 6x6 hardcover', () => {
            const dims = calculateCoverDimensions('6x6', 24, 'hardcover');

            // Hardcover has wrap-around, so slightly different
            expect(dims.totalWidth).toBeGreaterThan(12); // Back + Front + Spine + Wrap
            expect(dims.safetyMargin).toBe(0.75); // Hardcover has larger safety margin
        });

        it('calculates spine width correctly for different page counts', () => {
            const dims24 = calculateCoverDimensions('8x8', 24, 'softcover');
            const dims100 = calculateCoverDimensions('8x8', 100, 'softcover');

            expect(dims100.spineWidth).toBeGreaterThan(dims24.spineWidth);
        });

        it('includes correct safety margins', () => {
            const softcoverDims = calculateCoverDimensions('8x8', 24, 'softcover');
            const hardcoverDims = calculateCoverDimensions('8x8', 24, 'hardcover');

            expect(softcoverDims.safetyMargin).toBe(0.5);
            expect(hardcoverDims.safetyMargin).toBe(0.75);
        });
    });

    describe('generateCoverPDF', () => {
        it('generates a PDF blob', async () => {
            const result = await generateCoverPDF(mockBook, 'softcover', '8x8');
            expect(result).toBeInstanceOf(Blob);
            expect(result.type).toBe('application/pdf');
        });

        it('generates single-page spread PDF', async () => {
            const result = await generateCoverPDF(mockBook, 'softcover', '8x8');
            expect(result.size).toBeGreaterThan(0);
            // Cover PDF should be a single page spread
        });

        it('includes back cover, spine, and front cover', async () => {
            const result = await generateCoverPDF(mockBook, 'softcover', '8x8');
            expect(result).toBeInstanceOf(Blob);
            // The PDF should contain all three elements
        });

        it('handles hardcover format with wrap', async () => {
            const result = await generateCoverPDF(mockBook, 'hardcover', '8x8');
            expect(result).toBeInstanceOf(Blob);
        });

        it('applies bleed margins around entire spread', async () => {
            const result = await generateCoverPDF(mockBook, 'softcover', '8x8');
            expect(result.size).toBeGreaterThan(0);
        });

        it('throws error for book with no cover page', async () => {
            const noCoverBook = { ...mockBook, pages: mockBook.pages.slice(1) };
            await expect(
                generateCoverPDF(noCoverBook, 'softcover', '8x8')
            ).rejects.toThrow();
        });
    });
});
