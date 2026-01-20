'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Book } from '@/lib/types';
import { getBooks, deleteBook as deleteLocalBook } from '@/lib/storage';
import { useAuth } from '@/lib/auth/AuthContext';
import { Navbar } from '@/components/Navbar';
import { AuthModal } from '@/components/AuthModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import styles from './page.module.css';

export default function Home() {
  const router = useRouter();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

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
          console.error('Failed to fetch books');
          setBooks([]);
        }
      } catch (error) {
        console.error('Error fetching books:', error);
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
        console.error('Error deleting book:', error);
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

  const handleAuthClick = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleSignOut = async () => {
    await signOut();
    loadBooks(); // Reload with local books
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
      <Navbar />
      <main className={styles.main}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroBackground}>
            <div className={styles.floatingShape1}></div>
            <div className={styles.floatingShape2}></div>
            <div className={styles.floatingShape3}></div>
          </div>

          <div className={styles.heroContent}>
            <div className={styles.badge}>
              <span className={styles.badgeIcon}>✨</span>
              <span>Create magical stories</span>
            </div>

            <h1 className={styles.heroTitle}>
              Create{' '}
              <span className={styles.gradientText}>Personalized</span>
              <br />
              Children&apos;s Books
            </h1>

            <p className={styles.heroSubtitle}>
              Design beautiful custom books for your little ones. Upload photos,
              write stories, and order professionally printed books delivered to your door.
            </p>

            <div className={styles.heroActions}>
              <button onClick={handleCreateNew} className={styles.ctaButton}>
                <span className={styles.ctaIcon}>📖</span>
                Create Your Book
                <span className={styles.ctaArrow}>→</span>
              </button>

              <div className={styles.ctaFeatures}>
                <span className={styles.feature}>
                  <span className={styles.featureIcon}>🎨</span>
                  Easy to use
                </span>
                <span className={styles.feature}>
                  <span className={styles.featureIcon}>📦</span>
                  Print & ship
                </span>
                <span className={styles.feature}>
                  <span className={styles.featureIcon}>💝</span>
                  Perfect gift
                </span>
              </div>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.bookPreview}>
              <div className={styles.bookCover}>
                <div className={styles.bookSpine}></div>
                <div className={styles.bookFront} style={{
                  background: 'url(/images/default-cover.png) center/cover'
                }}>
                  {/* <span className={styles.bookEmoji}>📚</span> */}
                  {/* <span className={styles.bookTitle}>My Story</span> */}
                </div>
              </div>
              <div className={styles.bookShadow}></div>
            </div>
          </div>
        </section>

        {/* My Books Section Removed */}

        {/* Features Section */}
        <section className={styles.features}>
          <h2 className={styles.featuresTitle}>How It Works</h2>

          <div className={styles.stepsContainer}>
            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepIcon}>👶</div>
              <h3 className={styles.stepTitle}>Setup Your Book</h3>
              <p className={styles.stepDesc}>
                Enter your child&apos;s name, age, and choose the perfect book type and theme.
              </p>
            </div>

            <div className={styles.stepConnector}>
              <span>→</span>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepIcon}>🖼️</div>
              <h3 className={styles.stepTitle}>Add Content</h3>
              <p className={styles.stepDesc}>
                Upload photos and write your story. Arrange pages exactly how you want.
              </p>
            </div>

            <div className={styles.stepConnector}>
              <span>→</span>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepIcon}>📬</div>
              <h3 className={styles.stepTitle}>Order & Enjoy</h3>
              <p className={styles.stepDesc}>
                Preview your book, place your order, and receive a beautiful printed book.
              </p>
            </div>
          </div>
        </section>

        {/* Book Types Section */}
        <section className={styles.bookTypes}>
          <h2 className={styles.typesTitle}>Choose Your Book Type</h2>

          <div className={styles.typesGrid}>
            <div className={styles.typeCard} style={{ '--type-color': '#10b981' } as React.CSSProperties}>
              <span className={styles.typeEmoji}>📘</span>
              <h3>Board Book</h3>
              <p>Durable pages for little hands</p>
              <span className={styles.typeAge}>Ages 0-3</span>
            </div>

            <div className={styles.typeCard} style={{ '--type-color': '#6366f1' } as React.CSSProperties}>
              <span className={styles.typeEmoji}>🎨</span>
              <h3>Picture Book</h3>
              <p>Beautiful illustrations with short text</p>
              <span className={styles.typeAge}>Ages 3-6</span>
            </div>

            <div className={styles.typeCard} style={{ '--type-color': '#ec4899' } as React.CSSProperties}>
              <span className={styles.typeEmoji}>📖</span>
              <h3>Story Book</h3>
              <p>Engaging stories for growing readers</p>
              <span className={styles.typeAge}>Ages 5-10</span>
            </div>

            <div className={styles.typeCard} style={{ '--type-color': '#f59e0b' } as React.CSSProperties}>
              <span className={styles.typeEmoji}>🔤</span>
              <h3>Alphabet Book</h3>
              <p>Learn letters in a fun way</p>
              <span className={styles.typeAge}>Ages 2-5</span>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className={styles.footer}>
          <div className={styles.footerContent}>
            <div className={styles.footerBrand}>
              <span className={styles.footerLogo}>📚</span>
              <span className={styles.footerName}>KidBook Creator</span>
            </div>
            <p className={styles.footerCopy}>
              Made with ❤️ for parents who want to create magical memories
            </p>
          </div>
        </footer>

        {/* Loading overlay */}
        {isLoading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.spinner}></div>
          </div>
        )}

        {/* Auth Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={authMode}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDeleteBook}
          title="Delete Book"
          message="Are you sure you want to delete this book? This action cannot be undone."
          confirmText="Delete"
          isLoading={isDeleting}
        />
      </main>
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
