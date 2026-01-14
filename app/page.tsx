'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Book } from '@/lib/types';
import { getBooks, deleteBook } from '@/lib/storage';
import styles from './page.module.css';

export default function Home() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load books from storage
    const savedBooks = getBooks();
    setBooks(savedBooks);
    setIsLoading(false);
  }, []);

  const handleCreateNew = () => {
    router.push('/create');
  };

  const handleEditBook = (bookId: string) => {
    router.push(`/create/${bookId}`);
  };

  const handleDeleteBook = (bookId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this book?')) {
      deleteBook(bookId);
      setBooks(books.filter(b => b.id !== bookId));
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
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
              <div className={styles.bookFront}>
                <span className={styles.bookEmoji}>📚</span>
                <span className={styles.bookTitle}>My Story</span>
              </div>
            </div>
            <div className={styles.bookShadow}></div>
          </div>
        </div>
      </section>

      {/* My Books Section */}
      {books.length > 0 && (
        <section className={styles.myBooks}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>📚</span>
              My Books
            </h2>
            <span className={styles.bookCount}>{books.length} book{books.length !== 1 ? 's' : ''}</span>
          </div>

          <div className={styles.booksGrid}>
            {books.map((book, index) => (
              <div
                key={book.id}
                className={styles.bookCard}
                onClick={() => handleEditBook(book.id)}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div
                  className={styles.bookCardCover}
                  style={{
                    background: `linear-gradient(135deg, ${getBookColor(book.settings.bookTheme)} 0%, ${getBookColorSecondary(book.settings.bookTheme)} 100%)`
                  }}
                >
                  <span className={styles.bookCardEmoji}>
                    {getBookEmoji(book.settings.bookType)}
                  </span>
                  <span className={styles.pageCount}>
                    {book.pages.length} page{book.pages.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className={styles.bookCardInfo}>
                  <h3 className={styles.bookCardTitle}>
                    {book.settings.title || `${book.settings.childName}'s Book`}
                  </h3>
                  <p className={styles.bookCardMeta}>
                    For {book.settings.childName}, age {book.settings.childAge}
                  </p>
                  <p className={styles.bookCardDate}>
                    Updated {formatDate(book.updatedAt)}
                  </p>
                </div>

                <div className={styles.bookCardActions}>
                  <span className={`${styles.statusBadge} ${styles[book.status]}`}>
                    {book.status}
                  </span>
                  <button
                    className={styles.deleteBtn}
                    onClick={(e) => handleDeleteBook(book.id, e)}
                    aria-label="Delete book"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}

            {/* Add New Book Card */}
            <div
              className={`${styles.bookCard} ${styles.addNew}`}
              onClick={handleCreateNew}
            >
              <div className={styles.addNewContent}>
                <span className={styles.addIcon}>+</span>
                <span className={styles.addText}>Create New Book</span>
              </div>
            </div>
          </div>
        </section>
      )}

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
    </main>
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
  return emojis[type] || '📚';
}
