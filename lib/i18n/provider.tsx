'use client';

import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from './config';
import { getTextDirection } from './rtl';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const updateDirection = (lng: string) => {
      const dir = getTextDirection(lng);
      document.documentElement.dir = dir;
      document.documentElement.lang = lng;
    };

    updateDirection(i18n.language);

    i18n.on('languageChanged', updateDirection);

    return () => {
      i18n.off('languageChanged', updateDirection);
    };
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
