// ============================================
// PDF Generator for Storybooks (Digital)
// ============================================
// Uses jsPDF + html2canvas to preserve fonts and layout

'use client';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Book, BookPage, BookThemeInfo } from '@/lib/types';

type PdfLayout = {
    pageWidth: number;
    pageHeight: number;
    margin: number;
    contentWidth: number;
    contentHeight: number;
};

// Helper to load image as base64
async function loadImageAsBase64(url: string): Promise<string | null> {
    try {
        // If already base64, return as-is
        if (url.startsWith('data:')) {
            return url;
        }

        // Fetch and convert to base64
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
}

function getImageFormat(dataUrl: string): 'PNG' | 'JPEG' {
    if (dataUrl.startsWith('data:image/png')) return 'PNG';
    if (dataUrl.startsWith('data:image/webp')) return 'JPEG';
    if (dataUrl.startsWith('data:image/jpg')) return 'JPEG';
    if (dataUrl.startsWith('data:image/jpeg')) return 'JPEG';
    return 'JPEG';
}

// Get text content from a page
function getPageText(page: BookPage): string {
    if (!page.textElements || page.textElements.length === 0) {
        return '';
    }
    return page.textElements.map(el => el.content).join('\n\n');
}

// Get page image
function getPageImage(page: BookPage): string | null {
    if (page.imageElements && page.imageElements.length > 0 && page.imageElements[0]?.src) {
        return page.imageElements[0].src;
    }
    return page.backgroundImage ||
        (page as unknown as { background_image?: string }).background_image ||
        null;
}

const escapeHtml = (value: string) =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

async function renderDigitalPage(
    book: Book,
    page: BookPage,
    layout: PdfLayout
): Promise<string | null> {
    if (typeof document === 'undefined') return null;

    const pxPerMm = 96 / 25.4;
    const widthPx = Math.round(layout.pageWidth * pxPerMm);
    const heightPx = Math.round(layout.pageHeight * pxPerMm);
    const text = getPageText(page).trim();
    const imageUrl = getPageImage(page);
    const isRTL = (book.language || book.settings.language) === 'he';
    const theme = book.settings.bookTheme
        ? BookThemeInfo[book.settings.bookTheme]?.colors
        : null;
    const fallbackBg = theme
        ? `linear-gradient(135deg, ${theme[0]} 0%, ${theme[1]} 100%)`
        : 'linear-gradient(135deg, #f9f7f4 0%, #e9e4da 100%)';

    const container = document.createElement('div');
    container.style.cssText = `
        width: ${widthPx}px;
        height: ${heightPx}px;
        position: fixed;
        top: -10000px;
        left: -10000px;
        background: ${imageUrl ? `url('${imageUrl}') center/cover no-repeat` : fallbackBg};
        display: flex;
        align-items: flex-end;
        justify-content: center;
        box-sizing: border-box;
        padding: ${Math.round(widthPx * 0.06)}px;
        font-family: 'Crimson Text', 'Crimson Pro', 'Georgia', serif;
    `;
    container.dir = isRTL ? 'rtl' : 'ltr';

    if (text) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            width: 100%;
            background: rgba(255, 255, 255, 0.85);
            border-radius: 18px;
            padding: ${Math.round(widthPx * 0.04)}px ${Math.round(widthPx * 0.05)}px;
            box-shadow: 0 18px 36px rgba(15, 23, 42, 0.18);
            backdrop-filter: blur(6px);
        `;

        const bodyFont = Math.round(widthPx * 0.04);
        const dropFont = Math.round(bodyFont * 2.4);

        // Split into paragraphs using \n\n breaks
        const paragraphs = text.split(/\n\n+/).map(p => p.trim()).filter(Boolean);

        paragraphs.forEach((paraText, i) => {
            const paragraph = document.createElement('p');
            paragraph.style.cssText = `
                margin: 0 0 ${i < paragraphs.length - 1 ? '0.8em' : '0'} 0;
                font-size: ${bodyFont}px;
                line-height: 1.6;
                color: #1f2937;
                text-align: ${isRTL ? 'right' : 'left'};
                ${i > 0 ? 'text-indent: 2em;' : ''}
            `;

            if (i === 0) {
                // Drop cap for first paragraph
                const firstLetter = paraText.charAt(0);
                const rest = paraText.slice(1);

                const dropCap = document.createElement('span');
                dropCap.style.cssText = `
                    font-family: 'Playfair Display', 'Georgia', serif;
                    font-size: ${dropFont}px;
                    font-weight: 700;
                    float: ${isRTL ? 'right' : 'left'};
                    line-height: 0.8;
                    margin-${isRTL ? 'left' : 'right'}: ${Math.round(widthPx * 0.02)}px;
                    color: #6366f1;
                `;
                dropCap.textContent = firstLetter;

                const restSpan = document.createElement('span');
                restSpan.textContent = rest;

                paragraph.appendChild(dropCap);
                paragraph.appendChild(restSpan);
            } else {
                paragraph.textContent = paraText;
            }

            overlay.appendChild(paragraph);
        });
        container.appendChild(overlay);
    }

    document.body.appendChild(container);
    try {
        if (document.fonts?.ready) {
            await document.fonts.ready;
        }
        const canvas = await html2canvas(container, {
            backgroundColor: null,
            scale: 2,
            useCORS: true,
        });
        return canvas.toDataURL('image/jpeg', 0.92);
    } finally {
        document.body.removeChild(container);
    }
}

// Add cover page to PDF
async function renderDigitalCover(book: Book, layout: PdfLayout): Promise<string | null> {
    if (typeof document === 'undefined') return null;
    const coverPage = book.pages.find(page => page.type === 'cover') || book.pages[0];
    const imageUrl = coverPage ? getPageImage(coverPage) : null;
    const pxPerMm = 96 / 25.4;
    const widthPx = Math.round(layout.pageWidth * pxPerMm);
    const heightPx = Math.round(layout.pageHeight * pxPerMm);
    const theme = book.settings.bookTheme
        ? BookThemeInfo[book.settings.bookTheme]?.colors
        : null;
    const fallbackBg = theme
        ? `linear-gradient(135deg, ${theme[0]} 0%, ${theme[1]} 100%)`
        : 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)';

    const container = document.createElement('div');
    container.style.cssText = `
        width: ${widthPx}px;
        height: ${heightPx}px;
        position: fixed;
        top: -10000px;
        left: -10000px;
        background: ${imageUrl ? `url('${imageUrl}') center/cover no-repeat` : fallbackBg};
        display: flex;
        align-items: flex-end;
        justify-content: center;
        box-sizing: border-box;
        font-family: 'Playfair Display', 'Georgia', serif;
    `;

    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: absolute;
        left: 0;
        right: 0;
        bottom: 18%;
        margin: 0 auto;
        padding: ${Math.round(widthPx * 0.05)}px ${Math.round(widthPx * 0.06)}px ${Math.round(widthPx * 0.035)}px;
        text-align: center;
        border-top: 1px solid rgba(0, 0, 0, 0.08);
        box-shadow: 0 -6px 16px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(0, 0, 0, 0.08);
        backdrop-filter: blur(6px);
        overflow: hidden;
    `;

    const overlayBackground = document.createElement('div');
    overlayBackground.style.cssText = `
        position: absolute;
        inset: 0;
        background-color: rgba(255, 255, 255, 1);
        background-image: url('/textures/paper-texture.png');
        background-size: 300px 300px;
        background-repeat: repeat;
        opacity: 0.6;
        z-index: 0;
    `;

    const overlayContent = document.createElement('div');
    overlayContent.style.cssText = `
        position: relative;
        z-index: 1;
    `;

    const title = document.createElement('h1');
    title.textContent = book.settings.title || `${book.settings.childName}'s Story`;
    title.style.cssText = `
        margin: 0 0 ${Math.round(widthPx * 0.015)}px 0;
        font-family: 'Playfair Display', 'Georgia', serif;
        font-size: ${Math.round(widthPx * 0.065)}px;
        font-weight: 700;
        color: #1a1d23;
        letter-spacing: -0.01em;
        line-height: 1.1;
    `;

    const subtitle = document.createElement('p');
    subtitle.textContent = `For ${book.settings.childName}, age ${book.settings.childAge}`;
    subtitle.style.cssText = `
        margin: 0;
        font-family: 'Inter', sans-serif;
        font-size: ${Math.round(widthPx * 0.032)}px;
        color: #4a4d52;
        font-weight: 600;
        letter-spacing: 0.02em;
    `;

    overlayContent.appendChild(title);
    overlayContent.appendChild(subtitle);
    overlay.appendChild(overlayBackground);
    overlay.appendChild(overlayContent);
    container.appendChild(overlay);
    document.body.appendChild(container);

    try {
        if (document.fonts?.ready) {
            await document.fonts.ready;
        }
        const canvas = await html2canvas(container, {
            backgroundColor: null,
            scale: 2,
            useCORS: true,
        });
        return canvas.toDataURL('image/jpeg', 0.95);
    } finally {
        document.body.removeChild(container);
    }
}

async function addCoverPage(pdf: jsPDF, book: Book, layout: PdfLayout): Promise<void> {
    const coverDataUrl = await renderDigitalCover(book, layout);
    if (coverDataUrl) {
        pdf.addImage(coverDataUrl, 'JPEG', 0, 0, layout.pageWidth, layout.pageHeight);
        return;
    }

    const coverPage = book.pages.find(page => page.type === 'cover') || book.pages[0];
    await addImagePage(pdf, coverPage ? getPageImage(coverPage) : null, layout);
}

async function addImagePage(pdf: jsPDF, imageUrl: string | null, layout: PdfLayout): Promise<void> {
    if (imageUrl) {
        const base64 = await loadImageAsBase64(imageUrl);
        if (base64) {
            try {
                pdf.addImage(base64, getImageFormat(base64), 0, 0, layout.pageWidth, layout.pageHeight);
                return;
            } catch (e) {
                console.error('Error adding image page:', e);
            }
        }
    }

    pdf.setFillColor(240, 240, 240);
    pdf.rect(0, 0, layout.pageWidth, layout.pageHeight, 'F');
    pdf.setTextColor(150, 150, 150);
    pdf.setFontSize(24);
    pdf.text('📖', layout.pageWidth / 2, layout.pageHeight / 2, { align: 'center' });
}

async function addTextPage(pdf: jsPDF, text: string, layout: PdfLayout): Promise<void> {
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, layout.pageWidth, layout.pageHeight, 'F');

    if (!text) return;
    pdf.setTextColor(45, 45, 45);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'normal');
    const lines = pdf.splitTextToSize(text, layout.contentWidth);
    const lineHeight = 9;
    const textBlockHeight = lines.length * lineHeight;
    const startY = Math.max(layout.margin, (layout.pageHeight - textBlockHeight) / 2);
    pdf.text(lines, layout.margin, startY);
}

// Add content pages to PDF (digital: text over image)
async function addContentPages(pdf: jsPDF, book: Book, layout: PdfLayout): Promise<void> {
    const pages = [...book.pages].sort((a, b) => a.pageNumber - b.pageNumber);

    for (const page of pages) {
        if (page.type !== 'inside') continue;
        const dataUrl = await renderDigitalPage(book, page, layout);
        pdf.addPage();
        if (dataUrl) {
            pdf.addImage(dataUrl, 'JPEG', 0, 0, layout.pageWidth, layout.pageHeight);
        } else {
            await addImagePage(pdf, getPageImage(page), layout);
            const text = getPageText(page);
            if (text) {
                await addTextPage(pdf, text, layout);
            }
        }
    }
}

// Main export function
export async function generateBookPDF(book: Book): Promise<Blob> {
    const isSquare = book.settings.printFormat === 'square';
    const pageWidth = 210;
    const pageHeight = isSquare ? 210 : 280;
    const margin = Math.round(pageWidth * 0.07);
    const layout: PdfLayout = {
        pageWidth,
        pageHeight,
        margin,
        contentWidth: pageWidth - margin * 2,
        contentHeight: pageHeight - margin * 2,
    };

    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [layout.pageWidth, layout.pageHeight],
    });

    // Add cover page
    await addCoverPage(pdf, book, layout);

    // Add content pages
    await addContentPages(pdf, book, layout);

    // Add back cover if present
    const backCover = book.pages.find(page => page.type === 'back');
    if (backCover) {
        pdf.addPage();
        await addImagePage(pdf, getPageImage(backCover), layout);
    }

    // Return as blob for download
    return pdf.output('blob');
}

// Helper to trigger download
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
