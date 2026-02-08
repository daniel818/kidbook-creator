// ============================================
// KIDBOOK CREATOR - Local Storage Management
// ============================================

import { Book } from './types';

const STORAGE_KEY = 'kidbook_books';
const CURRENT_BOOK_KEY = 'kidbook_current';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

/**
 * Get all saved books from local storage
 */
export function getBooks(): Book[] {
    if (!isBrowser) return [];

    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return [];

        const books = JSON.parse(data);
        // Convert date strings back to Date objects
        return books.map((book: Book) => ({
            ...book,
            createdAt: new Date(book.createdAt),
            updatedAt: new Date(book.updatedAt),
            pages: book.pages.map(page => ({
                ...page,
                createdAt: new Date(page.createdAt),
                updatedAt: new Date(page.updatedAt)
            }))
        }));
    } catch (error) {
        console.error('Error loading books from storage:', error);
        return [];
    }
}

/**
 * Save all books to local storage
 */
export function saveBooks(books: Book[]): void {
    if (!isBrowser) return;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    } catch (error) {
        console.warn('Storage quota exceeded, could not save to local storage (ignoring in online mode):', error);
    }
}

/**
 * Get a single book by ID
 */
export function getBookById(id: string): Book | null {
    const books = getBooks();
    return books.find(book => book.id === id) || null;
}

/**
 * Save or update a single book
 */
export function saveBook(book: Book): void {
    const books = getBooks();
    const existingIndex = books.findIndex(b => b.id === book.id);

    const updatedBook = {
        ...book,
        updatedAt: new Date()
    };

    if (existingIndex >= 0) {
        books[existingIndex] = updatedBook;
    } else {
        books.push(updatedBook);
    }

    saveBooks(books);
}

/**
 * Delete a book by ID
 */
export function deleteBook(id: string): void {
    const books = getBooks();
    const filtered = books.filter(book => book.id !== id);
    saveBooks(filtered);
}

/**
 * Get current book being edited
 */
export function getCurrentBook(): Book | null {
    if (!isBrowser) return null;

    try {
        const id = localStorage.getItem(CURRENT_BOOK_KEY);
        if (!id) return null;
        return getBookById(id);
    } catch {
        return null;
    }
}

/**
 * Set current book being edited
 */
export function setCurrentBook(id: string | null): void {
    if (!isBrowser) return;

    if (id) {
        localStorage.setItem(CURRENT_BOOK_KEY, id);
    } else {
        localStorage.removeItem(CURRENT_BOOK_KEY);
    }
}

/**
 * Clear all stored data (for testing)
 */
export function clearAllData(): void {
    if (!isBrowser) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CURRENT_BOOK_KEY);
}
