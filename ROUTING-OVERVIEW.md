# KidBook Creator - Routing Overview

## Current Routing Structure

The application uses a **mixed routing architecture**:
- Most pages use **standard Next.js routing** (no locale prefix)
- Only the **Pricing page** uses **locale-based routing** with i18n support

---

## Working Routes ✅

### Root Routes (No Locale Prefix)
These routes work directly without locale prefixes:

| Route | Location | Description |
|-------|----------|-------------|
| `/` | `app/page.tsx` | Homepage with hero, features, book types |
| `/create` | `app/create/page.tsx` | Book creation wizard |
| `/create/[bookId]` | `app/create/[bookId]/page.tsx` | Book editor |
| `/mybooks` | `app/mybooks/page.tsx` | User's book library |
| `/profile` | `app/profile/page.tsx` | User profile page |
| `/purchases` | `app/purchases/page.tsx` | Purchase history |
| `/orders` | `app/orders/page.tsx` | Order management |
| `/book/[bookId]` | `app/book/[bookId]/page.tsx` | Book viewer |
| `/books` | `app/books/page.tsx` | Books listing |

### Locale-Based Routes
These routes require a locale prefix and support i18n:

| Route | Location | Supported Locales |
|-------|----------|-------------------|
| `/pricing` → `/{locale}/pricing` | `app/[locale]/pricing/page.tsx` | en, de, he |

**Examples:**
- `http://localhost:3000/pricing` → redirects to `/en/pricing`
- `http://localhost:3000/en/pricing` ✅
- `http://localhost:3000/de/pricing` ✅
- `http://localhost:3000/he/pricing` ✅

### API Routes
All API routes work without locale prefixes:
- `/api/books`
- `/api/checkout`
- `/api/orders`
- `/api/admin/*`
- `/api/ai/*`
- etc.

---

## Middleware Configuration

**File:** `middleware.ts`

The middleware handles:
1. **Supabase session refresh** for all routes
2. **Locale redirection** ONLY for specific routes defined in `localeRoutes` array

```typescript
const localeRoutes = ['/pricing'];
```

**How it works:**
- If a user visits `/pricing`, middleware redirects to `/{locale}/pricing`
- Locale is determined from:
  1. `NEXT_LOCALE` cookie
  2. Browser language
  3. Default: `en`
- All other routes pass through without redirection

---

## Navigation Components

### Navbar Component
**File:** `components/Navbar/Navbar.tsx`

**Navigation Links:**
- Logo → `/` (Homepage)
- Community Books → `/community` (disabled)
- **Pricing** → `/pricing` (middleware redirects to locale version)
- FAQ → `/faq` (disabled)
- About Us → `/about` (disabled)
- Create Book button → `/create`

**Active State Logic:**
- Pricing link shows active for both `/pricing` and `/{locale}/pricing`
- Other links use exact path matching

### UserNav Component
**File:** `components/UserNav/UserNav.tsx`

**Dropdown Menu Links:**
- My Books → `/mybooks`
- Purchases → `/purchases`
- Profile → `/profile`
- Sign Out → `/` (redirects to homepage)

---

## Internationalization (i18n)

### Supported Languages
- **English (en)** - Default
- **German (de)**
- **Hebrew (he)** - RTL support

### Translation Namespaces
Located in `locales/{lang}/`:
- `common.json` - Shared UI text
- `navbar.json` - Navigation labels
- `home.json` - Homepage content
- `auth.json` - Authentication forms
- `create.json` - Book creation wizard
- `profile.json` - Profile page
- `orders.json` - Order management
- `purchases.json` - Purchase history
- `mybooks.json` - My Books page
- `viewer.json` - Book viewer
- **`pricing.json`** - Pricing page (NEW)

### i18n Provider
**File:** `lib/i18n/provider.tsx`

Wraps the app in `app/layout.tsx` to provide translation context throughout the application.

### Language Switcher
**File:** `components/LanguageSwitcher/LanguageSwitcher.tsx`

**Features:**
- Language selection (EN, DE, HE)
- **Currency selection** (USD, EUR, ILS)
- Persists to localStorage
- Dispatches custom `currencyChange` event

---

## Directory Structure

```
app/
├── [locale]/                    # Locale-based routes
│   ├── layout.tsx              # Locale-specific layout
│   ├── pricing/                # ✅ Pricing page (i18n)
│   │   ├── page.tsx
│   │   └── page.module.css
│   └── test/                   # Test page
│
├── page.tsx                    # ✅ Homepage (root)
├── create/                     # ✅ Book creation
│   ├── page.tsx               # Creation wizard
│   └── [bookId]/              # Book editor
│
├── mybooks/                    # ✅ My Books
├── profile/                    # ✅ Profile
├── purchases/                  # ✅ Purchases
├── orders/                     # ✅ Orders
├── book/[bookId]/             # ✅ Book viewer
├── books/                      # ✅ Books listing
│
├── api/                        # API routes
├── admin/                      # Admin pages
├── auth/                       # Auth pages
│
├── layout.tsx                  # Root layout
└── globals.css                 # Global styles
```

---

## Known Issues & Limitations

### ❌ Mixed Routing Architecture
The app uses two different routing patterns:
1. **Standard routes** (most pages) - no locale support
2. **Locale routes** (pricing only) - full i18n support

**Impact:**
- Only the pricing page supports multiple languages
- Other pages show in English regardless of language selection
- Language switcher changes language for pricing page only

### ⚠️ Potential Confusion
- Users might expect language switcher to affect all pages
- Clicking language switcher on non-pricing pages has no visible effect
- Currency selector only affects pricing page

---

## Future Improvements

### Option 1: Full Locale Migration (Recommended)
Move all pages to `app/[locale]/` directory for complete i18n support:

```
app/[locale]/
├── page.tsx              # Homepage
├── create/               # Book creation
├── mybooks/              # My Books
├── profile/              # Profile
├── purchases/            # Purchases
├── pricing/              # Pricing (already done)
└── ...
```

**Benefits:**
- Consistent routing
- Full i18n support across all pages
- Better SEO for international markets
- Cleaner architecture

**Effort:** High (requires moving and testing all pages)

### Option 2: Keep Mixed Architecture
Maintain current structure with clear documentation:

**Benefits:**
- No migration needed
- Works for current requirements
- Pricing page has i18n as needed

**Drawbacks:**
- Inconsistent user experience
- Limited scalability for internationalization
- Confusing for developers

---

## Testing Checklist

### ✅ Working Routes
- [x] `/` - Homepage loads
- [x] `/create` - Creation wizard loads
- [x] `/mybooks` - My Books page loads
- [x] `/profile` - Profile page loads
- [x] `/purchases` - Purchases page loads
- [x] `/pricing` - Redirects to `/en/pricing`
- [x] `/en/pricing` - English pricing page
- [x] `/de/pricing` - German pricing page
- [x] `/he/pricing` - Hebrew pricing page (RTL)

### ✅ Navigation
- [x] Logo → Homepage
- [x] Create Book button → Creation wizard
- [x] Pricing link → Pricing page (with locale)
- [x] My Books → My Books page
- [x] Profile → Profile page
- [x] Purchases → Purchases page
- [x] Sign Out → Homepage

### ✅ Language/Currency Switcher
- [x] Language selection works on pricing page
- [x] Currency selection updates pricing
- [x] Selections persist in localStorage
- [x] RTL layout works for Hebrew

---

## Developer Notes

### Adding New Locale-Based Pages

1. **Create page in `app/[locale]/`:**
   ```
   app/[locale]/new-page/page.tsx
   ```

2. **Add route to middleware:**
   ```typescript
   const localeRoutes = ['/pricing', '/new-page'];
   ```

3. **Create translations:**
   ```
   locales/en/new-page.json
   locales/de/new-page.json
   locales/he/new-page.json
   ```

4. **Register in i18n config:**
   ```typescript
   // lib/i18n/config.ts
   import newPageEN from '@/locales/en/new-page.json';
   // ... add to resources
   ```

### Adding Navigation Links

**Navbar links:**
```typescript
// components/Navbar/Navbar.tsx
const navLinks = [
  { label: t('newLink'), href: '/new-page', disabled: false },
];
```

**UserNav dropdown:**
```typescript
// components/UserNav/UserNav.tsx
<button onClick={() => handleNavigation('/new-page')}>
  New Page
</button>
```

---

## Summary

**Current State:**
- ✅ All routes working correctly
- ✅ Pricing page has full i18n support (EN, DE, HE)
- ✅ Currency selector integrated (USD, EUR, ILS)
- ✅ Navigation components updated
- ✅ Middleware properly configured
- ⚠️ Mixed routing architecture (by design)

**Recommendation:**
For a production app with international users, consider migrating all pages to locale-based routing for a consistent multilingual experience.

---

**Last Updated:** January 26, 2026  
**Version:** 1.0  
**Status:** All routes verified and working ✅
