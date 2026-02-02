'use client';

import { useState, useEffect, useRef } from 'react';
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
  const { user, isLoading, signOut } = useAuth();
  const { t } = useTranslation('navbar');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const isHome = pathname === '/';
  const isLibrary = pathname.startsWith('/mybooks') || pathname.startsWith('/book');
  const isCreate = pathname.startsWith('/create');
  const isOrders = pathname.startsWith('/orders');


  // Close more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };

    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMoreMenu]);

  // Close menu on route change
  useEffect(() => {
    setShowMoreMenu(false);
  }, [pathname]);

  const navigateAuthed = (path: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    router.push(path);
  };

  const handleSignOut = async () => {
    setShowMoreMenu(false);
    await signOut();
    router.push('/');
  };

  return (
    <>
      {/* Desktop & Mobile Top Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.navInner}>
          {/* Logo / Brand */}
          <button className={styles.navBrand} onClick={() => router.push('/')}>
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
          </button>

          {/* Spacer for desktop layout balance */}
          <div className={styles.navSpacer}></div>

          {/* Desktop Actions */}
          <div className={styles.navActions}>
            {!isLoading && (
              <button
                className={styles.createButton}
                onClick={() => router.push('/create')}
              >
                <span className={styles.createIcon}>✨</span>
                <span className={styles.createButtonText}>{t('createBook', 'Create a Book')}</span>
              </button>
            )}

            {/* Mobile Language (shown on mobile top bar) */}
            <div className={styles.languageMobile}>
              <LanguageSwitcher compact />
            </div>

            {isLoading ? (
              <div className={styles.navSkeleton}></div>
            ) : (
              <div className={styles.desktopActions}>
                {!user && (
                  <button
                    className={styles.signInButton}
                    onClick={() => setShowAuthModal(true)}
                  >
                    {t('signIn', 'Sign In')}
                  </button>
                )}
                {user && <UserNav />}
                <div className={styles.languageDesktop}>
                  <LanguageSwitcher />
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <div className={styles.mobileBar} role="navigation" aria-label="Primary">
        <button
          className={`${styles.mobileTab} ${isHome ? styles.mobileActive : ''}`}
          onClick={() => router.push('/')}
        >
          <svg className={styles.mobileIcon} viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 11.5l9-7 9 7v8a2 2 0 0 1-2 2h-4.5v-6h-5v6H5a2 2 0 0 1-2-2z" />
          </svg>
          <span className={styles.mobileLabel}>{t('home', 'Home')}</span>
          {isHome && <span className={styles.mobileDot}></span>}
        </button>

        <button
          className={`${styles.mobileTab} ${isLibrary ? styles.mobileActive : ''}`}
          onClick={() => navigateAuthed('/mybooks')}
        >
          <svg className={styles.mobileIcon} viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 4h11a3 3 0 0 1 3 3v12a1 1 0 0 1-1 1H7a2 2 0 0 0-2 2V4z" />
            <path d="M5 20V6a2 2 0 0 0-2-2h11" />
          </svg>
          <span className={styles.mobileLabel}>{t('myBooks', 'Books')}</span>
          {isLibrary && <span className={styles.mobileDot}></span>}
        </button>

        <button
          className={`${styles.mobileTab} ${isOrders ? styles.mobileActive : ''}`}
          onClick={() => navigateAuthed('/orders')}
        >
          <svg className={styles.mobileIcon} viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 7h10l1 12H6L7 7z" />
            <path d="M9 7V5a3 3 0 0 1 6 0v2" />
          </svg>
          <span className={styles.mobileLabel}>{t('orders', 'Orders')}</span>
          {isOrders && <span className={styles.mobileDot}></span>}
        </button>

        <button
          className={`${styles.mobileTab} ${showMoreMenu ? styles.mobileActive : ''}`}
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          aria-expanded={showMoreMenu}
        >
          <svg className={styles.mobileIcon} viewBox="0 0 24 24" aria-hidden="true">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
          <span className={styles.mobileLabel}>{t('more', 'More')}</span>
        </button>
      </div>

      {/* Floating Create Button (Mobile) - Hidden when on create page */}
      {!isCreate && (
        <button
          className={styles.floatingFab}
          onClick={() => router.push('/create')}
          aria-label={t('createBook', 'Create a Book')}
        >
          <span className={styles.fabIcon}>✨</span>
          <span className={styles.fabLabel}>{t('create', 'Create')}</span>
        </button>
      )}

      {/* Bottom Sheet Menu */}
      {showMoreMenu && (
        <div className={styles.bottomSheetOverlay} onClick={() => setShowMoreMenu(false)}>
          <div
            ref={moreMenuRef}
            className={styles.bottomSheet}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.bottomSheetHandle}></div>

            {user && (
              <div className={styles.bottomSheetUser}>
                <div className={styles.bottomSheetAvatar}>
                  {user.user_metadata?.first_name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className={styles.bottomSheetUserInfo}>
                  <span className={styles.bottomSheetUserName}>
                    {user.user_metadata?.first_name || user.email?.split('@')[0]}
                  </span>
                  <span className={styles.bottomSheetUserEmail}>{user.email}</span>
                </div>
              </div>
            )}

            <nav className={styles.bottomSheetNav}>
              {!user && (
                <button
                  className={styles.bottomSheetItem}
                  onClick={() => {
                    setShowMoreMenu(false);
                    setShowAuthModal(true);
                  }}
                >
                  <svg className={styles.bottomSheetIcon} viewBox="0 0 24 24">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                  <span>{t('signIn', 'Sign In')}</span>
                </button>
              )}



              <div className={styles.bottomSheetDivider}></div>

              <div className={styles.bottomSheetItem}>
                <svg className={styles.bottomSheetIcon} viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                <span>{t('language', 'Language')}</span>
                <div className={styles.bottomSheetLanguage}>
                  <LanguageSwitcher />
                </div>
              </div>

              <button
                className={styles.bottomSheetItem}
                onClick={() => {
                  setShowMoreMenu(false);
                  router.push('/faq');
                }}
              >
                <svg className={styles.bottomSheetIcon} viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span>{t('help', 'Help & FAQ')}</span>
              </button>

              {user && (
                <>
                  <div className={styles.bottomSheetDivider}></div>
                  <button
                    className={`${styles.bottomSheetItem} ${styles.bottomSheetSignOut}`}
                    onClick={handleSignOut}
                  >
                    <svg className={styles.bottomSheetIcon} viewBox="0 0 24 24">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span>{t('signOut', 'Sign Out')}</span>
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="login"
      />
    </>
  );
}
