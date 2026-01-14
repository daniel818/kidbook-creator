# 📚 KidBook Creator

Create beautiful, personalized children's books and order professionally printed copies delivered to your door.

![KidBook Creator](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

## ✨ Features

### Phase 1 (Current - MVP)
- 🎨 **Beautiful Landing Page** - Premium design with animated 3D book preview
- 📝 **Book Setup Wizard** - Multi-step flow for child's name, age, book type, and theme
- 🖼️ **Page Editor** - Drag-and-drop interface for images and text
- 📄 **Page Management** - Add, delete, and reorder pages with drag-and-drop
- 👁️ **Book Preview** - Flip-through preview of the finished book
- 💾 **Auto-Save** - Books saved to local storage automatically
- 📱 **Responsive** - Works beautifully on desktop and iPhone

### Phase 2 (Coming Soon)
- 🔐 **User Authentication** - Supabase Auth (Email, Google, Apple)
- ☁️ **Cloud Storage** - Save books to Supabase database
- 📁 **Image Upload** - Upload images to Supabase Storage

### Phase 3 (Coming Soon)
- 🖨️ **PDF Generation** - Print-ready PDF with PDFKit
- 📦 **Lulu API Integration** - Order printed books
- 💳 **Stripe Payments** - Secure checkout
- 📧 **Order Tracking** - Email notifications and tracking

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ (recommended)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/kidbook-creator.git
cd kidbook-creator

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📂 Project Structure

```
kidbook-creator/
├── app/
│   ├── page.tsx                    # Landing page / My Books
│   ├── layout.tsx                  # Root layout with metadata
│   ├── globals.css                 # Design system & utilities
│   ├── page.module.css             # Landing page styles
│   └── create/
│       ├── page.tsx                # Book setup wizard
│       ├── page.module.css
│       └── [bookId]/
│           ├── page.tsx            # Page editor
│           ├── page.module.css
│           └── order/
│               ├── page.tsx        # Order flow
│               └── page.module.css
├── lib/
│   ├── types.ts                    # TypeScript types & helpers
│   └── storage.ts                  # Local storage utilities
├── public/
│   └── favicon.ico
├── package.json
├── tsconfig.json
└── README.md
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
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Vanilla CSS (custom design system) |
| Animations | Framer Motion |
| Drag & Drop | Framer Motion Reorder + react-dropzone |
| Storage (Current) | Browser LocalStorage |
| Storage (Planned) | Supabase (Auth, DB, Storage) |
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

## 💻 Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## 🔑 Environment Variables (Phase 2+)

Create a `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
STRIPE_SECRET_KEY=your_stripe_secret

# Lulu API
LULU_API_KEY=your_lulu_key
LULU_API_SECRET=your_lulu_secret
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
- [Lulu](https://www.lulu.com/) - Print-on-demand service
- [Stripe](https://stripe.com/) - Payment processing
- [Supabase](https://supabase.com/) - Backend-as-a-Service

---

Made with ❤️ for parents who want to create magical memories for their children.
