'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import FooterSection from './components/FooterSection';
import NewsletterForm from './components/NewsletterForm';
import SocialLinks from './components/SocialLinks';
import FooterBottom from './components/FooterBottom';
import styles from './Footer.module.css';

export default function Footer() {
  const { t } = useTranslation('footer');

  const handleComingSoon = (e: React.MouseEvent<HTMLAnchorElement>, pageName: string) => {
    e.preventDefault();
    alert(`${pageName} - Coming Soon!\n\nThis page is currently under development and will be available soon.`);
  };

  return (
    <footer className={styles.footer} role="contentinfo">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'KidBook Creator',
            url: 'https://kidbookcreator.com',
            logo: 'https://kidbookcreator.com/logo.png',
            sameAs: [
              'https://facebook.com/kidbookcreator',
              'https://instagram.com/kidbookcreator',
              'https://pinterest.com/kidbookcreator',
            ],
            contactPoint: {
              '@type': 'ContactPoint',
              contactType: 'Customer Service',
              email: 'support@kidbookcreator.com',
              availableLanguage: ['English', 'German', 'Hebrew'],
            },
          }),
        }}
      />

      <div className={styles.container}>
        <nav className={styles.grid} aria-label={t('aria.footerNavigation')}>
          <FooterSection title={t('sections.quickLinks.title')}>
            <Link href="/mybooks">{t('sections.quickLinks.myBooks')}</Link>
            <Link href="/create">{t('sections.quickLinks.createStory')}</Link>
            <Link href="/community" onClick={(e) => handleComingSoon(e, 'Community Books')}>{t('sections.quickLinks.community')}</Link>
            <Link href="/pricing">{t('sections.quickLinks.pricing')}</Link>
            <Link href="/faq">{t('sections.quickLinks.faq')}</Link>
            <Link href="/about">{t('sections.quickLinks.about')}</Link>
          </FooterSection>

          <FooterSection title={t('sections.resources.title')}>
            <Link href="/how-it-works" onClick={(e) => handleComingSoon(e, 'How It Works')}>{t('sections.resources.howItWorks')}</Link>
            <Link href="/samples" onClick={(e) => handleComingSoon(e, 'Sample Stories')}>{t('sections.resources.samples')}</Link>
            <Link href="/art-styles" onClick={(e) => handleComingSoon(e, 'Art Styles')}>{t('sections.resources.artStyles')}</Link>
            <Link href="/age-groups" onClick={(e) => handleComingSoon(e, 'Age Groups')}>{t('sections.resources.ageGroups')}</Link>
          </FooterSection>

          <FooterSection title={t('sections.legal.title')}>
            <Link href="/privacy">{t('sections.legal.privacy')}</Link>
            <Link href="/terms">{t('sections.legal.terms')}</Link>
            <Link href="/cookies" onClick={(e) => handleComingSoon(e, 'Cookie Policy')}>{t('sections.legal.cookies')}</Link>
            <Link href="/refunds" onClick={(e) => handleComingSoon(e, 'Refund Policy')}>{t('sections.legal.refunds')}</Link>
            <Link href="/shipping" onClick={(e) => handleComingSoon(e, 'Shipping Info')}>{t('sections.legal.shipping')}</Link>
            <Link href="/contact" onClick={(e) => handleComingSoon(e, 'Contact Us')}>{t('sections.legal.contact')}</Link>
          </FooterSection>

          <div className={styles.newsletterSection}>
            <NewsletterForm />
            <SocialLinks />
          </div>
        </nav>

        <FooterBottom />
      </div>
    </footer>
  );
}
