# Component Translation Guide

This guide explains how to add translations to new or existing components in KidBook Creator.

---

## Quick Start

### 1. Import the Hook

```typescript
import { useTranslation } from 'react-i18next';
```

### 2. Use in Component

```typescript
export function MyComponent() {
  const { t } = useTranslation('common');
  
  return <button>{t('buttons.save')}</button>;
}
```

### 3. Add Translation Keys

Add the keys to all language files in `/locales/{lang}/common.json`:

```json
{
  "buttons": {
    "save": "Save"
  }
}
```

---

## Choosing the Right Namespace

### Available Namespaces

- **common** - Buttons, labels, generic messages
- **navbar** - Navigation items
- **auth** - Authentication forms
- **home** - Homepage content
- **create** - Book creation wizard
- **profile** - User profile pages
- **orders** - Order management
- **purchases** - Purchase history
- **mybooks** - My Books page
- **viewer** - Book viewer controls

### When to Create a New Namespace

Create a new namespace when:
- ✅ Component has 10+ unique translation keys
- ✅ Translations are specific to one feature/page
- ✅ Content is logically separate from existing namespaces

Use existing namespace when:
- ✅ Component has few translations
- ✅ Translations are generic (buttons, labels)
- ✅ Content fits existing namespace

---

## Step-by-Step: Adding Translations to a Component

### Step 1: Identify Hardcoded Strings

Find all hardcoded text in your component:

```typescript
// Before
export function BookCard({ book }) {
  return (
    <div>
      <h3>{book.title}</h3>
      <p>Created on {book.createdAt}</p>
      <button>Edit</button>
      <button>Delete</button>
    </div>
  );
}
```

Strings to translate:
- "Created on" (label)
- "Edit" (button)
- "Delete" (button)

**Note:** `book.title` and `book.createdAt` are data, not UI text - don't translate!

---

### Step 2: Choose Namespace

For this example, use `mybooks` namespace since it's for the My Books page.

---

### Step 3: Add Translation Keys

Add keys to `/locales/en/mybooks.json`:

```json
{
  "bookCard": {
    "createdOn": "Created on",
    "edit": "Edit",
    "delete": "Delete"
  }
}
```

**Key Naming Convention:**
- Use camelCase: `createdOn`, not `created_on`
- Group related keys: `bookCard.edit`, `bookCard.delete`
- Be descriptive: `createdOn` not just `created`

---

### Step 4: Add to All Languages

Copy the structure to German and Hebrew:

**`/locales/de/mybooks.json`:**
```json
{
  "bookCard": {
    "createdOn": "Erstellt am",
    "edit": "Bearbeiten",
    "delete": "Löschen"
  }
}
```

**`/locales/he/mybooks.json`:**
```json
{
  "bookCard": {
    "createdOn": "נוצר ב",
    "edit": "ערוך",
    "delete": "מחק"
  }
}
```

---

### Step 5: Update Component

```typescript
import { useTranslation } from 'react-i18next';

export function BookCard({ book }) {
  const { t } = useTranslation('mybooks');
  
  return (
    <div>
      <h3>{book.title}</h3>
      <p>{t('bookCard.createdOn')} {book.createdAt}</p>
      <button>{t('bookCard.edit')}</button>
      <button>{t('bookCard.delete')}</button>
    </div>
  );
}
```

---

### Step 6: Test

1. Run the app: `npm run dev`
2. Switch languages in navbar
3. Verify all text updates correctly
4. Check browser console for missing translation warnings

---

## Advanced Patterns

### Multiple Namespaces

Use multiple namespaces when needed:

```typescript
export function MyComponent() {
  const { t } = useTranslation(['common', 'mybooks']);
  
  return (
    <div>
      <button>{t('common:buttons.save')}</button>
      <p>{t('mybooks:bookCard.createdOn')}</p>
    </div>
  );
}
```

---

### Interpolation

Pass dynamic values into translations:

**Translation file:**
```json
{
  "greeting": "Hello, {{name}}!",
  "itemCount": "You have {{count}} items"
}
```

**Component:**
```typescript
const { t } = useTranslation('common');

return (
  <div>
    <p>{t('greeting', { name: user.name })}</p>
    <p>{t('itemCount', { count: items.length })}</p>
  </div>
);
```

---

### Pluralization

Handle singular/plural forms:

**Translation file:**
```json
{
  "books": "{{count}} book",
  "books_other": "{{count}} books"
}
```

**Component:**
```typescript
const { t } = useTranslation('mybooks');

return <p>{t('books', { count: bookCount })}</p>;
// count: 1 → "1 book"
// count: 5 → "5 books"
```

**Hebrew pluralization (more complex):**
```json
{
  "books": "ספר אחד",
  "books_other": "{{count}} ספרים"
}
```

---

### HTML in Translations

For translations with HTML, use `Trans` component:

```typescript
import { Trans } from 'react-i18next';

// Translation file:
// "terms": "I agree to the <1>Terms of Service</1>"

return (
  <Trans i18nKey="terms" t={t}>
    I agree to the <a href="/terms">Terms of Service</a>
  </Trans>
);
```

---

### Conditional Translations

Translate based on conditions:

```typescript
const { t } = useTranslation('common');

const statusKey = book.status === 'draft' 
  ? 'status.draft' 
  : 'status.published';

return <span>{t(statusKey)}</span>;
```

---

### Default Values

Provide fallback text:

```typescript
const { t } = useTranslation('common');

return <p>{t('optional.key', 'Default text if key missing')}</p>;
```

---

## Creating a New Namespace

### When Needed

Create a new namespace for a major feature or page with many translations.

### Steps

**1. Create translation files:**

```bash
touch locales/en/mynewpage.json
touch locales/de/mynewpage.json
touch locales/he/mynewpage.json
```

**2. Add content:**

```json
{
  "title": "My New Page",
  "description": "This is a new page",
  "buttons": {
    "submit": "Submit",
    "cancel": "Cancel"
  }
}
```

**3. Import in config:**

Edit `/lib/i18n/config.ts`:

```typescript
import mynewpageEN from '@/locales/en/mynewpage.json';
import mynewpageDE from '@/locales/de/mynewpage.json';
import mynewpageHE from '@/locales/he/mynewpage.json';

i18n.init({
  resources: {
    en: {
      // ... existing
      mynewpage: mynewpageEN,
    },
    de: {
      // ... existing
      mynewpage: mynewpageDE,
    },
    he: {
      // ... existing
      mynewpage: mynewpageHE,
    },
  },
  // ... rest of config
});
```

**4. Use in components:**

```typescript
const { t } = useTranslation('mynewpage');
```

---

## RTL Considerations

### Text Direction

For RTL languages (Hebrew), text direction is handled automatically. However, you may need CSS adjustments:

```css
/* Component.module.css */
.container {
  text-align: left;
}

[dir="rtl"] .container {
  text-align: right;
}
```

### Logical Properties

Use CSS logical properties for better RTL support:

```css
/* Instead of margin-left */
.element {
  margin-inline-start: 1rem;
}

/* Instead of padding-right */
.element {
  padding-inline-end: 1rem;
}
```

### Icon Positioning

Mirror icons for RTL:

```css
.icon {
  margin-right: 0.5rem;
}

[dir="rtl"] .icon {
  margin-right: 0;
  margin-left: 0.5rem;
  transform: scaleX(-1); /* Mirror the icon */
}
```

---

## Best Practices

### ✅ Do

- Keep keys descriptive and context-specific
- Group related translations together
- Use interpolation for dynamic content
- Test in all languages
- Provide context comments in translation files
- Use consistent terminology

### ❌ Don't

- Hardcode text in components
- Translate user-generated content
- Use translation keys as default text
- Mix languages in one file
- Forget to add keys to all language files
- Use overly generic key names

---

## Common Patterns

### Form Labels

```typescript
const { t } = useTranslation('auth');

<input 
  type="email" 
  placeholder={t('form.emailPlaceholder')}
  aria-label={t('form.emailLabel')}
/>
```

### Error Messages

```typescript
const { t } = useTranslation('common');

{error && <p className="error">{t(`errors.${error.code}`)}</p>}
```

### Status Badges

```typescript
const { t } = useTranslation('mybooks');

<span className={`badge ${book.status}`}>
  {t(`status.${book.status}`)}
</span>
```

### Loading States

```typescript
const { t } = useTranslation('common');

{isLoading ? t('loading') : t('loaded')}
```

---

## Debugging

### Translation Not Showing

**Check:**
1. Is namespace registered in `/lib/i18n/config.ts`?
2. Does the key exist in all language files?
3. Is the key path correct? (`buttons.save` not `button.save`)
4. Check browser console for i18next warnings

### Wrong Translation Showing

**Check:**
1. Is the correct namespace being used?
2. Is there a key conflict in multiple namespaces?
3. Clear localStorage and test again
4. Check if fallback language is being used

---

## Testing Checklist

When adding translations to a component:

- [ ] All hardcoded strings replaced with `t()` calls
- [ ] Keys added to all language files (en, de, he)
- [ ] Translations reviewed by native speakers
- [ ] Component tested in all languages
- [ ] No console warnings about missing keys
- [ ] RTL layout works correctly (if applicable)
- [ ] Text doesn't overflow or break layout
- [ ] Interpolation works correctly
- [ ] Pluralization works correctly

---

## Examples

### Complete Component Example

```typescript
'use client';

import { useTranslation } from 'react-i18next';
import styles from './BookCard.module.css';

interface BookCardProps {
  book: {
    id: string;
    title: string;
    pages: number;
    status: 'draft' | 'published';
    createdAt: string;
  };
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function BookCard({ book, onEdit, onDelete }: BookCardProps) {
  const { t } = useTranslation('mybooks');
  
  return (
    <div className={styles.card}>
      <h3>{book.title}</h3>
      
      <div className={styles.meta}>
        <span>{t('bookCard.pages', { count: book.pages })}</span>
        <span className={`${styles.status} ${styles[book.status]}`}>
          {t(`bookCard.status.${book.status}`)}
        </span>
      </div>
      
      <p className={styles.date}>
        {t('bookCard.createdOn')} {book.createdAt}
      </p>
      
      <div className={styles.actions}>
        <button 
          onClick={() => onEdit(book.id)}
          className={styles.editButton}
        >
          {t('bookCard.edit')}
        </button>
        <button 
          onClick={() => onDelete(book.id)}
          className={styles.deleteButton}
        >
          {t('bookCard.delete')}
        </button>
      </div>
    </div>
  );
}
```

**Translation file (`/locales/en/mybooks.json`):**
```json
{
  "bookCard": {
    "pages": "{{count}} page",
    "pages_other": "{{count}} pages",
    "status": {
      "draft": "Draft",
      "published": "Published"
    },
    "createdOn": "Created on",
    "edit": "Edit",
    "delete": "Delete"
  }
}
```

---

## Resources

- [react-i18next Documentation](https://react.i18next.com/)
- [i18next Documentation](https://www.i18next.com/)
- [Main i18n README](./README-INTERNATIONALIZATION.md)
- [Adding a Language Guide](./README-ADD-LANGUAGE.md)
