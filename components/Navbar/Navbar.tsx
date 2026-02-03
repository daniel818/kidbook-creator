'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth/AuthContext';
import { UserNav } from '@/components/UserNav';
import { AuthModal } from '@/components/AuthModal';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import styles from './Navbar.module.css';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isLoading, signOut } = useAuth();
  const { t, i18n } = useTranslation('navbar');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const isHome = pathname === '/';
  const isLibrary = pathname.startsWith('/mybooks') || pathname.startsWith('/book');
  const isCreate = pathname.startsWith('/create');
  const isOrders = pathname.startsWith('/orders');

  const languageOptions = [
    { code: 'en', label: 'English (EN)' },
    { code: 'de', label: 'Deutsch (DE)' },
    { code: 'he', label: 'עברית (HE)' },
  ];

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

  const handleLanguageChange = (langCode: string) => {
    if (i18n.language === langCode) return;
    i18n.changeLanguage(langCode);
    document.cookie = `NEXT_LOCALE=${langCode}; path=/; max-age=31536000`;

    if (pathname) {
      const segments = pathname.split('/');
      if (segments.length > 1 && ['en', 'de', 'he'].includes(segments[1])) {
        segments[1] = langCode;
        const basePath = segments.join('/') || '/';
        const query = searchParams?.toString();
        const hash = typeof window !== 'undefined' ? window.location.hash : '';
        const nextPath = `${basePath}${query ? `?${query}` : ''}${hash}`;
        router.push(nextPath);
      }
    }

    setShowMoreMenu(false);
  };

  const handleMenuNavigate = (path: string, requiresAuth = false) => {
    setShowMoreMenu(false);
    if (requiresAuth) {
      navigateAuthed(path);
      return;
    }
    router.push(path);
  };

  return (
    <>
      {/* Desktop & Mobile Top Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.navInner}>
          {/* Logo / Brand */}
          <button className={styles.navBrand} onClick={() => router.push('/')}>
            <div className={styles.logoWrapper}>
              <span className={`material-symbols-outlined ${styles.logoIcon}`}>auto_stories</span>
            </div>
            <span className={styles.navName}>KidBook Creator</span>
          </button>

          <div className={styles.navActions}>
            <div className={styles.navLinks}>
              <button className={styles.navLink} onClick={() => router.push('/pricing')}>
                {t('pricing', 'Pricing')}
              </button>
              <div className={styles.languageDesktop}>
                <LanguageSwitcher compact variant="navbar" />
              </div>
            </div>

            <button
              className={styles.createButton}
              onClick={() => router.push('/create')}
            >
              {t('createBook', 'Create a Book')}
            </button>

            {isLoading ? (
              <div className={styles.navSkeleton}></div>
            ) : user ? (
              <div className={styles.userSlot}>
                <UserNav />
              </div>
            ) : (
              <div className={styles.desktopActions}>
                <button
                  className={styles.loginButton}
                  onClick={() => {
                    setAuthMode('login');
                    setShowAuthModal(true);
                  }}
                >
                  {t('signIn', 'Login')}
                </button>
                <button
                  className={styles.signupButton}
                  onClick={() => {
                    setAuthMode('signup');
                    setShowAuthModal(true);
                  }}
                >
                  {t('signUp', 'Sign Up')}
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
      {!isHome && <div className={styles.navOffset} aria-hidden="true"></div>}

      <div id="stitch-mobile-ui">
        {/* Mobile Bottom Navigation Bar */}
        <div className={styles.stitchMobileBar} role="navigation" aria-label="Primary">
          <button
            className={`${styles.stitchMobileTab} ${isHome ? styles.stitchMobileActive : ''}`}
            onClick={() => router.push('/')}
          >
            <span className={`material-symbols-outlined ${styles.stitchMobileIcon}`} aria-hidden="true">home</span>
            <span className={styles.stitchMobileLabel}>{t('home', 'Home')}</span>
            {isHome && <span className={styles.stitchMobileDot}></span>}
          </button>

          <button
            className={`${styles.stitchMobileTab} ${isLibrary ? styles.stitchMobileActive : ''}`}
            onClick={() => navigateAuthed('/mybooks')}
          >
            <span className={`material-symbols-outlined ${styles.stitchMobileIcon}`} aria-hidden="true">menu_book</span>
            <span className={styles.stitchMobileLabel}>{t('myBooks', 'Books')}</span>
            {isLibrary && <span className={styles.stitchMobileDot}></span>}
          </button>

          <button
            className={`${styles.stitchMobileTab} ${isOrders ? styles.stitchMobileActive : ''}`}
            onClick={() => navigateAuthed('/orders')}
          >
            <span className={`material-symbols-outlined ${styles.stitchMobileIcon}`} aria-hidden="true">shopping_bag</span>
            <span className={styles.stitchMobileLabel}>{t('orders', 'Orders')}</span>
            {isOrders && <span className={styles.stitchMobileDot}></span>}
          </button>

          <button
            className={`${styles.stitchMobileTab} ${showMoreMenu ? styles.stitchMobileActive : ''}`}
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            aria-expanded={showMoreMenu}
          >
            <span className={`material-symbols-outlined ${styles.stitchMobileIcon}`} aria-hidden="true">grid_view</span>
            <span className={styles.stitchMobileLabel}>{t('more', 'More')}</span>
          </button>
        </div>

        {/* Floating Create Button (Mobile) - Hidden when on create page */}
        {!isCreate && (
          <button
            className={styles.stitchFloatingFab}
            onClick={() => router.push('/create')}
            aria-label={t('createBook', 'Create a Book')}
          >
            <span className={styles.stitchFabIcon} aria-hidden="true">
              <span className="material-symbols-outlined">auto_awesome</span>
            </span>
            <span className={styles.stitchFabLabel}>{t('create', 'Create')}</span>
          </button>
        )}

        {/* Bottom Sheet Menu */}
        {showMoreMenu && (
          <div className={styles.stitchSheetOverlay} onClick={() => setShowMoreMenu(false)}>
            <div
              ref={moreMenuRef}
              className={styles.stitchSheet}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.stitchSheetHandle}></div>

              {user ? (
                <div className={styles.stitchUserCard}>
                  <div className={styles.stitchUserAvatar}>
                    <span className="material-symbols-outlined">face</span>
                  </div>
                  <div className={styles.stitchUserInfo}>
                    <span className={styles.stitchUserName}>
                      {user.user_metadata?.first_name || user.email?.split('@')[0]}
                    </span>
                    <span className={styles.stitchUserEmail}>{user.email}</span>
                  </div>
                </div>
              ) : (
                <button
                  className={`${styles.stitchUserCard} ${styles.stitchUserCardButton}`}
                  onClick={() => {
                    setShowMoreMenu(false);
                    setAuthMode('login');
                    setShowAuthModal(true);
                  }}
                >
                  <div className={styles.stitchUserAvatar}>
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <div className={styles.stitchUserInfo}>
                    <span className={styles.stitchUserName}>{t('signIn', 'Sign In')}</span>
                    <span className={styles.stitchUserEmail}>{t('signInSubtitle', 'Access your books')}</span>
                  </div>
                </button>
              )}

              <div className={styles.stitchMenu}>
                <button
                  className={styles.stitchMenuItem}
                  onClick={() => handleMenuNavigate('/mybooks', true)}
                >
                  <span className={`${styles.stitchMenuIcon} ${styles.stitchMenuIconBooks}`}>
                    <span className="material-symbols-outlined">menu_book</span>
                  </span>
                  <span className={styles.stitchMenuLabel}>{t('myBooks', 'My Books')}</span>
                  <span className={`material-symbols-outlined ${styles.stitchMenuChevron}`}>chevron_right</span>
                </button>

                <button
                  className={styles.stitchMenuItem}
                  onClick={() => handleMenuNavigate('/orders', true)}
                >
                  <span className={`${styles.stitchMenuIcon} ${styles.stitchMenuIconOrders}`}>
                    <span className="material-symbols-outlined">shopping_bag</span>
                  </span>
                  <span className={styles.stitchMenuLabel}>{t('orders', 'Orders')}</span>
                  <span className={`material-symbols-outlined ${styles.stitchMenuChevron}`}>chevron_right</span>
                </button>

                <button
                  className={styles.stitchMenuItem}
                  onClick={() => handleMenuNavigate('/faq')}
                >
                  <span className={`${styles.stitchMenuIcon} ${styles.stitchMenuIconHelp}`}>
                    <span className="material-symbols-outlined">help</span>
                  </span>
                  <span className={styles.stitchMenuLabel}>{t('help', 'FAQ & Support')}</span>
                  <span className={`material-symbols-outlined ${styles.stitchMenuChevron}`}>chevron_right</span>
                </button>
              </div>

              <div className={styles.stitchLanguageWrap}>
                <div className={styles.stitchLanguagePill}>
                  {languageOptions.map((lang) => (
                    <button
                      key={lang.code}
                      className={`${styles.stitchLanguageOption} ${i18n.language === lang.code ? styles.stitchLanguageActive : ''}`}
                      onClick={() => handleLanguageChange(lang.code)}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              {user && (
                <button className={styles.stitchSignOut} onClick={handleSignOut}>
                  <span className="material-symbols-outlined">logout</span>
                  <span>{t('signOut', 'Sign Out')}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </>
  );
}
