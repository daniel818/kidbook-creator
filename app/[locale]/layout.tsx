// This is a nested layout - it should NOT render html/body tags
// The root layout (app/layout.tsx) handles that
export default function LocaleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
