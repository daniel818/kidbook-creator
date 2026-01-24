'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth/AuthContext';
import { Navbar } from '@/components/Navbar';
import { BookGrid } from '@/components/BookGrid';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Book } from '@/lib/types';
import styles from './profile.module.css';

interface ChildProfile {
  id: string;
  name: string;
  age: number;
  gender?: string;
  interests?: string[];
}

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useTranslation('profile');
  const { user, isLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [language, setLanguage] = useState('en');
  const [childProfiles, setChildProfiles] = useState<ChildProfile[]>([]);
  const [showAddChild, setShowAddChild] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadBooks = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/books');
      if (response.ok) {
        const data = await response.json();
        setBooks(data);
      }
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  }, [user]);

  const handleSaveProfile = () => {
    setIsEditing(false);
  };

  const handleDeleteBook = (bookId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookToDelete(bookId);
    setShowDeleteModal(true);
  };

  const confirmDeleteBook = async () => {
    if (!bookToDelete) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/books/${bookToDelete}`, { method: 'DELETE' });
      if (response.ok) {
        setBooks(books.filter(b => b.id !== bookToDelete));
      }
    } catch (error) {
      console.error('Error deleting book:', error);
    }

    setIsDeleting(false);
    setShowDeleteModal(false);
    setBookToDelete(null);
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      loadBooks();
    }
  }, [user, loadBooks]);

  useEffect(() => {
    if (user) {
      setFirstName(user.user_metadata?.first_name || '');
      setLastName(user.user_metadata?.last_name || '');
      setLanguage(user.user_metadata?.language_preference || 'en');
      // TODO: Load child profiles from database
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        {/* Profile Content */}
        <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>{t('header.title')}</h1>
          <p className={styles.subtitle}>{t('header.subtitle')}</p>
        </div>

        {/* General Information */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>👤</span>
              {t('generalInfo.title')}
            </h2>
            {!isEditing && (
              <button
                className={styles.editButton}
                onClick={() => setIsEditing(true)}
              >
                {t('generalInfo.editButton')}
              </button>
            )}
          </div>

          <div className={styles.card}>
            {isEditing ? (
              <div className={styles.form}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>{t('generalInfo.firstName')}</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder={t('generalInfo.firstNamePlaceholder')}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>{t('generalInfo.lastName')}</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder={t('generalInfo.lastNamePlaceholder')}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>{t('generalInfo.email')}</label>
                  <input
                    type="email"
                    className={styles.input}
                    value={user.email || ''}
                    disabled
                  />
                  <p className={styles.helpText}>{t('generalInfo.emailHint')}</p>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>{t('generalInfo.language')}</label>
                  <select
                    className={styles.select}
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option value="en">{t('languages.en')}</option>
                    <option value="de">{t('languages.de')}</option>
                    <option value="he">{t('languages.he')}</option>
                  </select>
                </div>

                <div className={styles.formActions}>
                  <button
                    className={styles.cancelButton}
                    onClick={() => setIsEditing(false)}
                  >
                    {t('generalInfo.cancelButton')}
                  </button>
                  <button
                    className={styles.saveButton}
                    onClick={handleSaveProfile}
                  >
                    {t('generalInfo.saveButton')}
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>{t('generalInfo.firstName')}</span>
                  <span className={styles.infoValue}>
                    {firstName && lastName ? `${firstName} ${lastName}` : t('generalInfo.notSet')}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>{t('generalInfo.email')}</span>
                  <span className={styles.infoValue}>{user.email}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>{t('generalInfo.language')}</span>
                  <span className={styles.infoValue}>
                    {t(`languages.${language}`)}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>{t('generalInfo.accountCreated')}</span>
                  <span className={styles.infoValue}>
                    {new Date(user.created_at || '').toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Child Profiles */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>👶</span>
              {t('childProfiles.title')}
            </h2>
            <button
              className={styles.addButton}
              onClick={() => setShowAddChild(true)}
            >
              {t('childProfiles.addButton')}
            </button>
          </div>

          <div className={styles.card}>
            {childProfiles.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>👶</span>
                <p className={styles.emptyText}>{t('childProfiles.emptyTitle')}</p>
                <p className={styles.emptySubtext}>{t('childProfiles.emptySubtitle')}</p>
                <button
                  className={styles.emptyButton}
                  onClick={() => setShowAddChild(true)}
                >
                  {t('childProfiles.emptyButton')}
                </button>
              </div>
            ) : (
              <div className={styles.childrenGrid}>
                {childProfiles.map((child) => (
                  <div key={child.id} className={styles.childCard}>
                    <div className={styles.childAvatar}>
                      {child.name[0].toUpperCase()}
                    </div>
                    <div className={styles.childInfo}>
                      <h3 className={styles.childName}>{child.name}</h3>
                      <p className={styles.childMeta}>{t('childProfiles.age', { age: child.age })}</p>
                    </div>
                    <div className={styles.childActions}>
                      <button className={styles.iconButton}>✏️</button>
                      <button className={styles.iconButton}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Books Created */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>📚</span>
              {t('myBooks.title')}
            </h2>
            <button
              className={styles.viewAllButton}
              onClick={() => router.push('/mybooks')}
            >
              {t('myBooks.viewAllButton')}
            </button>
          </div>

          {books.length === 0 ? (
            <div className={styles.card}>
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>📚</span>
                <p className={styles.emptyText}>{t('myBooks.emptyTitle')}</p>
                <button
                  className={styles.emptyButton}
                  onClick={() => router.push('/create')}
                >
                  {t('myBooks.emptyButton')}
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.booksSection}>
              <BookGrid 
                books={books.slice(0, 3)} 
                onDeleteBook={handleDeleteBook}
                showAddNew={false}
              />
            </div>
          )}
        </section>

        {/* Purchases */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>📦</span>
              {t('purchases.title')}
            </h2>
            <button
              className={styles.viewAllButton}
              onClick={() => router.push('/purchases')}
            >
              {t('purchases.viewAllButton')}
            </button>
          </div>

          <div className={styles.card}>
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>📦</span>
              <p className={styles.emptyText}>{t('purchases.emptyTitle')}</p>
              <p className={styles.emptySubtext}>{t('purchases.emptySubtitle')}</p>
            </div>
          </div>
        </section>

        {/* Account Settings */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>⚙️</span>
              {t('accountSettings.title')}
            </h2>
          </div>

          <div className={styles.card}>
            <div className={styles.settingsList}>
              <button className={styles.settingItem}>
                <span className={styles.settingIcon}>🔒</span>
                <div className={styles.settingContent}>
                  <span className={styles.settingLabel}>{t('accountSettings.changePassword.label')}</span>
                  <span className={styles.settingDesc}>{t('accountSettings.changePassword.description')}</span>
                </div>
                <span className={styles.settingArrow}>→</span>
              </button>

              <button className={styles.settingItem}>
                <span className={styles.settingIcon}>💳</span>
                <div className={styles.settingContent}>
                  <span className={styles.settingLabel}>{t('accountSettings.paymentMethods.label')}</span>
                  <span className={styles.settingDesc}>{t('accountSettings.paymentMethods.description')}</span>
                </div>
                <span className={styles.settingArrow}>→</span>
              </button>

              <button className={styles.settingItem}>
                <span className={styles.settingIcon}>📍</span>
                <div className={styles.settingContent}>
                  <span className={styles.settingLabel}>{t('accountSettings.shippingAddresses.label')}</span>
                  <span className={styles.settingDesc}>{t('accountSettings.shippingAddresses.description')}</span>
                </div>
                <span className={styles.settingArrow}>→</span>
              </button>

              <button className={styles.settingItem}>
                <span className={styles.settingIcon}>🔔</span>
                <div className={styles.settingContent}>
                  <span className={styles.settingLabel}>{t('accountSettings.notifications.label')}</span>
                  <span className={styles.settingDesc}>{t('accountSettings.notifications.description')}</span>
                </div>
                <span className={styles.settingArrow}>→</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteBook}
        title={t('deleteModal.title')}
        message={t('deleteModal.message')}
        confirmText={t('deleteModal.confirmText')}
        isLoading={isDeleting}
      />
      </main>
    </>
  );
}
