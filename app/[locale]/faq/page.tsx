'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Navbar } from '@/components/Navbar';
import { FAQList } from '@/components/FAQ';
import { FAQData } from '@/lib/faq/types';

export default function FAQPage() {
  const { i18n } = useTranslation();
  const [data, setData] = useState<FAQData | null>(null);
  const locale = i18n.language || 'en';

  useEffect(() => {
    async function loadFAQData() {
      try {
        const faqData = await import(`@/locales/${locale}/faq.json`);
        setData(faqData.default);
      } catch (error) {
        // Fallback to English if locale not found
        const faqData = await import('@/locales/en/faq.json');
        setData(faqData.default);
      }
    }
    loadFAQData();
  }, [locale]);

  if (!data) {
    return (
      <>
        <Navbar />
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>Loading...</div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 'bold', 
            textAlign: 'center', 
            marginBottom: '1rem',
            color: '#111827'
          }}>
            {data.heading}
          </h1>
          
          <p style={{ 
            textAlign: 'center', 
            color: '#6b7280', 
            marginBottom: '3rem',
            fontSize: '1.125rem'
          }}>
            {data.meta.description}
          </p>

          <FAQList data={data} />
        </div>
      </main>
    </>
  );
}
