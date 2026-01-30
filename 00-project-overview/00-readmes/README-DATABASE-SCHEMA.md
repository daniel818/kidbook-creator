# Database Schema

> Supabase PostgreSQL database structure

## Overview

KidBook Creator uses Supabase (PostgreSQL) for data persistence. The schema includes tables for users, books, pages, and orders with Row Level Security (RLS) for data protection.

---

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   profiles  │       │    books    │       │    pages    │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │◀──────│ user_id(FK) │       │ id (PK)     │
│ email       │       │ id (PK)     │◀──────│ book_id(FK) │
│ full_name   │       │ title       │       │ page_number │
│ avatar_url  │       │ child_name  │       │ page_type   │
│ created_at  │       │ child_age   │       │ text_elems  │
│ updated_at  │       │ age_group   │       │ image_elems │
└─────────────┘       │ book_type   │       │ created_at  │
                      │ book_theme  │       │ updated_at  │
                      │ status      │       └─────────────┘
                      │ thumbnail   │
                      │ created_at  │
                      │ updated_at  │
                      └─────────────┘
                            │
                            ▼
                      ┌─────────────┐
                      │   orders    │
                      ├─────────────┤
                      │ id (PK)     │
                      │ book_id(FK) │
                      │ user_id(FK) │
                      │ format      │
                      │ size        │
                      │ quantity    │
                      │ total       │
                      │ status      │
                      │ stripe_id   │
                      │ lulu_id     │
                      │ tracking    │
                      └─────────────┘
```

---

## Tables

### profiles

User profile information (auto-created on signup).

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### books

Book metadata and settings.

```sql
CREATE TABLE books (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Book settings
  title TEXT NOT NULL,
  child_name TEXT NOT NULL,
  child_age INTEGER CHECK (child_age >= 0 AND child_age <= 18),
  age_group TEXT NOT NULL,
  book_type TEXT NOT NULL CHECK (book_type IN ('board', 'picture', 'story', 'alphabet')),
  book_theme TEXT NOT NULL CHECK (book_theme IN ('adventure', 'bedtime', 'learning', 'fantasy', 'animals', 'custom')),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'ordered')),
  
  -- Thumbnail
  thumbnail_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### pages

Individual book pages with content.

```sql
CREATE TABLE pages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  
  -- Page info
  page_number INTEGER NOT NULL,
  page_type TEXT NOT NULL DEFAULT 'inside' CHECK (page_type IN ('cover', 'inside', 'back')),
  
  -- Content (JSONB for flexibility)
  background_color TEXT DEFAULT '#ffffff',
  background_image TEXT,
  text_elements JSONB DEFAULT '[]'::jsonb,
  image_elements JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique page numbers per book
  UNIQUE(book_id, page_number)
);
```

### orders

Print orders and payment tracking.

```sql
CREATE TABLE orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  book_id UUID REFERENCES books(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Order details
  format TEXT NOT NULL CHECK (format IN ('softcover', 'hardcover')),
  size TEXT NOT NULL CHECK (size IN ('7.5x7.5', '8x8', '8x10')),
  quantity INTEGER NOT NULL DEFAULT 1,
  
  -- Pricing (stored in dollars)
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  
  -- Shipping address
  shipping_full_name TEXT NOT NULL,
  shipping_address_line1 TEXT NOT NULL,
  shipping_address_line2 TEXT,
  shipping_city TEXT NOT NULL,
  shipping_state TEXT NOT NULL,
  shipping_postal_code TEXT NOT NULL,
  shipping_country TEXT NOT NULL,
  shipping_phone TEXT NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'paid', 'processing', 'printed', 'shipped', 'delivered', 'cancelled')),
  
  -- External IDs
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  lulu_order_id TEXT,
  tracking_number TEXT,
  pdf_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Row Level Security (RLS)

All tables have RLS enabled to ensure users can only access their own data.

### profiles

```sql
-- Users can view own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

### books

```sql
-- Users can view own books
CREATE POLICY "Users can view own books" ON books
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create books
CREATE POLICY "Users can create books" ON books
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update own books
CREATE POLICY "Users can update own books" ON books
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete own books
CREATE POLICY "Users can delete own books" ON books
  FOR DELETE USING (auth.uid() = user_id);
```

### pages

```sql
-- Users can CRUD pages of their own books
CREATE POLICY "Users can view pages of own books" ON pages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM books WHERE books.id = pages.book_id AND books.user_id = auth.uid())
  );

CREATE POLICY "Users can create pages for own books" ON pages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM books WHERE books.id = pages.book_id AND books.user_id = auth.uid())
  );

CREATE POLICY "Users can update pages of own books" ON pages
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM books WHERE books.id = pages.book_id AND books.user_id = auth.uid())
  );

CREATE POLICY "Users can delete pages of own books" ON pages
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM books WHERE books.id = pages.book_id AND books.user_id = auth.uid())
  );
```

### orders

```sql
-- Users can view own orders
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create orders
CREATE POLICY "Users can create orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

## Triggers

### Auto-create profile on signup

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Auto-update updated_at

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON books
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pages_updated_at
  BEFORE UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Indexes

```sql
CREATE INDEX idx_books_user_id ON books(user_id);
CREATE INDEX idx_books_status ON books(status);
CREATE INDEX idx_pages_book_id ON pages(book_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_book_id ON orders(book_id);
CREATE INDEX idx_orders_status ON orders(status);
```

---

## Storage Bucket

### book-images

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'book-images',
  'book-images',
  false,
  10485760,  -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);
```

### Storage Policies

```sql
-- Users can upload to their own folder
CREATE POLICY "Users can upload images to own folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'book-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can view their own images
CREATE POLICY "Users can view own images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'book-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own images
CREATE POLICY "Users can delete own images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'book-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

---

## Files

| File | Purpose |
|------|---------|
| `supabase/schema.sql` | Main schema definition |
| `supabase/admin-schema.sql` | Admin-specific schema |
| `supabase/migrations/` | Migration files |
| `supabase/config.toml` | Supabase configuration |
