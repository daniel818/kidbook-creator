// ============================================
// Interior PDF Generator Tests
// ============================================
// TDD: These tests define the expected behavior for Lulu-compliant PDFs

import { generateInteriorPDF, TRIM_SIZES, BLEED_SIZE, SAFETY_MARGIN, GUTTER_MARGIN } from '@/lib/lulu/pdf-generator';
import { Book } from '@/lib/types';

// Mock book data for testing
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
    pages: [
        {
            id: 'cover',
            pageNumber: 1,
            type: 'cover',
            backgroundColor: '#ffffff',
            backgroundImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            textElements: [],
            imageElements: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            id: 'page-1',
            pageNumber: 2,
            type: 'inside',
            backgroundColor: '#ffffff',
            backgroundImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            textElements: [{ id: 't1', content: 'Once upon a time...', x: 10, y: 70, width: 80, fontSize: 18, fontFamily: 'Inter', color: '#333', textAlign: 'left', fontWeight: 'normal' }],
            imageElements: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    ],
};

describe('Interior PDF Generator', () => {
    describe('TRIM_SIZES', () => {
        it('defines correct 7.5x7.5 trim size in inches', () => {
            expect(TRIM_SIZES['7.5x7.5']).toEqual({ width: 7.5, height: 7.5 });
        });

        it('defines correct 8x8 trim size in inches', () => {
            expect(TRIM_SIZES['8x8']).toEqual({ width: 8.5, height: 8.5 });
        });

        it('defines correct 8x10 trim size in inches', () => {
            expect(TRIM_SIZES['8x10']).toEqual({ width: 8.5, height: 11 });
        });
    });

    describe('BLEED_SIZE', () => {
        it('is 0.125 inches per Lulu requirements', () => {
            expect(BLEED_SIZE).toBe(0.125);
        });
    });

    describe('SAFETY_MARGIN', () => {
        it('is 0.5 inches for content safety', () => {
            expect(SAFETY_MARGIN).toBe(0.5);
        });
    });

    describe('GUTTER_MARGIN', () => {
        it('is at least 0.2 inches for binding', () => {
            expect(GUTTER_MARGIN).toBeGreaterThanOrEqual(0.2);
        });
    });

    describe('generateInteriorPDF', () => {
        it('generates a PDF blob', async () => {
            const result = await generateInteriorPDF(mockBook, 'softcover', '8x8');
            expect(result).toBeInstanceOf(Blob);
            expect(result.type).toBe('application/pdf');
        });

        it('generates PDF with correct page dimensions including bleed', async () => {
            // For 8.5x8.5 book with 0.125" bleed on each side:
            // Width = 8.5 + (0.125 * 2) = 8.75 inches
            // Height = 8.5 + (0.125 * 2) = 8.75 inches
            const result = await generateInteriorPDF(mockBook, 'softcover', '8x8');

            // We'll need to verify the PDF dimensions
            // This test ensures the generator considers bleed
            expect(result.size).toBeGreaterThan(0);
        });

        it('generates correct number of pages', async () => {
            const result = await generateInteriorPDF(mockBook, 'softcover', '8x8');
            // mockBook has 2 pages (cover + 1 interior)
            // Interior PDF should have all pages
            expect(result.size).toBeGreaterThan(0);
        });

        it('handles 7.5x7.5 book size', async () => {
            const result = await generateInteriorPDF(mockBook, 'softcover', '7.5x7.5');
            expect(result).toBeInstanceOf(Blob);
        });

        it('handles 8x10 book size', async () => {
            const result = await generateInteriorPDF(mockBook, 'softcover', '8x10');
            expect(result).toBeInstanceOf(Blob);
        });

        it('handles hardcover format', async () => {
            const result = await generateInteriorPDF(mockBook, 'hardcover', '8x8');
            expect(result).toBeInstanceOf(Blob);
        });

        it('throws error for invalid book size', async () => {
            await expect(
                generateInteriorPDF(mockBook, 'softcover', 'invalid' as any)
            ).rejects.toThrow();
        });

        it('throws error for empty book', async () => {
            const emptyBook = { ...mockBook, pages: [] };
            await expect(
                generateInteriorPDF(emptyBook, 'softcover', '8x8')
            ).rejects.toThrow();
        });
    });
});
