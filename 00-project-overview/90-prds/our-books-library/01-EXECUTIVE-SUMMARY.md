# "Our Books" Library — Executive Summary

## Overview

The "Our Books" library is a public-facing inspiration catalog where visitors browse curated story templates and launch personalized book creation. It serves as the primary discovery surface for KidBook Creator's growing library of 200+ templates spanning children's books (ages 0–12) and a new adult line (romance, family, humor).

**Goal:** Convert casual visitors into book creators by showcasing the breadth and quality of our templates in an engaging, browsable experience.

**URL:** `/our-books` (public, no auth required)

---

## Strategic Context

### Why Now
- The current app only surfaces books a user has already created (`/mybooks`). There is no way to discover what's possible before entering the creation flow.
- Competitors (Wonderbly, Hooray Heroes, Magical Children's Book) all feature prominent catalogs that serve as both inspiration and SEO surfaces.
- Adding an adult book line (couples, parents, grandparents, humor) expands our addressable market beyond parents of young children.

### Target Personas
| Persona | Use Case |
|---------|----------|
| **Sarah (Engaged Parent, 28-42)** | Browsing bedtime stories for her 4-year-old, wants to see examples before committing |
| **Helga (Grandparent Gifter, 55-75)** | Looking for a "World's Best Grandma" book to gift, needs clear age/theme guidance |
| **Yael (Israeli Tech-Savvy Parent)** | Searching for Hebrew-compatible templates, wants quick filtering by age |
| **Adult Gifters (NEW)** | Couples seeking anniversary/love books, friends looking for funny retirement gifts |

---

## UX Approach: Hybrid Bookshelf

### Default View — "Magical Bookshelf" (Netflix-style)
Horizontal category rows with smooth scrolling. Each row represents a curated category (e.g., "Popular Stories", "Bedtime", "For Adults", "Holidays"). Users scroll horizontally within rows and vertically across categories.

- **Discovery-first:** Encourages serendipitous browsing (parents don't always know what they want)
- **Playful & magical:** Aligns with brand personality — warm, inviting, exploratory
- **Mobile-native:** Horizontal swipe is natural on touch devices
- **Scales to 200+ books** without overwhelming the user

### "See All" / Active Filter — Grid View
When a user taps "See All" on a category row or activates search/tag filters, the view transitions to a filterable grid showing all matching results.

- **Goal-oriented:** Serves users who know what they want ("bedtime story for age 3")
- **Shows more at a glance:** 3-4 column grid on desktop
- **Load more** pagination (not infinite scroll)

### Book Detail — Modal Overlay
Clicking any book tile opens a modal with cover image, description, highlights, and a prominent "Create This Story" CTA. The modal works on both views, keeping the user in context.

---

## Design Decisions

### One Consistent Library Tile: `LibraryBookCard`
A **new Netflix/streaming-style poster card** designed specifically for the library:

- **Poster format** — tall rectangle (2:3 aspect ratio), cover image fills the card
- **Rounded corners** (16px) matching the existing design system
- **Hover/tap effect** — subtle scale-up + shadow lift, info overlay slides up revealing title, age pill, theme tag, and "Create" mini-CTA
- **Mobile** — info is always visible below the card (no hover dependency)
- **Badges** — optional "New" or "Popular" pill in top corner

This is a **separate component** from the existing `BookGrid` 3D cards used on `/mybooks`. The existing page is not modified.

### Design System Alignment

| Element | Value | Source |
|---------|-------|--------|
| **Primary color** | `#6366f1` (Indigo) | `globals.css` |
| **Secondary color** | `#f472b6` (Pink) | `globals.css` |
| **Accent color** | `#fbbf24` (Amber) | `globals.css` |
| **Display font** | Outfit | `globals.css` |
| **Body font** | Inter | `globals.css` |
| **Border radius (cards)** | 16px | Brand guidelines |
| **Max container width** | 1400px | Existing layout |
| **CTA gradient** | `--gradient-primary` (Indigo → Pink) | `globals.css` |
| **Breakpoints** | 1024px / 768px / 480px | Existing responsive |

### Page Header
Soft purple gradient background with:
- Page title: "Discover Your Next Story" (Outfit, bold)
- Subtitle: "Find the perfect personalized book"
- Search bar (centered, prominent)
- Horizontal chip/tag filter row below search

### Responsive Strategy

| Viewport | Category Rows | Grid View | Book Detail |
|----------|--------------|-----------|-------------|
| **Mobile (≤480px)** | Full-width scroll, 2 visible cards | 1 column | Bottom sheet |
| **Tablet (481–1024px)** | 3-4 visible cards | 2-3 columns | Centered modal |
| **Desktop (>1024px)** | 5+ visible cards | 4 columns | Centered modal |

---

## Audience Segments

| Segment | Age | Priority | Template Count (Target) |
|---------|-----|----------|------------------------|
| Baby & Toddler | 0–2 | High | 30 |
| Preschool | 3–4 | High | 40 |
| Early Reader | 5–6 | High | 35 |
| Older Kids | 7–12 | Medium | 35 |
| Adults — Romance | Adults | Medium | 10 |
| Adults — Family | Adults | High | 10 |
| Adults — Humor | Adults | Medium | 10 |
| Adults — Milestones | Adults | Low | 10 |
| **Total** | | | **~180** |

---

## Category Rows (Default View)

Curated rows displayed in order:

1. **✨ Popular Stories** — top 10 by popularity score, mixed ages
2. **🌙 Bedtime Stories** — sleep/night themes, all ages
3. **🦁 Animal Adventures** — animal-themed stories
4. **🎒 Milestones & Firsts** — potty training, first day of school, losing a tooth
5. **🚀 Adventure & Fantasy** — space, pirates, unicorns, dragons
6. **👨‍👩‍👧 Family & Emotions** — sibling stories, feelings, family bonds
7. **📚 Learning & STEM** — alphabet, counting, science, careers
8. **🎄 Holidays & Celebrations** — birthday, Christmas, Hanukkah, Easter
9. **💕 For Adults** — romance, super parents, grandparents, humor
10. **🆕 New Arrivals** — most recently added templates

---

## Data & Backend

- **Storage:** Supabase (`story_templates` table + Supabase Storage for images)
- **Access:** Public read, admin write (RLS policy)
- **API:** Two endpoints — list with filters + single template detail
- **No auth required** for browsing
- **i18n ready:** Template titles/descriptions support en/de/he

---

## Implementation Phases

| Phase | Scope | Est. Effort |
|-------|-------|-------------|
| **1. Foundation** | DB migration, seed 20 templates, API routes | ~2 days |
| **2. Library Page** | `/our-books` route, category rows, search, tag filters | ~3 days |
| **3. Book Detail** | Modal component, "Create This Story" CTA | ~1 day |
| **4. Grid View** | "See All" grid mode, filtered results, load more | ~1 day |
| **5. Polish** | Loading skeletons, empty states, animations, responsive QA, i18n | ~2 days |
| **Total** | | **~9 days** |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| **Library page visits** | 30% of all site visitors |
| **Template click-through rate** | 15% of library visitors click a template |
| **"Create This Story" conversion** | 10% of template viewers start creation |
| **Bounce rate** | < 40% on library page |
| **Mobile usability** | No horizontal overflow, all interactions work on touch |

---

## Constraints & Out of Scope (v1)

- **No user reviews/ratings** — popularity is admin-curated
- **No personalization engine** — categories are hand-curated, not algorithmic
- **No image generation for catalog** — cover images are pre-made assets in Supabase Storage
- **No SSR** — client-side fetch with loading skeletons (can add SSR/ISR later for SEO)
- **No separate detail page** — modal only (can add `/our-books/[slug]` for SEO later)

---

## References

- Brand Guidelines: `00-project-overview/20-brand-guidelines/`
- UI/UX Guidelines: `00-project-overview/20-brand-guidelines/ui-ux-guidelines.md`
- Competitor Analysis: `00-project-overview/10-business/competitor-landscape/`
- Book Examples: `00-project-overview/50-book-examples/`
- Technical Plan: `90-prds/our-books-library/03-TECHNICAL-PLAN.md`
- Book Catalog: `90-prds/our-books-library/02-BOOK-CATALOG.md`
