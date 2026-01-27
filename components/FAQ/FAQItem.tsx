'use client';

import { useState } from 'react';
import { FAQ } from '@/lib/faq/types';
import { generateAnchorId } from '@/lib/faq/utils';
import styles from './FAQ.module.css';

interface FAQItemProps {
  faq: FAQ;
  isExpanded?: boolean;
  onToggle?: (faqId: string) => void;
}

export default function FAQItem({ faq, isExpanded = false, onToggle }: FAQItemProps) {
  const [expanded, setExpanded] = useState(isExpanded);

  const handleToggle = () => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    if (onToggle) {
      onToggle(faq.id);
    }
  };

  return (
    <div className={styles.faqItem} id={generateAnchorId(faq.id)}>
      <button
        className={styles.faqQuestion}
        onClick={handleToggle}
        aria-expanded={expanded}
        aria-controls={`answer-${faq.id}`}
      >
        <span className={styles.questionText}>{faq.question}</span>
        <span className={styles.icon} aria-hidden="true">
          {expanded ? '−' : '+'}
        </span>
      </button>
      
      {expanded && (
        <div
          id={`answer-${faq.id}`}
          className={styles.faqAnswer}
          dangerouslySetInnerHTML={{ __html: faq.answer }}
        />
      )}
    </div>
  );
}
