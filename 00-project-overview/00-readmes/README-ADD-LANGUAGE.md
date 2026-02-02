# Adding a New Language

This guide explains how to add support for a new language to KidBook Creator.

---

## Prerequisites

- Basic understanding of JSON
- Familiarity with the codebase
- Access to native speaker for translations (recommended)

---

## Step-by-Step Guide

### 1. Create Translation Files

Create a new folder in `/locales` with the language code (ISO 639-1):

```bash
mkdir locales/fr  # Example: French
```

Copy all translation files from English as templates:

```bash
cp locales/en/*.json locales/fr/
```

You should now have:
```
/locales/fr
  common.json
  navbar.json
  auth.json
  home.json
  create.json
  profile.json
  orders.json
  purchases.json
  mybooks.json
  viewer.json
```

---

### 2. Translate Content

Open each JSON file and translate the values (not the keys):

**Before (English):**
```json
{
  "buttons": {
    "save": "Save",
    "cancel": "Cancel"
  }
}
```

**After (French):**
```json
{
  "buttons": {
    "save": "Enregistrer",
    "cancel": "Annuler"
  }
}
```

**Important Rules:**
- ✅ Keep the same JSON structure
- ✅ Keep all keys identical to English
- ✅ Only translate the values
- ✅ Preserve placeholders: `{{name}}`, `{{count}}`
- ✅ Maintain HTML entities if present
- ❌ Don't add or remove keys
- ❌ Don't change key names

---

### 3. Import Translation Files

Edit `/lib/i18n/config.ts` and add imports:

```typescript
// Add at the top with other imports
import commonFR from '@/locales/fr/common.json';
import navbarFR from '@/locales/fr/navbar.json';
import authFR from '@/locales/fr/auth.json';
import homeFR from '@/locales/fr/home.json';
import createFR from '@/locales/fr/create.json';
import profileFR from '@/locales/fr/profile.json';
import ordersFR from '@/locales/fr/orders.json';
import purchasesFR from '@/locales/fr/purchases.json';
import mybooksFR from '@/locales/fr/mybooks.json';
import viewerFR from '@/locales/fr/viewer.json';
```

---

### 4. Register Language in i18next

In the same file (`/lib/i18n/config.ts`), add the language to resources:

```typescript
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { /* existing */ },
      de: { /* existing */ },
      he: { /* existing */ },
      // Add new language
      fr: {
        common: commonFR,
        navbar: navbarFR,
        auth: authFR,
        home: homeFR,
        create: createFR,
        profile: profileFR,
        orders: ordersFR,
        purchases: purchasesFR,
        mybooks: mybooksFR,
        viewer: viewerFR,
      },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'de', 'he', 'fr'], // Add 'fr'
    // ... rest of config
  });
```

---

### 5. Add Language to Navbar Dropdown

Edit `/components/Navbar/Navbar.tsx` and add the new language option:

```typescript
const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'he', name: 'עברית', flag: '🇮🇱' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' }, // Add this
];
```

---

### 6. Add AI Prompts (Optional but Recommended)

If you want AI to generate book content in the new language:

Create `/lib/gemini/prompts/fr.ts`:

```typescript
export const storyPrompt = (settings: any) => `
Créez une histoire pour enfants en français...
[Translate the entire prompt to French]
`;

export const characterPrompt = (photoDescription: string) => `
Extrayez les caractéristiques physiques en français...
[Translate the entire prompt to French]
`;

export const illustrationPrompt = (text: string, characterDesc: string) => `
Créez une illustration basée sur ce texte français...
[Translate the entire prompt to French]
`;
```

Then update `/lib/gemini/client.ts` to import and use the new prompts:

```typescript
import * as frPrompts from './prompts/fr';

// In getPrompts function:
case 'fr':
  return frPrompts;
```

---

### 7. RTL Support (If Needed)

If the new language is RTL (like Arabic, Hebrew, Urdu):

**Update RTL detection in `/lib/i18n/rtl.ts`:**

```typescript
export function getTextDirection(language: string): 'ltr' | 'rtl' {
  const rtlLanguages = ['he', 'ar', 'ur', 'fa']; // Add RTL languages
  return rtlLanguages.includes(language) ? 'rtl' : 'ltr';
}
```

**Add RTL CSS overrides in component CSS files:**

```css
/* Example: /components/Navbar/Navbar.module.css */
[dir="rtl"] .navLinks {
  flex-direction: row-reverse;
}
```

---

### 8. Update Database Schema (If Needed)

If the language code needs to be stored in the database, update the constraint:

```sql
-- In supabase/migrations/
ALTER TABLE books 
DROP CONSTRAINT IF EXISTS books_language_check;

ALTER TABLE books 
ADD CONSTRAINT books_language_check 
CHECK (language IN ('en', 'de', 'he', 'fr'));
```

---

### 9. Testing Checklist

Test the new language thoroughly:

- [ ] Language appears in navbar dropdown
- [ ] Switching to new language updates all UI
- [ ] Language preference persists after reload
- [ ] All pages display correctly
- [ ] No missing translations (check console for warnings)
- [ ] Forms and buttons work correctly
- [ ] Book creation works in new language
- [ ] AI generates content in new language (if prompts added)
- [ ] RTL layout works correctly (if RTL language)

---

### 10. Commit Changes

```bash
git add locales/fr
git add lib/i18n/config.ts
git add components/Navbar/Navbar.tsx
git add lib/gemini/prompts/fr.ts  # if added
git add lib/gemini/client.ts      # if modified
git commit -m "feat: Add French language support"
```

---

## Translation Tips

### Use Native Speakers
- Always have translations reviewed by native speakers
- Cultural context matters - direct translations may not work
- Consider regional variations (e.g., European French vs Canadian French)

### Maintain Consistency
- Use consistent terminology throughout
- Create a glossary for key terms
- Keep tone and style consistent with English version

### Handle Pluralization
Different languages have different plural rules:

```json
{
  "items": "{{count}} item",
  "items_other": "{{count}} items",
  "items_few": "{{count}} items",    // Some languages need this
  "items_many": "{{count}} items"    // Some languages need this
}
```

### Consider Text Length
- Translations can be 30-50% longer than English
- Test UI with longer text to ensure it doesn't break
- Use CSS `text-overflow: ellipsis` where needed

---

## Common Issues

### Missing Translations
**Symptom:** Keys showing instead of translated text

**Solution:**
1. Check if namespace is registered in config
2. Verify JSON file exists and is valid
3. Check for typos in key names
4. Clear browser cache and localStorage

### Language Not Appearing
**Symptom:** New language not in dropdown

**Solution:**
1. Verify it's added to `supportedLngs` array
2. Check Navbar component has the language entry
3. Restart dev server

### RTL Not Working
**Symptom:** RTL language displays LTR

**Solution:**
1. Check `getTextDirection()` includes the language
2. Verify `dir` attribute on `<html>` element
3. Add CSS RTL overrides where needed

---

## Resources

- **ISO 639-1 Language Codes:** https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
- **i18next Pluralization:** https://www.i18next.com/translation-function/plurals
- **Unicode CLDR:** https://cldr.unicode.org/ (for plural rules)
- **RTL Languages:** https://en.wikipedia.org/wiki/Right-to-left

---

## Need Help?

1. Review existing language implementations (de, he)
2. Check react-i18next documentation
3. Consult the development team
4. Test incrementally - one namespace at a time
