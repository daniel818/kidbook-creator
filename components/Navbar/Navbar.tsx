'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth/AuthContext';
import { UserNav } from '@/components/UserNav';
import { AuthModal } from '@/components/AuthModal';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import styles from './Navbar.module.css';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const { t } = useTranslation('common');
  const [showAuthModal, setShowAuthModal] = useState(false);

  const navLinks = [
    { label: 'Community Books', href: '/community', disabled: true },
    { label: 'FAQ', href: '/faq', disabled: true },
    { label: 'About Us', href: '/about', disabled: true },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <nav className={styles.navbar}>
      {/* Left: Logo */}
      <div className={styles.navBrand} onClick={() => router.push('/')}>
        <div className={styles.logoWrapper}>
          <Image 
            src="/media/logo.png" 
            alt="KidBook Creator" 
            width={32} 
            height={32}
            className={styles.logo}
          />
        </div>
        <span className={styles.navName}>KidBook Creator</span>
      </div>

      {/* Middle: Navigation Links */}
      <div className={styles.navLinks}>
        {navLinks.map((link) => (
          <button
            key={link.href}
            className={`${styles.navLink} ${isActive(link.href) ? styles.active : ''} ${link.disabled ? styles.disabled : ''}`}
            onClick={() => !link.disabled && router.push(link.href)}
            disabled={link.disabled}
          >
            {link.label}
          </button>
        ))}
      </div>

      {/* Right: Create Button + Language Switcher + User Nav */}
      <div className={styles.navActions}>
        {!isLoading && (
          <button
            className={styles.createButton}
            onClick={() => user ? router.push('/create') : setShowAuthModal(true)}
          >
            <span className={styles.createIcon}>✨</span>
            <span className={styles.createButtonText}>Create a Book</span>
          </button>
        )}
        
        <LanguageSwitcher />
        
        {isLoading ? (
          <div className={styles.navSkeleton}></div>
        ) : user ? (
          <UserNav />
        ) : (
          <button
            className={styles.signInButton}
            onClick={() => setShowAuthModal(true)}
          >
            {t('test')}
          </button>
        )}
      </div>
      
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="login"
      />
    </nav>
  );
}
