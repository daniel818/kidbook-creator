'use client';

import { useState, useRef, forwardRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import HTMLFlipBook from 'react-pageflip';
import { Book, BookPage, BookThemeInfo } from '@/lib/types';
import { generateBookPDF, downloadPDF } from '@/lib/pdf-generator';
import { formatTextIntoParagraphs } from '@/lib/utils/text-formatting';
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
    isGenerating?: boolean;
    isLocked?: boolean;
}>((props, ref) => {
    const { imageUrl, pageNumber, themeColors, isEditing, onRegenerate, isRegenerating, isGenerating, isLocked } = props;
    const [isLoaded, setIsLoaded] = useState(false);
    const imageRef = useRef<HTMLImageElement | null>(null);

    useEffect(() => {
        if (!imageUrl) return;
        setIsLoaded(false);
    }, [imageUrl]);

    useEffect(() => {
        if (!imageUrl) return;
        if (imageRef.current?.complete) {
            setIsLoaded(true);
        }
    }, [imageUrl]);

    return (
        <div className={styles.illustrationPage} ref={ref}>
            <div className={styles.illustrationPageWrapper}>
                {imageUrl ? (
                    <img
                        ref={imageRef}
                        src={imageUrl}
                        alt={`Illustration ${pageNumber || ''}`}
                        className={`${styles.fullBleedImage} ${!isLoaded ? styles.fullBleedImageLoading : ''}`}
                        onLoad={() => setIsLoaded(true)}
                        loading="lazy"
                    />
                ) : (
                    <div
                        className={`${styles.illustrationPlaceholder} ${isGenerating ? styles.illustrationPlaceholderGenerating : ''}`}
                        style={{
                            background: `linear-gradient(135deg, ${themeColors[0]}40 0%, ${themeColors[1]}40 100%)`
                        }}
                    >
                        <span className={styles.placeholderIcon}>🖼️</span>
                    </div>
                )}

                {/* Editor Overlay */}
                {isEditing && !isLocked && (
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
                {isGenerating && !imageUrl && !isLocked && (
                    <div className={styles.generatingOverlay}>
                        <div className={styles.generatingGlow}></div>
                        <div className={styles.generatingShimmer}></div>
                        <div className={styles.generatingContent}>
                            <div className={styles.generatingDots}>
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                            <span>Painting this page...</span>
                        </div>
                    </div>
                )}
                {isLocked && (
                    <div className={styles.lockedOverlay}>
                        <div className={styles.lockedBadge}>🔒 Locked</div>
                        <p className={styles.lockedText}>Unlock the full book to generate this page.</p>
                    </div>
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
    isLocked?: boolean;
}>((props, ref) => {
    const { textElements, pageNumber, isEditing, onTextChange, isLocked } = props;

    return (
        <div className={styles.textPage} ref={ref}>
            <div className={styles.textPageContent}>
                {isLocked ? (
                    <div className={styles.lockedCopy}>
                        <div className={styles.lockedBadge}>🔒 Locked</div>
                        <p>Unlock the full book to read this page.</p>
                    </div>
                ) : (
                    textElements.map((text, idx) => (
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
                    ))
                )}
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
    const [liveBook, setLiveBook] = useState(book);
    const isRTL = (liveBook.language || liveBook.settings.language) === 'he';
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isGeneratingPrint, setIsGeneratingPrint] = useState(false);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const [hudVisible, setHudVisible] = useState(true);
    const hudTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [pageSize, setPageSize] = useState({ width: 550, height: 733 });

    // Editor State
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [regeneratingPage, setRegeneratingPage] = useState<number | null>(null);
    const [edits, setEdits] = useState<Record<number, { text?: string; image?: string }>>({});
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [unlockError, setUnlockError] = useState<string | null>(null);
    const [showPaywall, setShowPaywall] = useState(false);
    const [unlockState, setUnlockState] = useState<'idle' | 'waiting' | 'generating'>('idle');
    const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
    const unlockStartedRef = useRef(false);
    const checkoutWindowRef = useRef<Window | null>(null);
    const checkoutChannelRef = useRef<BroadcastChannel | null>(null);

    useEffect(() => {
        setLiveBook(book);
    }, [book]);

    const themeColors = liveBook.settings.bookTheme
        ? BookThemeInfo[liveBook.settings.bookTheme]?.colors || ['#6366f1', '#ec4899']
        : ['#6366f1', '#ec4899'];
    const canRegenerateImages = false;
    const isPreview = liveBook.isPreview || liveBook.status === 'preview';
    const previewPageCount = liveBook.previewPageCount || 0;
    const isPaidAccess = !isPreview || !!liveBook.digitalUnlockPaid;
    const isSquare = liveBook.settings.printFormat === 'square';

    // Get total page count for progress indicator
    // Cover + (inner pages * 2 for spreads) + Back cover
    const innerPages = liveBook.pages.filter(p => p.type === 'inside');
    const totalFlipPages = 2 + (innerPages.length * 2); // Front cover, spreads, back cover
    const totalPageCount = liveBook.totalPageCount || totalFlipPages;

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const handleChange = () => {
            const minDimension = Math.min(window.innerWidth, window.innerHeight);
            setIsMobile(minDimension <= 600);
        };
        handleChange();
        window.addEventListener('resize', handleChange);
        return () => {
            window.removeEventListener('resize', handleChange);
        };
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const updateSize = () => {
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const horizontalPadding = isMobile ? 28 : 160;
            const verticalPadding = isMobile ? 220 : (isSquare ? 280 : 220);
            const baseWidth = 550;
            const maxWidth = Math.max(240, viewportWidth - horizontalPadding);
            let width = Math.min(baseWidth, maxWidth);
            const maxHeight = Math.max(320, viewportHeight - verticalPadding);
            if (isSquare) {
                width = Math.min(width, maxHeight);
            }
            let height = isSquare ? width : Math.round(width * 4 / 3);
            if (height > maxHeight) {
                height = maxHeight;
                width = isSquare ? height : Math.round(height * 3 / 4);
            }
            setPageSize({
                width: Math.max(240, Math.round(width)),
                height: Math.max(320, Math.round(height))
            });
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, [isMobile, isSquare]);

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

    const handleUnlock = useCallback(async () => {
        if (isUnlocking) return;
        setIsUnlocking(true);
        setUnlockError(null);
        try {
            if (liveBook.digitalUnlockPaid) {
                const response = await fetch(`/api/books/${book.id}/unlock`, { method: 'POST' });
                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data?.error || 'Failed to unlock');
                }
                window.location.reload();
                return;
            }

            const response = await fetch('/api/checkout/digital', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookId: book.id }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.error || 'Failed to start checkout');
            }
            if (data.url) {
                setCheckoutUrl(data.url);
                setUnlockState('waiting');
                checkoutWindowRef.current = window.open(
                    data.url,
                    'kidbookCheckout',
                    'popup,width=520,height=720,menubar=0,toolbar=0,location=1,status=0'
                );
            }
        } catch (error) {
            console.error('Unlock error:', error);
            setUnlockError(error instanceof Error ? error.message : 'Failed to unlock');
        } finally {
            setIsUnlocking(false);
        }
    }, [isUnlocking, liveBook.digitalUnlockPaid, book.id]);

    const pollBook = useCallback(async () => {
        try {
            const response = await fetch(`/api/books/${book.id}`);
            if (!response.ok) return;
            const data = await response.json();
            setLiveBook(data);
            if (unlockState === 'waiting' && data.digitalUnlockPaid) {
                checkoutWindowRef.current?.close();
                checkoutWindowRef.current = null;
                setShowPaywall(false);
                setUnlockState('generating');
            }
            if (unlockState === 'generating' && data.status !== 'preview' && !data.isPreview) {
                setUnlockState('idle');
                setShowPaywall(false);
                unlockStartedRef.current = false;
                checkoutWindowRef.current?.close();
                checkoutWindowRef.current = null;
            }
        } catch (error) {
            console.error('Polling error:', error);
        }
    }, [book.id, unlockState]);

    const pollBookRef = useRef(pollBook);

    useEffect(() => {
        pollBookRef.current = pollBook;
    }, [pollBook]);

    useEffect(() => {
        if (unlockState === 'idle') return;
        const interval = setInterval(pollBook, 2000);
        pollBook();
        return () => clearInterval(interval);
    }, [pollBook, unlockState]);

    useEffect(() => {
        if (unlockState !== 'generating' || unlockStartedRef.current) return;
        unlockStartedRef.current = true;
        fetch(`/api/books/${book.id}/unlock`, { method: 'POST' })
            .catch((err) => console.error('Unlock request failed', err));
    }, [book.id, unlockState]);

    useEffect(() => {
        if (!isPreview) return;
        if (unlockState !== 'idle') return;
        if (!liveBook.digitalUnlockPaid) return;
        setUnlockState('generating');
    }, [isPreview, liveBook.digitalUnlockPaid, unlockState]);

    useEffect(() => {
        if (!isPaidAccess && isEditing) {
            setIsEditing(false);
        }
    }, [isPaidAccess, isEditing]);

    const handleCheckoutComplete = useCallback((payload?: { bookId?: string }) => {
        if (payload?.bookId && payload.bookId !== book.id) return;
        checkoutWindowRef.current?.close();
        checkoutWindowRef.current = null;
        setShowPaywall(false);
        setUnlockState('waiting');
        pollBookRef.current();
    }, [book.id]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            if (!event.data || typeof event.data !== 'object') return;
            const payload = event.data as { type?: string; bookId?: string };
            if (payload.type === 'kidbook:checkout-complete') {
                handleCheckoutComplete(payload);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [handleCheckoutComplete]);

    useEffect(() => {
        if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
        const channel = new BroadcastChannel('kidbook-checkout');
        checkoutChannelRef.current = channel;
        channel.onmessage = (event) => {
            if (!event?.data || typeof event.data !== 'object') return;
            const payload = event.data as { type?: string; bookId?: string };
            if (payload.type === 'kidbook:checkout-complete') {
                handleCheckoutComplete(payload);
            }
        };

        return () => {
            channel.close();
            checkoutChannelRef.current = null;
        };
    }, [handleCheckoutComplete]);

    useEffect(() => {
        const handleStorage = (event: StorageEvent) => {
            if (!event.key) return;
            if (event.key !== `kidbook:checkout:${book.id}`) return;
            handleCheckoutComplete({ bookId: book.id });
        };

        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [book.id, handleCheckoutComplete]);

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

    const handleDownload = async () => {
        if (isDownloading) return;
        if (!isPaidAccess) {
            setShowPaywall(true);
            return;
        }

        try {
            setIsDownloading(true);
            const blob = await generateBookPDF(liveBook);
            const filename = `${liveBook.settings.title || 'story-book'}_digital.pdf`.replace(/[^a-z0-9]/gi, '_').toLowerCase();
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
            const filename = `${liveBook.settings.title || 'story-book'}_print.pdf`.replace(/[^a-z0-9]/gi, '_').toLowerCase();
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

    const readyTextPages = innerPages.filter(page => {
        const content = page.textElements?.[0]?.content || '';
        return content.trim().length > 0;
    }).length;
    const readyImagePages = innerPages.filter(page => !!getPageImage(page)).length;
    const backCoverPageForProgress = liveBook.pages.find(p => p.type === 'back');
    const backCoverReady = backCoverPageForProgress
        ? !!getPageImage(backCoverPageForProgress) || !!(backCoverPageForProgress.textElements?.[0]?.content || '').trim()
        : false;
    const readyPhysicalPages = Math.min(
        totalFlipPages,
        1 + readyTextPages + readyImagePages + (backCoverReady ? 1 : 0)
    );
    const generationPercent = totalFlipPages
        ? Math.round((readyPhysicalPages / totalFlipPages) * 100)
        : 0;

    const scheduleHudHide = useCallback(() => {
        if (!isMobile) return;
        if (showPaywall || isEditing || unlockState !== 'idle') return;
        if (hudTimerRef.current) {
            clearTimeout(hudTimerRef.current);
        }
        hudTimerRef.current = setTimeout(() => {
            setHudVisible(false);
        }, 2600);
    }, [isMobile, showPaywall, isEditing, unlockState]);

    const showHud = useCallback(() => {
        if (!isMobile) return;
        setHudVisible(true);
        scheduleHudHide();
    }, [isMobile, scheduleHudHide]);

    useEffect(() => {
        if (!isMobile) {
            setHudVisible(true);
            return;
        }
        showHud();
        return () => {
            if (hudTimerRef.current) {
                clearTimeout(hudTimerRef.current);
            }
        };
    }, [isMobile, showHud]);

    useEffect(() => {
        if (!isMobile) return;
        if (showPaywall || unlockState !== 'idle' || isEditing) {
            setHudVisible(true);
            if (hudTimerRef.current) {
                clearTimeout(hudTimerRef.current);
            }
        }
    }, [isMobile, showPaywall, unlockState, isEditing]);

    const onFlip = useCallback((e: { data: number }) => {
        setCurrentPageIndex(e.data);
        showHud();
    }, [showHud]);

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
        const innerPages = liveBook.pages.filter(p => p.type === 'inside');
        const isRTL = (liveBook.language || liveBook.settings.language) === 'he';
        const unlockedInnerCount = Math.max(0, previewPageCount - 1);

        innerPages.forEach((page, index) => {
            const pageNum = index + 1; // 1-based
            const edit = edits[pageNum] || {};
            // Resolve content (edit > original)
            const displayImage = edit.image || getPageImage(page);
            const displayText = edit.text || (page.textElements[0]?.content || '');
            // Split text into paragraphs for better readability
            const paragraphs = formatTextIntoParagraphs(displayText);
            const textElements = paragraphs.map((content, i) => ({
                id: `${page.id || index}-p-${i}`,
                content
            }));
            const isLocked = isPreview && !liveBook.digitalUnlockPaid && index >= unlockedInnerCount;
            const isGenerating = unlockState === 'generating' && !displayImage && !isLocked;

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
                            isEditing={isEditing && !isLocked}
                            onTextChange={(idx, val) => handleTextChange(index, idx, val)}
                            isLocked={isLocked}
                        />
                    </Page>
                );

                spreads.push(
                    <Page key={`illust-${page.id || index}`} className={styles.illustrationPageWrapper}>
                        <IllustrationPage
                            imageUrl={displayImage || undefined}
                            pageNumber={rightPageNum}
                            themeColors={themeColors}
                            isEditing={isEditing && canRegenerateImages && !isLocked}
                            isRegenerating={regeneratingPage === pageNum}
                            onRegenerate={() => handleRegenerateImage(index, displayImage || '', displayText)}
                            isLocked={isLocked}
                            isGenerating={isGenerating}
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
                            isEditing={isEditing && canRegenerateImages && !isLocked}
                            isRegenerating={regeneratingPage === pageNum}
                            onRegenerate={() => handleRegenerateImage(index, displayImage || '', displayText)}
                            isLocked={isLocked}
                            isGenerating={isGenerating}
                        />
                    </Page>
                );

                spreads.push(
                    <Page key={`text-${page.id || index}`} className={styles.textPageWrapper}>
                        <TextPage
                            textElements={textElements}
                            pageNumber={rightPageNum}
                            isEditing={isEditing && !isLocked}
                            onTextChange={(idx, val) => handleTextChange(index, idx, val)}
                            isLocked={isLocked}
                        />
                    </Page>
                );
            }
        });

        return spreads;
    };



    // Calculate dimensions based on format
    const displayTitle = liveBook.settings.title || 'Untitled story';
    const bookSubtitle = [
        liveBook.settings.childName,
        liveBook.settings.childAge ? `Age ${liveBook.settings.childAge}` : ''
    ]
        .filter(Boolean)
        .join(' · ');

    // Find custom back cover if it exists
    const backCoverPage = liveBook.pages.find(p => p.type === 'back');
    const backCoverImage = backCoverPage ? getPageImage(backCoverPage) : null;
    const backCoverText = isPreview && !liveBook.digitalUnlockPaid
        ? 'Unlock the full book to generate the back cover.'
        : (backCoverPage?.textElements?.[0]?.content || "Create your own book at KidBook Creator");

    return (
        <div
            ref={viewerRef}
            className={`${styles.viewer} ${isFullScreen || isFullscreen ? styles.fullScreen : ''} ${isMobile ? styles.mobile : ''} ${isMobile && !hudVisible ? styles.hudHidden : ''}`}
            onClickCapture={() => showHud()}
        >
            {/* Header Controls */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    {onClose && (
                        <button className={styles.closeBtn} onClick={onClose}>
                            ← Back
                        </button>
                    )}
                    <div className={styles.bookMeta}>
                        <span className={styles.bookTitle}>{displayTitle}</span>
                        {bookSubtitle && (
                            <span className={styles.bookSubtitle}>{bookSubtitle}</span>
                        )}
                    </div>
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
                    <div className={styles.editToolbar}>
                        {isEditing ? (
                            <>
                                <button className={styles.saveButton} onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? 'Saving...' : '💾 Save'}
                                </button>
                                <button className={styles.cancelButton} onClick={handleCancel} disabled={isSaving}>
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <button
                                className={styles.editToggle}
                                onClick={() => (isPaidAccess ? setIsEditing(true) : setShowPaywall(true))}
                                title={isPaidAccess ? undefined : 'Unlock to edit'}
                            >
                                ✎ Edit
                            </button>
                        )}
                    </div>
                    <span className={styles.headerDivider}></span>
                    <button
                        className={styles.orderButton}
                        onClick={isPreview ? () => setShowPaywall(true) : () => router.push(`/create/${book.id}/order`)}
                    >
                        {isPreview ? '🔓 Unlock Full Book' : '🛒 Order Print'}
                    </button>
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
                    {liveBook.estimatedCost !== undefined && (
                        <span className={styles.costBadge} title="Estimated AI Generation Cost">
                            💸 ${liveBook.estimatedCost.toFixed(3)}
                        </span>
                    )}
                </div>
            </header>

            {isPreview && (
                <div className={styles.previewBanner}>
                    <div className={styles.previewCopy}>
                        <strong>Preview Mode</strong>
                        <span>Includes {previewPageCount} pages. Unlock to generate all {totalPageCount} pages.</span>
                        {unlockError && <em className={styles.previewError}>{unlockError}</em>}
                    </div>
                    <button
                        className={styles.previewCta}
                        onClick={() => setShowPaywall(true)}
                    >
                        Unlock Options
                    </button>
                </div>
            )}

            {unlockState === 'generating' && (
                <div className={styles.generationBanner}>
                    <div className={styles.generationMeta}>
                        <span className={styles.generationLabel}>Pages ready</span>
                        <span className={styles.generationCount}>{readyPhysicalPages}/{totalFlipPages}</span>
                    </div>
                    <div className={styles.generationBar}>
                        <div
                            className={styles.generationFill}
                            style={{ width: `${generationPercent}%` }}
                        />
                    </div>
                    <p className={styles.generationHint}>Text is ready. We&apos;re painting the remaining illustrations.</p>
                </div>
            )}

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
                        width={pageSize.width}
                        height={pageSize.height}
                        size="fixed"
                        minWidth={240}
                        maxWidth={1000}
                        minHeight={320}
                        maxHeight={1533}
                        maxShadowOpacity={isMobile ? 0.3 : 0.5}
                        showCover={true}
                        mobileScrollSupport={isMobile}
                        onFlip={onFlip}
                        ref={bookRef}
                        className={styles.flipBook}
                        flippingTime={600}
                        usePortrait={isMobile}
                        startPage={0}
                        drawShadow={true}
                        autoSize={true}
                        clickEventForward={true}
                        useMouseEvents={!isEditing}
                        swipeDistance={30}
                        showPageCorners={!isMobile}
                        disableFlipByClick={isEditing}
                    >
                        {/* Front Cover */}
                        <Cover>
                            <div
                                className={styles.coverInner}
                                style={{
                                    background: liveBook.pages[0] && getPageImage(liveBook.pages[0])
                                        ? `url(${getPageImage(liveBook.pages[0])}) center/cover`
                                        : `linear-gradient(135deg, ${themeColors[0]} 0%, ${themeColors[1]} 100%)`
                                }}
                            >
                                <div className={styles.bookTexture}></div>
                                <div className={styles.spineOverlay}></div>
                                <div className={styles.coverOverlay}>
                                    <h1 className={styles.coverTitle}>{displayTitle}</h1>
                                    <p className={styles.coverSubtitle}>
                                        {(liveBook.language || liveBook.settings.language) === 'he' ? `${liveBook.settings.childName}, גיל ${liveBook.settings.childAge}` :
                                            (liveBook.language || liveBook.settings.language) === 'de' ? `Für ${liveBook.settings.childName}, ${liveBook.settings.childAge} Jahre alt` :
                                                `For ${liveBook.settings.childName}, age ${liveBook.settings.childAge}`}
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
                                    <h2 className={`${styles.coverTitle} ${styles.backCoverText}`}>
                                        {(liveBook.language || liveBook.settings.language) === 'he' ? 'סוף' :
                                            (liveBook.language || liveBook.settings.language) === 'de' ? 'Ende' :
                                                'The End'}
                                    </h2>
                                    <p className={`${styles.coverSubtitle} ${styles.backCoverText}`} style={{ maxWidth: '80%' }}>
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
                {t('viewer:controls.keyboardHint')}
            </div>

            {/* Hidden Print Generator */}
            {isGeneratingPrint && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <h2>Generating High-Res Print PDF... Please Wait</h2>
                    <PrintGenerator
                        book={liveBook}
                        onComplete={handlePrintComplete}
                    />
                </div>
            )}

            <div className={`${styles.drawer} ${showPaywall ? styles.drawerOpen : ''}`}>
                <div className={styles.drawerHeader}>
                    <div>
                        <h2>Unlock your full book</h2>
                        <p>Stay in the story while we finish the rest.</p>
                    </div>
                    <button className={styles.drawerClose} onClick={() => setShowPaywall(false)}>×</button>
                </div>

                <div className={styles.drawerContent}>
                    {unlockState === 'waiting' && (
                        <div className={styles.drawerStatus}>
                            <strong>Waiting for payment</strong>
                            <p>Complete checkout in the new tab. We&apos;ll unlock your book automatically.</p>
                            {checkoutUrl && (
                                <button className={styles.drawerLink} onClick={() => window.open(checkoutUrl, '_blank', 'noopener,noreferrer')}>
                                    Open checkout
                                </button>
                            )}
                        </div>
                    )}

                    {unlockState === 'generating' && (
                        <div className={styles.drawerStatus}>
                            <strong>Generating your pages</strong>
                            <p>New pages appear as they finish.</p>
                            <div className={styles.drawerProgress}>
                                {liveBook.pages.filter(p => p.type === 'inside' && p.imageElements?.[0]?.src).length}
                                {' / '}
                                {liveBook.pages.filter(p => p.type === 'inside').length} pages ready
                            </div>
                        </div>
                    )}

                    {unlockState === 'idle' && (
                        <div className={styles.drawerOptions}>
                            <button
                                className={styles.drawerCard}
                                onClick={handleUnlock}
                                disabled={isUnlocking}
                            >
                                <div>
                                    <span className={styles.paywallTitle}>Digital Unlock</span>
                                    <span className={styles.paywallPrice}>$15</span>
                                    <p>Instant access to all pages + high‑res PDF download.</p>
                                </div>
                                <span className={styles.paywallAction}>
                                    {isUnlocking ? 'Opening checkout…' : 'Unlock Now'}
                                </span>
                            </button>
                            <button
                                className={styles.drawerCardAlt}
                                onClick={() => router.push(`/create/${book.id}/order`)}
                            >
                                <div>
                                    <span className={styles.paywallTitle}>Printed Book</span>
                                    <span className={styles.paywallPrice}>From $45</span>
                                    <p>Premium print + digital included.</p>
                                </div>
                                <span className={styles.paywallAction}>Order Print</span>
                            </button>
                        </div>
                    )}

                    {unlockError && <div className={styles.paywallError}>{unlockError}</div>}
                </div>
            </div>

            {showPaywall && <div className={styles.drawerOverlay} onClick={() => setShowPaywall(false)}></div>}
        </div>
    );
}
