'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function Footer() {
  const { t } = useTranslation();

  const quickLinks = [
    { label: t('footer.sections.quickLinks.createStory', 'Create Story'), href: '/create' },
    { label: t('footer.sections.quickLinks.community', 'Our Books'), href: null },
    { label: t('footer.sections.quickLinks.pricing', 'Pricing'), href: '/pricing' },
    { label: t('footer.sections.quickLinks.faq', 'FAQ'), href: '/faq' },
    { label: t('footer.sections.quickLinks.about', 'About Us'), href: '/about' },
  ];

  const legalLinks = [
    { label: t('footer.sections.legal.privacy', 'Privacy Policy'), href: '/privacy' },
    { label: t('footer.sections.legal.terms', 'Terms of Service'), href: '/terms' },
    { label: t('footer.sections.legal.cookies', 'Cookie Policy'), href: '/privacy' },
    { label: t('footer.sections.legal.refunds', 'Refund Policy'), href: '/terms' },
    { label: t('footer.sections.legal.shipping', 'Shipping Info'), href: '/terms' },
    { label: t('footer.sections.legal.contact', 'Contact Us'), href: '/about' },
  ];

  return (
    <footer className="bg-[#0f172a] text-white" role="contentinfo">
      {/* Links Section */}
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-3xl">
          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold mb-6">
              {t('footer.sections.quickLinks.title', 'Quick Links')}
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  {link.href ? (
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <span className="text-sm text-slate-600 cursor-default">
                      {link.label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Trust */}
          <div>
            <h3 className="text-sm font-bold mb-6">
              {t('footer.sections.legal.title', 'Legal & Trust')}
            </h3>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  {link.href ? (
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <span className="text-sm text-slate-600 cursor-default">
                      {link.label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">📚</span>
            <div>
              <span className="text-sm font-bold">KidBook Creator</span>
              <p className="text-xs text-slate-500">
                {t('footer.bottom.copyright', '© {{year}} KidBook Creator. All rights reserved.', { year: new Date().getFullYear() })}
              </p>
            </div>
          </div>
          <LanguageSwitcher variant="footer" />
        </div>
      </div>
    </footer>
  );
}
