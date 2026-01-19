'use client';

import { useRef, useEffect, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Book, BookPage, BookThemeInfo } from '@/lib/types';
import styles from './StoryBookViewer.module.css';

interface PrintGeneratorProps {
    book: Book;
    onComplete: (blob: Blob) => void;
    onProgress?: (progress: number) => void;
}

// Fixed dimensions for Print (Lulu) @ 96 DPI screen equivalent
// We will upscale via html2canvas scale option for 300 DPI
const TARGET_WIDTH_INCH = 8 + 0.25; // 8" + bleed
const TARGET_HEIGHT_INCH = 10 + 0.25; // 10" + bleed
const DPI_SCALE = 2; // 2x scale for better quality (roughly 192 DPI, good enough for digital/draft print)

export default function PrintGenerator({ book, onComplete, onProgress }: PrintGeneratorProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [status, setStatus] = useState('Initializing...');

    // Theme colors for gradients
    const themeColors = book.settings.bookTheme
        ? BookThemeInfo[book.settings.bookTheme]?.colors || ['#6366f1', '#ec4899']
        : ['#6366f1', '#ec4899'];

    // Helper to get image
    const getPageImage = (page: BookPage) => {
        if (page.imageElements?.[0]?.src) return page.imageElements[0].src;
        return page.backgroundImage || (page as any).background_image || null;
    };

    useEffect(() => {
        const generate = async () => {
            if (!containerRef.current) return;

            // Wait for images to load? 
            // We'll rely on html2canvas handling loaded images, but a small delay helps
            await new Promise(r => setTimeout(r, 1000));

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'in',
                format: [8.25, 10.25], // Final trim + bleed
            });

            // Iterate over children (pages)
            const pages = containerRef.current.children;
            const totalPages = pages.length;

            for (let i = 0; i < totalPages; i++) {
                const pageEl = pages[i] as HTMLElement;

                setStatus(`Generating page ${i + 1} of ${totalPages}...`);
                onProgress?.((i / totalPages) * 100);

                // Use html2canvas to capture
                try {
                    const canvas = await html2canvas(pageEl, {
                        scale: DPI_SCALE,
                        useCORS: true,
                        allowTaint: true,
                        logging: false,
                        backgroundColor: '#ffffff',
                    });

                    // Add to PDF
                    if (i > 0) pdf.addPage([8.25, 10.25]);

                    const imgData = canvas.toDataURL('image/jpeg', 0.85);
                    pdf.addImage({
                        imageData: imgData,
                        format: 'JPEG',
                        x: 0,
                        y: 0,
                        width: 8.25,
                        height: 10.25
                    });

                } catch (e) {
                    console.error("Page snapshot failed:", e);
                }
            }

            const blob = pdf.output('blob');
            onComplete(blob);
        };

        generate();
    }, [book, onComplete, onProgress]);

    // Render all pages in a vertical list (hidden or off-screen)
    // We reuse the CSS classes but force dimensions
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, zIndex: -1000, opacity: 0, pointerEvents: 'none' }}>
            <div ref={containerRef} style={{ width: '8.25in', display: 'flex', flexDirection: 'column' }}>

                {/* 1. Generate Interior Pages (Spreads split into single pages) */}
                {book.pages.filter(p => p.type === 'inside').map((page, i) => (
                    <>
                        {/* Left Page (Image) */}
                        <div
                            key={`p${i}-L`}
                            className={styles.illustrationPage}
                            style={{ width: '8.25in', height: '10.25in', position: 'relative', overflow: 'hidden' }}
                        >
                            <div className={styles.illustrationPageWrapper} style={{ height: '100%' }}>
                                {getPageImage(page) ? (
                                    <img
                                        src={getPageImage(page)!}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        crossOrigin="anonymous"
                                    />
                                ) : (
                                    <div
                                        style={{
                                            width: '100%', height: '100%',
                                            background: `linear-gradient(135deg, ${themeColors[0]}40 0%, ${themeColors[1]}40 100%)`
                                        }}
                                    />
                                )}
                            </div>
                            <span className={styles.illustrationPageNumber} style={{ bottom: '0.5in' }}>{i * 2 + 1}</span>
                        </div>

                        {/* Right Page (Text) */}
                        <div
                            key={`p${i}-R`}
                            className={styles.textPage}
                            style={{
                                width: '8.25in', height: '10.25in', position: 'relative', overflow: 'hidden',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff'
                            }}
                        >
                            <div className={styles.textPageContent} style={{ padding: '1in' }}>
                                <p className={styles.storyParagraph} style={{ fontSize: '18pt', lineHeight: 1.6, fontFamily: 'serif' }}>
                                    {page.textElements[0]?.content}
                                </p>
                            </div>
                            <span className={styles.textPageNumber} style={{ bottom: '0.5in' }}>{i * 2 + 2}</span>
                        </div>
                    </>
                ))}
            </div>
        </div>
    );
}
