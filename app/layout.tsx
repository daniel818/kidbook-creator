import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/lib/auth/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "KidBook Creator - Create Personalized Children's Books",
  description: "Design and order beautiful custom children's books. Upload images, write stories, and create magical personalized books for kids of all ages.",
  keywords: ["children's books", "custom books", "personalized books", "kids", "book creator", "photo books"],
  authors: [{ name: "KidBook Creator" }],
  openGraph: {
    title: "KidBook Creator - Create Personalized Children's Books",
    description: "Design and order beautiful custom children's books for your little ones.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#6366f1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
