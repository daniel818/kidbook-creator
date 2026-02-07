'use client';

import { useTranslation } from 'react-i18next';
import { Navbar } from '@/components/Navbar';
import Footer from '@/components/Footer/Footer';
import FAQList from '@/components/FAQ/FAQList';
import { FAQData } from '@/lib/faq/types';

export default function FAQPage() {
  const { ready, i18n } = useTranslation('faq');

  if (!ready) {
    return (
      <>
        <Navbar />
        <main style={{ minHeight: '100vh', background: '#f8f5f7' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>
            <div style={{ textAlign: 'center', padding: '3rem 0', color: '#9c4973' }}>Loading...</div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const data = i18n.getResourceBundle(i18n.language, 'faq') as FAQData | undefined;

  if (!data) {
    return (
      <>
        <Navbar />
        <main style={{ minHeight: '100vh', background: '#f8f5f7' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>
            <div style={{ textAlign: 'center', padding: '3rem 0', color: '#9c4973' }}>Error loading FAQ data</div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', background: '#f8f5f7' }}>
        {/* Hero */}
        <div style={{
          background: 'linear-gradient(135deg, #fdf2f8 0%, #ede9fe 50%, #e0e7ff 100%)',
          padding: '100px 1rem 60px',
          textAlign: 'center',
        }}>
          <h1 style={{
            fontSize: 'clamp(2rem, 4vw, 2.75rem)',
            fontWeight: 800,
            color: '#1c0d14',
            margin: '0 0 0.75rem',
          }}>
            {data.heading}
          </h1>

          <p style={{
            color: '#9c4973',
            fontSize: '1.125rem',
            margin: '0 auto',
            maxWidth: '600px',
            lineHeight: 1.6,
          }}>
            {data.meta.description}
          </p>
        </div>

        <FAQList data={data} />
      </main>
      <Footer />
    </>
  );
}
