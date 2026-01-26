// ============================================
// PDF Generation Utility
// ============================================
// Client-side PDF generation using jsPDF and html2canvas

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Book, BookPage } from '@/lib/types';

export interface PDFOptions {
    format: 'softcover' | 'hardcover';
    size: '7.5x7.5' | '8x8' | '8x10';
}

// Size mappings in inches -> points (72 points per inch)
const SIZE_MAP = {
    '7.5x7.5': { width: 540, height: 540 },   // 7.5 * 72
    '8x8': { width: 576, height: 576 },   // 8 * 72
    '8x10': { width: 576, height: 720 },  // 8 * 72, 10 * 72
};

// Bleed area (0.125 inches = 9 points)
const BLEED = 9;

export async function generateBookPDF(
    book: Book,
    options: PDFOptions,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    const size = SIZE_MAP[options.size];

    // Create PDF with bleed
    const pdf = new jsPDF({
        orientation: options.size === '8x10' ? 'portrait' : 'square' as 'portrait',
        unit: 'pt',
        format: [size.width + BLEED * 2, size.height + BLEED * 2],
    });

    const totalPages = book.pages.length;

    for (let i = 0; i < book.pages.length; i++) {
        const page = book.pages[i];

        if (i > 0) {
            pdf.addPage();
        }

        await renderPageToPDF(pdf, page, size, options);

        if (onProgress) {
            onProgress(((i + 1) / totalPages) * 100);
        }
    }

    return pdf.output('blob');
}

async function renderPageToPDF(
    pdf: jsPDF,
    page: BookPage,
    size: { width: number; height: number },
    options: PDFOptions
) {
    // Create a temporary div to render the page
    const container = document.createElement('div');
    container.style.cssText = `
    position: fixed;
    left: -9999px;
    top: -9999px;
    width: ${size.width}px;
    height: ${size.height}px;
    background-color: ${page.backgroundColor || '#ffffff'};
    overflow: hidden;
  `;

    // Add background image if exists
    if (page.backgroundImage) {
        container.style.backgroundImage = `url(${page.backgroundImage})`;
        container.style.backgroundSize = 'cover';
        container.style.backgroundPosition = 'center';
    }

    // Render image elements
    for (const img of page.imageElements) {
        const imgEl = document.createElement('img');
        imgEl.src = img.src;
        imgEl.style.cssText = `
      position: absolute;
      left: ${(img.x / 100) * size.width}px;
      top: ${(img.y / 100) * size.height}px;
      width: ${(img.width / 100) * size.width}px;
      height: ${(img.height / 100) * size.height}px;
      transform: rotate(${img.rotation || 0}deg);
      object-fit: cover;
    `;
        container.appendChild(imgEl);
    }

    // Render text elements
    for (const text of page.textElements) {
        const textEl = document.createElement('div');
        textEl.textContent = text.content;
        textEl.style.cssText = `
      position: absolute;
      left: ${(text.x / 100) * size.width}px;
      top: ${(text.y / 100) * size.height}px;
      width: ${(text.width / 100) * size.width}px;
      font-size: ${text.fontSize * (size.width / 600)}px;
      font-family: ${text.fontFamily || 'Arial'}, sans-serif;
      font-weight: ${text.fontWeight || 'normal'};
      color: ${text.color || '#000000'};
      text-align: ${text.textAlign || 'left'};
      line-height: 1.4;
      white-space: pre-wrap;
      word-wrap: break-word;
    `;
        container.appendChild(textEl);
    }

    document.body.appendChild(container);

    // Wait for images to load
    await Promise.all(
        Array.from(container.querySelectorAll('img')).map(
            img => new Promise((resolve) => {
                if (img.complete) {
                    resolve(true);
                } else {
                    img.onload = () => resolve(true);
                    img.onerror = () => resolve(false);
                }
            })
        )
    );

    // Convert to canvas
    const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: page.backgroundColor || '#ffffff',
        width: size.width,
        height: size.height,
    });

    // Add to PDF with bleed offset
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(imgData, 'JPEG', BLEED, BLEED, size.width, size.height);

    // Clean up
    document.body.removeChild(container);
}

// Download the generated PDF
export async function downloadBookPDF(
    book: Book,
    options: PDFOptions,
    onProgress?: (progress: number) => void
): Promise<void> {
    const blob = await generateBookPDF(book, options, onProgress);

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${book.settings.title || 'my-book'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
