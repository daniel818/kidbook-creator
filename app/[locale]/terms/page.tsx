'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Navbar } from '@/components/Navbar';
import { LegalPage } from '@/components/Legal';
import { TermsData } from '@/lib/legal/types';

export default function TermsPage() {
  const { i18n } = useTranslation();
  const [data, setData] = useState<TermsData | null>(null);
  const locale = i18n.language || 'en';

  useEffect(() => {
    async function loadTermsData() {
      try {
        const termsData = await import(`@/locales/${locale}/terms.json`);
        setData(termsData.default);
      } catch (error) {
        // Fallback to English if locale not found
        const termsData = await import('@/locales/en/terms.json');
        setData(termsData.default);
      }
    }
    loadTermsData();
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
      <LegalPage data={data} type="terms" />
    </>
  );
}
