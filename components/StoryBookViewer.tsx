'use client';

import { useState, useRef, forwardRef, useEffect, useCallback } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { Book, BookPage, BookThemeInfo } from '@/lib/types';
import { generateBookPDF, downloadPDF } from '@/lib/pdf-generator';
import styles from './StoryBookViewer.module.css';

interface StoryBookViewerProps {
    book: Book;
    onClose?: () => void;
    isFullScreen?: boolean;
}

// ============================================
// Page Components for react-pageflip
// ============================================

// Generic Page wrapper with proper ref forwarding
const Page = forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string }>((props, ref) => {
    return (
        <div className={`${styles.page} ${props.className || ''}`} ref={ref}>
            {props.children}
        </div>
    );
});
Page.displayName = 'Page';

// Hard cover page wrapper
const Cover = forwardRef<HTMLDivElement, { children: React.ReactNode }>((props, ref) => {
    return (
        <div className={styles.cover} ref={ref} data-density="hard">
            {props.children}
        </div>
    );
});
Cover.displayName = 'Cover';

// ============================================
// Illustration Page (Left side of spread)
// Full-bleed image with optional page number
// ============================================
const IllustrationPage = forwardRef<HTMLDivElement, {
    imageUrl?: string;
    pageNumber?: number;
    themeColors: string[];
}>((props, ref) => {
    const { imageUrl, pageNumber, themeColors } = props;

    return (
        <div className={styles.illustrationPage} ref={ref}>
            {imageUrl ? (
                <img
                    src={imageUrl}
                    alt={`Illustration ${pageNumber || ''}`}
                    className={styles.fullBleedImage}
                />
            ) : (
                <div
                    className={styles.illustrationPlaceholder}
                    style={{
                        background: `linear-gradient(135deg, ${themeColors[0]}40 0%, ${themeColors[1]}40 100%)`
                    }}
                >
                    <span className={styles.placeholderIcon}>🖼️</span>
                </div>
            )}
            {pageNumber !== undefined && (
                <span className={styles.illustrationPageNumber}>{pageNumber}</span>
            )}
        </div>
    );
});
IllustrationPage.displayName = 'IllustrationPage';

// ============================================
// Text Page (Right side of spread)
// Story text with elegant typography
// ============================================
const TextPage = forwardRef<HTMLDivElement, {
    textElements: { id?: string; content: string }[];
    pageNumber: number;
}>((props, ref) => {
    const { textElements, pageNumber } = props;

    return (
        <div className={styles.textPage} ref={ref}>
            <div className={styles.textPageContent}>
                {textElements.map((text, idx) => (
                    <p key={text.id || idx} className={styles.storyParagraph}>
                        {text.content}
                    </p>
                ))}
            </div>
            <span className={styles.textPageNumber}>{pageNumber}</span>
        </div>
    );
});
TextPage.displayName = 'TextPage';

// ============================================
// Main StoryBookViewer Component
// ============================================
export default function StoryBookViewer({ book, onClose, isFullScreen = false }: StoryBookViewerProps) {
    const bookRef = useRef<any>(null);
    const viewerRef = useRef<HTMLDivElement>(null);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const themeColors = book.settings.bookTheme
        ? BookThemeInfo[book.settings.bookTheme]?.colors || ['#6366f1', '#ec4899']
        : ['#6366f1', '#ec4899'];

    // Get total page count for progress indicator
    // Cover + (inner pages * 2 for spreads) + Back cover
    const innerPages = book.pages.filter(p => p.type === 'inside');
    const totalFlipPages = 2 + (innerPages.length * 2); // Front cover, spreads, back cover

    // ============================================
    // Fullscreen Handling
    // ============================================

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

    // Listen for fullscreen changes (user might exit with Esc)
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // ============================================
    // Event Handlers
    // ============================================

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

    const getPageImage = (page: BookPage) => {
        // Try imageElements first (where AI-generated images are stored)
        if (page.imageElements && page.imageElements.length > 0 && page.imageElements[0].src) {
            return page.imageElements[0].src;
        }
        // Fallback to backgroundImage for manually uploaded images
        return page.backgroundImage || (page as unknown as { background_image?: string }).background_image || null;
    };

    const onFlip = useCallback((e: { data: number }) => {
        setCurrentPageIndex(e.data);
    }, []);

    const flipPrev = useCallback(() => {
        bookRef.current?.pageFlip().flipPrev();
    }, []);

    const flipNext = useCallback(() => {
        bookRef.current?.pageFlip().flipNext();
    }, []);

    // Auto-open book on mount (simulation of "taking and opening")
    useEffect(() => {
        const timer = setTimeout(() => {
            // Only flip if we are on the cover (page 0)
            if (currentPageIndex === 0 && bookRef.current) {
                // Use a slightly longer delay to match the "pickup" animation
                bookRef.current.pageFlip().flipNext();
            }
        }, 1200); // 800ms animation + 400ms pause before opening

        return () => clearTimeout(timer);
    }, []); // Run only once on mount

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowLeft':
                    flipPrev();
                    break;
                case 'ArrowRight':
                case ' ':
                    e.preventDefault();
                    flipNext();
                    break;
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
    }, [flipPrev, flipNext, onClose, isFullscreen, toggleFullscreen]);

    // ============================================
    // Render Spreads
    // For the Gemini approach:
    // - Front Cover (single hard page)
    // - For each inner page: Illustration (left) + Text (right)
    // - Back Cover (single hard page)
    // ============================================

    const renderSpreads = () => {
        const spreads: React.ReactNode[] = [];

        // Get inner pages (skip cover page at index 0)
        const innerPages = book.pages.filter(p => p.type === 'inside');

        innerPages.forEach((page, index) => {
            const pageNum = index + 1;

            // Left page: Illustration
            spreads.push(
                <Page key={`illust-${page.id || index}`} className={styles.illustrationPageWrapper}>
                    <IllustrationPage
                        imageUrl={getPageImage(page) || undefined}
                        pageNumber={pageNum * 2 - 1}
                        themeColors={themeColors}
                    />
                </Page>
            );

            // Right page: Text
            spreads.push(
                <Page key={`text-${page.id || index}`} className={styles.textPageWrapper}>
                    <TextPage
                        textElements={page.textElements || []}
                        pageNumber={pageNum * 2}
                    />
                </Page>
            );
        });

        return spreads;
    };



    // Calculate dimensions based on format
    // Check both settings (session) and title hack (persistence)
    const isSquare = book.settings.printFormat === 'square' || book.settings.title.includes('[Square]');
    const displayTitle = book.settings.title.replace(' [Square]', '');

    const bookWidth = 550;
    const bookHeight = isSquare ? 550 : 733; // 1:1 vs 3:4

    // Find custom back cover if it exists
    const backCoverPage = book.pages.find(p => p.type === 'back');
    const backCoverImage = backCoverPage ? getPageImage(backCoverPage) : null;
    const backCoverText = backCoverPage?.textElements?.[0]?.content || "Create your own book at KidBook Creator";

    return (
        <div
            ref={viewerRef}
            className={`${styles.viewer} ${isFullScreen || isFullscreen ? styles.fullScreen : ''}`}
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
                    <button
                        className={styles.navBtn}
                        onClick={flipPrev}
                        aria-label="Previous page"
                    >
                        ‹
                    </button>
                    <span className={styles.pageIndicator}>
                        {currentPageIndex + 1} / {totalFlipPages}
                    </span>
                    <button
                        className={styles.navBtn}
                        onClick={flipNext}
                        aria-label="Next page"
                    >
                        ›
                    </button>
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
                    style={{ width: `${((currentPageIndex + 1) / totalFlipPages) * 100}%` }}
                />
            </div>

            {/* Book Container */}
            <div className={`${styles.bookContainer} ${currentPageIndex === 0 ? styles.coverMode : ''}`}>
                {/* @ts-ignore - Library types are tricky */}
                <HTMLFlipBook
                    width={bookWidth}
                    height={bookHeight}
                    size="fixed"
                    minWidth={315}
                    maxWidth={1000}
                    minHeight={400}
                    maxHeight={1533}
                    maxShadowOpacity={0.5}
                    showCover={true}
                    mobileScrollSupport={true}
                    onFlip={onFlip}
                    ref={bookRef}
                    className={styles.flipBook}
                    flippingTime={600}
                    usePortrait={false}
                    startPage={0}
                    drawShadow={true}
                    autoSize={true}
                    clickEventForward={true}
                    useMouseEvents={true}
                    swipeDistance={30}
                    showPageCorners={true}
                    disableFlipByClick={false}
                >
                    {/* Front Cover */}
                    <Cover>
                        <div
                            className={styles.coverInner}
                            style={{
                                background: book.pages[0] && getPageImage(book.pages[0])
                                    ? `url(${getPageImage(book.pages[0])}) center/cover`
                                    : `linear-gradient(135deg, ${themeColors[0]} 0%, ${themeColors[1]} 100%)`
                            }}
                        >
                            <div className={styles.coverOverlay}>
                                <h1 className={styles.coverTitle}>{displayTitle}</h1>
                                <p className={styles.coverSubtitle}>
                                    For {book.settings.childName}, age {book.settings.childAge}
                                </p>
                            </div>
                        </div>
                    </Cover>

                    {/* Inner Spreads: Illustration (left) + Text (right) */}
                    {renderSpreads()}

                    {/* Back Cover */}
                    {/* Back Cover */}
                    <Cover>
                        <div
                            className={styles.coverInner}
                            style={{
                                background: backCoverImage
                                    ? `url(${backCoverImage}) center/cover`
                                    : `linear-gradient(135deg, ${themeColors[0]} 0%, ${themeColors[1]} 100%)`
                            }}
                        >
                            <div className={styles.coverOverlay}>
                                <h2 className={styles.coverTitle}>The End</h2>
                                <p className={styles.coverSubtitle} style={{ maxWidth: '80%' }}>
                                    {backCoverText}
                                </p>
                            </div>
                        </div>
                    </Cover>
                </HTMLFlipBook>
            </div>

            {/* Keyboard Hint */}
            <div className={styles.keyboardHint}>
                Use ← → arrow keys or click to flip pages
            </div>
        </div>
    );
}
