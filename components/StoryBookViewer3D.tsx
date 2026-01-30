'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Flipbook } from 'react-3d-flipbook';
import 'react-3d-flipbook/dist/styles.css';
import { Book, BookPage, BookThemeInfo } from '@/lib/types';
import { generateBookPDF, downloadPDF } from '@/lib/pdf-generator';
import styles from './StoryBookViewer3D.module.css';

interface StoryBookViewer3DProps {
    book: Book;
    onClose?: () => void;
    isFullScreen?: boolean;
}

// Type for the flipbook page format
interface FlipbookPage {
    src: string;
    title?: string;
    htmlContent?: string;
}

export default function StoryBookViewer3D({ book, onClose, isFullScreen = false }: StoryBookViewer3DProps) {
    const viewerRef = useRef<HTMLDivElement>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const isRTL = (book.language || book.settings.language) === 'he';

    const themeColors = book.settings.bookTheme
        ? BookThemeInfo[book.settings.bookTheme]?.colors || ['#6366f1', '#ec4899']
        : ['#6366f1', '#ec4899'];

    // Get image URL from a book page
    const getPageImage = (page: BookPage): string | null => {
        if (page.imageElements && page.imageElements.length > 0 && page.imageElements[0].src) {
            return page.imageElements[0].src;
        }
        return page.backgroundImage || (page as unknown as { background_image?: string }).background_image || null;
    };

    // Build pages array for the 3D flipbook
    const buildFlipbookPages = (): FlipbookPage[] => {
        const pages: FlipbookPage[] = [];

        // Cover page
        const coverPage = book.pages[0];
        const coverImage = getPageImage(coverPage);
        if (coverImage) {
            pages.push({
                src: coverImage,
                title: book.settings.title || 'Cover'
            });
        }

        // Inner pages - each book page becomes two flipbook pages (image + text overlay)
        const innerPages = book.pages.filter(p => p.type === 'inside');
        innerPages.forEach((page, index) => {
            const pageImage = getPageImage(page);
            const pageNumber = index + 1;

            if (pageImage) {
                // Image page
                pages.push({
                    src: pageImage,
                    title: `Page ${pageNumber * 2 - 1}`
                });
            }

            // Text page - we'll use a placeholder for now (library requires image src)
            // For text pages, we could create a canvas-rendered image or use htmlContent
            const textContent = page.textElements?.map(t => t.content).join('\n\n') || '';
            if (textContent) {
                // Create a text page placeholder - ideally render to canvas
                pages.push({
                    src: `data:image/svg+xml,${encodeURIComponent(`
                        <svg xmlns="http://www.w3.org/2000/svg" width="550" height="733" viewBox="0 0 550 733">
                            <rect fill="#fefcf9" width="100%" height="100%"/>
                            <foreignObject x="40" y="60" width="470" height="613">
                                <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Georgia, serif; font-size: 18px; line-height: 1.8; color: #1a1b1e; text-align: justify;">
                                    ${textContent.split('\n').map(p => `<p style="margin-bottom: 1em; text-indent: 2em;">${p}</p>`).join('')}
                                </div>
                            </foreignObject>
                            <text x="275" y="700" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#999">${pageNumber * 2}</text>
                        </svg>
                    `)}`,
                    title: `Page ${pageNumber * 2}`
                });
            }
        });

        // Back cover
        pages.push({
            src: `data:image/svg+xml,${encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="550" height="733" viewBox="0 0 550 733">
                    <defs>
                        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style="stop-color:${themeColors[0]}"/>
                            <stop offset="100%" style="stop-color:${themeColors[1]}"/>
                        </linearGradient>
                    </defs>
                    <rect fill="url(#grad)" width="100%" height="100%"/>
                    <text x="275" y="340" text-anchor="middle" font-family="Georgia, serif" font-size="32" fill="white" font-weight="bold">The End</text>
                    <text x="275" y="400" text-anchor="middle" font-family="sans-serif" font-size="16" fill="rgba(255,255,255,0.8)">KidBook Creator</text>
                </svg>
            `)}`,
            title: 'Back Cover'
        });

        return pages;
    };

    const flipbookPages = buildFlipbookPages();
    const totalPages = flipbookPages.length;

    // Event handlers
    const handlePageFlip = useCallback((e: { page: number }) => {
        setCurrentPage(e.page);
    }, []);

    const handleDownload = async () => {
        if (isDownloading) return;

        try {
            setIsDownloading(true);
            const blob = await generateBookPDF(book);
            const filename = `${book.settings.title || 'story-book'}.pdf`.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            downloadPDF(blob, filename);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setIsDownloading(false);
        }
    };

    const toggleFullscreen = useCallback(async () => {
        if (!viewerRef.current) return;

        try {
            if (!document.fullscreenElement) {
                await viewerRef.current.requestFullscreen();
                setIsFullscreen(true);
            } else {
                await document.exitFullscreen();
                setIsFullscreen(false);
            }
        } catch (error) {
            console.error('Fullscreen error:', error);
        }
    }, []);

    // Listen for fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'Escape':
                    if (isFullscreen) {
                        document.exitFullscreen();
                    } else if (onClose) {
                        onClose();
                    }
                    break;
                case 'f':
                case 'F':
                    toggleFullscreen();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, isFullscreen, toggleFullscreen]);

    return (
        <div
            ref={viewerRef}
            className={`${styles.viewer} ${isFullScreen || isFullscreen ? styles.fullScreen : ''}`}
            dir={isRTL ? 'rtl' : 'ltr'}
        >
            {/* Header Controls */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    {onClose && (
                        <button className={styles.closeBtn} onClick={onClose}>
                            ← Back
                        </button>
                    )}
                </div>

                <div className={styles.headerCenter}>
                    <span className={styles.pageIndicator}>
                        {currentPage} / {totalPages}
                    </span>
                </div>

                <div className={styles.headerRight}>
                    <button
                        className={styles.actionBtn}
                        title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
                        onClick={toggleFullscreen}
                        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                    >
                        {isFullscreen ? '⛶' : '⛶'}
                    </button>
                    <button
                        className={styles.actionBtn}
                        title="Download PDF"
                        onClick={handleDownload}
                        disabled={isDownloading}
                    >
                        {isDownloading ? '⏳' : '⬇️'}
                    </button>
                </div>
            </header>

            {/* Progress Bar */}
            <div className={styles.progressContainer}>
                <div
                    className={styles.progressBar}
                    style={{ width: `${(currentPage / totalPages) * 100}%` }}
                />
            </div>

            {/* 3D Flipbook Container */}
            <div className={styles.flipbookContainer}>
                <Flipbook
                    pages={flipbookPages}
                    width="100%"
                    height="100%"
                    skin="light"
                    backgroundColor="transparent"
                    startPage={1}
                    singlePageMode={false}
                    sideNavigationButtons={true}
                    hideMenu={true}
                    // 3D WebGL props for realistic hardcover
                    pageFlipDuration={600}
                    pageHardness={0.3}
                    coverHardness={0.95}
                    shadows={true}
                    shadowOpacity={0.4}
                    lights={true}
                    lightIntensity={1.2}
                    pageRoughness={0.7}
                    pageMetalness={0.05}
                    antialias={true}
                    // Camera settings
                    cameraZoom={1.4}
                    pageScale={6}
                    // Events
                    onPageFlip={handlePageFlip}
                />
            </div>

            {/* Keyboard Hint */}
            <div className={styles.keyboardHint}>
                Use arrow keys or click to flip pages • Press F for fullscreen
            </div>
        </div>
    );
}
