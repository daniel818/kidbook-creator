'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './LanguageSwitcher.module.css';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'ILS'>('USD');

  useEffect(() => {
    const savedCurrency = localStorage.getItem('currency') as 'USD' | 'EUR' | 'ILS' | null;
    if (savedCurrency) {
      setCurrency(savedCurrency);
    }
  }, []);

  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'he', label: 'עברית', flag: '🇮🇱' },
  ];

  const currencies = [
    { code: 'USD', symbol: '$', label: 'USD' },
    { code: 'EUR', symbol: '€', label: 'EUR' },
    { code: 'ILS', symbol: '₪', label: 'ILS' },
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];
  const currentCurrency = currencies.find(curr => curr.code === currency) || currencies[0];

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
  };

  const handleCurrencyChange = (currencyCode: 'USD' | 'EUR' | 'ILS') => {
    setCurrency(currencyCode);
    localStorage.setItem('currency', currencyCode);
    window.dispatchEvent(new CustomEvent('currencyChange', { detail: currencyCode }));
  };

  return (
    <div className={styles.languageSwitcher}>
      <button className={styles.currentLanguage}>
        <span className={styles.flag}>{currentLanguage.flag}</span>
        <span className={styles.label}>{currentLanguage.code.toUpperCase()}</span>
        <span className={styles.separator}>|</span>
        <span className={styles.currency}>{currentCurrency.symbol}</span>
      </button>
      <div className={styles.dropdown}>
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Language</div>
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
        <div className={styles.divider}></div>
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Currency</div>
          {currencies.map((curr) => (
            <button
              key={curr.code}
              className={`${styles.languageOption} ${currency === curr.code ? styles.active : ''}`}
              onClick={() => handleCurrencyChange(curr.code as 'USD' | 'EUR' | 'ILS')}
            >
              <span className={styles.flag}>{curr.symbol}</span>
              <span className={styles.label}>{curr.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
