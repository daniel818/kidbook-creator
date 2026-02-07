// This is a nested layout - it should NOT render html/body tags
// The root layout (app/layout.tsx) handles that
import { use } from 'react';
import LocaleSync from './LocaleSync';

export default function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = use(params);
  return (
    <>
      <LocaleSync locale={locale} />
      {children}
    </>
  );
}
