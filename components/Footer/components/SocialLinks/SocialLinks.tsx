'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './SocialLinks.module.css';

const FacebookIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);



export default function SocialLinks() {
  const { t } = useTranslation('footer');

  const socialLinks = [
    {
      name: 'facebook',
      icon: FacebookIcon,
      url: '#',
      label: t('sections.social.facebook'),
    },
    {
      name: 'instagram',
      icon: InstagramIcon,
      url: '#',
      label: t('sections.social.instagram'),
    },
  ];

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>{t('sections.social.title')}</h3>
      <div className={styles.links} role="list" aria-label={t('aria.socialMedia')}>
        {socialLinks.map((social) => {
          const Icon = social.icon;
          return (
            <a
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
              aria-label={social.label}
              role="listitem"
            >
              <Icon />
            </a>
          );
        })}
      </div>
    </div>
  );
}
