'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import styles from './LanguageSwitcher.module.css';

export function LanguageSwitcher({ compact = false, variant = 'default' }: { compact?: boolean; variant?: 'default' | 'navbar' | 'footer' }) {
  return (
    <Suspense fallback={null}>
      <LanguageSwitcherInner compact={compact} variant={variant} />
    </Suspense>
  );
}

function LanguageSwitcherInner({ compact = false, variant = 'default' }: { compact?: boolean; variant?: 'default' | 'navbar' | 'footer' }) {
  const { i18n } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'he', label: 'עברית', flag: '🇮🇱' },
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    document.cookie = `NEXT_LOCALE=${langCode}; path=/; max-age=31536000`;

    if (pathname) {
      const segments = pathname.split('/');
      if (segments.length > 1 && ['en', 'de', 'he'].includes(segments[1])) {
        segments[1] = langCode;
        const basePath = segments.join('/') || '/';
        const query = searchParams?.toString();
        const hash = typeof window !== 'undefined' ? window.location.hash : '';
        const nextPath = `${basePath}${query ? `?${query}` : ''}${hash}`;
        router.push(nextPath);
      }
    }

    setIsOpen(false);
  };

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (containerRef.current.contains(event.target as Node)) return;
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  if (variant === 'footer') {
    return (
      <div className={styles.footerVariant}>
        {languages.map((lang, i) => (
          <span key={lang.code}>
            <button
              className={`${styles.footerLangBtn} ${i18n.language === lang.code ? styles.footerLangActive : ''}`}
              onClick={() => handleLanguageChange(lang.code)}
            >
              {lang.code.toUpperCase()}
            </button>
            {i < languages.length - 1 && <span className={styles.footerSep}>|</span>}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${styles.languageSwitcher} ${isOpen ? styles.open : ''} ${compact ? styles.compact : ''} ${variant === 'navbar' ? styles.navbarVariant : ''}`}
      ref={containerRef}
    >
      <button
        className={styles.currentLanguage}
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="Change language"
        aria-expanded={isOpen}
      >
        <span className={styles.flag}>{currentLanguage.flag}</span>
        <span className={styles.label}>{currentLanguage.code.toUpperCase()}</span>
        <span className={`material-symbols-outlined ${styles.caret}`}>expand_more</span>
      </button>
      <div className={styles.dropdown}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            className={`${styles.languageOption} ${i18n.language === lang.code ? styles.active : ''}`}
            onClick={() => handleLanguageChange(lang.code)}
          >
            <span className={styles.flag}>{lang.flag}</span>
            <span className={styles.label}>{lang.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
