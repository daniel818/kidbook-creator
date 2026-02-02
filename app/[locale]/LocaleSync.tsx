'use client';

import { useEffect } from 'react';
import i18n from '@/lib/i18n/config';

const supportedLocales = ['en', 'de', 'he'] as const;

type SupportedLocale = typeof supportedLocales[number];

export default function LocaleSync({ locale }: { locale: string }) {
  useEffect(() => {
    if (!supportedLocales.includes(locale as SupportedLocale)) {
      return;
    }

    if (i18n.language !== locale) {
      i18n.changeLanguage(locale);
    }

    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`;
  }, [locale]);

  return null;
}
