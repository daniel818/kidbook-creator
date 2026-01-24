import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import commonEN from '@/locales/en/common.json';
import commonDE from '@/locales/de/common.json';
import commonHE from '@/locales/he/common.json';
import navbarEN from '@/locales/en/navbar.json';
import navbarDE from '@/locales/de/navbar.json';
import navbarHE from '@/locales/he/navbar.json';
import homeEN from '@/locales/en/home.json';
import homeDE from '@/locales/de/home.json';
import homeHE from '@/locales/he/home.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: commonEN,
        navbar: navbarEN,
        home: homeEN,
      },
      de: {
        common: commonDE,
        navbar: navbarDE,
        home: homeDE,
      },
      he: {
        common: commonHE,
        navbar: navbarHE,
        home: homeHE,
      },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'de', 'he'],
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
