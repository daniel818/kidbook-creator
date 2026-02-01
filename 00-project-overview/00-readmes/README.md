# 📚 KidBook Creator

Create beautiful, personalized children's books with AI-generated stories and illustrations, then order professionally printed copies.

![KidBook Creator](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase)

## ✨ Features

- 🤖 **AI Story Generation** - Gemini 3 creates personalized stories
- 🎨 **AI Illustrations** - Beautiful images generated for each page
- � **Interactive Storybook** - Gemini-inspired flip-book viewer
- �️ **Keyboard Navigation** - Arrow keys, fullscreen mode
- � **PDF Download** - Export books as print-ready PDFs
- 🔐 **User Authentication** - Supabase Auth (Email, Google)
- ☁️ **Cloud Storage** - Books saved to Supabase
- � **Payments** - Stripe integration

---

## � Dev Environment Setup

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| **Node.js** | 20+ | `brew install node` or [nvm](https://github.com/nvm-sh/nvm) |
| **Docker** | Latest | [Docker Desktop](https://www.docker.com/products/docker-desktop/) |
| **Supabase CLI** | Latest | `brew install supabase/tap/supabase` |

### Step 1: Clone & Install

```bash
git clone https://github.com/daniel818/kidbook-creator.git
cd kidbook-creator
npm install
```

### Step 2: Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your API keys:

```env
# Supabase (local dev uses these automatically)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase start output>
SUPABASE_SERVICE_ROLE_KEY=<from supabase start output>
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Gemini AI (required for story/image generation)
GEMINI_API_KEY=<get from https://aistudio.google.com/apikey>

# Stripe (for payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
```

### Step 3: Start Supabase (Database)

```bash
# Start local Supabase (runs in Docker)
supabase start
```

This starts:
- **API**: http://127.0.0.1:54321
- **Database**: postgresql://127.0.0.1:54322/postgres
- **Studio**: http://127.0.0.1:54323 (admin UI)
- **Auth**: Ready for login/signup

The first run will output your local API keys - copy these to `.env.local`.

### Step 4: Start Next.js App

```bash
# In a new terminal
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 📋 Quick Reference

### Start Everything

```bash
# Terminal 1: Database & Auth
supabase start

# Terminal 2: Web App
npm run dev
```

### Stop Everything

```bash
supabase stop
# Ctrl+C to stop npm run dev
```

### Useful Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests |
| `supabase start` | Start local Supabase |
| `supabase stop` | Stop local Supabase |
| `supabase status` | Show Supabase URLs & keys |
| `supabase db reset` | Reset database with migrations |

---

## 🐳 Docker Development (Alternative)

If you prefer Docker for the app too:

```bash
# Start app in Docker (still need supabase start separately)
npm run docker:dev

# Production build
npm run docker:build
npm run docker:prod
```

---

## 📂 Project Structure

```
kidbook-creator/
├── app/
│   ├── page.tsx              # Landing page
│   ├── create/               # Book creation wizard
│   ├── book/[bookId]/        # Book viewer (StoryBookViewer)
│   └── api/                  # API routes
│       └── ai/               # Gemini AI endpoints
├── components/
│   ├── StoryBookViewer.tsx   # Gemini-inspired book viewer
│   └── AuthModal/            # Login modal
├── lib/
│   ├── gemini/client.ts      # Gemini AI integration
│   ├── types.ts              # TypeScript types
│   └── supabase/             # Supabase clients
├── supabase/
│   ├── config.toml           # Local Supabase config
│   └── migrations/           # Database schema
├── Dockerfile                # Production image
└── docker-compose.yml        # Docker Compose config
```

---

## 🔑 API Keys Required

| Service | Purpose | Get it from |
|---------|---------|-------------|
| **Gemini** | Story & image generation | [Google AI Studio](https://aistudio.google.com/apikey) |
| **Supabase** | Auth, database, storage | [supabase.com](https://supabase.com) (or use local) |
| **Stripe** | Payments | [stripe.com/dashboard](https://dashboard.stripe.com/apikeys) |

---

## 🎨 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| AI | Google Gemini 3 |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Payments | Stripe |
| Styling | Vanilla CSS + Google Fonts |
| PDF | jsPDF + html2canvas |

---

## 📖 Book Features

### Book Types
| Type | Age Range |
|------|-----------|
| 📘 Board Book | 0-3 years |
| 🎨 Picture Book | 3-6 years |
| 📖 Story Book | 5-10 years |

### Storybook Viewer
- **Spread Layout**: Illustrations on left, text on right
- **Keyboard Navigation**: ← → arrows, Space, F (fullscreen)
- **Premium Typography**: Crimson Text serif + Playfair Display drop caps
- **PDF Download**: Export as print-ready PDF

---

## 🤝 Contributing

Contributions welcome! Please submit a Pull Request.

## 📄 License

MIT License - see [LICENSE](LICENSE) file.

---

Made with ❤️ for parents who want to create magical memories.
