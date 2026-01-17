# KidBook Creator - Technical Documentation

> AI-powered personalized children's storybook platform

## Overview

KidBook Creator enables parents to create personalized children's storybooks using AI-generated stories and illustrations. Children become the heroes of their own adventures, with books available as digital previews or premium printed hardcovers.

---

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15 (App Router), TypeScript, TailwindCSS, shadcn/ui |
| **Backend** | Next.js API Routes, Supabase (PostgreSQL + Auth + Storage) |
| **AI** | Google Gemini 3 Pro (stories), Gemini 2.5 Flash/3 Pro (images) |
| **Payments** | Stripe (checkout, webhooks) |
| **Print-on-Demand** | Lulu API |
| **Email** | Resend/SendGrid |

---

## Project Structure

```
kidbook-creator/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── ai/           # AI generation endpoints
│   │   ├── books/        # Book CRUD operations
│   │   ├── checkout/     # Stripe checkout
│   │   ├── orders/       # Order management
│   │   ├── upload/       # Image uploads
│   │   └── webhook/      # Stripe webhooks
│   ├── admin/            # Admin dashboard
│   ├── auth/             # Authentication pages
│   ├── book/             # Book viewer
│   ├── create/           # Book creation flow
│   └── order/            # Order pages
├── components/            # React components
│   ├── AuthModal/        # Authentication modal
│   ├── StoryBookViewer   # Interactive book viewer
│   └── ...
├── lib/                   # Shared libraries
│   ├── auth/             # Auth context
│   ├── gemini/           # AI client
│   ├── lulu/             # Print-on-demand client
│   ├── stripe/           # Payment utilities
│   ├── supabase/         # Database clients
│   └── ...
├── supabase/             # Database schema & migrations
└── 00-readmes/           # This documentation
```

---

## Documentation Index

| README | Description |
|--------|-------------|
| [AI-GENERATION](./README-AI-GENERATION.md) | Story & image generation with Gemini |
| [AUTHENTICATION](./README-AUTHENTICATION.md) | Supabase Auth integration |
| [BOOKS-API](./README-BOOKS-API.md) | Book CRUD operations |
| [CHECKOUT-PAYMENTS](./README-CHECKOUT-PAYMENTS.md) | Stripe integration & webhooks |
| [DATABASE-SCHEMA](./README-DATABASE-SCHEMA.md) | Supabase PostgreSQL schema |
| [PDF-GENERATION](./README-PDF-GENERATION.md) | PDF export functionality |
| [PRINT-ON-DEMAND](./README-PRINT-ON-DEMAND.md) | Lulu API integration |
| [STORAGE](./README-STORAGE.md) | Image storage & local storage |
| [STORYBOOK-VIEWER](./README-STORYBOOK-VIEWER.md) | Interactive book viewer component |
| [USER-FLOW](./README-USER-FLOW.md) | Complete user journey |

---

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables (copy from .env.example)
cp .env.example .env.local

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

---

## Environment Variables

See `.env.example` for required variables:

- **Supabase**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **Gemini AI**: `GEMINI_API_KEY`
- **Stripe**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- **Lulu**: `LULU_API_KEY`, `LULU_API_SECRET`, `LULU_SANDBOX`
- **App**: `NEXT_PUBLIC_APP_URL`

---

## Key Features

1. **AI Story Generation** - Personalized narratives using Gemini 3 Pro
2. **AI Illustrations** - Consistent character design across pages
3. **Interactive Book Viewer** - Page-flip animation with react-pageflip
4. **PDF Export** - Download books as PDF
5. **Print Ordering** - Stripe checkout + Lulu print-on-demand
6. **User Authentication** - Email/password + Google OAuth

---

**Last Updated**: January 2025
