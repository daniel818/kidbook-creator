'use client';

import { useRef, useEffect } from 'react';
import styles from './TagFilter.module.css';

interface TagOption {
  key: string;
  label: string;
  icon?: string;
}

interface TagFilterProps {
  tags: TagOption[];
  activeTag: string | null;
  onTagChange: (tag: string | null) => void;
}

export function TagFilter({ tags, activeTag, onTagChange }: TagFilterProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll active tag into view
  useEffect(() => {
    if (!scrollRef.current || !activeTag) return;
    const activeEl = scrollRef.current.querySelector(`[data-tag="${activeTag}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeTag]);

  return (
    <div className={styles.container} ref={scrollRef}>
      <button
        className={`${styles.chip} ${activeTag === null ? styles.chipActive : ''}`}
        onClick={() => onTagChange(null)}
        data-tag="all"
      >
        All
      </button>
      {tags.map((tag) => (
        <button
          key={tag.key}
          className={`${styles.chip} ${activeTag === tag.key ? styles.chipActive : ''}`}
          onClick={() => onTagChange(tag.key === activeTag ? null : tag.key)}
          data-tag={tag.key}
        >
          {tag.icon && <span className={styles.chipIcon}>{tag.icon}</span>}
          {tag.label}
        </button>
      ))}
    </div>
  );
}
