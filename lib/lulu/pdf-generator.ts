// ============================================
// Lulu-Compliant Interior PDF Generator
// ============================================
// Uses html2canvas to rasterize pages, preserving all fonts
// Generates print-ready interior PDFs meeting Lulu's specifications
//
// LAYOUT: Each "inside" page creates TWO PDF pages:
//   - Left page: Image ONLY (full bleed illustration)
//   - Right page: Text ONLY (story text on white/paper background)

'use client';

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Book, BookPage, BookThemeInfo } from '@/lib/types';

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
 * DPI for screen rendering (CSS pixels)
 */
const SCREEN_DPI = 96;

/**
 * Target print DPI - Lulu requires 300-600 PPI
 */
const PRINT_DPI = 300;

/**
 * Scale factor to achieve print DPI from screen DPI
 */
const SCALE_FACTOR = PRINT_DPI / SCREEN_DPI; // ~3.125

/**
 * Get page image URL from various possible properties
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
 * Get text content from page
 */
function getPageText(page: BookPage): string {
    if (!page.textElements || page.textElements.length === 0) {
        return '';
    }
    return page.textElements.map(el => el.content).join('\n\n');
}

/**
 * Detect if book is square format from settings or title hack
 */
function isSquareFormat(book: Book): boolean {
    return book.settings.printFormat === 'square' ||
        (book.settings.title?.includes('[Square]') ?? false);
}

/**
 * Get clean display title (strips [Square] marker)
 */
function getDisplayTitle(book: Book): string {
    return (book.settings.title || `${book.settings.childName}'s Story`).replace(' [Square]', '');
}

/**
 * Get the appropriate trim size based on book format
 */
function getBookSize(book: Book): '6x6' | '8x8' | '8x10' {
    if (isSquareFormat(book)) {
        return '8x8'; // Square books use 8x8
    }
    return '8x10'; // Portrait books use 8x10
}

/**
 * Create a hidden container for rendering pages
 */
function createRenderContainer(): HTMLDivElement {
    const container = document.createElement('div');
    container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        z-index: -9999;
        opacity: 0;
        pointer-events: none;
        background: white;
    `;
    document.body.appendChild(container);
    return container;
}

/**
 * Remove the render container
 */
function removeRenderContainer(container: HTMLDivElement): void {
    if (container.parentNode) {
        container.parentNode.removeChild(container);
    }
}

/**
 * Wait for images to load in an element
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
 * Create ILLUSTRATION PAGE (Left page - Image ONLY)
 * Full-bleed image with no text
 */
function createIllustrationPage(
    page: BookPage,
    pageNumber: number,
    widthInches: number,
    heightInches: number,
    themeColors: string[]
): HTMLDivElement {
    const widthPx = widthInches * SCREEN_DPI;
    const heightPx = heightInches * SCREEN_DPI;
    const bleedPx = BLEED_SIZE * SCREEN_DPI;

    const pageEl = document.createElement('div');
    pageEl.style.cssText = `
        width: ${widthPx}px;
        height: ${heightPx}px;
        position: relative;
        overflow: hidden;
        background: #f8f6f2;
    `;

    const imageUrl = getPageImage(page);

    if (imageUrl) {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.crossOrigin = 'anonymous';
        img.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
        `;
        pageEl.appendChild(img);
    } else {
        // Gradient placeholder
        pageEl.style.background = `linear-gradient(135deg, ${themeColors[0]}40 0%, ${themeColors[1]}40 100%)`;

        // Placeholder icon
        const placeholder = document.createElement('div');
        placeholder.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 72px;
            opacity: 0.25;
        `;
        placeholder.textContent = '🖼️';
        pageEl.appendChild(placeholder);
    }

    // Page number (bottom left for illustration pages)
    const pageNumEl = document.createElement('span');
    pageNumEl.style.cssText = `
        position: absolute;
        bottom: ${bleedPx + 15}px;
        left: ${bleedPx + 20}px;
        font-family: 'Inter', -apple-system, sans-serif;
        font-size: 10pt;
        color: rgba(255, 255, 255, 0.75);
        text-shadow: 0 1px 4px rgba(0,0,0,0.4);
    `;
    pageNumEl.textContent = String(pageNumber);
    pageEl.appendChild(pageNumEl);

    return pageEl;
}

/**
 * Create TEXT PAGE (Right page - Text ONLY)
 * White/paper background with story text, no image
 */
function createTextPage(
    page: BookPage,
    pageNumber: number,
    widthInches: number,
    heightInches: number
): HTMLDivElement {
    const widthPx = widthInches * SCREEN_DPI;
    const heightPx = heightInches * SCREEN_DPI;
    const safetyPx = SAFETY_MARGIN * SCREEN_DPI;
    const gutterPx = GUTTER_MARGIN * SCREEN_DPI;
    const bleedPx = BLEED_SIZE * SCREEN_DPI;

    const pageEl = document.createElement('div');
    pageEl.style.cssText = `
        width: ${widthPx}px;
        height: ${heightPx}px;
        position: relative;
        overflow: hidden;
        background: #ffffff;
        font-family: 'Crimson Text', 'Georgia', serif;
    `;

    // Paper texture background (subtle)
    const textureOverlay = document.createElement('div');
    textureOverlay.style.cssText = `
        position: absolute;
        inset: 0;
        background: 
            repeating-linear-gradient(
                0deg,
                transparent,
                transparent 28px,
                rgba(0,0,0,0.02) 28px,
                rgba(0,0,0,0.02) 29px
            );
        pointer-events: none;
    `;
    pageEl.appendChild(textureOverlay);

    // Margin line (left edge)
    const marginLine = document.createElement('div');
    marginLine.style.cssText = `
        position: absolute;
        left: ${bleedPx + gutterPx + 20}px;
        top: 0;
        bottom: 0;
        width: 1px;
        background: rgba(210, 180, 160, 0.2);
    `;
    pageEl.appendChild(marginLine);

    // Text content container
    const text = getPageText(page);
    if (text) {
        const textContainer = document.createElement('div');
        textContainer.style.cssText = `
            position: absolute;
            top: ${bleedPx + safetyPx}px;
            left: ${bleedPx + gutterPx + safetyPx}px;
            right: ${bleedPx + safetyPx}px;
            bottom: ${bleedPx + safetyPx + 30}px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        const textEl = document.createElement('p');
        textEl.style.cssText = `
            font-family: 'Crimson Text', 'Georgia', serif;
            font-size: 16pt;
            line-height: 1.8;
            color: #2d3436;
            text-align: justify;
            text-indent: 2em;
            margin: 0;
            hyphens: auto;
        `;
        textEl.textContent = text;
        textContainer.appendChild(textEl);
        pageEl.appendChild(textContainer);
    }

    // Page number (bottom right for text pages)
    const pageNumEl = document.createElement('span');
    pageNumEl.style.cssText = `
        position: absolute;
        bottom: ${bleedPx + 15}px;
        right: ${bleedPx + 20}px;
        font-family: 'Inter', -apple-system, sans-serif;
        font-size: 10pt;
        font-style: italic;
        color: #999;
    `;
    pageNumEl.textContent = String(pageNumber);
    pageEl.appendChild(pageNumEl);

    return pageEl;
}

/**
 * Create COVER PAGE
 */
function createCoverPage(
    book: Book,
    widthInches: number,
    heightInches: number,
    themeColors: string[]
): HTMLDivElement {
    const widthPx = widthInches * SCREEN_DPI;
    const heightPx = heightInches * SCREEN_DPI;
    const coverPage = book.pages.find(p => p.type === 'cover');
    const imageUrl = coverPage ? getPageImage(coverPage) : null;
    const title = getDisplayTitle(book);

    const pageEl = document.createElement('div');
    pageEl.style.cssText = `
        width: ${widthPx}px;
        height: ${heightPx}px;
        position: relative;
        overflow: hidden;
        background: linear-gradient(135deg, ${themeColors[0]} 0%, ${themeColors[1]} 100%);
    `;

    if (imageUrl) {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.crossOrigin = 'anonymous';
        img.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
        `;
        pageEl.appendChild(img);
    }

    // Title overlay at bottom
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 40px 30px;
        background: linear-gradient(transparent, rgba(0,0,0,0.7));
        color: white;
        text-align: center;
    `;

    overlay.innerHTML = `
        <h1 style="margin: 0 0 10px 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28pt; font-weight: 700; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">${title}</h1>
        <p style="margin: 0; font-family: Inter, sans-serif; font-size: 14pt; opacity: 0.9;">For ${book.settings.childName}, age ${book.settings.childAge}</p>
    `;
    pageEl.appendChild(overlay);

    return pageEl;
}

/**
 * Generate Lulu-compliant interior PDF
 * 
 * @param book - Book data with pages
 * @param format - 'softcover' or 'hardcover'
 * @param size - '6x6', '8x8', or '8x10' (optional, auto-detected from book)
 * @param onProgress - Optional progress callback
 * @returns PDF as Blob
 */
export async function generateInteriorPDF(
    book: Book,
    format: 'softcover' | 'hardcover',
    size?: '6x6' | '8x8' | '8x10',
    onProgress?: (progress: number) => void
): Promise<Blob> {
    // Auto-detect size from book if not provided
    const bookSize = size || getBookSize(book);
    const trimSize = TRIM_SIZES[bookSize];
    if (!trimSize) {
        throw new Error(`Invalid book size: ${bookSize}`);
    }

    if (!book.pages || book.pages.length === 0) {
        throw new Error('Book must have at least one page');
    }

    // Calculate page dimensions with bleed
    const pageWidthInches = trimSize.width + (BLEED_SIZE * 2);
    const pageHeightInches = trimSize.height + (BLEED_SIZE * 2);

    // Get theme colors
    const themeColors = book.settings.bookTheme
        ? BookThemeInfo[book.settings.bookTheme]?.colors || ['#6366f1', '#ec4899']
        : ['#6366f1', '#ec4899'];

    // Create hidden render container
    const container = createRenderContainer();

    // Create PDF document
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'in',
        format: [pageWidthInches, pageHeightInches],
    });

    try {
        let pdfPageIndex = 0;
        const innerPages = book.pages.filter(p => p.type === 'inside');
        const totalPdfPages = 1 + (innerPages.length * 2) + 1; // cover + spreads + back

        // 1. Generate Cover Page
        const coverEl = createCoverPage(book, pageWidthInches, pageHeightInches, themeColors);
        container.appendChild(coverEl);
        await waitForImages(coverEl);

        const coverCanvas = await html2canvas(coverEl, {
            scale: SCALE_FACTOR,
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: '#ffffff',
        });

        pdf.addImage({
            imageData: coverCanvas.toDataURL('image/jpeg', 0.92),
            format: 'JPEG',
            x: 0,
            y: 0,
            width: pageWidthInches,
            height: pageHeightInches,
        });
        container.removeChild(coverEl);
        pdfPageIndex++;
        onProgress?.((pdfPageIndex / totalPdfPages) * 100);

        // 2. Generate Interior Spreads (each "inside" page = 2 PDF pages)
        for (let i = 0; i < innerPages.length; i++) {
            const page = innerPages[i];
            const spreadNum = i + 1;

            // LEFT PAGE: Illustration (image only)
            const illustrationPageNum = spreadNum * 2 - 1;
            const illustEl = createIllustrationPage(
                page,
                illustrationPageNum,
                pageWidthInches,
                pageHeightInches,
                themeColors
            );
            container.appendChild(illustEl);
            await waitForImages(illustEl);

            pdf.addPage([pageWidthInches, pageHeightInches]);
            const illustCanvas = await html2canvas(illustEl, {
                scale: SCALE_FACTOR,
                useCORS: true,
                allowTaint: true,
                logging: false,
                backgroundColor: '#f8f6f2',
            });
            pdf.addImage({
                imageData: illustCanvas.toDataURL('image/jpeg', 0.92),
                format: 'JPEG',
                x: 0,
                y: 0,
                width: pageWidthInches,
                height: pageHeightInches,
            });
            container.removeChild(illustEl);
            pdfPageIndex++;
            onProgress?.((pdfPageIndex / totalPdfPages) * 100);

            // RIGHT PAGE: Text (text only)
            const textPageNum = spreadNum * 2;
            const textEl = createTextPage(
                page,
                textPageNum,
                pageWidthInches,
                pageHeightInches
            );
            container.appendChild(textEl);

            pdf.addPage([pageWidthInches, pageHeightInches]);
            const textCanvas = await html2canvas(textEl, {
                scale: SCALE_FACTOR,
                useCORS: true,
                allowTaint: true,
                logging: false,
                backgroundColor: '#ffffff',
            });
            pdf.addImage({
                imageData: textCanvas.toDataURL('image/jpeg', 0.92),
                format: 'JPEG',
                x: 0,
                y: 0,
                width: pageWidthInches,
                height: pageHeightInches,
            });
            container.removeChild(textEl);
            pdfPageIndex++;
            onProgress?.((pdfPageIndex / totalPdfPages) * 100);
        }

        // 3. Generate Back Cover
        const backCoverPage = book.pages.find(p => p.type === 'back');
        const backEl = document.createElement('div');
        backEl.style.cssText = `
            width: ${pageWidthInches * SCREEN_DPI}px;
            height: ${pageHeightInches * SCREEN_DPI}px;
            position: relative;
            overflow: hidden;
            background: linear-gradient(135deg, ${themeColors[0]} 0%, ${themeColors[1]} 100%);
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        const backImageUrl = backCoverPage ? getPageImage(backCoverPage) : null;
        if (backImageUrl) {
            const img = document.createElement('img');
            img.src = backImageUrl;
            img.crossOrigin = 'anonymous';
            img.style.cssText = `position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;`;
            backEl.appendChild(img);
        }

        const backText = document.createElement('div');
        backText.style.cssText = `
            position: relative;
            text-align: center;
            color: white;
            padding: 40px;
            text-shadow: 1px 1px 3px rgba(0,0,0,0.5);
        `;
        backText.innerHTML = `
            <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 24pt; margin: 0 0 10px 0;">The End</h2>
            <p style="font-family: Inter, sans-serif; font-size: 12pt; margin: 0;">${backCoverPage?.textElements?.[0]?.content || 'Created with KidBook Creator'}</p>
        `;
        backEl.appendChild(backText);

        container.appendChild(backEl);
        await waitForImages(backEl);

        pdf.addPage([pageWidthInches, pageHeightInches]);
        const backCanvas = await html2canvas(backEl, {
            scale: SCALE_FACTOR,
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: themeColors[0],
        });
        pdf.addImage({
            imageData: backCanvas.toDataURL('image/jpeg', 0.92),
            format: 'JPEG',
            x: 0,
            y: 0,
            width: pageWidthInches,
            height: pageHeightInches,
        });
        container.removeChild(backEl);

        onProgress?.(100);

        return pdf.output('blob');

    } finally {
        removeRenderContainer(container);
    }
}

/**
 * Helper to trigger download
 */
export function downloadPDF(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
