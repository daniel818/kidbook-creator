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
            try {
                // Try API first (for logged-in users)
                const response = await fetch(`/api/books/${bookId}`);
                if (response.ok) {
                    const data = await response.json();
                    // API returns book directly, not wrapped in {book: ...}
                    setBook(data);
                    return;
                }

                // If API fails (401 or 404), try localStorage
                const localBooks = localStorage.getItem('kidbook_books');
                if (localBooks) {
                    const books = JSON.parse(localBooks);
                    const localBook = books.find((b: Book) => b.id === bookId);
                    if (localBook) {
                        setBook(localBook);
                        return;
                    }
                }

                // Neither API nor localStorage had the book
                throw new Error('Book not found');
            } catch (err) {
                console.error('Error fetching book:', err);
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
