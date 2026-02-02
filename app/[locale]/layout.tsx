// This is a nested layout - it should NOT render html/body tags
// The root layout (app/layout.tsx) handles that
import LocaleSync from './LocaleSync';

export default function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  return (
    <>
      <LocaleSync locale={params.locale} />
      {children}
    </>
  );
}
