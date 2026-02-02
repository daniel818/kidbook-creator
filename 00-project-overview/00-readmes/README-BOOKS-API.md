# Books API

> CRUD operations for book management

## Overview

The Books API handles creating, reading, updating, and deleting books and their pages. All operations require authentication and enforce user ownership.

---

## API Endpoints

### GET `/api/books`

**List all books** for the authenticated user.

**Response:**
```typescript
Array<{
  id: string;
  settings: {
    title: string;
    childName: string;
    childAge: number;
    ageGroup: string;
    bookType: string;
    bookTheme: string;
  };
  pages: Array<{
    id: string;
    pageNumber: number;
    type: 'cover' | 'inside' | 'back';
    backgroundColor: string;
    backgroundImage?: string;
    textElements: TextElement[];
    imageElements: ImageElement[];
    createdAt: Date;
    updatedAt: Date;
  }>;
  status: 'draft' | 'completed' | 'ordered';
  thumbnailUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}>
```

---

### POST `/api/books`

**Create a new book** with initial cover page.

**Request Body:**
```typescript
{
  settings: {
    title: string;
    childName: string;
    childAge: number;
    ageGroup: string;
    bookType: string;
    bookTheme: string;
  }
}
```

**Response:** Created book object (status 201)

**Flow:**
1. Validate user authentication
2. Insert book record
3. Create cover page with title text element
4. Return complete book object

---

### GET `/api/books/[bookId]`

**Get a single book** by ID.

**Response:** Book object with all pages

---

### PATCH `/api/books/[bookId]`

**Update book** settings or status.

**Request Body:**
```typescript
{
  title?: string;
  status?: 'draft' | 'completed' | 'ordered';
  // ... other settings
}
```

---

### DELETE `/api/books/[bookId]`

**Delete a book** and all its pages (cascade delete).

---

## Data Types

### Book Settings

```typescript
interface BookSettings {
  childName: string;
  childAge: number;
  ageGroup: '0-2' | '3-5' | '6-8' | '9-12';
  bookType: 'board' | 'picture' | 'story' | 'alphabet';
  bookTheme: 'adventure' | 'bedtime' | 'learning' | 'fantasy' | 'animals' | 'custom';
  title: string;
  storyDescription?: string;
  artStyle?: ArtStyle;
  imageQuality?: 'fast' | 'pro';
}
```

### Book Types

| Type | Description | Age Range |
|------|-------------|-----------|
| `board` | Board Book - Durable pages | 0-3 years |
| `picture` | Picture Book - Beautiful illustrations | 3-6 years |
| `story` | Story Book - Engaging stories | 5-10 years |
| `alphabet` | Alphabet Book - Learn letters | 2-5 years |

### Book Themes

| Theme | Icon | Colors |
|-------|------|--------|
| `adventure` | 🏔️ | Orange, Yellow |
| `bedtime` | 🌙 | Indigo, Purple |
| `learning` | 📚 | Green, Cyan |
| `fantasy` | 🦄 | Pink, Purple |
| `animals` | 🦁 | Amber, Lime |
| `custom` | ✨ | Indigo, Pink |

---

## Page Structure

### TextElement

```typescript
interface TextElement {
  id: string;
  content: string;
  x: number;          // Position (0-100%)
  y: number;
  width: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  fontWeight: string;
  textAlign: 'left' | 'center' | 'right';
}
```

### ImageElement

```typescript
interface ImageElement {
  id: string;
  src: string;        // URL or base64
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}
```

---

## Database Schema

### books table

```sql
CREATE TABLE books (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  child_name TEXT NOT NULL,
  child_age INTEGER,
  age_group TEXT,
  book_type TEXT,
  book_theme TEXT,
  status TEXT DEFAULT 'draft',
  thumbnail_url TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### pages table

```sql
CREATE TABLE pages (
  id UUID PRIMARY KEY,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  page_number INTEGER,
  page_type TEXT,
  background_color TEXT,
  background_image TEXT,
  text_elements JSONB,
  image_elements JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(book_id, page_number)
);
```

---

## Row Level Security

Users can only access their own books:

```sql
-- View own books
CREATE POLICY "Users can view own books" ON books
  FOR SELECT USING (auth.uid() = user_id);

-- Create books
CREATE POLICY "Users can create books" ON books
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update own books
CREATE POLICY "Users can update own books" ON books
  FOR UPDATE USING (auth.uid() = user_id);

-- Delete own books
CREATE POLICY "Users can delete own books" ON books
  FOR DELETE USING (auth.uid() = user_id);
```

---

## Helper Functions (`lib/types.ts`)

### getAgeGroup

```typescript
function getAgeGroup(age: number): AgeGroup {
  if (age <= 2) return '0-2';
  if (age <= 5) return '3-5';
  if (age <= 8) return '6-8';
  return '9-12';
}
```

### createNewPage

```typescript
function createNewPage(pageNumber: number, type: 'cover' | 'inside' | 'back'): BookPage
```

### createNewBook

```typescript
function createNewBook(settings: BookSettings): Book
```

---

## Local Storage (`lib/storage.ts`)

For offline/draft support:

| Function | Purpose |
|----------|---------|
| `getBooks()` | Get all books from localStorage |
| `saveBook(book)` | Save/update a book |
| `getBookById(id)` | Get single book |
| `deleteBook(id)` | Delete a book |
| `getCurrentBook()` | Get currently editing book |
| `setCurrentBook(id)` | Set current book ID |

---

## Files

| File | Purpose |
|------|---------|
| `app/api/books/route.ts` | GET/POST books |
| `app/api/books/[bookId]/route.ts` | GET/PATCH/DELETE single book |
| `lib/types.ts` | Type definitions & helpers |
| `lib/storage.ts` | Local storage management |
