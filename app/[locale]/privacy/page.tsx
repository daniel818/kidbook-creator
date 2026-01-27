'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Navbar } from '@/components/Navbar';
import { LegalPage } from '@/components/Legal';
import { PrivacyData } from '@/lib/legal/types';

export default function PrivacyPage() {
  const { i18n } = useTranslation();
  const [data, setData] = useState<PrivacyData | null>(null);
  const locale = i18n.language || 'en';

  useEffect(() => {
    async function loadPrivacyData() {
      try {
        const privacyData = await import(`@/locales/${locale}/privacy.json`);
        setData(privacyData.default);
      } catch (error) {
        // Fallback to English if locale not found
        const privacyData = await import('@/locales/en/privacy.json');
        setData(privacyData.default);
      }
    }
    loadPrivacyData();
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
      <LegalPage data={data} type="privacy" />
    </>
  );
}
