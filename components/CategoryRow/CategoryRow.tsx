'use client';

import { StoryTemplate } from '@/lib/templates';
import { LibraryBookCard } from '@/components/LibraryBookCard';
import styles from './CategoryRow.module.css';

interface CategoryRowProps {
  title: string;
  templates: StoryTemplate[];
  onSeeAll: () => void;
  onCardClick: (slug: string) => void;
}

export function CategoryRow({ title, templates, onSeeAll, onCardClick }: CategoryRowProps) {
  if (templates.length === 0) return null;

  return (
    <section className={styles.row}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <button className={styles.seeAll} onClick={onSeeAll}>
          See All <span className={styles.arrow}>→</span>
        </button>
      </div>
      <div className={styles.scrollContainer}>
        <div className={styles.scrollTrack}>
          {templates.map((template) => (
            <div key={template.slug} className={styles.cardSlot}>
              <LibraryBookCard
                template={template}
                onClick={onCardClick}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
