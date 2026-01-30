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
import authEN from '@/locales/en/auth.json';
import authDE from '@/locales/de/auth.json';
import authHE from '@/locales/he/auth.json';
import createEN from '@/locales/en/create.json';
import createDE from '@/locales/de/create.json';
import createHE from '@/locales/he/create.json';
import profileEN from '@/locales/en/profile.json';
import profileDE from '@/locales/de/profile.json';
import profileHE from '@/locales/he/profile.json';
import ordersEN from '@/locales/en/orders.json';
import ordersDE from '@/locales/de/orders.json';
import ordersHE from '@/locales/he/orders.json';
import mybooksEN from '@/locales/en/mybooks.json';
import mybooksDE from '@/locales/de/mybooks.json';
import mybooksHE from '@/locales/he/mybooks.json';
import viewerEN from '@/locales/en/viewer.json';
import viewerDE from '@/locales/de/viewer.json';
import viewerHE from '@/locales/he/viewer.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: commonEN,
        navbar: navbarEN,
        home: homeEN,
        auth: authEN,
        create: createEN,
        profile: profileEN,
        orders: ordersEN,
        mybooks: mybooksEN,
        viewer: viewerEN,
      },
      de: {
        common: commonDE,
        navbar: navbarDE,
        home: homeDE,
        auth: authDE,
        create: createDE,
        profile: profileDE,
        orders: ordersDE,
        mybooks: mybooksDE,
        viewer: viewerDE,
      },
      he: {
        common: commonHE,
        navbar: navbarHE,
        home: homeHE,
        auth: authHE,
        create: createHE,
        profile: profileHE,
        orders: ordersHE,
        mybooks: mybooksHE,
        viewer: viewerHE,
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
