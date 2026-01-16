// ============================================
// PDF Generator for Storybooks
// ============================================
// Uses jsPDF to generate downloadable PDF books

import jsPDF from 'jspdf';
import { Book, BookPage } from '@/lib/types';

// PDF dimensions (in mm)
const PAGE_WIDTH = 210;  // A4 width
const PAGE_HEIGHT = 297; // A4 height
const MARGIN = 15;
const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);
const CONTENT_HEIGHT = PAGE_HEIGHT - (MARGIN * 2);

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

// Get text content from a page
function getPageText(page: BookPage): string {
    if (!page.textElements || page.textElements.length === 0) {
        return '';
    }
    return page.textElements.map(el => el.content).join('\n\n');
}

// Get page image
function getPageImage(page: BookPage): string | null {
    return page.backgroundImage ||
        (page as unknown as { background_image?: string }).background_image ||
        null;
}

// Add cover page to PDF
async function addCoverPage(pdf: jsPDF, book: Book): Promise<void> {
    const coverPage = book.pages[0];
    const imageUrl = getPageImage(coverPage);

    // Add cover image if available
    if (imageUrl) {
        const base64 = await loadImageAsBase64(imageUrl);
        if (base64) {
            try {
                // Full page image
                pdf.addImage(base64, 'JPEG', 0, 0, PAGE_WIDTH, PAGE_HEIGHT);
            } catch (e) {
                console.error('Error adding cover image:', e);
                // Use gradient background fallback
                pdf.setFillColor(99, 102, 241);
                pdf.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');
            }
        }
    } else {
        // Gradient background fallback
        pdf.setFillColor(99, 102, 241);
        pdf.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');
    }

    // Semi-transparent overlay for text
    pdf.setFillColor(0, 0, 0);
    pdf.setGState(new (pdf as unknown as { GState: new (opts: { opacity: number }) => unknown }).GState({ opacity: 0.5 }));
    pdf.rect(0, PAGE_HEIGHT - 80, PAGE_WIDTH, 80, 'F');
    pdf.setGState(new (pdf as unknown as { GState: new (opts: { opacity: number }) => unknown }).GState({ opacity: 1 }));

    // Title
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(32);
    pdf.setFont('helvetica', 'bold');
    const title = book.settings.title || `${book.settings.childName}'s Story`;
    pdf.text(title, PAGE_WIDTH / 2, PAGE_HEIGHT - 45, { align: 'center' });

    // Subtitle
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`For ${book.settings.childName}, age ${book.settings.childAge}`, PAGE_WIDTH / 2, PAGE_HEIGHT - 25, { align: 'center' });
}

// Add content pages to PDF
async function addContentPages(pdf: jsPDF, book: Book): Promise<void> {
    // Start from page 1 (skip cover at index 0)
    for (let i = 1; i < book.pages.length; i++) {
        pdf.addPage();
        const page = book.pages[i];

        const imageUrl = getPageImage(page);
        const text = getPageText(page);

        // Page layout: image on top half, text on bottom
        const imageHeight = CONTENT_HEIGHT * 0.55;
        const textStartY = MARGIN + imageHeight + 10;

        // Add image
        if (imageUrl) {
            const base64 = await loadImageAsBase64(imageUrl);
            if (base64) {
                try {
                    pdf.addImage(
                        base64,
                        'JPEG',
                        MARGIN,
                        MARGIN,
                        CONTENT_WIDTH,
                        imageHeight
                    );
                } catch (e) {
                    console.error('Error adding page image:', e);
                    // Placeholder
                    pdf.setFillColor(240, 240, 240);
                    pdf.rect(MARGIN, MARGIN, CONTENT_WIDTH, imageHeight, 'F');
                }
            }
        } else {
            // Placeholder for missing image
            pdf.setFillColor(240, 240, 240);
            pdf.rect(MARGIN, MARGIN, CONTENT_WIDTH, imageHeight, 'F');
            pdf.setTextColor(150, 150, 150);
            pdf.setFontSize(24);
            pdf.text('📖', PAGE_WIDTH / 2, MARGIN + imageHeight / 2, { align: 'center' });
        }

        // Add text
        if (text) {
            pdf.setTextColor(45, 45, 45);
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'normal');

            // Split text into lines that fit the page width
            const lines = pdf.splitTextToSize(text, CONTENT_WIDTH);
            pdf.text(lines, MARGIN, textStartY);
        }

        // Page number
        pdf.setTextColor(150, 150, 150);
        pdf.setFontSize(10);
        pdf.text(String(i), PAGE_WIDTH / 2, PAGE_HEIGHT - 10, { align: 'center' });
    }
}

// Main export function
export async function generateBookPDF(book: Book): Promise<Blob> {
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    // Add cover page
    await addCoverPage(pdf, book);

    // Add content pages
    await addContentPages(pdf, book);

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
