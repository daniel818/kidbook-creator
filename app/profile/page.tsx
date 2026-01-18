'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
          <h1 className={styles.title}>My Profile</h1>
          <p className={styles.subtitle}>Manage your account settings and preferences</p>
        </div>

        {/* General Information */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>👤</span>
              General Information
            </h2>
            {!isEditing && (
              <button
                className={styles.editButton}
                onClick={() => setIsEditing(true)}
              >
                ✏️ Edit
              </button>
            )}
          </div>

          <div className={styles.card}>
            {isEditing ? (
              <div className={styles.form}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>First Name</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Last Name</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Email</label>
                  <input
                    type="email"
                    className={styles.input}
                    value={user.email || ''}
                    disabled
                  />
                  <p className={styles.helpText}>Email cannot be changed</p>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Language Preference</label>
                  <select
                    className={styles.select}
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option value="de">German (Deutsch)</option>
                    <option value="he">Hebrew (עברית)</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div className={styles.formActions}>
                  <button
                    className={styles.cancelButton}
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className={styles.saveButton}
                    onClick={handleSaveProfile}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Name</span>
                  <span className={styles.infoValue}>
                    {firstName && lastName ? `${firstName} ${lastName}` : 'Not set'}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Email</span>
                  <span className={styles.infoValue}>{user.email}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Language</span>
                  <span className={styles.infoValue}>
                    {language === 'de' ? 'German' : language === 'he' ? 'Hebrew' : 'English'}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Account Created</span>
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
              Child Profiles
            </h2>
            <button
              className={styles.addButton}
              onClick={() => setShowAddChild(true)}
            >
              + Add Child
            </button>
          </div>

          <div className={styles.card}>
            {childProfiles.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>👶</span>
                <p className={styles.emptyText}>No child profiles yet</p>
                <p className={styles.emptySubtext}>Add a child profile to create personalized stories</p>
                <button
                  className={styles.emptyButton}
                  onClick={() => setShowAddChild(true)}
                >
                  Add Your First Child
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
                      <p className={styles.childMeta}>Age {child.age}</p>
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
              My Books
            </h2>
            <button
              className={styles.viewAllButton}
              onClick={() => router.push('/mybooks')}
            >
              View All →
            </button>
          </div>

          {books.length === 0 ? (
            <div className={styles.card}>
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>📚</span>
                <p className={styles.emptyText}>Your created books will appear here</p>
                <button
                  className={styles.emptyButton}
                  onClick={() => router.push('/create')}
                >
                  Create Your First Book
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
              Recent Purchases
            </h2>
            <button
              className={styles.viewAllButton}
              onClick={() => router.push('/purchases')}
            >
              View All →
            </button>
          </div>

          <div className={styles.card}>
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>📦</span>
              <p className={styles.emptyText}>No purchases yet</p>
              <p className={styles.emptySubtext}>Order your first book to see it here</p>
            </div>
          </div>
        </section>

        {/* Account Settings */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>⚙️</span>
              Account Settings
            </h2>
          </div>

          <div className={styles.card}>
            <div className={styles.settingsList}>
              <button className={styles.settingItem}>
                <span className={styles.settingIcon}>🔒</span>
                <div className={styles.settingContent}>
                  <span className={styles.settingLabel}>Change Password</span>
                  <span className={styles.settingDesc}>Update your password</span>
                </div>
                <span className={styles.settingArrow}>→</span>
              </button>

              <button className={styles.settingItem}>
                <span className={styles.settingIcon}>💳</span>
                <div className={styles.settingContent}>
                  <span className={styles.settingLabel}>Payment Methods</span>
                  <span className={styles.settingDesc}>Manage saved cards</span>
                </div>
                <span className={styles.settingArrow}>→</span>
              </button>

              <button className={styles.settingItem}>
                <span className={styles.settingIcon}>📍</span>
                <div className={styles.settingContent}>
                  <span className={styles.settingLabel}>Shipping Addresses</span>
                  <span className={styles.settingDesc}>Manage delivery addresses</span>
                </div>
                <span className={styles.settingArrow}>→</span>
              </button>

              <button className={styles.settingItem}>
                <span className={styles.settingIcon}>🔔</span>
                <div className={styles.settingContent}>
                  <span className={styles.settingLabel}>Notifications</span>
                  <span className={styles.settingDesc}>Email and push preferences</span>
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
        title="Delete Book"
        message="Are you sure you want to delete this book? This action cannot be undone."
        confirmText="Delete"
        isLoading={isDeleting}
      />
      </main>
    </>
  );
}
