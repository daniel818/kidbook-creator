'use client';

import { StoryTemplate, CategoryInfo, getAgeLabel } from '@/lib/templates';
import styles from './LibraryBookCard.module.css';

interface LibraryBookCardProps {
  template: StoryTemplate;
  onClick: (slug: string) => void;
}

export function LibraryBookCard({ template, onClick }: LibraryBookCardProps) {
  const categoryInfo = CategoryInfo[template.category];
  const ageLabel = getAgeLabel(template.ageMin, template.ageMax);
  const [colorStart, colorEnd] = categoryInfo?.colors || ['#6366f1', '#ec4899'];

  return (
    <div
      className={styles.card}
      onClick={() => onClick(template.slug)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick(template.slug); }}
    >
      {/* Cover */}
      <div className={styles.coverWrapper}>
        {template.coverImageUrl ? (
          <img
            src={template.coverImageUrl}
            alt={template.title}
            className={styles.coverImage}
            loading="lazy"
          />
        ) : (
          <div
            className={styles.coverFallback}
            style={{
              background: `linear-gradient(135deg, ${colorStart} 0%, ${colorEnd} 100%)`,
            }}
          >
            <span className={styles.fallbackEmoji}>
              {categoryInfo?.icon || '📖'}
            </span>
            <span className={styles.fallbackTitle}>{template.title}</span>
          </div>
        )}

        {/* Badges */}
        {(template.isNew || template.isFeatured) && (
          <div className={styles.badgeContainer}>
            {template.isNew && (
              <span className={`${styles.badge} ${styles.badgeNew}`}>New</span>
            )}
            {template.isFeatured && !template.isNew && (
              <span className={`${styles.badge} ${styles.badgePopular}`}>Popular</span>
            )}
          </div>
        )}

        {/* Hover Overlay (desktop only) */}
        <div className={styles.hoverOverlay}>
          <h3 className={styles.overlayTitle}>{template.title}</h3>
          <div className={styles.overlayMeta}>
            <span className={styles.agePill}>{ageLabel}</span>
            <span className={styles.categoryTag}>
              {categoryInfo?.icon} {categoryInfo?.label}
            </span>
          </div>
          <span className={styles.overlayCta}>Create This Story →</span>
        </div>
      </div>

      {/* Info below card (always visible on mobile) */}
      <div className={styles.info}>
        <h3 className={styles.infoTitle}>{template.title}</h3>
        <div className={styles.infoMeta}>
          <span className={styles.agePillSmall}>{ageLabel}</span>
          <span className={styles.categorySmall}>{categoryInfo?.icon} {categoryInfo?.label}</span>
        </div>
      </div>
    </div>
  );
}
