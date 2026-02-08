'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthProvider } from "@/lib/auth/AuthContext";
import { I18nProvider } from "@/lib/i18n/provider";
import { useAnalyticsInit, useIdentify } from "@/lib/analytics";
import "./globals.css";
import "./rtl.css";

// Component to initialize analytics and identify users
function AnalyticsController() {
  useAnalyticsInit();
  useIdentify();
  return null;
}

// Component to handle RTL/LTR direction changes
function DirectionController() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const locale = i18n.language || 'en';
    const dir = locale === 'he' ? 'rtl' : 'ltr';
    const lang = locale;

    // Update html attributes
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang);
  }, [i18n.language]);

  return null;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#6366f1" />
        <link rel="icon" href="/media/newlogo.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <title>KidBook Creator - Create Personalized Children's Books</title>
        <meta name="description" content="Design and order beautiful custom children's books. Upload images, write stories, and create magical personalized books for kids of all ages." />
        {/* Premium Typography for Storybook Viewer */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@400;500;600;700;800&family=Outfit:wght@400;600;700;800&family=Playfair+Display:wght@600;700&family=Poppins:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@100..700,0..1&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning>
        <I18nProvider>
          <AuthProvider>
            <AnalyticsController />
            <DirectionController />
            {children}
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
