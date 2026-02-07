'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { StoryTemplate, CategoryInfo, getAgeLabel } from '@/lib/templates';
import { LibraryBookCard } from '@/components/LibraryBookCard';
import styles from './BookDetailModal.module.css';

interface BookDetailModalProps {
  slug: string | null;
  onClose: () => void;
  onCardClick: (slug: string) => void;
}

export function BookDetailModal({ slug, onClose, onCardClick }: BookDetailModalProps) {
  const router = useRouter();
  const [template, setTemplate] = useState<StoryTemplate | null>(null);
  const [related, setRelated] = useState<StoryTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTemplate = useCallback(async (templateSlug: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/templates/${templateSlug}`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      setTemplate(data.template);
      setRelated(data.related || []);
    } catch (error) {
      console.error('Error fetching template detail:', error);
      setTemplate(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (slug) {
      fetchTemplate(slug);
      document.body.style.overflow = 'hidden';
    } else {
      setTemplate(null);
      setRelated([]);
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [slug, fetchTemplate]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (slug) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [slug, onClose]);

  if (!slug) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleCreateStory = () => {
    onClose();
    router.push('/create');
  };

  const categoryInfo = template ? CategoryInfo[template.category] : null;
  const ageLabel = template ? getAgeLabel(template.ageMin, template.ageMax) : '';
  const [colorStart, colorEnd] = categoryInfo?.colors || ['#6366f1', '#ec4899'];

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        {/* Close Button */}
        <button className={styles.closeButton} onClick={onClose} aria-label="Close">
          ✕
        </button>

        {isLoading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
          </div>
        ) : template ? (
          <div className={styles.content}>
            {/* Cover */}
            <div className={styles.coverSection}>
              {template.coverImageUrl ? (
                <img
                  src={template.coverImageUrl}
                  alt={template.title}
                  className={styles.coverImage}
                />
              ) : (
                <div
                  className={styles.coverFallback}
                  style={{
                    background: `linear-gradient(135deg, ${colorStart} 0%, ${colorEnd} 100%)`,
                  }}
                >
                  <span className={styles.fallbackEmoji}>{categoryInfo?.icon || '📖'}</span>
                  <span className={styles.fallbackTitle}>{template.title}</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className={styles.infoSection}>
              <h2 className={styles.templateTitle}>{template.title}</h2>

              <div className={styles.pills}>
                <span className={styles.agePill}>{ageLabel}</span>
                <span className={styles.categoryPill}>
                  {categoryInfo?.icon} {categoryInfo?.label}
                </span>
                <span className={styles.pagesPill}>{template.pageCount} pages</span>
              </div>

              {template.description && (
                <p className={styles.description}>{template.description}</p>
              )}

              {template.highlights && template.highlights.length > 0 && (
                <div className={styles.highlights}>
                  <h3 className={styles.highlightsTitle}>✨ What makes it special</h3>
                  <ul className={styles.highlightsList}>
                    {template.highlights.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CTA */}
              <button className={styles.ctaButton} onClick={handleCreateStory}>
                ✨ Create This Story
              </button>
            </div>

            {/* Related */}
            {related.length > 0 && (
              <div className={styles.relatedSection}>
                <h3 className={styles.relatedTitle}>You might also like</h3>
                <div className={styles.relatedGrid}>
                  {related.slice(0, 4).map((r) => (
                    <div key={r.slug} className={styles.relatedCard}>
                      <LibraryBookCard template={r} onClick={onCardClick} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.errorState}>
            <span className={styles.errorIcon}>😕</span>
            <p>Template not found</p>
          </div>
        )}
      </div>
    </div>
  );
}
