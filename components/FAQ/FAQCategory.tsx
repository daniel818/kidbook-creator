'use client';

import { FAQCategory as FAQCategoryType } from '@/lib/faq/types';
import FAQItem from './FAQItem';
import styles from './FAQ.module.css';

interface FAQCategoryProps {
  category: FAQCategoryType;
  expandedFaqs: Set<string>;
  onToggleFaq: (faqId: string) => void;
}

export default function FAQCategory({ 
  category, 
  expandedFaqs, 
  onToggleFaq 
}: FAQCategoryProps) {
  if (category.faqs.length === 0) {
    return null;
  }

  return (
    <div className={styles.category}>
      <h2 className={styles.categoryTitle}>{category.title}</h2>
      <div className={styles.faqList}>
        {category.faqs.map((faq) => (
          <FAQItem
            key={faq.id}
            faq={faq}
            isExpanded={expandedFaqs.has(faq.id)}
            onToggle={onToggleFaq}
          />
        ))}
      </div>
    </div>
  );
}
