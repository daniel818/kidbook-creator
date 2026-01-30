'use client';

import { useState, useRef, forwardRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import HTMLFlipBook from 'react-pageflip';
import { Book, BookPage, BookThemeInfo } from '@/lib/types';
import { generateBookPDF, downloadPDF } from '@/lib/pdf-generator';
import { generateInteriorPDF, downloadPDF as downloadLuluPDF } from '@/lib/lulu/pdf-generator';
import { generateCoverPDF } from '@/lib/lulu/cover-generator';
import PrintGenerator from './PrintGenerator';
import styles from './StoryBookViewer.module.css';

interface StoryBookViewerProps {
    book: Book;
    onClose?: () => void;
    isFullScreen?: boolean;
}

// ============================================
// Helper: Stop Propagation Wrapper
// Blocks native events (mousedown, click, touch) 
// so react-pageflip listener doesn't trigger.
// ============================================
function StopPropagationWrapper({ children, className }: { children: React.ReactNode, className?: string }) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const stop = (e: Event) => {
            e.stopPropagation();
            // Important: immediate propagation stop for native listeners on same node or parents
            e.stopImmediatePropagation();
        };

        // We must block all mouse/touch events that might trigger a flip
        el.addEventListener('mousedown', stop);
        // el.addEventListener('click', stop); // ALLOW click to bubble so React sees it!
        el.addEventListener('mouseup', stop);
        el.addEventListener('touchstart', stop);
        el.addEventListener('touchend', stop);

        return () => {
            el.removeEventListener('mousedown', stop);
            // el.removeEventListener('click', stop);
            el.removeEventListener('mouseup', stop);
            el.removeEventListener('touchstart', stop);
            el.removeEventListener('touchend', stop);
        };
    }, []);

    return (
        <div ref={ref} className={className}>
            {children}
        </div>
    );
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
    isEditing?: boolean;
    onRegenerate?: () => void;
    isRegenerating?: boolean;
}>((props, ref) => {
    const { imageUrl, pageNumber, themeColors, isEditing, onRegenerate, isRegenerating } = props;

    return (
        <div className={styles.illustrationPage} ref={ref}>
            <div className={styles.illustrationPageWrapper}>
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

                {/* Editor Overlay */}
                {isEditing && (
                    <StopPropagationWrapper className={styles.imageOverlay}>
                        <button
                            className={styles.overlayButton}
                            onClick={onRegenerate}
                            disabled={isRegenerating}
                        >
                            {isRegenerating ? '✨ Regenerating...' : '✨ Regenerate Image'}
                        </button>
                    </StopPropagationWrapper>
                )}
            </div>
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
    isEditing?: boolean;
    onTextChange?: (idx: number, val: string) => void;
    isRTL?: boolean;
}>((props, ref) => {
    const { textElements, pageNumber, isEditing, onTextChange, isRTL } = props;

    return (
        <div className={styles.textPage} ref={ref} dir={isRTL ? 'rtl' : 'ltr'}>
            <div className={styles.textPageContent}>
                {textElements.map((text, idx) => (
                    isEditing ? (
                        <StopPropagationWrapper key={text.id || idx}>
                            <textarea
                                className={styles.editableText}
                                value={text.content}
                                onChange={(e) => onTextChange?.(idx, e.target.value)}
                            />
                        </StopPropagationWrapper>
                    ) : (
                        <p key={text.id || idx} className={styles.storyParagraph}>
                            {text.content}
                        </p>
                    )
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
export default function StoryBookViewer({ book, onClose, isFullScreen: isFullscreen = false }: StoryBookViewerProps) {
    const router = useRouter();
    const { t } = useTranslation(['common', 'viewer']);
    const flipBookRef = useRef<any>(null);
    const bookRef = useRef<any>(null);
    const viewerRef = useRef<HTMLDivElement>(null);
    const isRTL = (book.language || book.settings.language) === 'he';
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isGeneratingPrint, setIsGeneratingPrint] = useState(false);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);

    // Editor State
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [regeneratingPage, setRegeneratingPage] = useState<number | null>(null);
    const [edits, setEdits] = useState<Record<number, { text?: string; image?: string }>>({});

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
                setIsFullScreen(true);
            } else {
                await document.exitFullscreen();
                setIsFullScreen(false);
            }
        } catch (error) {
            console.error('Fullscreen error:', error);
        }
    }, []);

    // Listen for fullscreen changes (user might exit with Esc)
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // ============================================
    // Event Handlers
    // ============================================

    const handleDownload = async (e: React.MouseEvent) => {
        if (isDownloading) return;

        try {
            setIsDownloading(true);

            // Secret developer mode: Alt/Option + Click = Download Lulu Print Files
            if (e.altKey) {
                // Defaults to book format (square -> 8x8, portrait -> 8x10)
                const size = book.settings.printFormat === 'square' ? '8x8' : '8x10';
                const format: 'softcover' | 'hardcover' = 'softcover';

                // 1. Generate Interior
                const interiorBlob = await generateInteriorPDF(book, format, size);
                downloadLuluPDF(interiorBlob, `${book.settings.title || 'book'}_interior_${size}.pdf`);

                // 2. Generate Cover
                const coverBlob = await generateCoverPDF(book, format, size);
                downloadLuluPDF(coverBlob, `${book.settings.title || 'book'}_cover_${size}.pdf`);

                return;
            }

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

    const handlePrintComplete = (blob: Blob) => {
        setIsGeneratingPrint(false);
        if (blob) {
            const filename = `${book.settings.title || 'story-book'}_print.pdf`.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            downloadPDF(blob, filename);
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

    // Editor Handlers
    const handleTextChange = (pageIndex: number, textIdx: number, val: string) => {
        // pageIndex is 0-based index of innerPages array
        // We need to map this to logical pageNumber for edits state
        const pageNum = pageIndex + 1;
        setEdits(prev => ({
            ...prev,
            [pageNum]: {
                ...prev[pageNum],
                text: val
            }
        }));
    };

    const handleRegenerateImage = async (pageIndex: number, currentImage: string, contextText: string) => {
        const pageNum = pageIndex + 1;
        setRegeneratingPage(pageNum);
        try {
            const response = await fetch('/api/ai/regenerate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookId: book.id,
                    pageNumber: pageNum,
                    prompt: contextText,
                    currentImageContext: currentImage
                })
            });
            if (!response.ok) throw new Error('Failed');
            const data = await response.json();
            if (data.imageUrl) {
                setEdits(prev => ({
                    ...prev,
                    [pageNum]: { ...prev[pageNum], image: data.imageUrl }
                }));
            }
        } catch (e) {
            console.error(e);
            alert('Failed to regenerate');
        } finally {
            setRegeneratingPage(null);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updatedPages = book.pages.map((page, i) => {
                if (page.type !== 'inside') return page;
                return page;
            });

            // RE-Logic for Save:
            const newBookPages = [...book.pages];
            let innerIdx = 0;
            for (let i = 0; i < newBookPages.length; i++) {
                if (newBookPages[i].type === 'inside') {
                    const pageNum = innerIdx + 1; // 1-based logic used in UI
                    const edit = edits[pageNum];
                    if (edit) {
                        const page = newBookPages[i];
                        if (edit.image) {
                            if (page.imageElements.length > 0) {
                                page.imageElements[0].src = edit.image;
                            }
                        }
                        if (edit.text) {
                            if (page.textElements.length > 0) {
                                page.textElements[0].content = edit.text;
                            }
                        }
                        newBookPages[i] = { ...page };
                    }
                    innerIdx++;
                }
            }

            const response = await fetch(`/api/books/${book.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pages: newBookPages })
            });

            if (!response.ok) throw new Error('Save failed');

            setIsEditing(false);
            setEdits({});
            router.refresh();
        } catch (e) {
            console.error(e);
            alert('Failed to save');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        if (Object.keys(edits).length > 0 && !confirm('Discard changes?')) return;
        setIsEditing(false);
        setEdits({});
    };


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
            // If editing text, do NOT handle arrow keys!
            if (isEditing && (e.target as HTMLElement).tagName === 'TEXTAREA') return;

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
    }, [flipPrev, flipNext, onClose, isFullscreen, toggleFullscreen, isEditing]);

    // ============================================
    // Render Spreads
    // ============================================

    const renderSpreads = () => {
        const spreads: React.ReactNode[] = [];
        // Get inner pages (skip cover page at index 0)
        const innerPages = book.pages.filter(p => p.type === 'inside');
        const isRTL = (book.language || book.settings.language) === 'he';

        innerPages.forEach((page, index) => {
            const pageNum = index + 1; // 1-based
            const edit = edits[pageNum] || {};

            // Resolve content (edit > original)
            const displayImage = edit.image || getPageImage(page);
            const displayText = edit.text || (page.textElements[0]?.content || '');
            const textElements = [{ ...page.textElements[0], content: displayText }];

            // For RTL books, flip the page numbering
            // Right page should be lower number in RTL
            const leftPageNum = isRTL ? pageNum * 2 : pageNum * 2 - 1;
            const rightPageNum = isRTL ? pageNum * 2 - 1 : pageNum * 2;

            if (isRTL) {
                // RTL: Text on left (even number), Illustration on right (odd number)
                spreads.push(
                    <Page key={`text-${page.id || index}`} className={styles.textPageWrapper}>
                        <TextPage
                            textElements={textElements}
                            pageNumber={leftPageNum}
                            isEditing={isEditing}
                            onTextChange={(idx, val) => handleTextChange(index, idx, val)}
                            isRTL={true}
                        />
                    </Page>
                );

                spreads.push(
                    <Page key={`illust-${page.id || index}`} className={styles.illustrationPageWrapper}>
                        <IllustrationPage
                            imageUrl={displayImage || undefined}
                            pageNumber={rightPageNum}
                            themeColors={themeColors}
                            isEditing={isEditing}
                            isRegenerating={regeneratingPage === pageNum}
                            onRegenerate={() => handleRegenerateImage(index, displayImage || '', displayText)}
                        />
                    </Page>
                );
            } else {
                // LTR: Illustration on left (odd number), Text on right (even number)
                spreads.push(
                    <Page key={`illust-${page.id || index}`} className={styles.illustrationPageWrapper}>
                        <IllustrationPage
                            imageUrl={displayImage || undefined}
                            pageNumber={leftPageNum}
                            themeColors={themeColors}
                            isEditing={isEditing}
                            isRegenerating={regeneratingPage === pageNum}
                            onRegenerate={() => handleRegenerateImage(index, displayImage || '', displayText)}
                        />
                    </Page>
                );

                spreads.push(
                    <Page key={`text-${page.id || index}`} className={styles.textPageWrapper}>
                        <TextPage
                            textElements={textElements}
                            pageNumber={rightPageNum}
                            isEditing={isEditing}
                            onTextChange={(idx, val) => handleTextChange(index, idx, val)}
                            isRTL={false}
                        />
                    </Page>
                );
            }
        });

        return spreads;
    };



    // Calculate dimensions based on format
    const isSquare = book.settings.printFormat === 'square';
    const displayTitle = book.settings.title;

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
            dir={isRTL ? 'rtl' : 'ltr'}
        >
            {/* Header Controls */}
            <header className={styles.header}>
                {/* Left Section: Back Button + Testing Area */}
                <div className={styles.headerLeft}>
                    {onClose && (
                        <button className={styles.backBtn} onClick={onClose}>
                            ← {t('buttons.myBooks', { ns: 'viewer' })}
                        </button>
                    )}
                    
                    {/* Testing Area - Only visible in dev/testing mode */}
                    <div className={styles.testingArea}>
                        {book.estimatedCost !== undefined && (
                            <span className={styles.costBadge} title="Estimated AI Generation Cost">
                                💰 ${book.estimatedCost.toFixed(3)}
                            </span>
                        )}
                        <button
                            className={styles.testBtn}
                            title={t('buttons.downloadPdf', { ns: 'viewer' })}
                            onClick={handleDownload}
                            disabled={isDownloading}
                        >
                            {isDownloading ? '⏳' : '⬇️'} {t('buttons.downloadPdf', { ns: 'viewer' })}
                        </button>
                    </div>
                </div>

                {/* Center Section: Page Management */}
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

                {/* Right Section: Edit Story + Order Print */}
                <div className={styles.headerRight}>
                    {isEditing ? (
                        <>
                            <button className={styles.saveButton} onClick={handleSave} disabled={isSaving}>
                                {isSaving ? 'Saving...' : `💾 ${t('buttons.save', { ns: 'viewer' })}`}
                            </button>
                            <button className={styles.cancelButton} onClick={handleCancel} disabled={isSaving}>
                                {t('buttons.cancel', { ns: 'viewer' })}
                            </button>
                        </>
                    ) : (
                        <>
                            <button className={styles.editButton} onClick={() => setIsEditing(true)}>
                                ✎ {t('buttons.editStory', { ns: 'viewer' })}
                            </button>
                            <button
                                className={styles.orderPrintButton}
                                onClick={() => router.push(`/create/${book.id}/order`)}
                            >
                                🛒 {t('buttons.orderPrint', { ns: 'viewer' })}
                            </button>
                        </>
                    )}
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
            <div className={`${styles.bookContainer} ${currentPageIndex === 0 ? styles.coverMode : ''} ${currentPageIndex === totalFlipPages - 1 ? styles.backCoverMode : ''}`}>
                <div className={styles.centeringWrapper}>
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
                        disableFlipByClick={isEditing}
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
                                <div className={styles.bookTexture}></div>
                                <div className={styles.spineOverlay}></div>
                                <div className={styles.coverOverlay}>
                                    <h1 className={styles.coverTitle}>{displayTitle}</h1>
                                    <p className={styles.coverSubtitle}>
                                        {(book.language || book.settings.language) === 'he' ? `${book.settings.childName}, גיל ${book.settings.childAge}` :
                                            (book.language || book.settings.language) === 'de' ? `Für ${book.settings.childName}, ${book.settings.childAge} Jahre alt` :
                                                `For ${book.settings.childName}, age ${book.settings.childAge}`}
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
                                    <h2 className={styles.coverTitle}>
                                        {(book.language || book.settings.language) === 'he' ? 'סוף' :
                                            (book.language || book.settings.language) === 'de' ? 'Ende' :
                                                'The End'}
                                    </h2>
                                    <p className={styles.coverSubtitle} style={{ maxWidth: '80%' }}>
                                        {backCoverText}
                                    </p>
                                </div>
                            </div>
                        </Cover>
                    </HTMLFlipBook>
                </div>
            </div>

            {/* Keyboard Hint */}
            <div className={styles.keyboardHint}>
                {t('controls.keyboardHint', { ns: 'viewer' })}
            </div>

            {/* Floating Download Digital Button - Bottom Right */}
            {!isEditing && (
                <button
                    className={styles.floatingDownloadButton}
                    onClick={() => router.push(`/create/${book.id}/checkout?format=digital`)}
                >
                    ⬇️ {t('buttons.downloadDigital', { ns: 'viewer' })}
                </button>
            )}

            {/* Hidden Print Generator */}
            {isGeneratingPrint && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <h2>Generating High-Res Print PDF... Please Wait</h2>
                    <PrintGenerator
                        book={book}
                        onComplete={handlePrintComplete}
                    />
                </div>
            )}
        </div>
    );
}
