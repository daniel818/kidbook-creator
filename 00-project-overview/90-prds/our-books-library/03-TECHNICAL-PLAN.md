# "Our Books" Library — Technical Implementation Plan

## Overview

This document defines the phased technical implementation for the "Our Books" library page. It covers the data model, API design, component architecture, responsive strategy, and constraints. The guiding principle is **simplicity and scalability** — minimal new dependencies, reuse of existing patterns, and a clear path from v1 to future enhancements.

---

## Guiding Principles

1. **Simple stack** — Next.js pages, CSS Modules, Supabase. No new libraries unless strictly necessary.
2. **One new card component** — `LibraryBookCard` (Netflix-style) used across the entire library. Does not touch existing `BookGrid`.
3. **Supabase for everything** — `story_templates` table + Supabase Storage for cover images.
4. **Mobile-first CSS** — horizontal scroll via native `overflow-x: auto`, no JS carousel library.
5. **i18n ready** — template content supports en/de/he from day one.
6. **No premature optimization** — client-side fetch with loading skeletons. Add SSR/ISR later for SEO.

---

## Data Model

### Table: `story_templates`

```sql
CREATE TABLE story_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,

  -- Content (i18n via JSONB)
  title JSONB NOT NULL,                -- {"en": "...", "de": "...", "he": "..."}
  description JSONB,                   -- {"en": "...", "de": "...", "he": "..."}
  highlights JSONB,                    -- {"en": ["...", "..."], "de": [...], "he": [...]}

  -- Media
  cover_image_url TEXT,                -- Supabase Storage public URL
  sample_pages TEXT[] DEFAULT '{}',    -- Array of image URLs

  -- Classification
  audience TEXT NOT NULL,              -- 'baby','preschool','early_reader','older_kids','adults'
  age_min INT,                         -- e.g. 0
  age_max INT,                         -- e.g. 2
  category TEXT NOT NULL,              -- 'bedtime','adventure','fantasy','romance', etc.
  tags TEXT[] DEFAULT '{}',            -- ['bedtime','family','emotions']

  -- Book metadata
  page_count INT DEFAULT 12,
  art_style TEXT,                      -- 'watercolor','cartoon','3d_animation', etc.

  -- Curation
  popularity_score INT DEFAULT 0,      -- Admin-managed score for sorting
  is_featured BOOLEAN DEFAULT false,   -- Appears in "Popular" row
  is_new BOOLEAN DEFAULT false,        -- Shows "New" badge
  status TEXT DEFAULT 'draft',         -- 'draft','published','archived'

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_templates_audience ON story_templates(audience) WHERE status = 'published';
CREATE INDEX idx_templates_category ON story_templates(category) WHERE status = 'published';
CREATE INDEX idx_templates_popularity ON story_templates(popularity_score DESC) WHERE status = 'published';
CREATE INDEX idx_templates_slug ON story_templates(slug);

-- RLS: public read, no public write
ALTER TABLE story_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published templates"
  ON story_templates FOR SELECT
  USING (status = 'published');
```

### Storage: Cover Images

- **Bucket:** `template-covers` in Supabase Storage
- **Path pattern:** `covers/{audience}/{slug}.webp`
- **Size:** 600×900px (2:3 ratio), WebP format, ~50-100KB each
- **Public access:** Enabled via Supabase Storage public URL policy
- **Placeholder:** A default gradient cover for templates without images

### Why JSONB for i18n

Instead of a separate localization table:
- Simpler queries (no joins)
- Each template is a single row with all language variants
- Easy to extend to new languages
- Access pattern: `title->>'en'` in SQL, `template.title[locale]` in code

---

## API Design

### `GET /api/templates`

List templates with filtering, search, and pagination.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `audience` | string | — | Filter by audience segment |
| `category` | string | — | Filter by category |
| `tags` | string (comma-separated) | — | Filter by any matching tag |
| `search` | string | — | Full-text search on title/description |
| `featured` | boolean | — | Only featured templates |
| `sort` | string | `popular` | `popular`, `newest`, `age_asc`, `alpha` |
| `limit` | number | 20 | Max results per request |
| `offset` | number | 0 | Pagination offset |
| `locale` | string | `en` | Language for title/description |

**Response:**
```json
{
  "templates": [
    {
      "id": "uuid",
      "slug": "brave-little-explorer",
      "title": "The Brave Little [Name]",
      "description": "A magical story where...",
      "coverImageUrl": "https://...",
      "audience": "preschool",
      "ageMin": 3,
      "ageMax": 4,
      "category": "adventure",
      "tags": ["adventure", "emotions"],
      "pageCount": 12,
      "artStyle": "watercolor",
      "popularityScore": 85,
      "isFeatured": true,
      "isNew": false
    }
  ],
  "total": 170,
  "limit": 20,
  "offset": 0
}
```

**Implementation:**
```
app/api/templates/route.ts
```
- Uses Supabase client with `.from('story_templates')`
- Builds query dynamically from params
- Extracts localized fields: `title->>'${locale}' as title`
- No auth required

### `GET /api/templates/[slug]`

Single template detail.

**Response:** Same shape as list item, plus:
```json
{
  "highlights": ["Teaches bravery", "Beautiful watercolor illustrations"],
  "samplePages": ["https://...", "https://..."]
}
```

**Implementation:**
```
app/api/templates/[slug]/route.ts
```

### Category Rows Endpoint

Rather than a separate endpoint, the library page makes **multiple parallel calls** to `/api/templates` with different filters:

```ts
// Fetch all category rows in parallel
const [popular, bedtime, animals, ...] = await Promise.all([
  fetch('/api/templates?featured=true&limit=10'),
  fetch('/api/templates?category=bedtime&limit=10'),
  fetch('/api/templates?category=animals&limit=10'),
  // ...
]);
```

This keeps the API simple (one endpoint) and allows each row to be independently cacheable.

---

## Component Architecture

### New Components (4 total)

```
components/
  LibraryBookCard/
    LibraryBookCard.tsx          -- Netflix-style poster tile
    LibraryBookCard.module.css
    index.ts
  BookDetailModal/
    BookDetailModal.tsx           -- Template detail popup
    BookDetailModal.module.css
    index.ts
  CategoryRow/
    CategoryRow.tsx               -- Horizontal scroll row with title + "See All"
    CategoryRow.module.css
    index.ts
  TagFilter/
    TagFilter.tsx                 -- Horizontal chip/tag filter bar
    TagFilter.module.css
    index.ts
```

### Page Route

```
app/our-books/
  page.tsx                        -- Main library page
  our-books.module.css            -- Page-level styles
```

### Unchanged

```
components/BookGrid/              -- NOT MODIFIED. Stays as-is for /mybooks.
```

---

## Component Specs

### `LibraryBookCard`

**Purpose:** A single, consistent Netflix-style poster tile used everywhere in the library.

**Props:**
```ts
interface LibraryBookCardProps {
  slug: string;
  title: string;
  coverImageUrl: string | null;
  audience: string;              // For age pill label
  ageMin?: number;
  ageMax?: number;
  category: string;              // For theme icon
  tags: string[];
  isNew?: boolean;               // Shows "New" badge
  isFeatured?: boolean;          // Shows "Popular" badge
  onClick: (slug: string) => void;
}
```

**Visual Spec:**
- **Dimensions:** 2:3 aspect ratio (e.g., 200×300px desktop, scales with container)
- **Cover image:** fills card via `object-fit: cover`, rounded corners 16px
- **Fallback:** gradient background with category emoji when no cover image
- **Hover (desktop):**
  - Card scales to 1.05 with `transform: scale(1.05)`
  - Shadow lifts: `box-shadow: 0 16px 40px rgba(0,0,0,0.15)`
  - Info overlay slides up from bottom (title, age pill, theme tag)
  - Smooth transition: `transition: all 0.3s ease`
- **Mobile:** Info (title, age pill) always visible below the card (no hover dependency)
- **Badges:** "New" (green) or "Popular" (amber) pill positioned top-left corner, absolute

**CSS approach:** CSS Modules, consistent with existing codebase. Uses CSS custom properties from `globals.css`.

### `CategoryRow`

**Props:**
```ts
interface CategoryRowProps {
  title: string;                 // e.g., "✨ Popular Stories"
  templates: StoryTemplate[];
  onSeeAll: () => void;
  onCardClick: (slug: string) => void;
}
```

**Behavior:**
- Horizontal scroll container: `overflow-x: auto; scroll-snap-type: x mandatory;`
- Each card snaps: `scroll-snap-align: start;`
- Row header: title left, "See All →" link right
- CSS gap between cards: 16px
- Hide scrollbar: `-webkit-scrollbar: none`
- No JS carousel library — native CSS scroll
- Optional: left/right arrow buttons on desktop (CSS only, hide on mobile)

**Responsive:**
- Mobile: 2 cards visible, full-width scroll
- Tablet: 3-4 cards visible
- Desktop: 5+ cards visible

### `TagFilter`

**Props:**
```ts
interface TagFilterProps {
  tags: { key: string; label: string; icon?: string }[];
  activeTag: string | null;
  onTagChange: (tag: string | null) => void;
}
```

**Behavior:**
- Horizontal row of chip buttons
- "All" is the first chip (default active)
- Active chip: filled with `--color-primary`, white text
- Inactive chip: white/gray background, gray text, border
- Scrollable on mobile via `overflow-x: auto`
- Clicking a tag filters the displayed rows/grid

### `BookDetailModal`

**Props:**
```ts
interface BookDetailModalProps {
  template: StoryTemplate | null;  // null = modal closed
  onClose: () => void;
  onCreateStory: (slug: string) => void;
  relatedTemplates?: StoryTemplate[];
}
```

**Behavior:**
- Overlay backdrop (dark semi-transparent)
- Centered modal on desktop/tablet, bottom sheet on mobile
- Cover image at top (large)
- Title, age/category pills, description, highlights list
- "Create This Story" CTA button (gradient, same as app CTA)
- "You might also like" row at bottom (3 `LibraryBookCard` tiles)
- Close on backdrop click, X button, or Escape key
- Scroll lock on body when open

---

## Page Logic (`app/our-books/page.tsx`)

### State Management

```ts
// View mode
const [viewMode, setViewMode] = useState<'bookshelf' | 'grid'>('bookshelf');

// Filters
const [activeAudience, setActiveAudience] = useState<string | null>(null);
const [activeCategory, setActiveCategory] = useState<string | null>(null);
const [searchQuery, setSearchQuery] = useState('');

// Category row data
const [categoryRows, setCategoryRows] = useState<CategoryRowData[]>([]);

// Grid data (for "See All" / search)
const [gridTemplates, setGridTemplates] = useState<StoryTemplate[]>([]);
const [gridTotal, setGridTotal] = useState(0);
const [gridOffset, setGridOffset] = useState(0);

// Detail modal
const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

// Loading
const [isLoading, setIsLoading] = useState(true);
```

### View Transitions

- **Default:** `bookshelf` mode — shows category rows
- **"See All" click:** switches to `grid` mode with that category pre-filtered
- **Search input:** switches to `grid` mode with search results
- **Tag filter click:** if in `bookshelf` mode, filters which rows are visible; if in `grid` mode, filters grid results
- **"Back to Browse" button** in grid mode returns to `bookshelf`

### Data Fetching

On mount (bookshelf mode):
```ts
const ROWS = [
  { title: '✨ Popular Stories', params: 'featured=true&limit=10' },
  { title: '🌙 Bedtime Stories', params: 'category=bedtime&limit=10' },
  { title: '🦁 Animal Adventures', params: 'category=animals&limit=10' },
  // ...
];

const rowData = await Promise.all(
  ROWS.map(row => fetch(`/api/templates?${row.params}`).then(r => r.json()))
);
```

On grid mode / search:
```ts
const res = await fetch(`/api/templates?${buildQueryString(filters)}`);
```

---

## Types

Add to `lib/types.ts` (or a new `lib/templates.ts`):

```ts
export interface StoryTemplate {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverImageUrl: string | null;
  audience: 'baby' | 'preschool' | 'early_reader' | 'older_kids' | 'adults';
  ageMin: number;
  ageMax: number;
  category: string;
  tags: string[];
  pageCount: number;
  artStyle: string | null;
  popularityScore: number;
  isFeatured: boolean;
  isNew: boolean;
  highlights?: string[];
  samplePages?: string[];
}

export interface CategoryRowData {
  title: string;
  icon: string;
  filterParams: string;
  templates: StoryTemplate[];
}
```

---

## Supabase Migration

File: `supabase/migrations/YYYYMMDDHHMMSS_add_story_templates.sql`

Contains:
1. `CREATE TABLE story_templates` (full schema above)
2. Indexes
3. RLS policies
4. Seed data for P1 templates (51 rows)

Seed data will use placeholder cover images initially (gradient covers with emoji overlays). Real cover images will be uploaded to Supabase Storage as they're created.

---

## Navigation Update

Add "Our Books" link to the navbar:

- **Location:** Between existing nav items, before "Pricing"
- **Label:** "Our Books" (translatable)
- **Link:** `/our-books`
- **Style:** Same as existing nav links

---

## Implementation Phases

### Phase 1: Foundation (~2 days)

| Task | Details |
|------|---------|
| Create `story_templates` table | Supabase migration with schema, indexes, RLS |
| Seed P1 templates | 51 rows with i18n titles, placeholder covers |
| `GET /api/templates` route | List endpoint with filtering, search, pagination |
| `GET /api/templates/[slug]` route | Single template detail endpoint |
| `StoryTemplate` TypeScript type | In `lib/types.ts` or `lib/templates.ts` |

### Phase 2: Library Page (~3 days)

| Task | Details |
|------|---------|
| `LibraryBookCard` component | Netflix-style poster tile with CSS Modules |
| `CategoryRow` component | Horizontal scroll row with native CSS |
| `TagFilter` component | Chip-based filter bar |
| `app/our-books/page.tsx` | Main page with bookshelf view, search, filters |
| Page header | Gradient background, title, subtitle, search bar |
| Navbar update | Add "Our Books" link |

### Phase 3: Book Detail (~1 day)

| Task | Details |
|------|---------|
| `BookDetailModal` component | Modal overlay with template info |
| "Create This Story" CTA | Links to `/create` with template pre-filled |
| "You might also like" | Related templates row in modal |

### Phase 4: Grid View (~1 day)

| Task | Details |
|------|---------|
| Grid layout | Responsive CSS grid for filtered/search results |
| View mode toggle | Switch between bookshelf and grid |
| "Load more" pagination | Offset-based loading |
| "Back to Browse" | Return to bookshelf mode |

### Phase 5: Polish (~2 days)

| Task | Details |
|------|---------|
| Loading skeletons | Shimmer placeholders for cards and rows |
| Empty states | "No templates found" with illustration |
| Animations | Fade-in on cards, smooth view transitions |
| Responsive QA | Test on iPhone, iPad, desktop at all breakpoints |
| i18n keys | Add translation keys for en/de/he |
| Accessibility | Keyboard navigation, focus management, ARIA labels |

---

## Constraints & Simplifications (v1)

| Constraint | Rationale |
|-----------|-----------|
| No SSR/ISR | Keep it simple; add for SEO in v2 |
| No separate `/our-books/[slug]` route | Modal-only for detail; add route for SEO in v2 |
| No user reviews/ratings | Admin-curated `popularity_score` |
| No personalization/recommendations | Hand-curated category rows |
| No image generation | Cover images are pre-made assets |
| No JS carousel library | Native CSS `overflow-x: auto` + `scroll-snap` |
| No infinite scroll | "Load more" button for grid pagination |
| No analytics events (v1) | Add tracking in v2 |
| Placeholder covers for seed data | Real covers uploaded later |

---

## Future Enhancements (v2+)

- **SSR/ISR** for `/our-books` and `/our-books/[slug]` pages (SEO)
- **Analytics** — track template views, "Create" clicks, search queries
- **Admin panel** — CRUD for templates via existing admin routes
- **Smart recommendations** — "Based on your previous books" for logged-in users
- **User favorites** — save templates for later
- **Real cover images** — AI-generated or designer-created covers per template
- **Seasonal banners** — holiday/event-specific featured rows
- **A/B testing** — test different row orders and featured templates

---

## File Checklist

| File | Action | Phase |
|------|--------|-------|
| `supabase/migrations/YYYYMMDDHHMMSS_add_story_templates.sql` | Create | 1 |
| `lib/templates.ts` | Create (types) | 1 |
| `app/api/templates/route.ts` | Create | 1 |
| `app/api/templates/[slug]/route.ts` | Create | 1 |
| `components/LibraryBookCard/LibraryBookCard.tsx` | Create | 2 |
| `components/LibraryBookCard/LibraryBookCard.module.css` | Create | 2 |
| `components/LibraryBookCard/index.ts` | Create | 2 |
| `components/CategoryRow/CategoryRow.tsx` | Create | 2 |
| `components/CategoryRow/CategoryRow.module.css` | Create | 2 |
| `components/CategoryRow/index.ts` | Create | 2 |
| `components/TagFilter/TagFilter.tsx` | Create | 2 |
| `components/TagFilter/TagFilter.module.css` | Create | 2 |
| `components/TagFilter/index.ts` | Create | 2 |
| `app/our-books/page.tsx` | Create | 2 |
| `app/our-books/our-books.module.css` | Create | 2 |
| `components/BookDetailModal/BookDetailModal.tsx` | Create | 3 |
| `components/BookDetailModal/BookDetailModal.module.css` | Create | 3 |
| `components/BookDetailModal/index.ts` | Create | 3 |
| Navbar component (existing) | Modify — add link | 2 |
| `lib/types.ts` or `lib/templates.ts` | Modify — add types | 1 |

---

## Dependencies

**No new npm packages required.** The implementation uses:
- Next.js App Router (existing)
- Supabase JS client (existing)
- CSS Modules (existing)
- CSS scroll-snap (native browser)
- next-intl or equivalent (existing i18n setup)

---

## References

- Executive Summary: `90-prds/our-books-library/01-EXECUTIVE-SUMMARY.md`
- Book Catalog: `90-prds/our-books-library/02-BOOK-CATALOG.md`
- Database Migration Guide: `.agent/workflows/database-migration.md`
- Existing schema: `supabase/schema.sql`
