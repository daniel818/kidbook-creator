'use client';

import { useState, useCallback } from 'react';
import { FAQData } from '@/lib/faq/types';
import { searchFAQs } from '@/lib/faq/utils';
import FAQSearch from './FAQSearch';
import FAQCategory from './FAQCategory';
import styles from './FAQ.module.css';

interface FAQListProps {
  data: FAQData;
}

export default function FAQList({ data }: FAQListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaqs, setExpandedFaqs] = useState<Set<string>>(new Set());

  const filteredCategories = searchFAQs(data.categories, searchQuery);
  const hasResults = filteredCategories.some(cat => cat.faqs.length > 0);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleToggleFaq = useCallback((faqId: string) => {
    setExpandedFaqs(prev => {
      const next = new Set(prev);
      if (next.has(faqId)) {
        next.delete(faqId);
      } else {
        next.add(faqId);
      }
      return next;
    });
  }, []);

  return (
    <div className={styles.faqContainer}>
      <FAQSearch 
        placeholder={data.searchPlaceholder} 
        onSearch={handleSearch} 
      />

      {!hasResults && searchQuery && (
        <div className={styles.noResults}>
          <p>{data.noResults}</p>
        </div>
      )}

      {hasResults && (
        <div className={styles.categories}>
          {filteredCategories.map((category) => (
            <FAQCategory
              key={category.id}
              category={category}
              expandedFaqs={expandedFaqs}
              onToggleFaq={handleToggleFaq}
            />
          ))}
        </div>
      )}

      {/* Contact Section - duplicated from About page */}
      <section className={styles.contactSection}>
        <div className={styles.contactContainer}>
          <h2 className={styles.contactHeading}>{data.stillHaveQuestions}</h2>
          <p className={styles.contactDescription}>{data.contactDescription}</p>
          <a 
            href="mailto:support@kidbookcreator.com"
            className={styles.contactButton}
          >
            {data.contactSupport}
          </a>
        </div>
      </section>
    </div>
  );
}
