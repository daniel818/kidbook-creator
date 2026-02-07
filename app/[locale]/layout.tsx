// This is a nested layout - it should NOT render html/body tags
// The root layout (app/layout.tsx) handles that
import LocaleSync from './LocaleSync';

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  return (
    <>
      <LocaleSync locale={locale} />
      {children}
    </>
  );
}
