'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Book } from '@/lib/types';
import StoryBookViewer from '@/components/StoryBookViewer';

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes safety timeout

export default function BookViewerPage() {
    const params = useParams();
    const router = useRouter();
    const bookId = params.bookId as string;

    const [book, setBook] = useState<Book | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const pollStartRef = useRef<number>(0);

    const fetchBook = useCallback(async () => {
        try {
            const response = await fetch(`/api/books/${bookId}`);
            if (response.ok) {
                const data = await response.json();
                return data as Book;
            }

            // If API fails, try localStorage
            const localBooks = localStorage.getItem('kidbook_books');
            if (localBooks) {
                const books = JSON.parse(localBooks);
                const localBook = books.find((b: Book) => b.id === bookId);
                if (localBook) return localBook;
            }
            return null;
        } catch {
            return null;
        }
    }, [bookId]);

    // Initial fetch
    useEffect(() => {
        const loadBook = async () => {
            console.log(`[VIEWER] Loading book ${bookId}...`);
            const data = await fetchBook();
            if (data) {
                setBook(data);
                if (data.illustrationProgress?.isGenerating) {
                    pollStartRef.current = Date.now();
                }
            } else {
                setError('Could not load this book');
            }
            setLoading(false);
        };

        if (bookId) loadBook();
    }, [bookId, fetchBook]);

    // Poll when illustrations are generating
    useEffect(() => {
        if (!book?.illustrationProgress?.isGenerating) return;

        // Safety timeout
        if (pollStartRef.current && Date.now() - pollStartRef.current > POLL_TIMEOUT_MS) {
            console.log('[VIEWER] Polling timeout reached, stopping');
            return;
        }

        const interval = setInterval(async () => {
            // Safety timeout check inside interval
            if (pollStartRef.current && Date.now() - pollStartRef.current > POLL_TIMEOUT_MS) {
                clearInterval(interval);
                return;
            }

            const data = await fetchBook();
            if (data) {
                setBook(data);
                if (!data.illustrationProgress?.isGenerating) {
                    console.log('[VIEWER] All illustrations complete, stopping polling');
                    clearInterval(interval);
                }
            }
        }, POLL_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [book?.illustrationProgress?.isGenerating, fetchBook]);

    const handleClose = () => {
        router.push('/mybooks');
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
