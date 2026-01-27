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

  const handleShowAll = () => {
    const allFaqIds = data.categories.flatMap(cat => 
      cat.faqs.map(faq => faq.id)
    );
    setExpandedFaqs(new Set(allFaqIds));
  };

  const handleCollapseAll = () => {
    setExpandedFaqs(new Set());
  };

  return (
    <div className={styles.faqContainer}>
      <FAQSearch 
        placeholder={data.searchPlaceholder} 
        onSearch={handleSearch} 
      />

      <div className={styles.controls}>
        <button 
          className={styles.controlButton}
          onClick={handleShowAll}
          type="button"
        >
          {data.showAll}
        </button>
        <button 
          className={styles.controlButton}
          onClick={handleCollapseAll}
          type="button"
        >
          {data.collapseAll}
        </button>
      </div>

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

      <div className={styles.contactSection}>
        <p className={styles.contactText}>{data.stillHaveQuestions}</p>
        <a href="/contact" className={styles.contactButton}>
          {data.contactSupport}
        </a>
      </div>
    </div>
  );
}
