'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('home');
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
              <span>{t('hero.badge')}</span>
            </div>

            <h1 className={styles.heroTitle}>
              {t('hero.title')}{' '}
              <span className={styles.gradientText}>{t('hero.titleHighlight')}</span>
              <br />
              {t('hero.titleEnd')}
            </h1>

            <p className={styles.heroSubtitle}>
              {t('hero.subtitle')}
            </p>

            <div className={styles.heroActions}>
              <button onClick={handleCreateNew} className={styles.ctaButton}>
                <span className={styles.ctaIcon}>📖</span>
                {t('hero.ctaButton')}
                <span className={styles.ctaArrow}>→</span>
              </button>

              <div className={styles.ctaFeatures}>
                <span className={styles.feature}>
                  <span className={styles.featureIcon}>🎨</span>
                  {t('hero.features.easyToUse')}
                </span>
                <span className={styles.feature}>
                  <span className={styles.featureIcon}>📦</span>
                  {t('hero.features.printShip')}
                </span>
                <span className={styles.feature}>
                  <span className={styles.featureIcon}>💝</span>
                  {t('hero.features.perfectGift')}
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
          <h2 className={styles.featuresTitle}>{t('howItWorks.title')}</h2>

          <div className={styles.stepsContainer}>
            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepIcon}>👶</div>
              <h3 className={styles.stepTitle}>{t('howItWorks.step1.title')}</h3>
              <p className={styles.stepDesc}>
                {t('howItWorks.step1.description')}
              </p>
            </div>

            <div className={styles.stepConnector}>
              <span>→</span>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepIcon}>🖼️</div>
              <h3 className={styles.stepTitle}>{t('howItWorks.step2.title')}</h3>
              <p className={styles.stepDesc}>
                {t('howItWorks.step2.description')}
              </p>
            </div>

            <div className={styles.stepConnector}>
              <span>→</span>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepIcon}>📬</div>
              <h3 className={styles.stepTitle}>{t('howItWorks.step3.title')}</h3>
              <p className={styles.stepDesc}>
                {t('howItWorks.step3.description')}
              </p>
            </div>
          </div>
        </section>

        {/* Book Types Section */}
        <section className={styles.bookTypes}>
          <h2 className={styles.typesTitle}>{t('bookTypes.title')}</h2>

          <div className={styles.typesGrid}>
            <div className={styles.typeCard} style={{ '--type-color': '#10b981' } as React.CSSProperties}>
              <span className={styles.typeEmoji}>📘</span>
              <h3>{t('bookTypes.board.title')}</h3>
              <p>{t('bookTypes.board.description')}</p>
              <span className={styles.typeAge}>{t('bookTypes.board.age')}</span>
            </div>

            <div className={styles.typeCard} style={{ '--type-color': '#6366f1' } as React.CSSProperties}>
              <span className={styles.typeEmoji}>🎨</span>
              <h3>{t('bookTypes.picture.title')}</h3>
              <p>{t('bookTypes.picture.description')}</p>
              <span className={styles.typeAge}>{t('bookTypes.picture.age')}</span>
            </div>

            <div className={styles.typeCard} style={{ '--type-color': '#ec4899' } as React.CSSProperties}>
              <span className={styles.typeEmoji}>📖</span>
              <h3>{t('bookTypes.story.title')}</h3>
              <p>{t('bookTypes.story.description')}</p>
              <span className={styles.typeAge}>{t('bookTypes.story.age')}</span>
            </div>

            <div className={styles.typeCard} style={{ '--type-color': '#f59e0b' } as React.CSSProperties}>
              <span className={styles.typeEmoji}>🔤</span>
              <h3>{t('bookTypes.alphabet.title')}</h3>
              <p>{t('bookTypes.alphabet.description')}</p>
              <span className={styles.typeAge}>{t('bookTypes.alphabet.age')}</span>
            </div>
          </div>
        </section>

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
          title={t('deleteModal.title')}
          message={t('deleteModal.message')}
          confirmText={t('deleteModal.confirmText')}
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
