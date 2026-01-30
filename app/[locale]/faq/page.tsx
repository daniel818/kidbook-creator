'use client';

import { useTranslation } from 'react-i18next';
import { Navbar } from '@/components/Navbar';
import FAQList from '@/components/FAQ/FAQList';
import { FAQData } from '@/lib/faq/types';

export default function FAQPage() {
  const { t, ready, i18n } = useTranslation('faq');

  if (!ready) {
    return (
      <>
        <Navbar />
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>Loading...</div>
        </main>
      </>
    );
  }

  const data: FAQData = i18n.getResourceBundle(i18n.language, 'faq') as FAQData;

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
