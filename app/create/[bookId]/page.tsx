'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Book, BookPage, TextElement, ImageElement, createNewPage, BookTypeInfo, BookThemeInfo } from '@/lib/types';
import { getBookById, saveBook } from '@/lib/storage';
import styles from './page.module.css';

export default function BookEditorPage() {
    const router = useRouter();
    const params = useParams();
    const bookId = params.bookId as string;

    const [book, setBook] = useState<Book | null>(null);
    const [selectedPageIndex, setSelectedPageIndex] = useState(0);
    const [selectedElement, setSelectedElement] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [editingText, setEditingText] = useState<string | null>(null);

    const canvasRef = useRef<HTMLDivElement>(null);
    const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Load book on mount
    useEffect(() => {
        const loadBook = async () => {
            // Try to fetch from API first (for logged-in users)
            try {
                const response = await fetch(`/api/books/${bookId}`);
                if (response.ok) {
                    const data = await response.json();
                    setBook(data);
                    setIsLoading(false);
                    return;
                }
            } catch (error) {
                console.error('Error fetching book from API:', error);
            }

            router.push('/');
            setIsLoading(false);
        };

        loadBook();
    }, [bookId, router]);

    // Auto-save when book changes
    useEffect(() => {
        if (!book) return;

        if (autoSaveTimeoutRef.current) {
            clearTimeout(autoSaveTimeoutRef.current);
        }

        autoSaveTimeoutRef.current = setTimeout(() => {
            setIsSaving(true);
            saveBook(book);
            setTimeout(() => setIsSaving(false), 500);
        }, 1000);

        return () => {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }
        };
    }, [book]);

    const currentPage = book?.pages[selectedPageIndex];

    // Update book helper
    const updateBook = useCallback((updates: Partial<Book>) => {
        if (!book) return;
        setBook({ ...book, ...updates, updatedAt: new Date() });
    }, [book]);

    // Update current page helper
    const updateCurrentPage = useCallback((updates: Partial<BookPage>) => {
        if (!book || !currentPage) return;

        const newPages = [...book.pages];
        newPages[selectedPageIndex] = {
            ...currentPage,
            ...updates,
            updatedAt: new Date()
        };
        updateBook({ pages: newPages });
    }, [book, currentPage, selectedPageIndex, updateBook]);

    // Add new page
    const handleAddPage = () => {
        if (!book) return;

        const newPage = createNewPage(book.pages.length, 'inside');
        updateBook({ pages: [...book.pages, newPage] });
        setSelectedPageIndex(book.pages.length);
    };

    // Delete current page
    const handleDeletePage = () => {
        if (!book || book.pages.length <= 1) return;

        if (!confirm('Delete this page?')) return;

        const newPages = book.pages.filter((_, i) => i !== selectedPageIndex);
        // Renumber pages
        newPages.forEach((page, i) => {
            page.pageNumber = i;
        });

        updateBook({ pages: newPages });
        setSelectedPageIndex(Math.max(0, selectedPageIndex - 1));
    };

    // Reorder pages
    const handleReorderPages = (newOrder: BookPage[]) => {
        if (!book) return;

        // Renumber pages
        const renumbered = newOrder.map((page, i) => ({
            ...page,
            pageNumber: i
        }));

        updateBook({ pages: renumbered });
    };

    // Image upload with dropzone
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (!currentPage) return;

        acceptedFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = () => {
                const newImage: ImageElement = {
                    id: crypto.randomUUID(),
                    src: reader.result as string,
                    x: 10,
                    y: 10,
                    width: 40,
                    height: 40,
                    rotation: 0
                };

                updateCurrentPage({
                    imageElements: [...currentPage.imageElements, newImage]
                });
            };
            reader.readAsDataURL(file);
        });
    }, [currentPage, updateCurrentPage]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
        },
        noClick: true
    });

    // Add text element
    const handleAddText = () => {
        if (!currentPage) return;

        const newText: TextElement = {
            id: crypto.randomUUID(),
            content: 'Click to edit text',
            x: 10,
            y: 50,
            fontSize: 24,
            fontFamily: 'Outfit',
            color: '#1f2937',
            fontWeight: 'normal',
            textAlign: 'center',
            width: 80
        };

        updateCurrentPage({
            textElements: [...currentPage.textElements, newText]
        });
        setEditingText(newText.id);
    };

    // Update text element
    const handleUpdateText = (id: string, updates: Partial<TextElement>) => {
        if (!currentPage) return;

        const newTexts = currentPage.textElements.map(t =>
            t.id === id ? { ...t, ...updates } : t
        );
        updateCurrentPage({ textElements: newTexts });
    };

    // Delete selected element
    const handleDeleteElement = () => {
        if (!currentPage || !selectedElement) return;

        updateCurrentPage({
            textElements: currentPage.textElements.filter(t => t.id !== selectedElement),
            imageElements: currentPage.imageElements.filter(i => i.id !== selectedElement)
        });
        setSelectedElement(null);
    };

    // Update image element
    const handleUpdateImage = (id: string, updates: Partial<ImageElement>) => {
        if (!currentPage) return;

        const newImages = currentPage.imageElements.map(img =>
            img.id === id ? { ...img, ...updates } : img
        );
        updateCurrentPage({ imageElements: newImages });
    };

    // Handle element drag
    const handleElementDrag = (id: string, type: 'text' | 'image', deltaX: number, deltaY: number) => {
        if (!currentPage || !canvasRef.current) return;

        const canvasRect = canvasRef.current.getBoundingClientRect();
        const percentX = (deltaX / canvasRect.width) * 100;
        const percentY = (deltaY / canvasRect.height) * 100;

        if (type === 'text') {
            const element = currentPage.textElements.find(t => t.id === id);
            if (element) {
                handleUpdateText(id, {
                    x: Math.max(0, Math.min(100 - element.width, element.x + percentX)),
                    y: Math.max(0, Math.min(90, element.y + percentY))
                });
            }
        } else {
            const element = currentPage.imageElements.find(i => i.id === id);
            if (element) {
                handleUpdateImage(id, {
                    x: Math.max(0, Math.min(100 - element.width, element.x + percentX)),
                    y: Math.max(0, Math.min(100 - element.height, element.y + percentY))
                });
            }
        }
    };

    // Change page background color
    const handleBackgroundChange = (color: string) => {
        updateCurrentPage({ backgroundColor: color });
    };

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading your book...</p>
            </div>
        );
    }

    if (!book) {
        return null;
    }

    const themeColors = book.settings.bookTheme ? BookThemeInfo[book.settings.bookTheme].colors : ['#6366f1', '#ec4899'];

    return (
        <main className={styles.main}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <button
                        className={styles.backButton}
                        onClick={() => router.push('/')}
                    >
                        ← Back
                    </button>
                    <div className={styles.bookInfo}>
                        <h1 className={styles.bookTitle}>{book.settings.title}</h1>
                        <span className={styles.bookMeta}>
                            {book.pages.length} page{book.pages.length !== 1 ? 's' : ''} •
                            {BookTypeInfo[book.settings.bookType].label}
                        </span>
                    </div>
                </div>

                <div className={styles.headerRight}>
                    <div className={`${styles.saveStatus} ${isSaving ? styles.saving : ''}`}>
                        {isSaving ? (
                            <>
                                <span className={styles.savingDot}></span>
                                Saving...
                            </>
                        ) : (
                            <>✓ Saved</>
                        )}
                    </div>

                    <button
                        className={styles.previewButton}
                        onClick={() => setShowPreview(true)}
                    >
                        👁️ Preview
                    </button>

                    <button
                        className={styles.orderButton}
                        onClick={() => router.push(`/create/${bookId}/order`)}
                    >
                        🛒 Order Book
                    </button>
                </div>
            </header>

            {/* Main Editor Area */}
            <div className={styles.editorLayout}>
                {/* Left Sidebar - Page List */}
                <aside className={styles.pagesSidebar}>
                    <div className={styles.sidebarHeader}>
                        <h2>Pages</h2>
                        <button
                            className={styles.addPageBtn}
                            onClick={handleAddPage}
                        >
                            + Add
                        </button>
                    </div>

                    <Reorder.Group
                        axis="y"
                        values={book.pages}
                        onReorder={handleReorderPages}
                        className={styles.pagesList}
                    >
                        {book.pages.map((page, index) => (
                            <Reorder.Item
                                key={page.id}
                                value={page}
                                className={`${styles.pageThumb} ${selectedPageIndex === index ? styles.selected : ''}`}
                                onClick={() => setSelectedPageIndex(index)}
                            >
                                <div
                                    className={styles.pageThumbPreview}
                                    style={{
                                        backgroundColor: page.backgroundColor,
                                        background: page.type === 'cover'
                                            ? `linear-gradient(135deg, ${themeColors[0]} 0%, ${themeColors[1]} 100%)`
                                            : page.backgroundColor
                                    }}
                                >
                                    <span className={styles.pageNumber}>
                                        {page.type === 'cover' ? '📕' : page.pageNumber}
                                    </span>
                                </div>
                                <span className={styles.pageLabel}>
                                    {page.type === 'cover' ? 'Cover' : `Page ${page.pageNumber}`}
                                </span>
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>
                </aside>

                {/* Center - Canvas */}
                <div className={styles.canvasArea}>
                    <div
                        ref={canvasRef}
                        className={styles.canvas}
                        style={{
                            backgroundColor: currentPage?.backgroundColor || '#ffffff',
                            background: currentPage?.type === 'cover'
                                ? `linear-gradient(135deg, ${themeColors[0]} 0%, ${themeColors[1]} 100%)`
                                : currentPage?.backgroundColor || '#ffffff'
                        }}
                        {...getRootProps()}
                    >
                        <input {...getInputProps()} />

                        {isDragActive && (
                            <div className={styles.dropOverlay}>
                                <span className={styles.dropIcon}>📷</span>
                                <span>Drop image here</span>
                            </div>
                        )}

                        {/* Render images */}
                        {currentPage?.imageElements.map(img => (
                            <motion.div
                                key={img.id}
                                className={`${styles.imageElement} ${selectedElement === img.id ? styles.selected : ''}`}
                                style={{
                                    left: `${img.x}%`,
                                    top: `${img.y}%`,
                                    width: `${img.width}%`,
                                    transform: `rotate(${img.rotation}deg)`
                                }}
                                drag
                                dragMomentum={false}
                                onDragEnd={(__, info) => handleElementDrag(img.id, 'image', info.offset.x, info.offset.y)}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedElement(img.id);
                                }}
                            >
                                <img src={img.src} alt="" className={styles.image} />
                                {selectedElement === img.id && (
                                    <div className={styles.resizeHandles}>
                                        <div className={styles.resizeHandle} data-position="se"></div>
                                    </div>
                                )}
                            </motion.div>
                        ))}

                        {/* Render text elements */}
                        {currentPage?.textElements.map(text => (
                            <motion.div
                                key={text.id}
                                className={`${styles.textElement} ${selectedElement === text.id ? styles.selected : ''}`}
                                style={{
                                    left: `${text.x}%`,
                                    top: `${text.y}%`,
                                    width: `${text.width}%`,
                                    fontSize: `${text.fontSize}px`,
                                    fontFamily: text.fontFamily,
                                    fontWeight: text.fontWeight,
                                    color: text.color,
                                    textAlign: text.textAlign
                                }}
                                drag
                                dragMomentum={false}
                                onDragEnd={(__, info) => handleElementDrag(text.id, 'text', info.offset.x, info.offset.y)}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedElement(text.id);
                                }}
                                onDoubleClick={() => setEditingText(text.id)}
                            >
                                {editingText === text.id ? (
                                    <textarea
                                        className={styles.textInput}
                                        value={text.content}
                                        onChange={(e) => handleUpdateText(text.id, { content: e.target.value })}
                                        onBlur={() => setEditingText(null)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Escape') setEditingText(null);
                                        }}
                                        autoFocus
                                        style={{
                                            fontSize: `${text.fontSize}px`,
                                            fontFamily: text.fontFamily,
                                            fontWeight: text.fontWeight,
                                            color: text.color,
                                            textAlign: text.textAlign
                                        }}
                                    />
                                ) : (
                                    <span>{text.content}</span>
                                )}
                            </motion.div>
                        ))}

                        {/* Click to deselect */}
                        <div
                            className={styles.canvasClickArea}
                            onClick={() => {
                                setSelectedElement(null);
                                setEditingText(null);
                            }}
                        ></div>
                    </div>

                    {/* Canvas Tools */}
                    <div className={styles.canvasTools}>
                        <button
                            className={styles.tool}
                            onClick={() => (document.querySelector('input[type="file"]') as HTMLElement)?.click()}
                            title="Add Image"
                        >
                            🖼️ Add Image
                        </button>
                        <button
                            className={styles.tool}
                            onClick={handleAddText}
                            title="Add Text"
                        >
                            ✏️ Add Text
                        </button>
                        <div className={styles.toolDivider}></div>
                        <button
                            className={styles.tool}
                            onClick={handleDeletePage}
                            disabled={book.pages.length <= 1}
                            title="Delete Page"
                        >
                            🗑️ Delete Page
                        </button>
                    </div>
                </div>

                {/* Right Sidebar - Properties */}
                <aside className={styles.propertiesSidebar}>
                    <div className={styles.sidebarHeader}>
                        <h2>Properties</h2>
                    </div>

                    {selectedElement ? (
                        <ElementProperties
                            element={
                                currentPage?.textElements.find(t => t.id === selectedElement) ||
                                currentPage?.imageElements.find(i => i.id === selectedElement)
                            }
                            onUpdateText={handleUpdateText}
                            onUpdateImage={handleUpdateImage}
                            onDelete={handleDeleteElement}
                        />
                    ) : (
                        <PageProperties
                            page={currentPage}
                            onBackgroundChange={handleBackgroundChange}
                        />
                    )}
                </aside>
            </div>

            {/* Preview Modal */}
            <AnimatePresence>
                {showPreview && (
                    <BookPreviewModal
                        book={book}
                        onClose={() => setShowPreview(false)}
                    />
                )}
            </AnimatePresence>
        </main>
    );
}

// Element Properties Panel
function ElementProperties({
    element,
    onUpdateText,
    onUpdateImage,
    onDelete
}: {
    element: TextElement | ImageElement | undefined;
    onUpdateText: (id: string, updates: Partial<TextElement>) => void;
    onUpdateImage: (id: string, updates: Partial<ImageElement>) => void;
    onDelete: () => void;
}) {
    if (!element) return null;

    const isText = 'content' in element;

    return (
        <div className={styles.propertiesPanel}>
            {isText ? (
                <>
                    <div className={styles.propGroup}>
                        <label>Font Size</label>
                        <input
                            type="range"
                            min="12"
                            max="72"
                            value={(element as TextElement).fontSize}
                            onChange={(e) => onUpdateText(element.id, { fontSize: parseInt(e.target.value) })}
                        />
                        <span>{(element as TextElement).fontSize}px</span>
                    </div>

                    <div className={styles.propGroup}>
                        <label>Color</label>
                        <input
                            type="color"
                            value={(element as TextElement).color}
                            onChange={(e) => onUpdateText(element.id, { color: e.target.value })}
                        />
                    </div>

                    <div className={styles.propGroup}>
                        <label>Font Weight</label>
                        <select
                            value={(element as TextElement).fontWeight}
                            onChange={(e) => onUpdateText(element.id, { fontWeight: e.target.value })}
                        >
                            <option value="normal">Normal</option>
                            <option value="bold">Bold</option>
                        </select>
                    </div>

                    <div className={styles.propGroup}>
                        <label>Align</label>
                        <div className={styles.alignButtons}>
                            {(['left', 'center', 'right'] as const).map(align => (
                                <button
                                    key={align}
                                    className={`${styles.alignBtn} ${(element as TextElement).textAlign === align ? styles.active : ''}`}
                                    onClick={() => onUpdateText(element.id, { textAlign: align })}
                                >
                                    {align === 'left' ? '⬅️' : align === 'center' ? '↔️' : '➡️'}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div className={styles.propGroup}>
                        <label>Width</label>
                        <input
                            type="range"
                            min="10"
                            max="100"
                            value={(element as ImageElement).width}
                            onChange={(e) => onUpdateImage(element.id, {
                                width: parseInt(e.target.value),
                                height: parseInt(e.target.value)
                            })}
                        />
                        <span>{(element as ImageElement).width}%</span>
                    </div>

                    <div className={styles.propGroup}>
                        <label>Rotation</label>
                        <input
                            type="range"
                            min="-180"
                            max="180"
                            value={(element as ImageElement).rotation}
                            onChange={(e) => onUpdateImage(element.id, { rotation: parseInt(e.target.value) })}
                        />
                        <span>{(element as ImageElement).rotation}°</span>
                    </div>
                </>
            )}

            <button className={styles.deleteBtn} onClick={onDelete}>
                🗑️ Delete Element
            </button>
        </div>
    );
}

// Page Properties Panel
function PageProperties({
    page,
    onBackgroundChange
}: {
    page: BookPage | undefined;
    onBackgroundChange: (color: string) => void;
}) {
    if (!page) return null;

    const presetColors = [
        '#ffffff', '#f3f4f6', '#fef3c7', '#dbeafe',
        '#dcfce7', '#fce7f3', '#f3e8ff', '#fed7aa'
    ];

    return (
        <div className={styles.propertiesPanel}>
            <div className={styles.propGroup}>
                <label>Page Type</label>
                <span className={styles.pageType}>
                    {page.type === 'cover' ? '📕 Cover Page' : `📄 Page ${page.pageNumber}`}
                </span>
            </div>

            {page.type !== 'cover' && (
                <div className={styles.propGroup}>
                    <label>Background Color</label>
                    <div className={styles.colorPalette}>
                        {presetColors.map(color => (
                            <button
                                key={color}
                                className={`${styles.colorSwatch} ${page.backgroundColor === color ? styles.selected : ''}`}
                                style={{ backgroundColor: color }}
                                onClick={() => onBackgroundChange(color)}
                            />
                        ))}
                    </div>
                    <input
                        type="color"
                        value={page.backgroundColor}
                        onChange={(e) => onBackgroundChange(e.target.value)}
                        className={styles.colorPicker}
                    />
                </div>
            )}

            <div className={styles.propInfo}>
                <p>📷 {page.imageElements.length} image{page.imageElements.length !== 1 ? 's' : ''}</p>
                <p>✏️ {page.textElements.length} text element{page.textElements.length !== 1 ? 's' : ''}</p>
            </div>
        </div>
    );
}

// Book Preview Modal
function BookPreviewModal({
    book,
    onClose
}: {
    book: Book;
    onClose: () => void;
}) {
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const themeColors = book.settings.bookTheme ? BookThemeInfo[book.settings.bookTheme].colors : ['#6366f1', '#ec4899'];

    const goToPrev = () => {
        setCurrentPageIndex(prev => Math.max(0, prev - 1));
    };

    const goToNext = () => {
        setCurrentPageIndex(prev => Math.min(book.pages.length - 1, prev + 1));
    };

    return (
        <motion.div
            className={styles.previewModal}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className={styles.previewContent}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
            >
                <button className={styles.closeBtn} onClick={onClose}>×</button>

                <h2 className={styles.previewTitle}>{book.settings.title}</h2>

                <div className={styles.previewBook}>
                    <button
                        className={`${styles.navBtn} ${styles.prevBtn}`}
                        onClick={goToPrev}
                        disabled={currentPageIndex === 0}
                    >
                        ←
                    </button>

                    <div
                        className={styles.previewPage}
                        style={{
                            backgroundColor: book.pages[currentPageIndex]?.backgroundColor || '#fff',
                            background: book.pages[currentPageIndex]?.type === 'cover'
                                ? `linear-gradient(135deg, ${themeColors[0]} 0%, ${themeColors[1]} 100%)`
                                : book.pages[currentPageIndex]?.backgroundColor || '#fff'
                        }}
                    >
                        {/* Render page content */}
                        {book.pages[currentPageIndex]?.imageElements.map(img => (
                            <div
                                key={img.id}
                                className={styles.previewImage}
                                style={{
                                    left: `${img.x}%`,
                                    top: `${img.y}%`,
                                    width: `${img.width}%`,
                                    transform: `rotate(${img.rotation}deg)`
                                }}
                            >
                                <img src={img.src} alt="" />
                            </div>
                        ))}

                        {book.pages[currentPageIndex]?.textElements.map(text => (
                            <div
                                key={text.id}
                                className={styles.previewText}
                                style={{
                                    left: `${text.x}%`,
                                    top: `${text.y}%`,
                                    width: `${text.width}%`,
                                    fontSize: `${text.fontSize * 0.6}px`,
                                    fontFamily: text.fontFamily,
                                    fontWeight: text.fontWeight,
                                    color: text.color,
                                    textAlign: text.textAlign
                                }}
                            >
                                {text.content}
                            </div>
                        ))}
                    </div>

                    <button
                        className={`${styles.navBtn} ${styles.nextBtn}`}
                        onClick={goToNext}
                        disabled={currentPageIndex === book.pages.length - 1}
                    >
                        →
                    </button>
                </div>

                <div className={styles.previewPagination}>
                    {book.pages.map((page, index) => (
                        <button
                            key={page.id}
                            className={`${styles.paginationDot} ${currentPageIndex === index ? styles.active : ''}`}
                            onClick={() => setCurrentPageIndex(index)}
                        />
                    ))}
                </div>

                <p className={styles.previewFooter}>
                    Page {currentPageIndex + 1} of {book.pages.length}
                </p>
            </motion.div>
        </motion.div>
    );
}
