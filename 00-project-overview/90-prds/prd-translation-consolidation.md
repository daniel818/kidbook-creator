# PRD: Translation File Consolidation

## Overview

Refactor the internationalization (i18n) architecture from multiple JSON files per language (one per namespace) to a single consolidated JSON file per language with nested namespaces.

## Problem Statement

### Current State (Audited Jan 30, 2026)

**Locale Files per Language:**
| Namespace | EN | DE | HE | In i18n Config? | Load Method |
|-----------|----|----|-----|-----------------|-------------|
| common | ✅ | ✅ | ✅ | ✅ | i18next |
| navbar | ✅ | ✅ | ✅ | ✅ | i18next |
| home | ✅ | ✅ | ✅ | ✅ | i18next |
| auth | ✅ | ✅ | ✅ | ✅ | i18next |
| create | ✅ | ✅ | ✅ | ✅ | i18next |
| profile | ✅ | ✅ | ✅ | ✅ | i18next |
| orders | ✅ | ✅ | ✅ | ✅ | i18next |
| purchases | ✅ | ✅ | ✅ | ✅ | i18next |
| mybooks | ✅ | ✅ | ✅ | ✅ | i18next |
| viewer | ✅ | ✅ | ✅ | ✅ | i18next |
| pricing | ✅ | ✅ | ✅ | ✅ | i18next |
| about | ✅ | ✅ | ✅ | ✅ | i18next |
| footer | ✅ | ✅ | ✅ | ✅ | i18next |
| **faq** | ✅ | ✅ | ✅ | ❌ | **Dynamic import** |
| **terms** | ✅ | ✅ | ✅ | ❌ | **Dynamic import** |
| **privacy** | ✅ | ✅ | ✅ | ❌ | **Dynamic import** |

**Total: 16 namespaces × 3 languages = 48 files**

**Additional Issues Found:**
- Duplicate files in `en/` and `he/` folders (e.g., `auth 2.json`, `common 2.json`) - need cleanup
- FAQ, Terms, Privacy pages use `import(\`@/locales/${locale}/faq.json\`)` - **dynamic imports that bypass i18next**

### Pain Points
1. **Scalability** – Adding 5 more languages would result in 128 files
2. **Maintenance burden** – `config.ts` has 39 imports (missing 3 namespaces)
3. **Inconsistent loading** – Some pages use i18next, others use dynamic imports
4. **Duplicate files** – Bad merge left duplicate files that need cleanup

## Proposed Solution

Consolidate to **one JSON file per language** with nested namespace structure.

### Target State

```
locales/
├── en.json
├── de.json
└── he.json
```

Each file contains all namespaces as top-level keys:

```json
{
  "common": { ... },
  "navbar": { ... },
  "home": { ... },
  "auth": { ... },
  "create": { ... },
  "profile": { ... },
  "orders": { ... },
  "purchases": { ... },
  "mybooks": { ... },
  "viewer": { ... },
  "pricing": { ... },
  "about": { ... },
  "footer": { ... },
  "faq": { ... },
  "terms": { ... },
  "privacy": { ... }
}
```

### Benefits
- **3 files instead of 48** (or 8 instead of 128 with 8 languages)
- **3 imports instead of 39+** in `config.ts`
- **Adding a language = 1 file + 1 import**
- **Unified loading** – All translations through i18next
- **Simpler translator handoff** – one file per language

## Implementation Tasks

### Phase 1: Cleanup Duplicate Files

- [ ] **Task 1.1**: Delete duplicate files in `locales/en/` (files with " 2" suffix)
- [ ] **Task 1.2**: Delete duplicate files in `locales/he/` (files with " 2" suffix)

### Phase 2: Create Consolidated Files

- [ ] **Task 2.1**: Create `locales/en.json` by merging ALL 16 English namespace files
- [ ] **Task 2.2**: Create `locales/de.json` by merging ALL 16 German namespace files
- [ ] **Task 2.3**: Create `locales/he.json` by merging ALL 16 Hebrew namespace files

### Phase 3: Update i18n Configuration

- [ ] **Task 3.1**: Refactor `lib/i18n/config.ts` to:
  - Import only 3 files (one per language)
  - Include ALL 16 namespaces (add missing faq, terms, privacy)
  - Remove all individual namespace imports

### Phase 4: Update Dynamic Import Pages

These pages currently use `import(\`@/locales/${locale}/faq.json\`)` and need refactoring:

- [ ] **Task 4.1**: Refactor `app/[locale]/faq/page.tsx` to use i18next `useTranslation('faq')`
- [ ] **Task 4.2**: Refactor `app/[locale]/terms/page.tsx` to use i18next `useTranslation('terms')`
- [ ] **Task 4.3**: Refactor `app/[locale]/privacy/page.tsx` to use i18next `useTranslation('privacy')`

### Phase 5: Verify Functionality

- [ ] **Task 5.1**: Test home page translations (EN, DE, HE)
- [ ] **Task 5.2**: Test pricing page with currency display
- [ ] **Task 5.3**: Test FAQ page loads all categories
- [ ] **Task 5.4**: Test Terms page loads all sections
- [ ] **Task 5.5**: Test Privacy page loads all sections
- [ ] **Task 5.6**: Test Footer links and translations
- [ ] **Task 5.7**: Test About page
- [ ] **Task 5.8**: Test language switching on all pages
- [ ] **Task 5.9**: Verify RTL (Hebrew) layout works correctly

### Phase 6: Cleanup

- [ ] **Task 6.1**: Delete old namespace-specific JSON files from `locales/en/`
- [ ] **Task 6.2**: Delete old namespace-specific JSON files from `locales/de/`
- [ ] **Task 6.3**: Delete old namespace-specific JSON files from `locales/he/`
- [ ] **Task 6.4**: Remove empty `locales/*/` directories
- [ ] **Task 6.5**: Update `README-ADD-LANGUAGE.md` with new process

## Technical Details

### i18next Configuration Change

**Before (39 imports, missing 3 namespaces):**
```typescript
import commonEN from '@/locales/en/common.json';
import navbarEN from '@/locales/en/navbar.json';
// ... 37 more imports

resources: {
  en: {
    common: commonEN,
    navbar: navbarEN,
    // ... 11 more namespaces (missing faq, terms, privacy)
  },
  // ... de, he
}
```

**After (3 imports, all 16 namespaces):**
```typescript
import en from '@/locales/en.json';
import de from '@/locales/de.json';
import he from '@/locales/he.json';

resources: {
  en,
  de,
  he,
}
```

### Dynamic Import Pages Refactor

**Before (FAQ page):**
```typescript
const faqData = await import(`@/locales/${locale}/faq.json`);
setData(faqData.default);
```

**After:**
```typescript
const { t } = useTranslation('faq');
// Access data via t('categories'), t('heading'), etc.
```

**Note:** The FAQ, Terms, Privacy pages have complex nested structures. We may need to:
- Keep the data structure as-is in the JSON
- Access via `t('categories', { returnObjects: true })` to get arrays/objects

### Translation Access (No Change Required for Most Pages)

Components continue to use the same pattern:
```typescript
const { t } = useTranslation('home');
t('hero.title'); // Still works
```

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Bundle size increase | Negligible – total translations ~80KB per language |
| FAQ/Terms/Privacy page breakage | Careful refactor with i18next `returnObjects: true` |
| Merge conflicts in single file | Use clear namespace separation; conflicts are still scoped |
| Missing translations | Audit all 16 namespaces before consolidation |

## Success Criteria

1. All existing translations render correctly
2. FAQ, Terms, Privacy pages work with i18next
3. Language switching works without issues
4. `config.ts` reduced from ~110 lines to ~40 lines
5. File count reduced from 48+ to 3
6. No duplicate files remain
7. Adding a new language requires only 2 changes (1 file + 1 import)

## Timeline

Estimated effort: **3-4 hours** (increased due to dynamic import refactoring)

## Files Affected

### Modified
- `lib/i18n/config.ts` – Major refactor (reduce imports, add namespaces)
- `app/[locale]/faq/page.tsx` – Refactor to use i18next
- `app/[locale]/terms/page.tsx` – Refactor to use i18next
- `app/[locale]/privacy/page.tsx` – Refactor to use i18next
- `00-readmes/README-ADD-LANGUAGE.md` – Update documentation

### Created
- `locales/en.json` – Consolidated English translations
- `locales/de.json` – Consolidated German translations
- `locales/he.json` – Consolidated Hebrew translations

### Deleted
- `locales/en/*.json` – 16 files + duplicates
- `locales/de/*.json` – 16 files
- `locales/he/*.json` – 16 files + duplicates
- `locales/en/`, `locales/de/`, `locales/he/` directories
