'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { StoryTemplate, CATEGORY_ROWS, CategoryRowData, AudienceInfo, CategoryInfo } from '@/lib/templates';
import { CategoryRow } from '@/components/CategoryRow';
import { TagFilter } from '@/components/TagFilter';
import { LibraryBookCard } from '@/components/LibraryBookCard';
import { BookDetailModal } from '@/components/BookDetailModal';
import { Navbar } from '@/components/Navbar';
import styles from './our-books.module.css';

type ViewMode = 'bookshelf' | 'grid';

// Tag options for the filter bar
const AUDIENCE_TAGS = Object.entries(AudienceInfo).map(([key, info]) => ({
  key,
  label: info.ageLabel,
  icon: info.icon,
}));

const CATEGORY_TAGS = Object.entries(CategoryInfo).map(([key, info]) => ({
  key,
  label: info.label,
  icon: info.icon,
}));

const ALL_FILTER_TAGS = [...AUDIENCE_TAGS, ...CATEGORY_TAGS];

export default function OurBooksPage() {
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('bookshelf');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Bookshelf data
  const [categoryRows, setCategoryRows] = useState<CategoryRowData[]>([]);
  const [isLoadingRows, setIsLoadingRows] = useState(true);

  // Grid data
  const [gridTemplates, setGridTemplates] = useState<StoryTemplate[]>([]);
  const [gridTotal, setGridTotal] = useState(0);
  const [gridOffset, setGridOffset] = useState(0);
  const gridOffsetRef = useRef(0);
  const [isLoadingGrid, setIsLoadingGrid] = useState(false);
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Detail modal
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  // Grid "See All" context
  const [gridContext, setGridContext] = useState<string>('');

  // ---- Fetch category rows ----
  const fetchCategoryRows = useCallback(async () => {
    setIsLoadingRows(true);
    try {
      const results = await Promise.all(
        CATEGORY_ROWS.map(async (row) => {
          const res = await fetch(`/api/templates?${row.filterParams}`);
          if (!res.ok) return { ...row, templates: [] };
          const data = await res.json();
          return { ...row, templates: data.templates || [] };
        })
      );
      setCategoryRows(results.filter(r => r.templates.length > 0));
    } catch (error) {
      console.error('Error fetching category rows:', error);
    }
    setIsLoadingRows(false);
  }, []);

  // Keep ref in sync with state
  useEffect(() => { gridOffsetRef.current = gridOffset; }, [gridOffset]);

  // ---- Fetch grid templates ----
  const fetchGridTemplates = useCallback(async (append = false) => {
    setIsLoadingGrid(true);
    try {
      const currentOffset = append ? gridOffsetRef.current : 0;
      const params = new URLSearchParams();
      params.set('limit', '20');
      params.set('offset', String(currentOffset));

      // Apply active tag as filter
      if (activeTag) {
        const isAudience = Object.keys(AudienceInfo).includes(activeTag);
        if (isAudience) {
          params.set('audience', activeTag);
        } else {
          params.set('category', activeTag);
        }
      }

      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }

      const res = await fetch(`/api/templates?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();

      if (append) {
        setGridTemplates(prev => [...prev, ...(data.templates || [])]);
      } else {
        setGridTemplates(data.templates || []);
      }
      setGridTotal(data.total || 0);
      setGridOffset(currentOffset + 20);
    } catch (error) {
      console.error('Error fetching grid templates:', error);
    }
    setIsLoadingGrid(false);
  }, [activeTag, searchQuery]);

  // ---- Initial load ----
  useEffect(() => {
    fetchCategoryRows();
  }, [fetchCategoryRows]);

  // ---- Switch to grid when filter/search active (debounced for search) ----
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    if (activeTag || searchQuery.trim()) {
      const delay = searchQuery.trim() ? 400 : 0;
      searchTimerRef.current = setTimeout(() => {
        setViewMode('grid');
        setGridOffset(0);
        gridOffsetRef.current = 0;
        fetchGridTemplates(false);
      }, delay);
    } else if (viewMode === 'grid' && !gridContext) {
      setViewMode('bookshelf');
    }

    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTag, searchQuery]);

  // ---- Handlers ----
  const handleSeeAll = (rowTitle: string, filterParams: string) => {
    setGridContext(rowTitle);
    setViewMode('grid');

    // Parse filterParams to set active filter
    const params = new URLSearchParams(filterParams);
    const audience = params.get('audience');
    const category = params.get('category');
    const featured = params.get('featured');

    if (audience) {
      setActiveTag(audience);
    } else if (category) {
      setActiveTag(category);
    } else if (featured) {
      setActiveTag(null);
      // Fetch featured specifically
      setGridOffset(0);
      fetchGridFeatured();
    } else {
      setActiveTag(null);
      setGridOffset(0);
      fetchGridTemplates(false);
    }
  };

  const fetchGridFeatured = async () => {
    setIsLoadingGrid(true);
    try {
      const res = await fetch('/api/templates?featured=true&limit=50');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setGridTemplates(data.templates || []);
      setGridTotal(data.total || 0);
    } catch (error) {
      console.error('Error fetching featured:', error);
    }
    setIsLoadingGrid(false);
  };

  const handleBackToBrowse = () => {
    setViewMode('bookshelf');
    setActiveTag(null);
    setSearchQuery('');
    setGridContext('');
  };

  const handleCardClick = (slug: string) => {
    setSelectedSlug(slug);
  };

  const handleCloseModal = () => {
    setSelectedSlug(null);
  };

  const handleLoadMore = () => {
    fetchGridTemplates(true);
  };

  const handleTagChange = (tag: string | null) => {
    setActiveTag(tag);
    setGridContext('');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setViewMode('grid');
      setGridOffset(0);
      fetchGridTemplates(false);
    }
  };

  return (
    <div className={styles.page}>
      <Navbar />

      {/* ---- Header ---- */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.pageTitle}>
            Discover Your Next <span className={styles.gradientText}>Story</span>
          </h1>
          <p className={styles.pageSubtitle}>
            Find the perfect personalized book for your child — or for someone you love
          </p>

          {/* Search Bar */}
          <form className={styles.searchForm} onSubmit={handleSearchSubmit}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search by title, theme, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className={styles.searchClear}
                onClick={() => { setSearchQuery(''); setActiveTag(null); setGridContext(''); }}
              >
                ✕
              </button>
            )}
          </form>

          {/* Tag Filters */}
          <div className={styles.filterRow}>
            <TagFilter
              tags={ALL_FILTER_TAGS}
              activeTag={activeTag}
              onTagChange={handleTagChange}
            />
          </div>
        </div>
      </header>

      {/* ---- Main Content ---- */}
      <main className={styles.main}>
        {viewMode === 'bookshelf' ? (
          /* ---- Bookshelf View (Category Rows) ---- */
          <div className={styles.bookshelf}>
            {isLoadingRows ? (
              <div className={styles.loadingContainer}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className={styles.skeletonRow}>
                    <div className={styles.skeletonTitle} />
                    <div className={styles.skeletonCards}>
                      {[1, 2, 3, 4, 5].map((j) => (
                        <div key={j} className={styles.skeletonCard} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : categoryRows.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>📚</span>
                <h3>No stories available yet</h3>
                <p>Check back soon — we&apos;re adding new stories every week!</p>
              </div>
            ) : (
              categoryRows.map((row, index) => (
                <CategoryRow
                  key={row.filterParams + index}
                  title={row.title}
                  templates={row.templates}
                  onSeeAll={() => handleSeeAll(row.title, row.filterParams)}
                  onCardClick={handleCardClick}
                />
              ))
            )}
          </div>
        ) : (
          /* ---- Grid View (Filtered / See All) ---- */
          <div className={styles.gridView}>
            <div className={styles.gridHeader}>
              <button className={styles.backButton} onClick={handleBackToBrowse}>
                ← Back to Browse
              </button>
              {gridContext && (
                <h2 className={styles.gridTitle}>{gridContext}</h2>
              )}
              {gridTotal > 0 && (
                <span className={styles.resultCount}>{gridTotal} stories</span>
              )}
            </div>

            {isLoadingGrid && gridTemplates.length === 0 ? (
              <div className={styles.gridSkeleton}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className={styles.skeletonCard} />
                ))}
              </div>
            ) : gridTemplates.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>🔍</span>
                <h3>No stories found</h3>
                <p>Try a different search or filter to discover more stories.</p>
                <button className={styles.resetButton} onClick={handleBackToBrowse}>
                  Browse All Stories
                </button>
              </div>
            ) : (
              <>
                <div className={styles.grid}>
                  {gridTemplates.map((template) => (
                    <div key={template.slug} className={styles.gridCard}>
                      <LibraryBookCard
                        template={template}
                        onClick={handleCardClick}
                      />
                    </div>
                  ))}
                </div>

                {gridTemplates.length < gridTotal && (
                  <div className={styles.loadMoreContainer}>
                    <button
                      className={styles.loadMoreButton}
                      onClick={handleLoadMore}
                      disabled={isLoadingGrid}
                    >
                      {isLoadingGrid ? 'Loading...' : 'Load More Stories'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* ---- Book Detail Modal ---- */}
      <BookDetailModal
        slug={selectedSlug}
        onClose={handleCloseModal}
        onCardClick={handleCardClick}
      />
    </div>
  );
}
