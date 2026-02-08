'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Book } from '@/lib/types';
import { getBooks, deleteBook as deleteLocalBook } from '@/lib/storage';
import { useAuth } from '@/lib/auth/AuthContext';
import { Navbar } from '@/components/Navbar';
import Footer from '@/components/Footer/Footer';
import { ConfirmModal } from '@/components/ConfirmModal';
import { createClientModuleLogger } from '@/lib/client-logger';
import styles from './page.module.css';

const logger = createClientModuleLogger('home');

export default function Home() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useTranslation('home');
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Opening Animation State
  const [openingBookId, setOpeningBookId] = useState<string | null>(null);

  // Load books - from API if logged in
  const loadBooks = useCallback(async () => {
    if (authLoading) return;

    setIsLoading(true);

    if (user) {
      // Load from API
      try {
        const response = await fetch('/api/books');
        if (response.ok) {
          const data = await response.json();
          setBooks(data);
        } else {
          logger.error('Failed to fetch books');
          setBooks([]);
        }
      } catch (error) {
        logger.error({ err: error }, 'Error fetching books');
        setBooks([]);
      }
    } else {
      // Unauthenticated
      setBooks([]);
    }

    setIsLoading(false);
  }, [user, authLoading]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const handleCreateNew = () => {
    router.push('/create');
  };

  const handleEditBook = (bookId: string) => {
    router.push(`/book/${bookId}`);
  };

  const handleViewBook = (bookId: string) => {
    setOpeningBookId(bookId);
    // Delay navigation to allow animation to play
    setTimeout(() => {
      router.push(`/book/${bookId}`);
    }, 500);
  };

  const handleDeleteBook = (bookId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookToDelete(bookId);
    setShowDeleteModal(true);
  };

  const confirmDeleteBook = async () => {
    if (!bookToDelete) return;

    setIsDeleting(true);

    if (user) {
      // Delete from API
      try {
        const response = await fetch(`/api/books/${bookToDelete}`, { method: 'DELETE' });
        if (response.ok) {
          setBooks(books.filter(b => b.id !== bookToDelete));
        }
      } catch (error) {
        logger.error({ err: error }, 'Error deleting book');
      }
    } else {
      // Delete from local storage
      deleteLocalBook(bookToDelete);
      setBooks(books.filter(b => b.id !== bookToDelete));
    }

    setIsDeleting(false);
    setShowDeleteModal(false);
    setBookToDelete(null);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <>
      <div
        id="stitch-landing-page"
        className="min-h-screen bg-[#f8f5f7] dark:bg-[#221019] font-display text-[#1c0d14] dark:text-white transition-colors duration-300 overflow-x-hidden"
      >
        <Navbar />

        {/* Main Content */}
        <main className="relative pt-32 overflow-hidden">
        {/* Background Shapes (legacy) */}
        <div className={styles.heroBackground} aria-hidden="true">
          <div className={styles.floatingShape1}></div>
          <div className={styles.floatingShape2}></div>
          <div className={styles.floatingShape3}></div>
        </div>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[70vh]">
          <div className="flex flex-col gap-8">
            <div className="inline-flex items-center px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 rounded-full text-sm font-bold w-fit">
              The #1 Book Creator for Kids
            </div>
            <h1 className="text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight text-[#1c0d14] dark:text-white">
              Make Your <br /><span className="text-[#f4258c] italic">Child</span> the Hero
            </h1>
            <p className="text-lg text-[#9c4973] dark:text-pink-100/70 max-w-lg leading-relaxed">
              Create personalized stories that spark imagination and build lasting memories. Turn bedtime into a magical adventure every night.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => router.push('/create')}
                className="bg-[#f4258c] text-white px-10 py-5 rounded-full text-lg font-bold shadow-2xl shadow-[#f4258c]/40 hover:scale-105 transition-transform"
              >
                Create a Book
              </button>
            </div>

            {/* Hero Features Row */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-indigo-100 dark:border-white/10">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#f4258c]">auto_fix_high</span>
                <span className="text-xs font-bold uppercase tracking-wider opacity-70">Easy to Use</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#f4258c]">local_shipping</span>
                <span className="text-xs font-bold uppercase tracking-wider opacity-70">Print & Ship</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#f4258c]">featured_seasonal_and_gifts</span>
                <span className="text-xs font-bold uppercase tracking-wider opacity-70">Perfect Gift</span>
              </div>
            </div>
          </div>

          {/* Right Frame (legacy image) */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="w-full max-w-[350px] lg:max-w-[350px] aspect-[4/5] transform rotate-6 hover:rotate-2 transition-transform duration-700">
              <img
                src="/images/default-cover.png"
                alt="Personalized storybook cover"
                className="w-full h-full object-cover rounded-[28px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)]"
                loading="eager"
              />
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="max-w-7xl mx-auto px-6 py-32">
          <h2 className="text-4xl font-black text-center mb-16 dark:text-white">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center gap-6 group">
              <div className="w-20 h-20 bg-white dark:bg-white/10 rounded-3xl shadow-xl flex items-center justify-center text-[#f4258c] group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-4xl">child_care</span>
              </div>
              <div>
                <h4 className="text-xl font-bold mb-2">1. Create</h4>
                <p className="text-[#9c4973] dark:text-pink-100/60">Choose your story and add your child's name.</p>
              </div>
            </div>
            {/* Step 2 */}
            <div className="flex flex-col items-center text-center gap-6 group">
              <div className="w-20 h-20 bg-white dark:bg-white/10 rounded-3xl shadow-xl flex items-center justify-center text-[#f4258c] group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-4xl">photo_frame</span>
              </div>
              <div>
                <h4 className="text-xl font-bold mb-2">2. Personalize</h4>
                <p className="text-[#9c4973] dark:text-pink-100/60">Add magic details and personal photos.</p>
              </div>
            </div>
            {/* Step 3 */}
            <div className="flex flex-col items-center text-center gap-6 group">
              <div className="w-20 h-20 bg-white dark:bg-white/10 rounded-3xl shadow-xl flex items-center justify-center text-[#f4258c] group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-4xl">markunread_mailbox</span>
              </div>
              <div>
                <h4 className="text-xl font-bold mb-2">3. Order</h4>
                <p className="text-[#9c4973] dark:text-pink-100/60">We print and deliver to your doorstep.</p>
              </div>
            </div>
            {/* Connecting Arrows */}
            <div className="hidden md:block absolute top-10 left-[30%] right-[30%] pointer-events-none opacity-20">
              <div className="flex justify-between">
                <span className="material-symbols-outlined text-4xl">arrow_forward</span>
                <span className="material-symbols-outlined text-4xl">arrow_forward</span>
              </div>
            </div>
          </div>
        </section>

        {/* Book Types Grid */}
        <section className="max-w-7xl mx-auto px-6 pb-32">
          <div className="flex items-end justify-between mb-12">
            <h2 className="text-4xl font-black dark:text-white">Choose your format</h2>
            <a className="text-[#f4258c] font-bold flex items-center gap-2 hover:underline" href="#">View all sizes <span className="material-symbols-outlined">east</span></a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Board Book */}
            <div className="group cursor-pointer bg-white dark:bg-white/5 p-6 rounded-lg border border-transparent hover:border-emerald-200 dark:hover:border-emerald-900 transition-all shadow-sm hover:shadow-xl">
              <div className="aspect-square bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl mb-6 flex items-center justify-center overflow-hidden">
                <div className="bg-emerald-400 w-24 h-32 rounded shadow-lg transform group-hover:rotate-12 transition-transform"></div>
              </div>
              <h3 className="text-xl font-bold mb-1">Board Book</h3>
              <p className="text-sm text-[#9c4973] dark:text-pink-100/60">Perfect for tiny hands (Ages 0-3)</p>
            </div>
            {/* Picture Book */}
            <div className="group cursor-pointer bg-white dark:bg-white/5 p-6 rounded-lg border border-transparent hover:border-indigo-200 dark:hover:border-indigo-900 transition-all shadow-sm hover:shadow-xl">
              <div className="aspect-square bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl mb-6 flex items-center justify-center overflow-hidden">
                <div className="bg-indigo-500 w-32 h-24 rounded shadow-lg transform group-hover:-rotate-6 transition-transform"></div>
              </div>
              <h3 className="text-xl font-bold mb-1">Picture Book</h3>
              <p className="text-sm text-[#9c4973] dark:text-pink-100/60">Standard storybook (Ages 3-7)</p>
            </div>
            {/* Story Book */}
            <div className="group cursor-pointer bg-white dark:bg-white/5 p-6 rounded-lg border border-transparent hover:border-pink-200 dark:hover:border-pink-900 transition-all shadow-sm hover:shadow-xl">
              <div className="aspect-square bg-pink-50 dark:bg-pink-900/30 rounded-2xl mb-6 flex items-center justify-center overflow-hidden">
                <div className="bg-[#f4258c] w-28 h-36 rounded shadow-lg transform group-hover:scale-110 transition-transform"></div>
              </div>
              <h3 className="text-xl font-bold mb-1">Story Book</h3>
              <p className="text-sm text-[#9c4973] dark:text-pink-100/60">Chapter stories (Ages 7-10)</p>
            </div>
            {/* Alphabet Book */}
            <div className="group cursor-pointer bg-white dark:bg-white/5 p-6 rounded-lg border border-transparent hover:border-amber-200 dark:hover:border-amber-900 transition-all shadow-sm hover:shadow-xl">
              <div className="aspect-square bg-amber-50 dark:bg-amber-900/30 rounded-2xl mb-6 flex items-center justify-center overflow-hidden">
                <div className="bg-amber-400 w-32 h-32 rounded-full shadow-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                  <span className="text-white text-4xl font-black">ABC</span>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-1">Alphabet Book</h3>
              <p className="text-sm text-[#9c4973] dark:text-pink-100/60">Learning made fun (Ages 2-5)</p>
            </div>
          </div>
        </section>
        </main>

        <Footer />
      </div>

      {bookToDelete && (
        <ConfirmModal
          isOpen={!!bookToDelete}
          onClose={() => setBookToDelete(null)}
          onConfirm={confirmDeleteBook}
          title="Delete Book"
          message="Are you sure you want to delete this book? This action cannot be undone."
        />
      )}
    </>
  );
}

// Helper functions for book display
function getBookColor(theme: string): string {
  const colors: Record<string, string> = {
    adventure: '#f97316',
    bedtime: '#6366f1',
    learning: '#10b981',
    fantasy: '#ec4899',
    animals: '#f59e0b',
    custom: '#6366f1'
  };
  return colors[theme] || '#6366f1';
}

function getBookColorSecondary(theme: string): string {
  const colors: Record<string, string> = {
    adventure: '#eab308',
    bedtime: '#8b5cf6',
    learning: '#06b6d4',
    fantasy: '#a855f7',
    animals: '#84cc16',
    custom: '#ec4899'
  };
  return colors[theme] || '#ec4899';
}

function getBookEmoji(type: string): string {
  const emojis: Record<string, string> = {
    board: '📘',
    picture: '🎨',
    story: '📖',
    alphabet: '🔤'
  };
  // ... existing emoji helper
  return emojis[type] || '📚';
}

function getBookCoverImage(book: Book) {
  // Try imageElements first (where AI-generated images are stored)
  const coverPage = book.pages[0];
  if (!coverPage) return null;

  if (coverPage.imageElements && coverPage.imageElements.length > 0 && coverPage.imageElements[0].src) {
    return coverPage.imageElements[0].src;
  }
  // Fallback to backgroundImage for manually uploaded images
  // @ts-ignore - Backend sometimes sends snake_case
  if (coverPage.backgroundImage || coverPage.background_image) {
    // @ts-ignore
    return coverPage.backgroundImage || coverPage.background_image;
  }
  return null;
}
