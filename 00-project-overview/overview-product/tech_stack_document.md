# KidBook Creator – Tech Stack Document

This document outlines the technology stack for KidBook Creator, an AI-powered personalized children's storybook platform. The stack is optimized for AI story generation, content safety, print-on-demand integration, and seamless user experience.

---

## **1. Frontend**

### **Core Framework**
- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript (strict mode)
- **React Version**: React 18+ with Server Components

### **Styling & UI**
- **CSS Framework**: TailwindCSS 3.4+
- **Component Library**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Fonts**: Poppins (display), Inter (UI), Georgia (story text)

### **Forms & Validation**
- **Form Management**: React Hook Form
- **Validation**: Zod schema validation
- **Date Handling**: date-fns

### **State Management**
- **Server State**: React Server Components (default)
- **Client State**: React Context + useState (minimal client-side state)
- **URL State**: Next.js searchParams for filters/tabs

---

## **2. Backend & Database**

### **Backend Platform**
- **Platform**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Database**: PostgreSQL 15+
- **Real-time**: Supabase Realtime (for admin notifications)
- **Storage**: Supabase Storage (for uploaded files, portfolio images)

### **Database Schema**
**Tables**:
- `users`: User accounts (email, password_hash, created_at, subscription_status)
- `stories`: Generated stories (user_id, title, content, age_group, language, status, created_at)
- `story_pages`: Individual story pages (story_id, page_number, text, image_url, image_prompt)
- `child_profiles`: Child information (user_id, name, age, gender, appearance, interests)
- `orders`: Print orders (user_id, story_id, order_type, price, status, shipping_address, tracking_number)
- `subscriptions`: Subscription management (user_id, plan_type, status, start_date, end_date)
- `analytics_events`: Custom event tracking (user_id, event_type, metadata, created_at)

**Key Features**:
- Row-Level Security (RLS) for data protection
- Triggers for automated workflows (e.g., lead notification)
- Full-text search for blog posts
- JSON columns for flexible metadata

### **Edge Functions** (Supabase)
- `generate-story`: Call Gemini API to generate story content
- `generate-illustrations`: Call Imagen API to generate story illustrations
- `moderate-content`: Check story content for child safety
- `process-payment`: Handle Stripe payment webhooks
- `send-order-confirmation`: Email order confirmation to user
- `update-subscription`: Handle RevenueCat subscription webhooks

---

## **3. AI & Generation**

### **Story Generation**
- **Provider**: Google Gemini 1.5 Pro
- **Use Cases**: Generate personalized story narratives
- **Features**:
  - Age-appropriate language and themes
  - Child as protagonist throughout
  - Multi-language support (German, Hebrew, English)
  - Custom prompt templates per age group

### **Image Generation**
- **Provider**: Google Imagen 3 or Stable Diffusion
- **Use Cases**: Generate story illustrations
- **Features**:
  - Consistent character design across pages
  - Child-friendly, whimsical art style
  - Soft colors and rounded shapes
  - Professional storybook quality

### **Content Moderation**
- **Multi-layer Safety**:
  1. Gemini base safety filters
  2. Custom keyword filtering
  3. Age-appropriate guardrails
  4. Human review for flagged content
- **Monitoring**: All generated content logged for review

## **4. Email & Communication**

### **Email Service**
- **Provider**: Resend or SendGrid
- **Templates**: React Email components
- **Use Cases**:
  - Welcome email (new user registration)
  - Order confirmation (print book ordered)
  - Shipping notification (book shipped)
  - Subscription confirmation
  - Post-delivery follow-up

### **Email Types**
1. **Welcome Email**: "Your first book is free! Start creating"
2. **Story Complete**: "Your story is ready! Preview and order"
3. **Order Confirmation**: "Your book is printing! Track your order"
4. **Shipping Notification**: "Your book is on its way!"
5. **Post-Delivery**: "How did [child name] like their book?"

---

## **5. Payments & Subscriptions**

### **Payment Processing**
- **Provider**: Stripe
- **Features**:
  - Credit card payments
  - PayPal integration
  - One-time purchases (print books)
  - Recurring subscriptions
  - Secure checkout (PCI compliant)

### **Subscription Management**
- **Provider**: RevenueCat
- **Features**:
  - Monthly (€6.99) and annual (€60) plans
  - Subscription status tracking
  - Automatic renewal
  - Cancellation handling
  - Analytics and reporting

---

## **6. Analytics & Tracking**

### **Product Analytics**
- **Platform**: Mixpanel (user behavior tracking)
- **Events Tracked**:
  - page_view
  - story_creation_start
  - story_creation_complete
  - registration_gate_shown
  - user_registered
  - print_order_initiated
  - print_order_complete
  - subscription_started
  - subscription_cancelled
  - social_share
  - referral_link_clicked

### **Conversion Tracking**
- **Goals**:
  - Free book creation
  - Story completion
  - User registration
  - Print order
  - Subscription conversion
- **Funnels**:
  - Visitor → Free book creation → Story completion → Registration → Print order
  - Registration → Subscription
  - First order → Repeat order

### **Revenue Analytics**
- **Platform**: RevenueCat
- **Metrics**:
  - Monthly Recurring Revenue (MRR)
  - Customer Lifetime Value (LTV)
  - Churn rate
  - Subscription cohorts
  - Revenue by plan type

---

## **7. Print-on-Demand Integration**

### **Print Partners**
- **Germany/Austria**: 2-3 local print partners
- **Israel**: 1-2 local print partners
- **Integration**: API or manual order submission
- **Features**:
  - Hardcover book printing (8.5" x 8.5")
  - Premium paper options
  - Fast turnaround (5-10 days)
  - Quality control
  - Tracking integration

### **Order Management**
- **Workflow**:
  1. User orders print book
  2. Generate print-ready PDF
  3. Submit to print partner API
  4. Receive tracking number
  5. Update order status
  6. Send shipping notification
- **Quality Control**: Sample checks, customer feedback loop

## **8. SEO & Performance**

### **SEO Optimization**
- **Meta Tags**: Dynamic per page (title, description, OG tags)
- **Structured Data**: JSON-LD (Organization, LocalBusiness, Service, Article)
- **Sitemap**: Auto-generated XML sitemap
- **Robots.txt**: Configured for search engines
- **Canonical URLs**: Set on all pages
- **hreflang Tags**: DE/EN language versions
- **Image Optimization**: Alt text, lazy loading, WebP format

### **Performance Targets**
- **Lighthouse Score**: 95+ on all metrics
- **Core Web Vitals**:
  - LCP (Largest Contentful Paint): < 2.5s
  - FID (First Input Delay): < 100ms
  - CLS (Cumulative Layout Shift): < 0.1
- **Page Size**: < 1MB initial load
- **Time to Interactive**: < 3s

### **Optimization Techniques**
- Next.js Image component (automatic optimization)
- Font optimization (preload, subset)
- Code splitting (automatic with Next.js)
- Static generation for blog posts
- Incremental Static Regeneration (ISR) for portfolio
- Edge caching with Vercel Edge Network

---

## **9. Content Management**

### **Story Templates**
- **Storage**: Database (Supabase)
- **Structure**: Age group, category, prompt template, illustration style
- **Categories**: Adventure, Fantasy, Educational, Bedtime
- **Age Groups**: 2-4 (Board Book), 5-7 (Picture Book), 8-10 (Story Book)

### **Blog CMS** (Optional)
- **Storage**: MDX files or Supabase
- **Content**: Parenting tips, literacy development, product updates
- **SEO**: Optimized for German keywords

---

## **10. Hosting & Deployment**

### **Hosting Platform**
- **Provider**: Vercel (Next.js optimized)
- **Features**:
  - Automatic deployments (Git push)
  - Preview deployments (PRs)
  - Edge Network (global CDN)
  - Serverless functions
  - Environment variables
  - Custom domain (sparkee.at or sparkee-studios.at)

### **Domain & DNS**
- **Registrar**: Namecheap, GoDaddy, or AWS Route 53
- **DNS**: Vercel DNS or Cloudflare
- **SSL**: Automatic HTTPS (Let's Encrypt)

### **Environments**
- **Production**: kidbookcreator.com (or .de)
- **Staging**: staging.kidbookcreator.com
- **Development**: localhost:3000

---

## **11. Development & Testing**

### **Code Quality**
- **Linting**: ESLint (Next.js config + custom rules)
- **Formatting**: Prettier
- **Type Checking**: TypeScript strict mode
- **Pre-commit Hooks**: Husky + lint-staged

### **Testing**
- **Unit Tests**: Vitest (React components)
- **Integration Tests**: Playwright (E2E)
- **Visual Regression**: Percy or Chromatic (optional)
- **Accessibility**: axe-core, Lighthouse

### **CI/CD**
- **Platform**: GitHub Actions or Vercel (automatic)
- **Pipeline**:
  1. Lint & type check
  2. Run tests
  3. Build Next.js app
  4. Deploy to Vercel
  5. Run smoke tests

---

## **12. Security & Compliance**

### **Security Measures**
- **HTTPS**: Enforced on all pages
- **CSP**: Content Security Policy headers
- **Rate Limiting**: API route protection (Vercel Edge Middleware)
- **Input Validation**: Zod schemas on all forms
- **SQL Injection**: Supabase parameterized queries
- **XSS Protection**: React automatic escaping

### **Privacy & Compliance**
- **GDPR**: Cookie consent banner, privacy policy, data deletion
- **Cookie Policy**: Documented cookie usage
- **Data Storage**: EU region (Supabase Frankfurt)
- **Data Retention**: Defined policies for leads and analytics
- **Right to Erasure**: User data deletion workflow

### **Legal Pages**
- Impressum (required in Germany/Austria)
- Datenschutzerklärung (Privacy Policy)
- AGB (Terms of Service)
- Cookie Policy
- Child Safety Policy

---

## **13. Third-Party Integrations**

### **Essential Integrations**
- **Google Gemini**: AI story generation
- **Google Imagen**: AI illustration generation
- **Stripe**: Payment processing
- **RevenueCat**: Subscription management
- **Mixpanel**: User analytics
- **Supabase**: Backend, database, auth, storage
- **Print Partners**: Print-on-demand fulfillment

### **Optional Integrations**
- **Intercom**: Customer support chat
- **Hotjar**: UX optimization
- **Zapier**: Workflow automation

---

## **14. Internationalization (i18n)**

### **Languages**
- **Primary**: German (DE) - Germany & Austria
- **Secondary**: Hebrew (HE) - Israel
- **Tertiary**: English (EN) - International

### **Implementation**
- **Library**: next-intl
- **Structure**: `/de/`, `/he/`, `/en/` route prefixes
- **Detection**: Browser language detection, manual toggle
- **Storage**: Translation JSON files per language
- **SEO**: hreflang tags for language versions
- **RTL Support**: Hebrew right-to-left layout

### **Content Strategy**
- All pages translated (German priority)
- Story templates: Language-specific
- Email templates: Language-specific
- AI prompts: Native language generation

---

## **15. Cost Breakdown (Monthly)**

### **MVP Phase (Months 1-3)**
- **Vercel**: $20 (Pro)
- **Supabase**: $25 (Pro)
- **Google Gemini**: ~$50-200 (usage-based, ~100 stories/month)
- **Google Imagen**: ~$100-300 (usage-based, ~100 books/month)
- **Stripe**: 2.9% + €0.30 per transaction
- **RevenueCat**: $0 (Free tier up to $10k MRR)
- **Mixpanel**: $0 (Free tier up to 20M events)
- **Email**: $20 (SendGrid or Resend)
- **Domain**: ~$15/year (~$1.25/month)
- **Total**: ~$215-565/month (variable with usage)

### **Growth Phase (Months 4-12)**
- **Vercel Pro**: $20/month
- **Supabase Pro**: $25/month
- **Google Gemini**: ~$500-1,000 (500-1,000 stories/month)
- **Google Imagen**: ~$500-1,000 (500-1,000 books/month)
- **Stripe**: 2.9% + €0.30 per transaction (~€300-500 in fees)
- **RevenueCat**: $0-250 (scales with MRR)
- **Mixpanel**: $0-89 (Growth plan)
- **Email**: $80-200 (higher volume)
- **Total**: ~$1,425-3,084/month (variable with usage)

---

## **16. Development Workflow**

### **Version Control**
- **Platform**: GitHub
- **Branching**: main (production), staging, feature branches
- **PR Process**: Code review required, automated checks

### **Local Development**
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run type checking
npm run type-check

# Run linting
npm run lint

# Run tests
npm run test

# Build for production
npm run build
```

### **Environment Variables**
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google AI
GOOGLE_GEMINI_API_KEY=
GOOGLE_IMAGEN_API_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# RevenueCat
REVENUECAT_API_KEY=
NEXT_PUBLIC_REVENUECAT_PUBLIC_KEY=

# Mixpanel
NEXT_PUBLIC_MIXPANEL_TOKEN=

# Email
SENDGRID_API_KEY=
RESEND_API_KEY=

# Print Partners
PRINT_PARTNER_API_KEY=
PRINT_PARTNER_API_URL=
```

---

## **17. Scalability Considerations**

### **Traffic Scaling**
- **Current**: 1,000-2,000 visitors/month
- **6 Months**: 5,000-10,000 visitors/month
- **12 Months**: 10,000-20,000 visitors/month
- **Vercel**: Auto-scales with traffic
- **Supabase**: Connection pooling, read replicas if needed
- **AI API**: Rate limiting, queue system for high volume

### **Database Optimization**
- Indexes on frequently queried columns
- Pagination for large result sets
- Caching with Vercel Edge
- CDN for static assets

### **Future Enhancements**
- Multi-region deployment (UK, US expansion)
- Advanced caching for AI responses (Redis)
- Dedicated AI inference servers (if volume justifies)
- Mobile app (iOS/Android)
- B2B platform for schools/libraries

---

## **Notes**

### **MVP Focus**
- Story creation flow (child profile, story selection, AI generation)
- Registration gate (email + password)
- Print ordering (Stripe integration)
- Subscription management (RevenueCat)
- German language support
- Mobile-responsive
- Child-safe content moderation

### **Performance Priorities**
1. Fast story generation (< 3 minutes)
2. Smooth user experience (no lag)
3. Mobile-first design
4. Accessibility (WCAG 2.1 AA)
5. SEO optimization (German keywords)

### **Security Priorities**
1. HTTPS enforced
2. Content moderation (child safety)
3. Input validation
4. Rate limiting (prevent abuse)
5. GDPR compliance
6. Payment security (PCI compliant)

### **Business Priorities**
1. Free book creation (acquisition)
2. Registration conversion (25-35% target)
3. Print order conversion (20-30% target)
4. Subscription conversion (10-15% target)
5. Analytics and tracking (Mixpanel)

---

**Status**: ✅ Ready for development with modern, scalable, and cost-effective tech stack
