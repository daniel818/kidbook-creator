# 📚 KidBook Creator

Create beautiful, personalized children's books and order professionally printed copies delivered to your door.

![KidBook Creator](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

## ✨ Features

### Phase 1 ✅ (MVP)
- 🎨 **Beautiful Landing Page** - Premium design with animated 3D book preview
- 📝 **Book Setup Wizard** - Multi-step flow for child's name, age, book type, and theme
- 🖼️ **Page Editor** - Drag-and-drop interface for images and text
- 📄 **Page Management** - Add, delete, and reorder pages with drag-and-drop
- 👁️ **Book Preview** - Flip-through preview of the finished book
- 💾 **Auto-Save** - Books saved to local storage automatically
- 📱 **Responsive** - Works beautifully on desktop and iPhone

### Phase 2 ✅ (Backend & Auth)
- 🐳 **Docker Support** - Development and production containers
- 🔐 **User Authentication** - Supabase Auth (Email, Google OAuth)
- ☁️ **Cloud Storage** - Save books to Supabase database
- 📁 **Image Upload** - Upload images to Supabase Storage
- 🔄 **Session Management** - Automatic session refresh with middleware

### Phase 3 (Coming Soon)
- 🖨️ **PDF Generation** - Print-ready PDF with PDFKit
- 📦 **Lulu API Integration** - Order printed books
- 💳 **Stripe Payments** - Secure checkout
- 📧 **Order Tracking** - Email notifications and tracking

## 🐳 Quick Start with Docker

The fastest way to run the app without affecting your local system:

```bash
# Clone the repository
git clone https://github.com/yourusername/kidbook-creator.git
cd kidbook-creator

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server with Docker
npm run docker:dev
# Or directly: docker compose up
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Docker Commands

```bash
# Development (with hot-reload)
npm run docker:dev

# Build production image
npm run docker:build

# Run production container
npm run docker:prod

# Stop all containers
npm run docker:stop
```

## 🚀 Local Development (Alternative)

If you prefer running locally (requires Node.js 20+):

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## 🗄️ Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)

2. Run the database schema:
   - Go to SQL Editor in your Supabase dashboard
   - Copy and paste contents of `supabase/schema.sql`
   - Execute the SQL

3. Enable Google OAuth (optional):
   - Go to Authentication > Providers
   - Enable Google and add your OAuth credentials

4. Update environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

## 📂 Project Structure

```
kidbook-creator/
├── app/
│   ├── page.tsx                    # Landing page / My Books
│   ├── layout.tsx                  # Root layout with AuthProvider
│   ├── globals.css                 # Design system & utilities
│   ├── api/
│   │   ├── books/                  # Books CRUD API
│   │   └── upload/                 # Image upload API
│   ├── auth/
│   │   ├── callback/               # OAuth callback handler
│   │   └── error/                  # Auth error page
│   └── create/
│       ├── page.tsx                # Book setup wizard
│       └── [bookId]/
│           ├── page.tsx            # Page editor
│           └── order/              # Order flow
├── components/
│   └── AuthModal/                  # Login/Signup modal
├── lib/
│   ├── types.ts                    # TypeScript types & helpers
│   ├── storage.ts                  # Local storage utilities
│   ├── auth/                       # Auth context & hooks
│   └── supabase/                   # Supabase client factories
├── supabase/
│   └── schema.sql                  # Database schema
├── Dockerfile                      # Production container
├── Dockerfile.dev                  # Development container
├── docker-compose.yml              # Docker Compose config
└── docker-compose.prod.yml         # Production overrides
```

## 🎨 Design System

The app uses a custom CSS design system with:

- **Color Palette** - Playful gradients with purple, pink, and yellow accents
- **Typography** - Outfit (display) and Inter (body) from Google Fonts
- **Spacing** - Consistent spacing scale from xs to 4xl
- **Shadows** - Layered shadows with glow effects
- **Animations** - Smooth micro-animations and transitions
- **Components** - Buttons, cards, forms, and more

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Vanilla CSS (custom design system) |
| Animations | Framer Motion |
| Drag & Drop | Framer Motion + react-dropzone |
| Auth & Database | Supabase |
| Storage | Supabase Storage |
| Containerization | Docker |
| Payments (Planned) | Stripe |
| Printing (Planned) | Lulu API |

## 📖 Book Types Supported

| Type | Description | Age Range |
|------|-------------|-----------|
| 📘 Board Book | Durable pages for little hands | 0-3 years |
| 🎨 Picture Book | Beautiful illustrations with short text | 3-6 years |
| 📖 Story Book | Engaging stories for growing readers | 5-10 years |
| 🔤 Alphabet Book | Learn letters in a fun way | 2-5 years |

## 🎭 Book Themes

- 🏔️ Adventure
- 🌙 Bedtime
- 📚 Learning
- 🦄 Fantasy
- 🦁 Animals
- ✨ Custom

## 💻 Development Commands

```bash
# Start development server (Docker)
npm run docker:dev

# Start development server (local)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## 🔑 Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```env
# Supabase (Required for Phase 2+)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe (Required for Phase 3)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx

# Lulu API (Required for Phase 3)
LULU_API_KEY=your-lulu-key
LULU_API_SECRET=your-lulu-secret
```

## 📱 Mobile Support

The app is designed mobile-first with:
- Touch-friendly button sizes (48px minimum)
- Swipe gestures for page navigation
- Bottom-aligned action buttons
- Responsive layouts that adapt to screen size
- PWA-ready meta tags

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [Supabase](https://supabase.com/) - Backend-as-a-Service
- [Docker](https://www.docker.com/) - Containerization
- [Lulu](https://www.lulu.com/) - Print-on-demand service
- [Stripe](https://stripe.com/) - Payment processing

---

Made with ❤️ for parents who want to create magical memories for their children.
