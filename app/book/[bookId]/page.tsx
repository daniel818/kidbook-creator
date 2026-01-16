'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Book, createNewPage } from '@/lib/types';
import StoryBookViewer from '@/components/StoryBookViewer';

export default function BookViewerPage() {
    const params = useParams();
    const router = useRouter();
    const bookId = params.bookId as string;

    const [book, setBook] = useState<Book | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBook = async () => {
            const startTime = Date.now();
            console.log('[VIEWER] ========================================');
            console.log(`[VIEWER] === BOOK VIEWER LOADING STARTED (bookId: ${bookId}) ===`);
            console.log('[VIEWER] ========================================');

            try {
                // Try API first (for logged-in users)
                console.log('[VIEWER] Step 1: Fetching from API...');
                const apiStartTime = Date.now();
                const response = await fetch(`/api/books/${bookId}`);
                console.log(`[VIEWER] API response status: ${response.status} in ${Date.now() - apiStartTime}ms`);

                if (response.ok) {
                    console.log('[VIEWER] Step 2: Parsing API response...');
                    const parseStartTime = Date.now();
                    const data = await response.json();
                    console.log(`[VIEWER] Response parsed in ${Date.now() - parseStartTime}ms`);
                    console.log(`[VIEWER] Book data: title="${data.settings?.title}", pages=${data.pages?.length || 0}`);

                    // Check for image data
                    const pagesWithImages = data.pages?.filter((p: any) =>
                        p.backgroundImage || p.imageElements?.some((img: any) => img.src)
                    )?.length || 0;
                    console.log(`[VIEWER] Pages with images: ${pagesWithImages}/${data.pages?.length || 0}`);

                    setBook(data);
                    const totalDuration = Date.now() - startTime;
                    console.log('[VIEWER] ========================================');
                    console.log(`[VIEWER] === BOOK LOADED FROM API in ${totalDuration}ms ===`);
                    console.log('[VIEWER] ========================================');
                    return;
                }

                // If API fails (401 or 404), try localStorage
                console.log('[VIEWER] API failed, trying localStorage...');
                const localBooks = localStorage.getItem('kidbook_books');
                if (localBooks) {
                    const books = JSON.parse(localBooks);
                    const localBook = books.find((b: Book) => b.id === bookId);
                    if (localBook) {
                        console.log('[VIEWER] Book found in localStorage');
                        setBook(localBook);
                        const totalDuration = Date.now() - startTime;
                        console.log(`[VIEWER] === BOOK LOADED FROM LOCALSTORAGE in ${totalDuration}ms ===`);
                        return;
                    }
                }

                // Neither API nor localStorage had the book
                console.log('[VIEWER] Book not found in API or localStorage');
                throw new Error('Book not found');
            } catch (err) {
                const totalDuration = Date.now() - startTime;
                console.log('[VIEWER] ========================================');
                console.log(`[VIEWER] === BOOK LOADING FAILED after ${totalDuration}ms ===`);
                console.log('[VIEWER] ========================================');
                console.error('[VIEWER] Error:', err);
                setError('Could not load this book');
            } finally {
                setLoading(false);
            }
        };

        if (bookId) {
            fetchBook();
        }
    }, [bookId]);

    const handleClose = () => {
        router.push('/');
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                color: 'white'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
                    <p>Loading your storybook...</p>
                </div>
            </div>
        );
    }

    if (error || !book) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                color: 'white',
                gap: '1rem'
            }}>
                <div style={{ fontSize: '3rem' }}>😢</div>
                <p>{error || 'Book not found'}</p>
                <button
                    onClick={handleClose}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        color: 'white',
                        cursor: 'pointer'
                    }}
                >
                    Go Home
                </button>
            </div>
        );
    }

    return (
        <StoryBookViewer
            book={book}
            onClose={handleClose}
            isFullScreen={true}
        />
    );
}
