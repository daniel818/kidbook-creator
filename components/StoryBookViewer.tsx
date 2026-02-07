'use client';

import { useState, useRef, forwardRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import HTMLFlipBook from 'react-pageflip';
import { Book, BookPage, BookThemeInfo } from '@/lib/types';
import { generateBookPDF, downloadPDF } from '@/lib/pdf-generator';
import { formatTextIntoParagraphs, normalizeParagraphText } from '@/lib/utils/text-formatting';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/stripe/client';
import PaymentForm from '@/components/PaymentForm/PaymentForm';
import PrintGenerator from './PrintGenerator';
import { createClientModuleLogger } from '@/lib/client-logger';
import styles from './StoryBookViewer.module.css';

const logger = createClientModuleLogger('viewer');

const stripeAppearance = {
    theme: 'stripe' as const,
    variables: {
        colorPrimary: '#6366f1',
        colorBackground: '#ffffff',
        colorText: '#111827',
        colorDanger: '#ef4444',
        fontFamily: 'Inter, system-ui, sans-serif',
        borderRadius: '12px',
        spacingUnit: '4px',
    },
};

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
// Paragraph Editor (contentEditable with <p> tags)
// Preserves paragraph structure during editing
// ============================================
function ParagraphEditor({
    paragraphs,
    onChange,
}: {
    paragraphs: string[];
    onChange: (text: string) => void;
}) {
    const editorRef = useRef<HTMLDivElement>(null);
    const initializedRef = useRef(false);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    // Set initial content once on mount
    useEffect(() => {
        if (!editorRef.current || initializedRef.current) return;
        initializedRef.current = true;
        const html = paragraphs
            .map(p => `<p>${p.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`)
            .join('');
        editorRef.current.innerHTML = html || '<p><br></p>';
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const extractAndSync = useCallback(() => {
        if (!editorRef.current) return;
        const pElements = editorRef.current.querySelectorAll('p');
        let texts: string[];
        if (pElements.length > 0) {
            texts = Array.from(pElements).map(p => p.textContent?.trim() || '');
        } else {
            // Fallback: user deleted all <p> tags
            texts = (editorRef.current.innerText || '').split('\n');
        }
        onChangeRef.current(texts.filter(Boolean).join('\n\n'));
    }, []);

    // Only sync state on blur — avoids re-render during typing
    const handleBlur = useCallback(() => {
        extractAndSync();
    }, [extractAndSync]);

    // Handle keyboard events — block arrow keys from bubbling to pageflip
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        // Stop all keyboard events from reaching react-pageflip
        e.stopPropagation();

        if (e.key === 'Enter') {
            e.preventDefault();
            const selection = window.getSelection();
            if (!selection || !selection.rangeCount) return;

            const range = selection.getRangeAt(0);
            range.deleteContents();

            // Create a new paragraph
            const newP = document.createElement('p');
            newP.innerHTML = '<br>';

            // Find the parent <p> element
            let currentNode: Node | null = range.startContainer;
            while (currentNode && currentNode.nodeName !== 'P' && currentNode !== editorRef.current) {
                currentNode = currentNode.parentNode;
            }

            if (currentNode && currentNode.nodeName === 'P' && editorRef.current) {
                // Split text after cursor into new paragraph
                const afterRange = document.createRange();
                afterRange.setStart(range.startContainer, range.startOffset);
                afterRange.setEndAfter(currentNode.lastChild || currentNode);
                const afterContent = afterRange.extractContents();

                // Put extracted content into new paragraph
                if (afterContent.textContent?.trim()) {
                    newP.innerHTML = '';
                    newP.appendChild(afterContent);
                }

                // Insert new paragraph after current one
                currentNode.parentNode?.insertBefore(newP, currentNode.nextSibling);
            } else if (editorRef.current) {
                editorRef.current.appendChild(newP);
            }

            // Move cursor to new paragraph
            const newRange = document.createRange();
            newRange.setStart(newP, 0);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
        }
    }, []);

    return (
        <StopPropagationWrapper>
            <div
                ref={editorRef}
                className={styles.paragraphEditor}
                contentEditable
                suppressContentEditableWarning
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
            />
        </StopPropagationWrapper>
    );
}

// ============================================
// Text Page (Right side of spread)
// Story text with elegant typography
// ============================================
const TextPage = forwardRef<HTMLDivElement, {
    textElements: { id?: string; content: string }[];
    pageNumber: number;
    isEditing?: boolean;
    onTextChange?: (val: string) => void;
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
                ) : isEditing ? (
                    <ParagraphEditor
                        paragraphs={textElements.map(t => t.content)}
                        onChange={(val) => onTextChange?.(val)}
                    />
                ) : (
                    textElements.map((text, idx) => (
                        <p key={text.id || idx} className={styles.storyParagraph}>
                            {text.content}
                        </p>
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
    const hudTimerRef = useRef<number | null>(null);
    const [pageSize, setPageSize] = useState({ width: 550, height: 733 });

    // Editor State
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [regeneratingPage, setRegeneratingPage] = useState<number | null>(null);
    const [edits, setEdits] = useState<Record<number, { text?: string; image?: string }>>({});
    const [titleDraft, setTitleDraft] = useState(liveBook.settings.title || '');
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [unlockError, setUnlockError] = useState<string | null>(null);
    const [showPaywall, setShowPaywall] = useState(false);
    const [paywallView, setPaywallView] = useState<'offers' | 'payment'>('offers');
    const [unlockState, setUnlockState] = useState<'idle' | 'waiting' | 'generating'>('idle');
    const [unlockClientSecret, setUnlockClientSecret] = useState<string | null>(null);
    const unlockStartedRef = useRef(false);
    const unlockPaymentIntentRef = useRef<string | null>(null);

    useEffect(() => {
        setLiveBook(book);
    }, [book]);

    useEffect(() => {
        if (isEditing) return;
        setTitleDraft(liveBook.settings.title || '');
    }, [liveBook.settings.title, isEditing]);

    const themeColors = liveBook.settings.bookTheme
        ? BookThemeInfo[liveBook.settings.bookTheme]?.colors || ['#6366f1', '#ec4899']
        : ['#6366f1', '#ec4899'];
    const canRegenerateImages = false;
    const isPreview = liveBook.isPreview || liveBook.status === 'preview';
    const previewPageCount = liveBook.previewPageCount || 0;
    const isPaidAccess = !isPreview || !!liveBook.digitalUnlockPaid;
    const isSquare = liveBook.settings.printFormat === 'square';
    const isGeneratingIllustrations = liveBook.illustrationProgress?.isGenerating ?? false;

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
            logger.error({ err: error }, 'Fullscreen error');
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
            if (data.clientSecret) {
                setUnlockClientSecret(data.clientSecret);
                unlockPaymentIntentRef.current = data.paymentIntentId || null;
                setUnlockState('waiting');
            }
        } catch (error) {
            logger.error({ err: error }, 'Unlock error');
            setUnlockError(error instanceof Error ? error.message : 'Failed to unlock');
        } finally {
            setIsUnlocking(false);
        }
    }, [isUnlocking, liveBook.digitalUnlockPaid, book.id]);

    const openPaywall = useCallback(() => {
        setPaywallView('offers');
        setShowPaywall(true);
    }, []);

    const closePaywall = useCallback(() => {
        setShowPaywall(false);
        setPaywallView('offers');
    }, []);

    const pollBook = useCallback(async () => {
        try {
            const response = await fetch(`/api/books/${book.id}`);
            if (!response.ok) return;
            const data = await response.json();
            setLiveBook(data);
            if (unlockState === 'waiting' && data.digitalUnlockPaid) {
                setShowPaywall(false);
                setUnlockClientSecret(null);
                setUnlockState('generating');
            }
            if (unlockState === 'generating' && data.status !== 'preview' && !data.isPreview) {
                setUnlockState('idle');
                closePaywall();
                unlockStartedRef.current = false;
            }
        } catch (error) {
            logger.error({ err: error }, 'Polling error');
        }
    }, [book.id, unlockState, closePaywall]);

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
        const piParam = unlockPaymentIntentRef.current ? `?payment_intent=${unlockPaymentIntentRef.current}` : '';
        fetch(`/api/books/${book.id}/unlock${piParam}`, { method: 'POST' })
            .catch((err) => logger.error({ err }, 'Unlock request failed'));
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

    const handlePaymentSuccess = useCallback((paymentIntentId: string) => {
        unlockPaymentIntentRef.current = paymentIntentId;
        setUnlockClientSecret(null);
        setShowPaywall(false);
        setUnlockState('generating');
        // Trigger unlock immediately
        fetch(`/api/books/${book.id}/unlock?payment_intent=${paymentIntentId}`, { method: 'POST' })
            .catch((err) => logger.error({ err }, 'Unlock request failed'));
        pollBookRef.current();
    }, [book.id]);

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
            openPaywall();
            return;
        }

        try {
            setIsDownloading(true);
            const blob = await generateBookPDF(liveBook);
            const filename = `${liveBook.settings.title || 'story-book'}_digital.pdf`.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            downloadPDF(blob, filename);
        } catch (error) {
            logger.error({ err: error }, 'Error generating PDF');
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
            window.clearTimeout(hudTimerRef.current);
        }
        hudTimerRef.current = window.setTimeout(() => {
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
                window.clearTimeout(hudTimerRef.current);
            }
        };
    }, [isMobile, showHud]);

    useEffect(() => {
        if (!isMobile) return;
        if (showPaywall || unlockState !== 'idle' || isEditing) {
            setHudVisible(true);
            if (hudTimerRef.current) {
                window.clearTimeout(hudTimerRef.current);
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
    const handleTextChange = (pageIndex: number, val: string) => {
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
            logger.error({ err: e }, 'Failed to regenerate image');
            alert('Failed to regenerate');
        } finally {
            setRegeneratingPage(null);
        }
    };

    const handleSave = async () => {
        // Force-sync any active ParagraphEditor before reading edits state
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
        await new Promise(resolve => setTimeout(resolve, 0));

        setIsSaving(true);
        try {
            // Build surgical page edits — only send changed fields for changed pages.
            // This prevents overwriting data that may have been updated by background generation.
            const pageEdits: { pageId: string; text?: string; image?: string }[] = [];
            const innerPages = liveBook.pages.filter(p => p.type === 'inside');

            for (const [pageNumStr, edit] of Object.entries(edits)) {
                const pageIdx = parseInt(pageNumStr, 10) - 1; // 1-based → 0-based
                const page = innerPages[pageIdx];
                if (!page || (!edit.text && !edit.image)) continue;

                const pageEdit: { pageId: string; text?: string; image?: string } = { pageId: page.id };
                if (edit.text) pageEdit.text = normalizeParagraphText(edit.text);
                if (edit.image) pageEdit.image = edit.image;
                pageEdits.push(pageEdit);
            }

            const response = await fetch(`/api/books/${book.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    settings: {
                        ...liveBook.settings,
                        title: titleDraft
                    },
                    ...(pageEdits.length > 0 ? { pageEdits } : {})
                })
            });

            if (!response.ok) throw new Error('Save failed');

            // Apply edits to liveBook BEFORE clearing edits state,
            // so the UI shows the updated content immediately without needing a refresh.
            setLiveBook(prev => {
                const updatedPages = [...prev.pages];
                const innerPages = updatedPages.filter(p => p.type === 'inside');

                for (const [pageNumStr, edit] of Object.entries(edits)) {
                    const pageIdx = parseInt(pageNumStr, 10) - 1;
                    const page = innerPages[pageIdx];
                    if (!page) continue;

                    // Find the actual index in updatedPages (which includes cover/back pages)
                    const realIdx = updatedPages.indexOf(page);
                    if (realIdx === -1) continue;

                    const updatedPage = { ...updatedPages[realIdx] };

                    if (edit.text) {
                        const normalizedText = normalizeParagraphText(edit.text);
                        const existingElements = [...(updatedPage.textElements || [])];
                        if (existingElements.length > 0) {
                            existingElements[0] = { ...existingElements[0], content: normalizedText };
                        } else {
                            existingElements.push({ id: `te-${Date.now()}`, content: normalizedText } as typeof existingElements[0]);
                        }
                        updatedPage.textElements = existingElements;
                    }

                    if (edit.image) {
                        const existingImages = [...(updatedPage.imageElements || [])];
                        if (existingImages.length > 0) {
                            existingImages[0] = { ...existingImages[0], src: edit.image };
                        } else {
                            existingImages.push({ id: `ie-${Date.now()}`, src: edit.image } as typeof existingImages[0]);
                        }
                        updatedPage.imageElements = existingImages;
                    }

                    updatedPages[realIdx] = updatedPage;
                }

                return {
                    ...prev,
                    pages: updatedPages,
                    settings: {
                        ...prev.settings,
                        title: titleDraft
                    }
                };
            });

            setIsEditing(false);
            setEdits({});
            router.refresh();
        } catch (e) {
            logger.error({ err: e }, 'Failed to save book');
            alert('Failed to save');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        if (Object.keys(edits).length > 0 && !confirm('Discard changes?')) return;
        setIsEditing(false);
        setEdits({});
        setTitleDraft(liveBook.settings.title || '');
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
            if (isEditing) {
                const tagName = (e.target as HTMLElement).tagName;
                if (tagName === 'TEXTAREA' || tagName === 'INPUT') return;
            }

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
            const isGenerating = (unlockState === 'generating' || isGeneratingIllustrations) && !displayImage && !isLocked;

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
                            onTextChange={(val) => handleTextChange(index, val)}
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
                            onTextChange={(val) => handleTextChange(index, val)}
                            isLocked={isLocked}
                        />
                    </Page>
                );
            }
        });

        return spreads;
    };



    // Calculate dimensions based on format
    const displayTitle = (isEditing ? titleDraft : liveBook.settings.title) || 'Untitled story';
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
                            <span className="material-symbols-outlined">arrow_back</span>
                            Back
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
                        <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <span className={styles.pageIndicator}>
                        {currentPageIndex + 1} / {totalFlipPages}
                    </span>
                    <button
                        className={styles.navBtn}
                        onClick={flipNext}
                        aria-label="Next page"
                    >
                        <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                </div>

                <div className={styles.headerRight}>
                    <div className={styles.editToolbar}>
                        {isEditing ? (
                            <>
                                <button className={styles.saveButton} onClick={handleSave} disabled={isSaving}>
                                    <span className="material-symbols-outlined">
                                        {isSaving ? 'hourglass_top' : 'save'}
                                    </span>
                                    {isSaving ? 'Saving...' : 'Save'}
                                </button>
                                <button className={styles.cancelButton} onClick={handleCancel} disabled={isSaving}>
                                    <span className="material-symbols-outlined">close</span>
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <button
                                className={styles.editToggle}
                                onClick={() => (isPaidAccess ? setIsEditing(true) : openPaywall())}
                                title={isPaidAccess ? undefined : 'Unlock to edit'}
                            >
                                <span className="material-symbols-outlined">edit</span>
                                Edit
                            </button>
                        )}
                    </div>
                    <span className={styles.headerDivider}></span>
                    <button
                        className={styles.orderButton}
                        onClick={isPreview ? () => openPaywall() : () => router.push(`/create/${book.id}/order`)}
                    >
                        <span className="material-symbols-outlined">
                            {isPreview ? 'lock_open' : 'shopping_cart'}
                        </span>
                        {isPreview ? 'Unlock Full Book' : 'Order Print'}
                    </button>
                    <button
                        className={styles.actionBtn}
                        title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
                        onClick={toggleFullscreen}
                        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                    >
                        <span className="material-symbols-outlined">
                            {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
                        </span>
                    </button>
                    <button
                        className={styles.actionBtn}
                        title="Download PDF"
                        onClick={handleDownload}
                        disabled={isDownloading}
                    >
                        <span className="material-symbols-outlined">
                            {isDownloading ? 'hourglass_top' : 'download'}
                        </span>
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
                        onClick={() => openPaywall()}
                    >
                        Unlock Options
                    </button>
                </div>
            )}

            {(unlockState === 'generating' || isGeneratingIllustrations) && (
                <div className={styles.generationBanner}>
                    <div className={styles.generationMeta}>
                        <span className={styles.generationLabel}>Pages ready</span>
                        <span className={styles.generationCount}>
                            {liveBook.illustrationProgress
                                ? `${liveBook.illustrationProgress.completed}/${liveBook.illustrationProgress.total}`
                                : `${readyPhysicalPages}/${totalFlipPages}`
                            }
                        </span>
                    </div>
                    <div className={styles.generationBar}>
                        <div
                            className={styles.generationFill}
                            style={{ width: `${liveBook.illustrationProgress
                                ? Math.round((liveBook.illustrationProgress.completed / Math.max(1, liveBook.illustrationProgress.total)) * 100)
                                : generationPercent}%` }}
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
                                    {isEditing ? (
                                        <StopPropagationWrapper className={styles.coverTitleInputWrapper}>
                                            <input
                                                className={styles.coverTitleInput}
                                                value={titleDraft}
                                                onChange={(e) => setTitleDraft(e.target.value)}
                                                placeholder="Untitled story"
                                                maxLength={80}
                                            />
                                        </StopPropagationWrapper>
                                    ) : (
                                        <h1 className={styles.coverTitle}>{displayTitle}</h1>
                                    )}
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

            {showPaywall && (
                <div className={styles.paywallBackdrop} onClick={closePaywall}>
                    <div className={styles.paywallSheet} onClick={event => event.stopPropagation()}>
                        <div className={styles.paywallHandleRow}>
                            <div className={styles.paywallHandle}></div>
                        </div>

                        <div className={styles.paywallHeader}>
                            {(unlockState === 'idle' && paywallView === 'payment') || (unlockState === 'waiting' && unlockClientSecret) ? (
                                <>
                                    <button
                                        aria-label="Back to unlock options"
                                        className={styles.paywallBack}
                                        onClick={() => {
                                            setPaywallView('offers');
                                            setUnlockState('idle');
                                            setUnlockClientSecret(null);
                                            setUnlockError(null);
                                        }}
                                    >
                                        <span className="material-symbols-outlined">arrow_back</span>
                                    </button>
                                    <h2 className={styles.paywallPaymentTitle}>Complete Payment</h2>
                                    <div className={styles.paywallSecurePill}>
                                        <span className="material-symbols-outlined">lock</span>
                                        <span>SSL Secured</span>
                                    </div>
                                </>
                            ) : (
                                <button
                                    aria-label="Close paywall"
                                    className={styles.paywallClose}
                                    onClick={closePaywall}
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            )}
                        </div>

                        <div className={`${styles.paywallBody} ${unlockState === 'idle' && paywallView === 'payment' ? styles.paywallBodyPayment : ''}`}>
                            {unlockState === 'idle' && paywallView === 'offers' && (
                                <div className={styles.paywallTitleGroup}>
                                    <h2>Unlock your full book</h2>
                                    <p>Stay in the story while we finish the rest.</p>
                                </div>
                            )}

                            {unlockState === 'waiting' && unlockClientSecret && (
                                <div className={styles.paywallPaymentScreen}>
                                    <div className={styles.paywallSummaryCard}>
                                        <span className={styles.paywallSummaryLabel}>Order Summary</span>
                                        <div className={styles.paywallSummaryRow}>
                                            <h3>Digital Unlock - {liveBook.settings.title || 'Your Story Book'}</h3>
                                            <span>$15.00</span>
                                        </div>
                                    </div>

                                    <Elements
                                        stripe={getStripe()}
                                        options={{
                                            clientSecret: unlockClientSecret,
                                            appearance: stripeAppearance,
                                        }}
                                    >
                                        <PaymentForm
                                            amount={15}
                                            onConfirmClick={async () => true}
                                            onPaymentSuccess={handlePaymentSuccess}
                                            onPaymentError={(err) => setUnlockError(err)}
                                            isPreparingOrder={false}
                                            returnUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/book/${book.id}`}
                                        />
                                    </Elements>

                                </div>
                            )}

                            {unlockState === 'generating' && (
                                <div className={styles.paywallStatus}>
                                    <strong>Generating your pages</strong>
                                    <p>New pages appear as they finish.</p>
                                    <div className={styles.paywallProgress}>
                                        {liveBook.pages.filter(p => p.type === 'inside' && p.imageElements?.[0]?.src).length}
                                        {' / '}
                                        {liveBook.pages.filter(p => p.type === 'inside').length} pages ready
                                    </div>
                                </div>
                            )}

                            {unlockState === 'idle' && paywallView === 'offers' && (
                                <div className={styles.paywallCards}>
                                    <div className={styles.paywallCard}>
                                        <div className={styles.paywallCardInner}>
                                            <div className={styles.paywallCardHeader}>
                                                <div>
                                                    <h3>Digital Unlock</h3>
                                                    <p>Instant access to all pages <br />+ high-res PDF download.</p>
                                                </div>
                                                <span className={styles.paywallPricePrimary}>$15</span>
                                            </div>
                                            <button
                                                className={styles.paywallCardButton}
                                                onClick={() => {
                                                    setPaywallView('payment');
                                                    handleUnlock();
                                                }}
                                            >
                                                Unlock Now
                                            </button>
                                        </div>
                                    </div>

                                    <div className={styles.paywallCardFeatured}>
                                        <div className={styles.paywallCardFeaturedInner}>
                                            <div className={styles.paywallCardHeader}>
                                                <div>
                                                    <h3>Hardcover Book</h3>
                                                    <p>Premium print + digital included.</p>
                                                </div>
                                                <span className={styles.paywallPriceHighlight}>
                                                    <span>From</span>
                                                    <br />
                                                    <span>$45</span>
                                                </span>
                                            </div>
                                            <button
                                                className={styles.paywallFeaturedButton}
                                                onClick={() => router.push(`/create/${book.id}/order`)}
                                            >
                                                <span>Order Print</span>
                                                <span className="material-symbols-outlined">arrow_forward</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {unlockState === 'idle' && paywallView === 'payment' && !unlockClientSecret && (
                                <div className={styles.paywallStatus}>
                                    <strong>{isUnlocking ? 'Preparing payment...' : 'Loading payment form...'}</strong>
                                </div>
                            )}

                            {unlockError && <div className={styles.paywallError}>{unlockError}</div>}

                            {paywallView === 'offers' && (
                                <div className={styles.paywallFooter}>
                                    <div className={styles.paywallLinks}>
                                        <a href="#" rel="noreferrer">Terms of Service</a>
                                        <span></span>
                                        <a href="#" rel="noreferrer">Privacy Policy</a>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className={styles.paywallSafeArea}></div>
                    </div>
                </div>
            )}
        </div>
    );
}
