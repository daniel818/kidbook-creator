// ============================================
// Lulu-Compliant Cover PDF Generator
// ============================================
// Uses html2canvas to rasterize cover spread, preserving all fonts
// Generates print-ready cover spread (back + spine + front)

'use client';

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Book, BookPage, BookThemeInfo } from '@/lib/types';
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
    hardcover: 0.75,
};

/**
 * DPI for screen rendering
 */
const SCREEN_DPI = 96;

/**
 * Target print DPI
 */
const PRINT_DPI = 300;

/**
 * Scale factor for html2canvas
 */
const SCALE_FACTOR = PRINT_DPI / SCREEN_DPI;

/**
 * Cover dimensions calculation result
 */
export interface CoverDimensions {
    totalWidth: number;
    totalHeight: number;
    backCoverWidth: number;
    spineWidth: number;
    frontCoverWidth: number;
    safetyMargin: number;
    bleed: number;
}

/**
 * Detect if book is square format
 */
function isSquareFormat(book: Book): boolean {
    return book.settings.printFormat === 'square';
}

/**
 * Get display title
 */
function getDisplayTitle(book: Book): string {
    return book.settings.title || `${book.settings.childName}'s Story`;
}

/**
 * Get the appropriate trim size based on book format
 */
function getBookSize(book: Book): '6x6' | '8x8' | '8x10' {
    if (isSquareFormat(book)) {
        return '8x8';
    }
    return '8x10';
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

    const backCoverWidth = trimSize.width;
    const frontCoverWidth = trimSize.width;

    const totalWidth = backCoverWidth + spineWidth + frontCoverWidth + (BLEED_SIZE * 2);
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
    if (page.imageElements && page.imageElements.length > 0 && page.imageElements[0].src) {
        return page.imageElements[0].src;
    }
    return page.backgroundImage ||
        (page as unknown as { background_image?: string }).background_image ||
        null;
}

/**
 * Wait for images to load
 */
async function waitForImages(element: HTMLElement): Promise<void> {
    const images = element.querySelectorAll('img');
    const promises = Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
        });
    });
    await Promise.all(promises);
    await new Promise(r => setTimeout(r, 100));
}

/**
 * Create the cover spread element (back + spine + front)
 */
function createCoverSpreadElement(
    book: Book,
    dims: CoverDimensions,
    themeColors: string[]
): HTMLDivElement {
    const totalWidthPx = dims.totalWidth * SCREEN_DPI;
    const totalHeightPx = dims.totalHeight * SCREEN_DPI;
    const bleedPx = dims.bleed * SCREEN_DPI;
    const backWidthPx = dims.backCoverWidth * SCREEN_DPI;
    const spineWidthPx = dims.spineWidth * SCREEN_DPI;
    const frontWidthPx = dims.frontCoverWidth * SCREEN_DPI;
    const safetyPx = dims.safetyMargin * SCREEN_DPI;

    const coverPage = getCoverPage(book);
    const backCoverPage = getBackCoverPage(book);

    // Get clean title (no [Square] marker)
    const bookTitle = getDisplayTitle(book);

    // Main container
    const container = document.createElement('div');
    container.style.cssText = `
        width: ${totalWidthPx}px;
        height: ${totalHeightPx}px;
        position: relative;
        display: flex;
        flex-direction: row;
        background: white;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // ===== BACK COVER =====
    const backCover = document.createElement('div');
    backCover.style.cssText = `
        width: ${backWidthPx + bleedPx}px;
        height: ${totalHeightPx}px;
        position: relative;
        overflow: hidden;
    `;

    const backImageUrl = backCoverPage ? getPageImage(backCoverPage) : null;
    if (backImageUrl) {
        const backImg = document.createElement('img');
        backImg.src = backImageUrl;
        backImg.crossOrigin = 'anonymous';
        backImg.style.cssText = `
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 100%;
            object-fit: cover;
        `;
        backCover.appendChild(backImg);
    } else {
        backCover.style.background = `linear-gradient(135deg, ${themeColors[0]} 0%, ${themeColors[1]} 100%)`;
    }

    // Back cover text
    const backText = document.createElement('div');
    backText.style.cssText = `
        position: absolute;
        top: 50%;
        left: ${bleedPx + safetyPx}px;
        right: ${safetyPx}px;
        transform: translateY(-50%);
        text-align: center;
        color: white;
        text-shadow: 1px 1px 3px rgba(0,0,0,0.5);
    `;
    const backBlurb = backCoverPage?.textElements?.[0]?.content ||
        'A personalized storybook adventure created with love.';
    backText.innerHTML = `<p style="font-size: 12pt; line-height: 1.6; margin: 0;">${backBlurb}</p>`;
    backCover.appendChild(backText);

    container.appendChild(backCover);

    // ===== SPINE =====
    const spine = document.createElement('div');
    spine.style.cssText = `
        width: ${spineWidthPx}px;
        height: ${totalHeightPx}px;
        background: linear-gradient(135deg, ${themeColors[0]}dd 0%, ${themeColors[1]}dd 100%);
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    // Spine text (rotated) - only if spine is wide enough (>100 pages per Lulu)
    if (dims.spineWidth > 0.2) {
        const spineText = document.createElement('div');
        spineText.style.cssText = `
            transform: rotate(-90deg);
            white-space: nowrap;
            color: white;
            font-size: ${Math.min(10, spineWidthPx * 0.6)}pt;
            font-weight: bold;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        `;
        spineText.textContent = bookTitle;
        spine.appendChild(spineText);
    }

    container.appendChild(spine);

    // ===== FRONT COVER =====
    const frontCover = document.createElement('div');
    frontCover.style.cssText = `
        width: ${frontWidthPx + bleedPx}px;
        height: ${totalHeightPx}px;
        position: relative;
        overflow: hidden;
    `;

    const frontImageUrl = coverPage ? getPageImage(coverPage) : null;
    if (frontImageUrl) {
        const frontImg = document.createElement('img');
        frontImg.src = frontImageUrl;
        frontImg.crossOrigin = 'anonymous';
        frontImg.style.cssText = `
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 100%;
            object-fit: cover;
        `;
        frontCover.appendChild(frontImg);
    } else {
        frontCover.style.background = `linear-gradient(135deg, ${themeColors[0]} 0%, ${themeColors[1]} 100%)`;
    }

    // Front cover title overlay
    const titleOverlay = document.createElement('div');
    titleOverlay.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: ${safetyPx}px;
        background: linear-gradient(transparent, rgba(0,0,0,0.7));
        color: white;
        text-align: center;
    `;
    titleOverlay.innerHTML = `
        <h1 style="margin: 0 0 10px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28pt; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">${bookTitle}</h1>
        <p style="margin: 0; font-family: Inter, sans-serif; font-size: 14pt; opacity: 0.9;">For ${book.settings.childName}, age ${book.settings.childAge}</p>
    `;
    frontCover.appendChild(titleOverlay);

    container.appendChild(frontCover);

    return container;
}

/**
 * Generate Lulu-compliant cover PDF
 * Creates a single-page spread with Back Cover + Spine + Front Cover
 */
export async function generateCoverPDF(
    book: Book,
    format: 'softcover' | 'hardcover',
    size?: '6x6' | '8x8' | '8x10',
    paperType: PaperType = 'standard'
): Promise<Blob> {
    const coverPage = getCoverPage(book);
    if (!coverPage) {
        throw new Error('Book must have a cover page');
    }

    // Auto-detect size from book if not provided
    const bookSize = size || getBookSize(book);

    // Calculate dimensions
    const pageCount = book.pages.length;
    const dims = calculateCoverDimensions(bookSize, pageCount, format, paperType);

    // Get theme colors
    const themeColors = book.settings.bookTheme
        ? BookThemeInfo[book.settings.bookTheme]?.colors || ['#6366f1', '#ec4899']
        : ['#6366f1', '#ec4899'];

    // Create hidden container
    const renderContainer = document.createElement('div');
    renderContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        z-index: -9999;
        opacity: 0;
        pointer-events: none;
    `;
    document.body.appendChild(renderContainer);

    try {
        // Create cover spread element
        const coverSpread = createCoverSpreadElement(book, dims, themeColors);
        renderContainer.appendChild(coverSpread);

        // Wait for images
        await waitForImages(coverSpread);

        // Capture with html2canvas
        const canvas = await html2canvas(coverSpread, {
            scale: SCALE_FACTOR,
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: '#ffffff',
        });

        // Create PDF
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'in',
            format: [dims.totalWidth, dims.totalHeight],
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        pdf.addImage({
            imageData: imgData,
            format: 'JPEG',
            x: 0,
            y: 0,
            width: dims.totalWidth,
            height: dims.totalHeight,
        });

        return pdf.output('blob');

    } finally {
        if (renderContainer.parentNode) {
            renderContainer.parentNode.removeChild(renderContainer);
        }
    }
}
