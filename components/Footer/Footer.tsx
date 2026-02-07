'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function Footer() {
  const { t } = useTranslation('footer');

  const links = [
    { label: t('sections.quickLinks.about', 'About Us'), href: '/about' },
    { label: t('sections.quickLinks.faq', 'FAQ'), href: '/faq' },
    { label: t('sections.legal.privacy', 'Privacy'), href: '/privacy' },
    { label: t('sections.legal.terms', 'Terms'), href: '/terms' },
  ];

  return (
    <footer className="bg-white border-t border-indigo-100 py-12 px-6" role="contentinfo">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="bg-[#f4258c]/20 p-1.5 rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-[#f4258c] text-xl font-bold">auto_stories</span>
          </div>
          <span className="text-lg font-extrabold tracking-tight text-[#1c0d14]">KidBook Creator</span>
        </div>

        {/* Nav Links */}
        <nav className="flex items-center gap-8 text-sm font-medium text-slate-500">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-[#f4258c] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right: Language Switcher + Copyright */}
        <div className="flex items-center gap-6">
          <LanguageSwitcher variant="footer" />
          <p className="text-sm text-slate-400">
            {t('bottom.copyright', '© {{year}} KidBook Creator. All rights reserved.', { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </footer>
  );
}
