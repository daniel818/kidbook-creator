# Product Requirements Document: About Us Page

## Introduction/Overview

Create an engaging and heartfelt About Us page that introduces KidBook Creator's team and mission. The page will showcase the team's passion for storytelling, creativity, and meaningful children's content, featuring two team photos and compelling narrative content. This page will help users connect with the people behind the product and understand the values driving KidBook Creator.

**Problem it solves:** Users want to know who created KidBook Creator and what drives the team. Building trust and emotional connection with users is essential for a product focused on children's content. An About Us page humanizes the brand and establishes credibility.

**Goal:** Create an authentic, engaging page that builds trust, showcases the team's passion for storytelling and innovation, and reinforces the brand's mission to create meaningful stories for children.

---

## Goals

1. **Authenticity:** Present the team as genuine, passionate individuals who are parents and storytellers
2. **Connection:** Create emotional resonance with users through relatable content about parenting and creativity
3. **Trust:** Build credibility by showing the real people behind the product
4. **Brand Alignment:** Reinforce core values of creativity, innovation, and meaningful storytelling
5. **Accessibility:** Ensure content is available in all supported languages (EN, DE, HE) with proper RTL support

---

## User Stories

1. **As a parent**, I want to know who created this platform so that I can trust them with content for my children.

2. **As a new user**, I want to understand the team's values and mission so that I can decide if this platform aligns with my values.

3. **As a potential customer**, I want to see the faces behind the brand so that I feel more connected and confident in my purchase decision.

4. **As an educator**, I want to know the team's philosophy on storytelling and learning so that I can assess if this tool fits my teaching approach.

5. **As an international user**, I want to read about the team in my language so that I can fully understand their story and mission.

---

## Functional Requirements

### FR1: Hero Section
The page must include a compelling hero section with:
- Engaging headline that captures the team's essence
- Brief tagline or mission statement
- Visual interest (background gradient, subtle animation, or design element)

### FR2: Team Story Section
- Narrative content describing the team as:
  - Young entrepreneurs
  - Parents who are still kids at heart
  - Passionate about stories and storytelling
  - Believers in stories that teach meaningful lessons
  - Advocates for creativity and innovation
- Warm, conversational tone that feels authentic and approachable
- 2-3 paragraphs of compelling narrative

### FR3: Visual Content
- **Two placeholder image sections** for team photos
- Clear placeholder styling that indicates images will be added
- Proper image containers with aspect ratios maintained
- Alt text placeholders for accessibility
- Suggested dimensions and aspect ratios for future photos

### FR4: Values/Mission Highlights
- Visual callouts or cards highlighting core values:
  - Storytelling & Creativity
  - Meaningful Learning
  - Innovation
  - Childlike Wonder
- Icons or illustrations for each value
- Brief description for each (1-2 sentences)

### FR5: Call-to-Action
- Encourage users to start creating their own stories
- Link to `/create` route
- Secondary CTA option (e.g., "Explore Community Books")

### FR6: Internationalization
- Create new translation namespace `about.json` for all About Us page content
- Support all three languages: English (EN), German (DE), Hebrew (HE)
- Implement proper RTL layout for Hebrew
- Translate all narrative content, maintaining tone and authenticity
- Ensure cultural appropriateness across languages

### FR7: Navigation Integration
- Add "About Us" link to navbar (suggest placement near "FAQ" or at the end)
- Update `Navbar.tsx` to include the new about link
- Add translation keys to `navbar.json` for all languages
- Ensure active state styling works correctly

### FR8: Page Route
- Create page at route `/about`
- Use Next.js App Router structure: `app/[locale]/about/page.tsx`
- Implement proper metadata for SEO (title, description, Open Graph tags)

### FR9: Responsive Design
- Mobile-first approach with breakpoints for tablet and desktop
- Image placeholders should scale appropriately
- Text should remain readable across all screen sizes
- Proper spacing and layout adjustments for different viewports

---

## Non-Goals (Out of Scope)

1. **Individual Team Member Profiles:** No detailed bios or individual team member pages
2. **Team Directory:** No organizational chart or complete team listing
3. **Company History Timeline:** No detailed chronological history
4. **Press/Media Section:** No press releases or media coverage section
5. **Careers/Jobs Section:** No hiring or recruitment information
6. **Contact Form:** Contact information handled elsewhere (FAQ or dedicated contact page)
7. **Blog Integration:** No blog posts or news updates on this page
8. **Video Content:** Only static images, no video embeds in initial version

---

## Design Considerations

### Component Structure
```
AboutPage/
├── page.tsx (main page component)
├── AboutPage.module.css (styles)
└── components/
    ├── AboutHero/ (hero section)
    │   ├── AboutHero.tsx
    │   └── AboutHero.module.css
    ├── TeamStory/ (narrative content section)
    │   ├── TeamStory.tsx
    │   └── TeamStory.module.css
    ├── TeamPhotos/ (image placeholder sections)
    │   ├── TeamPhotos.tsx
    │   └── TeamPhotos.module.css
    └── ValuesGrid/ (core values display)
        ├── ValuesGrid.tsx
        └── ValuesGrid.module.css
```

### UI/UX Guidelines
- **Color Scheme:** Use brand colors (purple/blue gradient theme) with warm, inviting tones
- **Typography:** Clear hierarchy, readable body text, engaging headlines
- **Spacing:** Generous whitespace for comfortable reading
- **Imagery:** Placeholder boxes with subtle borders and background colors
- **Tone:** Warm, authentic, conversational, and inspiring
- **Accessibility:** WCAG 2.1 AA compliance, proper semantic HTML, ARIA labels

### Content Tone & Voice
- **Authentic:** Genuine and honest, not corporate or overly polished
- **Warm:** Friendly and approachable, like talking to a friend
- **Inspiring:** Convey passion and enthusiasm for storytelling
- **Relatable:** Speak to shared experiences of parenting and creativity
- **Optimistic:** Positive and hopeful about the power of stories

### Image Placeholder Specifications
```
Placeholder 1: Team Photo - Collaborative Moment
- Aspect Ratio: 16:9 or 3:2
- Suggested Size: 1200x800px
- Position: After team story section
- Style: Subtle border, light background, "Image Coming Soon" text

Placeholder 2: Team Photo - Creative Environment
- Aspect Ratio: 4:3 or 1:1
- Suggested Size: 800x800px or 1000x750px
- Position: Before or within values section
- Style: Matching placeholder styling
```

### Page Layout (Desktop)
```
┌─────────────────────────────────────────────┐
│           Hero Section                       │
│   "We're storytellers, parents, dreamers"   │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│           Team Story Section                 │
│   Narrative about the team, mission,        │
│   passion for storytelling...                │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│       [Image Placeholder 1]                  │
│       Team Photo - Collaborative             │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│           Core Values Grid                   │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐   │
│  │Story │  │Learn │  │Innov │  │Wonder│   │
│  │telling│  │ing   │  │ation │  │      │   │
│  └──────┘  └──────┘  └──────┘  └──────┘   │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│       [Image Placeholder 2]                  │
│       Team Photo - Creative Space            │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│           Call to Action                     │
│       "Start Your Story Today"               │
└─────────────────────────────────────────────┘
```

### RTL Considerations
- Mirror layout for Hebrew
- Ensure text flow is natural right-to-left
- Test image placement and alignment in RTL mode
- Use CSS logical properties (`margin-inline-start`, `padding-inline-end`, etc.)

---

## Technical Considerations

### Dependencies
- **react-i18next:** Already in use for translations
- **Next.js App Router:** Use existing routing structure
- **CSS Modules:** Follow existing pattern for styling
- **Lucide Icons (optional):** For values section icons if already in project
- **No new external libraries required**

### File Locations
- **Page:** `app/[locale]/about/page.tsx`
- **Components:** `components/AboutHero/`, `components/TeamStory/`, `components/TeamPhotos/`, `components/ValuesGrid/`
- **Translations:** `locales/{en,de,he}/about.json`
- **Navbar updates:** `components/Navbar/Navbar.tsx`, `locales/{en,de,he}/navbar.json`
- **Images (future):** `public/images/team/` (for when actual photos are added)

### Translation Namespace Structure
```json
{
  "hero": {
    "title": "We're Storytellers, Parents & Dreamers",
    "subtitle": "Creating magical stories that teach, inspire, and delight"
  },
  "story": {
    "heading": "Our Story",
    "paragraph1": "We're a team of young entrepreneurs who are parents and, at heart, still kids ourselves. We believe in the magic of storytelling and the power of a good story to shape young minds.",
    "paragraph2": "We love stories that teach children meaning—stories that spark imagination, build character, and create lasting memories. Every book created on our platform is a chance to share values, lessons, and love.",
    "paragraph3": "Creativity and innovation drive everything we do. We're constantly exploring new ways to make storytelling more accessible, more personal, and more meaningful for families around the world."
  },
  "values": {
    "heading": "What We Believe In",
    "storytelling": {
      "title": "Storytelling",
      "description": "Every story is an opportunity to connect, teach, and inspire."
    },
    "learning": {
      "title": "Meaningful Learning",
      "description": "Stories that teach values, build character, and shape young minds."
    },
    "innovation": {
      "title": "Innovation",
      "description": "Pushing boundaries to make storytelling accessible to everyone."
    },
    "wonder": {
      "title": "Childlike Wonder",
      "description": "Keeping the magic alive in every story we help create."
    }
  },
  "images": {
    "placeholder1Alt": "KidBook Creator team collaborating",
    "placeholder2Alt": "KidBook Creator creative workspace",
    "comingSoon": "Photo Coming Soon"
  },
  "cta": {
    "heading": "Ready to Create Your Story?",
    "description": "Join thousands of parents creating meaningful stories for their children.",
    "primary": "Start Creating",
    "secondary": "Explore Community Books"
  }
}
```

### Integration with Existing Systems
- **Navbar:** Update `navLinks` array to include about link
- **i18n Config:** Register new `about` namespace in `lib/i18n/config.ts`
- **Routing:** Ensure locale prefix works correctly (`/en/about`, `/de/about`, `/he/about`)
- **SEO:** Add proper meta tags, Open Graph tags for social sharing

### Image Placeholder Implementation
```tsx
// Example placeholder component structure
<div className={styles.imagePlaceholder}>
  <div className={styles.placeholderContent}>
    <ImageIcon size={48} />
    <p>{t('images.comingSoon')}</p>
  </div>
</div>
```

```css
/* Example placeholder styling */
.imagePlaceholder {
  aspect-ratio: 16 / 9;
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  border: 2px dashed #d0d0d0;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

---

## Success Metrics

1. **User Engagement:**
   - 25%+ of users visit the About Us page
   - Average time on page: 45+ seconds
   - Low bounce rate (<60%)

2. **Trust & Conversion:**
   - Increased conversion rate for users who view About Us page
   - Positive sentiment in user feedback about brand connection
   - Increased social sharing of About Us content

3. **Technical Performance:**
   - Page load time <2 seconds
   - No translation errors in any language
   - 100% mobile responsiveness score
   - Accessibility score 95%+

4. **Content Effectiveness:**
   - Users mention team/values in feedback or surveys
   - Increased brand recognition and recall
   - Higher trust scores in user surveys

---

## Content Guidelines

### Writing the Team Story
- Start with a relatable hook about being parents and storytellers
- Emphasize the "kids at heart" aspect—authenticity is key
- Explain the mission: creating stories that teach meaningful lessons
- Highlight creativity and innovation as core drivers
- End with an inspiring note about the impact of stories
- Keep paragraphs short and scannable (3-5 sentences each)
- Use "we" language to create inclusivity

### Tone Examples
✅ **Good:** "We're parents who believe every bedtime story is a chance to teach, inspire, and connect."
❌ **Avoid:** "Our company was founded to provide educational content solutions."

✅ **Good:** "We're still kids at heart, and we bring that playful spirit to everything we create."
❌ **Avoid:** "Our team has extensive experience in the children's content industry."

---

## Open Questions

1. **Team Photo Specifications:** What specific moments/settings should the two photos capture? (Collaborative work, creative brainstorming, with families, etc.)

2. **Team Size Mention:** Should we mention team size or keep it general?

3. **Founder Names:** Should we include founder names or keep it as "we/our team"?

4. **Company Location:** Should we mention where the team is based?

5. **Awards/Recognition:** Any achievements or milestones to highlight?

6. **Partner/Investor Logos:** Any partnerships or backing to mention for credibility?

7. **Social Proof:** Should we include testimonials or user quotes on this page?

8. **Newsletter Signup:** Should there be an email signup option on this page?

---

## Implementation Notes for Developer

- Follow existing component patterns in the codebase
- Use `'use client'` directive for interactive components if needed
- Implement proper TypeScript types for all props
- Follow CSS module naming conventions (camelCase)
- Test in all three languages before marking complete
- Ensure proper SEO metadata (title, description, Open Graph)
- Add proper alt text for placeholder images
- Use semantic HTML (`<article>`, `<section>`, `<header>`)
- Follow accessibility best practices (proper heading hierarchy, ARIA labels)
- Make placeholder images easy to replace (clear documentation in code comments)
- Consider adding subtle animations (fade-in on scroll) for enhanced UX
- Ensure images are optimized when added (use Next.js Image component)

### Placeholder Replacement Instructions
```tsx
// TODO: Replace placeholder with actual image
// Recommended specs: 1200x800px, 16:9 aspect ratio
// File location: /public/images/team/team-photo-1.jpg
// Update src and remove placeholder styling
<Image 
  src="/images/team/team-photo-1.jpg"
  alt={t('images.placeholder1Alt')}
  width={1200}
  height={800}
  priority
/>
```

---

## Related Documentation

- `README-COMPONENT-TRANSLATION.md` - Translation implementation guide
- `README-INTERNATIONALIZATION.md` - i18n system overview
- Navbar component - Navigation integration reference
- Brand Guidelines - For tone, voice, and visual identity

---

## Timeline & Priorities

### Phase 1: Core Implementation (MVP)
- Hero section with headline and mission
- Team story narrative content
- Two image placeholders with proper styling
- Basic responsive layout
- Translation setup for all three languages

### Phase 2: Enhancement
- Core values grid with icons
- Enhanced styling and animations
- SEO optimization
- Social sharing meta tags

### Phase 3: Content Addition
- Replace placeholders with actual team photos
- Refine copy based on user feedback
- A/B test different headlines or CTAs

---

## Notes

- Keep the tone authentic and warm—this is about connecting with users emotionally
- The placeholder images should be styled professionally so the page looks complete even before photos are added
- Consider the page as a trust-building tool, not just informational content
- Ensure translations maintain the warmth and authenticity of the original English content
- This page should feel like a conversation with friends, not a corporate bio
