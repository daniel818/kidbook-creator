'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './PricingFAQ.module.css';

interface FAQItem {
  question: string;
  answer: string;
}

export function PricingFAQ() {
  const { t } = useTranslation('pricing');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqItems: FAQItem[] = [
    { question: t('faq.q1'), answer: t('faq.a1') },
    { question: t('faq.q2'), answer: t('faq.a2') },
    { question: t('faq.q3'), answer: t('faq.a3') },
    { question: t('faq.q4'), answer: t('faq.a4') },
    { question: t('faq.q5'), answer: t('faq.a5') },
  ];

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className={styles.faq}>
      <h2 className={styles.title}>{t('faq.title')}</h2>
      <div className={styles.items}>
        {faqItems.map((item, index) => (
          <div key={index} className={styles.item}>
            <button
              className={`${styles.question} ${openIndex === index ? styles.open : ''}`}
              onClick={() => toggleItem(index)}
              aria-expanded={openIndex === index}
            >
              <span className={styles.questionText}>{item.question}</span>
              <span className={styles.icon}>
                {openIndex === index ? '−' : '+'}
              </span>
            </button>
            <div
              className={`${styles.answer} ${openIndex === index ? styles.visible : ''}`}
              aria-hidden={openIndex !== index}
            >
              <p className={styles.answerText}>{item.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
