# CLAUDE.md - KidBook Creator

## Project Overview

AI-powered web app that creates personalized children's books with AI-generated stories and illustrations, then orders professionally printed copies via Lulu print-on-demand.

## Tech Stack

- **Framework:** Next.js 16 (App Router) with TypeScript (strict mode)
- **React:** 19.x
- **AI:** Google Gemini 3 via `@google/genai` SDK
- **Database:** PostgreSQL via Supabase (with RLS policies)
- **Auth:** Supabase Auth (email + Google OAuth)
- **Payments:** Stripe
- **Print Fulfillment:** Lulu API
- **Email:** Resend
- **Styling:** Tailwind CSS 4 + CSS Modules + vanilla CSS custom properties
- **i18n:** i18next + react-i18next (en, de, he with RTL support)
- **Storage:** Supabase Storage + Cloudflare R2
- **PDF:** jsPDF + html2canvas
- **Testing:** Jest + React Testing Library
- **Package Manager:** npm

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server on localhost:3000 |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm test` | Run Jest tests |
| `npm run test:watch` | Tests in watch mode |
| `npm run test:coverage` | Coverage report |

## Project Structure

```
app/                    # Next.js App Router pages & API routes
  api/                  # API routes (ai/, books/, checkout/, orders/, webhooks/, lulu/)
  [locale]/             # Locale-prefixed routes (en, de, he)
  create/               # Book creation wizard (multi-step)
  book/[bookId]/        # Book viewer
  mybooks/              # User's book library
  orders/               # Order management
  admin/                # Admin dashboard
  auth/                 # Auth routes
components/             # React components (StoryBookViewer, Navbar, AuthModal, etc.)
lib/                    # Shared utilities and integrations
  gemini/               # AI client, prompts
  supabase/             # DB client (client.ts, server.ts), middleware, uploads
  auth/                 # AuthContext provider
  stripe/               # Stripe client/server
  lulu/                 # Lulu API client, pricing, fulfillment, PDF/cover generation
  i18n/                 # i18next config, provider, RTL utilities
  types.ts              # Core TypeScript interfaces
  art-styles.ts         # Art style definitions
locales/                # Translation JSON files (en/, de/, he/)
supabase/               # DB schema, migrations
__tests__/              # Unit + integration tests
```

## Key Conventions

- **Path alias:** `@/*` maps to project root
- **Client components:** Use `'use client'` directive for interactive components
- **API routes:** All protected routes check Supabase auth; return `{ error, status }` on failure
- **State management:** React Context for auth (`AuthContext`), local `useState` elsewhere
- **Styling:** Tailwind utilities for layout, CSS Modules for component-scoped styles, CSS custom properties for design tokens
- **Book status flow:** `preview` → `draft` → `completed` → `ordered`
- **AI cost tracking:** Every Gemini API call logged to `generation_logs` table with token counts
- **Images:** Base64 → Buffer → upload to Supabase Storage or R2
- **i18n:** Prompts auto-adjusted per language; RTL automatic for Hebrew

## Database

PostgreSQL via Supabase with RLS. Key tables: `profiles`, `books`, `pages`, `orders`, `generation_logs`. UUID primary keys. Migrations in `supabase/migrations/`.

## Environment Variables

Required groups: Supabase (URL, anon key, service role key), Gemini API key + model names, Stripe keys + webhook secret, Lulu API key/secret, Resend API key, R2 storage credentials, `NEXT_PUBLIC_APP_URL`. See `.env.example` for full list.

## Testing

- Unit tests: pricing logic, validation (`__tests__/unit/`)
- Integration tests: checkout API, admin auth, upload API (`__tests__/integration/`)
- Mocked environment for all secrets in test setup
