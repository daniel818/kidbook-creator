// ============================================
// Lulu-Compliant Interior PDF Generator
// ============================================
// Generates print-ready interior PDFs meeting Lulu's specifications

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Book, BookPage } from '@/lib/types';

/**
 * Trim sizes in inches (final book dimensions after cutting)
 */
export const TRIM_SIZES: Record<string, { width: number; height: number }> = {
    '6x6': { width: 6, height: 6 },
    '8x8': { width: 8, height: 8 },
    '8x10': { width: 8, height: 10 },
};

/**
 * Bleed size in inches - content that extends beyond trim edge
 * Required by Lulu for full-bleed printing
 */
export const BLEED_SIZE = 0.125;

/**
 * Safety margin in inches - keep important content within this area
 */
export const SAFETY_MARGIN = 0.5;

/**
 * Gutter margin in inches - extra space on binding edge
 */
export const GUTTER_MARGIN = 0.25;

/**
 * Points per inch for PDF coordinate conversion
 */
const POINTS_PER_INCH = 72;

/**
 * Convert inches to PDF points
 */
function inchesToPoints(inches: number): number {
    return inches * POINTS_PER_INCH;
}

/**
 * Get page image URL from various possible properties
 */
function getPageImage(page: BookPage): string | null {
    return page.backgroundImage ||
        (page as unknown as { background_image?: string }).background_image ||
        null;
}

/**
 * Get text content from page
 */
function getPageText(page: BookPage): string {
    if (!page.textElements || page.textElements.length === 0) {
        return '';
    }
    return page.textElements.map(el => el.content).join('\n\n');
}

/**
 * Load image as Uint8Array for pdf-lib
 */
async function loadImageBytes(url: string): Promise<Uint8Array | null> {
    try {
        if (url.startsWith('data:')) {
            // Parse base64 data URL
            const base64 = url.split(',')[1];
            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes;
        }

        // Fetch remote URL
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        return new Uint8Array(arrayBuffer);
    } catch (error) {
        console.error('Failed to load image:', error);
        return null;
    }
}

/**
 * Generate Lulu-compliant interior PDF
 * 
 * @param book - Book data with pages
 * @param format - 'softcover' or 'hardcover'
 * @param size - '6x6', '8x8', or '8x10'
 * @returns PDF as Blob
 */
export async function generateInteriorPDF(
    book: Book,
    format: 'softcover' | 'hardcover',
    size: '6x6' | '8x8' | '8x10'
): Promise<Blob> {
    // Validate inputs
    const trimSize = TRIM_SIZES[size];
    if (!trimSize) {
        throw new Error(`Invalid book size: ${size}`);
    }

    if (!book.pages || book.pages.length === 0) {
        throw new Error('Book must have at least one page');
    }

    // Calculate page dimensions with bleed
    const pageWidthInches = trimSize.width + (BLEED_SIZE * 2);
    const pageHeightInches = trimSize.height + (BLEED_SIZE * 2);
    const pageWidthPoints = inchesToPoints(pageWidthInches);
    const pageHeightPoints = inchesToPoints(pageHeightInches);

    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Generate each page
    for (let i = 0; i < book.pages.length; i++) {
        const bookPage = book.pages[i];
        const pdfPage = pdfDoc.addPage([pageWidthPoints, pageHeightPoints]);

        const imageUrl = getPageImage(bookPage);
        const text = getPageText(bookPage);

        // Calculate safe content area (inside bleed and safety margins)
        const safeLeft = inchesToPoints(BLEED_SIZE + SAFETY_MARGIN);
        const safeRight = pageWidthPoints - inchesToPoints(BLEED_SIZE + SAFETY_MARGIN);
        const safeTop = pageHeightPoints - inchesToPoints(BLEED_SIZE + SAFETY_MARGIN);
        const safeBottom = inchesToPoints(BLEED_SIZE + SAFETY_MARGIN);

        // Add gutter margin on binding edge (alternates based on page number)
        const isRightPage = (i + 1) % 2 === 1; // Right pages are odd numbered
        const gutterOffset = inchesToPoints(GUTTER_MARGIN);
        const contentLeft = isRightPage
            ? safeLeft + gutterOffset
            : safeLeft;
        const contentRight = isRightPage
            ? safeRight
            : safeRight - gutterOffset;

        // Add background image (full bleed)
        if (imageUrl) {
            const imageBytes = await loadImageBytes(imageUrl);
            if (imageBytes) {
                try {
                    // Detect image type and embed
                    let embeddedImage;
                    if (imageUrl.includes('png') || imageUrl.startsWith('data:image/png')) {
                        embeddedImage = await pdfDoc.embedPng(imageBytes);
                    } else {
                        embeddedImage = await pdfDoc.embedJpg(imageBytes);
                    }

                    // Scale to fill page (full bleed)
                    const imageWidth = pageWidthPoints;
                    const imageHeight = pageHeightPoints;

                    pdfPage.drawImage(embeddedImage, {
                        x: 0,
                        y: 0,
                        width: imageWidth,
                        height: imageHeight,
                    });
                } catch (error) {
                    console.error(`Failed to embed image on page ${i + 1}:`, error);
                    // Fill with placeholder color
                    pdfPage.drawRectangle({
                        x: 0,
                        y: 0,
                        width: pageWidthPoints,
                        height: pageHeightPoints,
                        color: rgb(0.95, 0.95, 0.95),
                    });
                }
            }
        }

        // Add text content (within safe area)
        if (text && bookPage.type !== 'cover') {
            // Text positioning based on layout
            // For picture books: text at bottom of page
            const textFontSize = 14;
            const lineHeight = textFontSize * 1.4;
            const maxWidth = contentRight - contentLeft;

            // Simple text wrapping
            const words = text.split(' ');
            const lines: string[] = [];
            let currentLine = '';

            for (const word of words) {
                const testLine = currentLine ? `${currentLine} ${word}` : word;
                const testWidth = font.widthOfTextAtSize(testLine, textFontSize);

                if (testWidth > maxWidth && currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            }
            if (currentLine) {
                lines.push(currentLine);
            }

            // Draw text from bottom up
            let yPos = safeBottom + (lines.length * lineHeight);
            for (const line of lines) {
                pdfPage.drawText(line, {
                    x: contentLeft,
                    y: yPos,
                    size: textFontSize,
                    font: font,
                    color: rgb(0.2, 0.2, 0.2),
                });
                yPos -= lineHeight;
            }
        }

        // Add page number (except cover)
        if (bookPage.type !== 'cover' && i > 0) {
            const pageNum = i.toString();
            const pageNumWidth = font.widthOfTextAtSize(pageNum, 10);
            const xPos = isRightPage
                ? contentRight - pageNumWidth
                : contentLeft;

            pdfPage.drawText(pageNum, {
                x: xPos,
                y: safeBottom - inchesToPoints(0.3),
                size: 10,
                font: font,
                color: rgb(0.5, 0.5, 0.5),
            });
        }
    }

    // Save and return as Blob
    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
}

/**
 * Validate that a book meets Lulu's requirements
 */
export function validateForPrint(book: Book, size: string): string[] {
    const errors: string[] = [];

    if (!TRIM_SIZES[size]) {
        errors.push(`Invalid size: ${size}`);
    }

    if (!book.pages || book.pages.length < 2) {
        errors.push('Book must have at least 2 pages');
    }

    // Check for missing images
    const pagesWithoutImages = book.pages.filter(p => !getPageImage(p));
    if (pagesWithoutImages.length > 0) {
        errors.push(`${pagesWithoutImages.length} page(s) are missing images`);
    }

    return errors;
}
