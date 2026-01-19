// ============================================
// Lulu-Compliant Cover PDF Generator
// ============================================
// Generates print-ready cover spread (back + spine + front)

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Book, BookPage } from '@/lib/types';
import { calculateSpineWidth, PaperType } from './spine-calculator';

/**
 * Trim sizes in inches
 */
const TRIM_SIZES: Record<string, { width: number; height: number }> = {
    '6x6': { width: 6, height: 6 },
    '8x8': { width: 8, height: 8 },
    '8x10': { width: 8, height: 10 },
};

/**
 * Bleed size in inches
 */
const BLEED_SIZE = 0.125;

/**
 * Safety margins for cover content
 */
const SAFETY_MARGINS = {
    softcover: 0.5,
    hardcover: 0.75,  // Hardcover casewrap needs more margin
};

/**
 * Points per inch
 */
const POINTS_PER_INCH = 72;

/**
 * Cover dimensions calculation result
 */
export interface CoverDimensions {
    totalWidth: number;      // Full spread width in inches
    totalHeight: number;     // Full spread height in inches
    backCoverWidth: number;  // Back cover width in inches
    spineWidth: number;      // Spine width in inches
    frontCoverWidth: number; // Front cover width in inches
    safetyMargin: number;    // Safety margin in inches
    bleed: number;           // Bleed in inches
}

/**
 * Calculate cover spread dimensions
 */
export function calculateCoverDimensions(
    size: '6x6' | '8x8' | '8x10',
    pageCount: number,
    format: 'softcover' | 'hardcover',
    paperType: PaperType = 'standard'
): CoverDimensions {
    const trimSize = TRIM_SIZES[size];
    if (!trimSize) {
        throw new Error(`Invalid size: ${size}`);
    }

    const spineWidth = calculateSpineWidth(pageCount, paperType);
    const safetyMargin = SAFETY_MARGINS[format];

    // Cover spread = Back + Spine + Front + Bleed on all edges
    const backCoverWidth = trimSize.width;
    const frontCoverWidth = trimSize.width;

    // Total width includes bleed on left and right edges
    const totalWidth = backCoverWidth + spineWidth + frontCoverWidth + (BLEED_SIZE * 2);

    // Total height includes bleed on top and bottom
    const totalHeight = trimSize.height + (BLEED_SIZE * 2);

    return {
        totalWidth,
        totalHeight,
        backCoverWidth,
        spineWidth,
        frontCoverWidth,
        safetyMargin,
        bleed: BLEED_SIZE,
    };
}

/**
 * Convert inches to PDF points
 */
function inchesToPoints(inches: number): number {
    return inches * POINTS_PER_INCH;
}

/**
 * Load image as Uint8Array
 */
async function loadImageBytes(url: string): Promise<Uint8Array | null> {
    try {
        if (url.startsWith('data:')) {
            const base64 = url.split(',')[1];
            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes;
        }

        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        return new Uint8Array(arrayBuffer);
    } catch (error) {
        console.error('Failed to load image:', error);
        return null;
    }
}

/**
 * Get cover page from book
 */
function getCoverPage(book: Book): BookPage | undefined {
    return book.pages.find(p => p.type === 'cover');
}

/**
 * Get back cover page from book
 */
function getBackCoverPage(book: Book): BookPage | undefined {
    return book.pages.find(p => p.type === 'back');
}

/**
 * Get page image URL
 */
function getPageImage(page: BookPage): string | null {
    return page.backgroundImage ||
        (page as unknown as { background_image?: string }).background_image ||
        null;
}

/**
 * Generate Lulu-compliant cover PDF
 * Creates a single-page spread with Back Cover + Spine + Front Cover
 */
export async function generateCoverPDF(
    book: Book,
    format: 'softcover' | 'hardcover',
    size: '6x6' | '8x8' | '8x10',
    paperType: PaperType = 'standard'
): Promise<Blob> {
    const coverPage = getCoverPage(book);
    if (!coverPage) {
        throw new Error('Book must have a cover page');
    }

    const pageCount = book.pages.length;
    const dims = calculateCoverDimensions(size, pageCount, format, paperType);

    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Single page spread
    const pageWidthPoints = inchesToPoints(dims.totalWidth);
    const pageHeightPoints = inchesToPoints(dims.totalHeight);
    const pdfPage = pdfDoc.addPage([pageWidthPoints, pageHeightPoints]);

    // Calculate positions in points
    const bleedPoints = inchesToPoints(dims.bleed);
    const backCoverLeft = bleedPoints;
    const backCoverWidth = inchesToPoints(dims.backCoverWidth);
    const spineLeft = bleedPoints + backCoverWidth;
    const spineWidth = inchesToPoints(dims.spineWidth);
    const frontCoverLeft = spineLeft + spineWidth;
    const frontCoverWidth = inchesToPoints(dims.frontCoverWidth);

    // ===== BACK COVER =====
    const backCoverPage = getBackCoverPage(book);
    const backCoverImageUrl = backCoverPage ? getPageImage(backCoverPage) : null;

    if (backCoverImageUrl) {
        const imageBytes = await loadImageBytes(backCoverImageUrl);
        if (imageBytes) {
            try {
                const embeddedImage = backCoverImageUrl.includes('png')
                    ? await pdfDoc.embedPng(imageBytes)
                    : await pdfDoc.embedJpg(imageBytes);

                pdfPage.drawImage(embeddedImage, {
                    x: 0,  // Include bleed
                    y: 0,
                    width: backCoverWidth + bleedPoints,
                    height: pageHeightPoints,
                });
            } catch (error) {
                console.error('Failed to embed back cover image:', error);
            }
        }
    } else {
        // Default back cover background
        pdfPage.drawRectangle({
            x: 0,
            y: 0,
            width: backCoverWidth + bleedPoints,
            height: pageHeightPoints,
            color: rgb(0.95, 0.95, 0.95),
        });
    }

    // Back cover text (blurb)
    const backCoverText = backCoverPage?.textElements?.[0]?.content ||
        'A personalized storybook adventure created with love.';
    const safeMargin = inchesToPoints(dims.safetyMargin);
    const textMaxWidth = backCoverWidth - (safeMargin * 2);

    pdfPage.drawText(backCoverText, {
        x: backCoverLeft + safeMargin,
        y: pageHeightPoints / 2,
        size: 12,
        font: fontRegular,
        color: rgb(0.3, 0.3, 0.3),
        maxWidth: textMaxWidth,
    });

    // ===== SPINE =====
    pdfPage.drawRectangle({
        x: spineLeft,
        y: 0,
        width: spineWidth,
        height: pageHeightPoints,
        color: rgb(0.3, 0.3, 0.5),  // Dark spine color
    });

    // Spine text (rotated - title)
    if (spineWidth > inchesToPoints(0.2)) {  // Only if spine is wide enough
        const title = book.settings.title || `${book.settings.childName}'s Story`;
        const spineFontSize = Math.min(10, spineWidth * 0.6);

        // Rotate and center spine text
        pdfPage.drawText(title, {
            x: spineLeft + (spineWidth / 2) - (spineFontSize / 4),
            y: pageHeightPoints / 2,
            size: spineFontSize,
            font: font,
            color: rgb(1, 1, 1),
            rotate: { type: 'degrees' as const, angle: 90 },
        });
    }

    // ===== FRONT COVER =====
    const frontCoverImageUrl = getPageImage(coverPage);

    if (frontCoverImageUrl) {
        const imageBytes = await loadImageBytes(frontCoverImageUrl);
        if (imageBytes) {
            try {
                const embeddedImage = frontCoverImageUrl.includes('png')
                    ? await pdfDoc.embedPng(imageBytes)
                    : await pdfDoc.embedJpg(imageBytes);

                pdfPage.drawImage(embeddedImage, {
                    x: frontCoverLeft,
                    y: 0,
                    width: frontCoverWidth + bleedPoints,  // Include right bleed
                    height: pageHeightPoints,
                });
            } catch (error) {
                console.error('Failed to embed front cover image:', error);
            }
        }
    } else {
        // Default front cover gradient
        pdfPage.drawRectangle({
            x: frontCoverLeft,
            y: 0,
            width: frontCoverWidth + bleedPoints,
            height: pageHeightPoints,
            color: rgb(0.4, 0.4, 0.9),
        });
    }

    // Front cover title overlay
    const title = book.settings.title || `${book.settings.childName}'s Story`;
    const titleFontSize = 24;

    // Semi-transparent overlay
    pdfPage.drawRectangle({
        x: frontCoverLeft,
        y: 0,
        width: frontCoverWidth + bleedPoints,
        height: inchesToPoints(1.5),
        color: rgb(0, 0, 0),
        opacity: 0.5,
    });

    pdfPage.drawText(title, {
        x: frontCoverLeft + safeMargin,
        y: inchesToPoints(0.8),
        size: titleFontSize,
        font: font,
        color: rgb(1, 1, 1),
    });

    // Save and return as Blob
    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
}
