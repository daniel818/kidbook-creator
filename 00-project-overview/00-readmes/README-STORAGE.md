# Storage Service

> Image storage and local storage management

## Overview

KidBook Creator uses two storage mechanisms:
1. **Supabase Storage** - Cloud storage for book images
2. **Local Storage** - Browser storage for drafts and offline support

---

## Supabase Storage

### Bucket: `book-images`

| Setting | Value |
|---------|-------|
| Public | false |
| Max Size | 10MB |
| Allowed Types | JPEG, PNG, GIF, WebP |

### File Structure

```
book-images/
└── {user_id}/
    └── {book_id}/
        ├── 0.png    # Cover image
        ├── 1.png    # Page 1
        ├── 2.png    # Page 2
        └── ...
```

---

## Upload API (`app/api/upload/route.ts`)

### POST `/api/upload`

Upload an image file.

**Request:** `multipart/form-data`
- `file` - Image file
- `bookId` - Optional book ID for organization

**Response:**
```typescript
{
  url: string;   // Signed URL (1 hour expiry)
  path: string;  // Storage path
}
```

### DELETE `/api/upload`

Delete an image.

**Request Body:**
```typescript
{ path: string }
```

---

## Local Storage (`lib/storage.ts`)

### Functions

| Function | Purpose |
|----------|---------|
| `getBooks()` | Get all books from localStorage |
| `saveBooks(books)` | Save all books |
| `getBookById(id)` | Get single book |
| `saveBook(book)` | Save/update a book |
| `deleteBook(id)` | Delete a book |
| `getCurrentBook()` | Get currently editing book |
| `setCurrentBook(id)` | Set current book ID |
| `clearAllData()` | Clear all stored data |

### Storage Keys

| Key | Purpose |
|-----|---------|
| `kidbook_books` | All saved books |
| `kidbook_current` | Current book ID |

---

## Usage Examples

### Upload Image

```typescript
const formData = new FormData();
formData.append('file', file);
formData.append('bookId', bookId);

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData
});
const { url, path } = await response.json();
```

### Local Storage

```typescript
import { saveBook, getBookById } from '@/lib/storage';

// Save book locally
saveBook(book);

// Retrieve book
const book = getBookById('book-id');
```

---

## Files

| File | Purpose |
|------|---------|
| `app/api/upload/route.ts` | Image upload/delete API |
| `lib/storage.ts` | Local storage utilities |
