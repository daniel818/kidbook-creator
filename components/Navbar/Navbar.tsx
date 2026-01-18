'use client';

import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { UserNav } from '@/components/UserNav';
import styles from './Navbar.module.css';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

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

      {/* Right: Create Button + User Nav */}
      <div className={styles.navActions}>
        {!isLoading && user && (
          <button
            className={styles.createButton}
            onClick={() => router.push('/create')}
          >
            <span className={styles.createIcon}>✨</span>
            <span className={styles.createButtonText}>Create Book</span>
          </button>
        )}
        
        {isLoading ? (
          <div className={styles.navSkeleton}></div>
        ) : user ? (
          <UserNav />
        ) : (
          <button
            className={styles.signInButton}
            onClick={() => router.push('/')}
          >
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
}
