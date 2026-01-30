---
description: How to safely apply database migrations WITHOUT losing data
---

# Safe Database Migration

## ⚠️ CRITICAL: NEVER USE THESE COMMANDS
The following commands DESTROY ALL DATA:
- `supabase db reset` ❌ NEVER USE
- `supabase db push --reset` ❌ NEVER USE

## ✅ Safe Migration Commands

### Option 1: Apply pending migrations only
```bash
# turbo
npx supabase migration up
```

### Option 2: Run specific migration SQL manually
```bash
# Connect to local Supabase Postgres
psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/migrations/YOUR_MIGRATION.sql
```

### Option 3: Run SQL in Supabase Studio
1. Open http://localhost:54323
2. Go to SQL Editor
3. Paste and run the migration SQL

## Before Any Migration
Always backup first:
```bash
pg_dump postgresql://postgres:postgres@localhost:54322/postgres > backup_$(date +%Y%m%d_%H%M%S).sql
```
