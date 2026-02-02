'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth/AuthContext';
import styles from './UserNav.module.css';

export function UserNav() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { t } = useTranslation('navbar');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get user initials from email or name
  const getInitials = () => {
    if (!user) return '';

    // Try to get from user metadata if available
    const firstName = user.user_metadata?.first_name || '';
    const lastName = user.user_metadata?.last_name || '';

    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }

    if (firstName) {
      return firstName.substring(0, 2).toUpperCase();
    }

    // Fallback to email
    if (user.email) {
      const emailParts = user.email.split('@')[0].split('.');
      if (emailParts.length >= 2) {
        return `${emailParts[0][0]}${emailParts[1][0]}`.toUpperCase();
      }
      return user.email.substring(0, 2).toUpperCase();
    }

    return 'U';
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNavigation = (path: string) => {
    setIsOpen(false);
    router.push(path);
  };

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
    router.push('/');
  };

  if (!user) return null;

  const initials = getInitials();

  return (
    <div className={styles.userNav} ref={dropdownRef}>
      <button
        className={styles.initialsButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <span className={styles.initials}>{initials}</span>
        <span className={`material-symbols-outlined ${styles.chevron}`}>expand_more</span>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <div className={styles.userInfo}>
              <div className={styles.userInitials}>{initials}</div>
              <div className={styles.userDetails}>
                <div className={styles.userName}>
                  {user.user_metadata?.first_name || user.email?.split('@')[0]}
                </div>
                <div className={styles.userEmail}>{user.email}</div>
              </div>
            </div>
          </div>

          <div className={styles.dropdownDivider}></div>

          <nav className={styles.dropdownMenu}>
            <button
              className={styles.menuItem}
              onClick={() => handleNavigation('/mybooks')}
            >
              <span className={`${styles.iconContainer} ${styles.iconIndigo}`}>
                <span className="material-symbols-outlined">library_books</span>
              </span>
              <span className={styles.menuLabel}>{t('myBooks')}</span>
            </button>

            <button
              className={styles.menuItem}
              onClick={() => handleNavigation('/orders')}
            >
              <span className={`${styles.iconContainer} ${styles.iconAmber}`}>
                <span className="material-symbols-outlined">inventory_2</span>
              </span>
              <span className={styles.menuLabel}>{t('orders')}</span>
            </button>
          </nav>

          <div className={styles.dropdownDivider}></div>

          <button
            className={`${styles.menuItem} ${styles.signOutItem}`}
            onClick={handleSignOut}
          >
            <span className={`${styles.iconContainer} ${styles.iconRed}`}>
              <span className="material-symbols-outlined">logout</span>
            </span>
            <span className={styles.menuLabel}>{t('signOut')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
