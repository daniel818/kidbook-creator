'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Book, BookDisplayState, getBookDisplayState } from '@/lib/types';
import styles from './BookGrid.module.css';

interface BookGridProps {
  books: Book[];
  onDeleteBook?: (bookId: string, e: React.MouseEvent) => void;
  showAddNew?: boolean;
  orderMap?: Record<string, { status: string; estimatedDelivery?: string }>;
}

const STATUS_BADGE_ICONS: Partial<Record<BookDisplayState, string>> = {
  ready: 'check_circle',
  ordered: 'local_shipping',
  delivered: 'verified',
};

export function BookGrid({ books, onDeleteBook, showAddNew = true, orderMap = {} }: BookGridProps) {
  const router = useRouter();
  const { t } = useTranslation('mybooks');
  const [openingBookId, setOpeningBookId] = useState<string | null>(null);

  const handleViewBook = (bookId: string) => {
    setOpeningBookId(bookId);
    setTimeout(() => {
      router.push(`/book/${bookId}`);
    }, 500);
  };

  const handleCreateNew = () => {
    router.push('/create');
  };

  return (
    <div className={styles.booksGrid}>
      {books.map((book, index) => {
        const coverImage = getBookCoverImage(book);
        const themeColor = getBookColor(book.settings.bookTheme);
        const orderInfo = orderMap[book.id];
        const displayState = getBookDisplayState(book, orderInfo?.status);

        return (
          <div
            key={book.id}
            className={`${styles.bookItem} ${openingBookId === book.id ? styles.isOpening : ''} ${styles[`bookItem_${displayState}`] || ''}`}
            onClick={() => handleViewBook(book.id)}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* 3D Book Object */}
            <div className={styles.book3DContainer}>
              <div className={styles.book3D}>
                {/* Back Cover */}
                <div
                  className={styles.book3DBack}
                  style={{ backgroundColor: themeColor }}
                ></div>

                {/* Pages faces */}
                <div className={styles.bookPagesTop}></div>
                <div className={styles.bookPagesRight}></div>
                <div className={styles.bookPagesBottom}></div>

                {/* Spine */}
                <div
                  className={styles.book3DSpine}
                  style={{
                    backgroundColor: getBookColorSecondary(book.settings.bookTheme)
                  }}
                ></div>

                {/* Front Cover */}
                <div
                  className={styles.book3DFront}
                  style={{
                    background: coverImage
                      ? `url(${coverImage}) center/cover`
                      : `linear-gradient(135deg, ${themeColor} 0%, ${getBookColorSecondary(book.settings.bookTheme)} 100%)`
                  }}
                >
                  <div className={styles.bookTexture}></div>
                  <div className={styles.book3DFrontContent}>
                    {!coverImage && (
                      <>
                        <span className={styles.book3DEmoji}>
                          {getBookEmoji(book.settings.bookType)}
                        </span>
                        <span className={styles.book3DTitle}>
                          {book.settings.title}
                        </span>
                      </>
                    )}
                    <div className={styles.bookCoverOverlay}></div>
                  </div>
                </div>
              </div>
              <div className={styles.book3DShadow}></div>

              {/* Status Badge */}
              <div className={`${styles.statusBadge} ${styles[`statusBadge_${displayState}`] || ''}`}>
                {STATUS_BADGE_ICONS[displayState] && (
                  <span className={`material-symbols-outlined ${styles.badgeIcon}`}>
                    {STATUS_BADGE_ICONS[displayState]}
                  </span>
                )}
                {t(`status.${displayState}`, displayState)}
              </div>

              {/* Progress Bar for Draft */}
              {displayState === 'draft' && (
                <div className={styles.progressBarContainer}>
                  <div
                    className={`${styles.progressBar} ${styles.progressBar_draft}`}
                    style={{ width: `${getDraftProgress(book)}%` }}
                  />
                </div>
              )}
            </div>

            {/* Meta (Below Book) */}
            <div className={styles.bookMeta}>
              <h4 className={styles.metaTitle}>{book.settings.title || t('bookCard.untitled', 'Untitled Story')}</h4>

              {/* Status-specific CTA / info */}
              <div className={styles.bookCta}>
                {displayState === 'ready' && (
                  <button
                    className={styles.ctaOrderPrint}
                    onClick={(e) => { e.stopPropagation(); router.push(`/create/${book.id}/order`); }}
                  >
                    {t('cta.orderPrint', 'Order Print')}
                  </button>
                )}

                {displayState === 'preview' && (
                  <button
                    className={styles.ctaUnlock}
                    onClick={(e) => { e.stopPropagation(); router.push(`/book/${book.id}`); }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>lock</span>
                    {t('cta.unlockFullBook', 'Unlock Full Book')}
                  </button>
                )}

                {displayState === 'ordered' && (
                  <span className={styles.ctaDeliveryDate}>
                    {orderInfo?.estimatedDelivery
                      ? t('cta.arriving', { dateRange: orderInfo.estimatedDelivery, defaultValue: `Arriving ${orderInfo.estimatedDelivery}` })
                      : t('cta.orderProcessing', 'Processing order...')}
                  </span>
                )}

                {displayState === 'delivered' && (
                  <button
                    className={styles.ctaReorder}
                    onClick={(e) => { e.stopPropagation(); router.push(`/create/${book.id}/order`); }}
                  >
                    {t('cta.orderAnother', 'Order Another')} &rarr;
                  </button>
                )}

                {displayState === 'draft' && (
                  <span className={styles.ctaDraftInfo}>
                    {t('progress.stepOf', { current: getDraftStep(book), total: 5, defaultValue: `Step ${getDraftStep(book)} of 5` })}
                  </span>
                )}
              </div>

              <div className={styles.metaActions}>
                {onDeleteBook && (
                  <button
                    className={styles.deleteBtn}
                    onClick={(e) => onDeleteBook(book.id, e)}
                    title="Delete book"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Add New Book Card */}
      {showAddNew && (
        <div
          className={styles.addNewCard}
          onClick={handleCreateNew}
        >
          <div className={styles.addNewContent}>
            <span className={styles.plusIcon}>+</span>
            <span className={styles.addNewText}>Create New Book</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions
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
    board: '\uD83D\uDCD8',
    picture: '\uD83C\uDFA8',
    story: '\uD83D\uDCD6',
    alphabet: '\uD83D\uDD24'
  };
  return emojis[type] || '\uD83D\uDCDA';
}

function getBookCoverImage(book: Book) {
  const coverPage = book.pages[0];
  if (!coverPage) return null;

  if (coverPage.imageElements && coverPage.imageElements.length > 0 && coverPage.imageElements[0].src) {
    return coverPage.imageElements[0].src;
  }
  // @ts-expect-error - Backend sometimes sends snake_case
  if (coverPage.backgroundImage || coverPage.background_image) {
    // @ts-expect-error - Backend sometimes sends snake_case
    return coverPage.backgroundImage || coverPage.background_image;
  }
  return null;
}

function getDraftProgress(book: Book): number {
  let filled = 0;
  const s = book.settings;
  if (s.childName) filled++;
  if (s.bookTheme) filled++;
  if (s.printFormat) filled++;
  if (s.artStyle) filled++;
  if (s.storyDescription) filled++;
  return Math.round((filled / 5) * 100);
}

function getDraftStep(book: Book): number {
  const s = book.settings;
  if (s.storyDescription) return 5;
  if (s.artStyle) return 4;
  if (s.printFormat) return 3;
  if (s.bookTheme) return 2;
  if (s.childName) return 1;
  return 1;
}
