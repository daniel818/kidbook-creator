'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './LanguageSwitcher.module.css';

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { i18n } = useTranslation();
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

  return (
    <div
      className={`${styles.languageSwitcher} ${isOpen ? styles.open : ''} ${compact ? styles.compact : ''}`}
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
