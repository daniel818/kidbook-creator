import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enMessages from '@/locales/en.json';
import deMessages from '@/locales/de.json';
import heMessages from '@/locales/he.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: enMessages,
      de: deMessages,
      he: heMessages,
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'de', 'he'],
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['path', 'localStorage', 'navigator'],
      lookupFromPathIndex: 0,
      caches: ['localStorage'],
    } as Record<string, unknown>,
  });

export default i18n;
