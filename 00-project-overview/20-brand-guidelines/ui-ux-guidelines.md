# Sparkee Studios UI/UX Guidelines

**Purpose**: Comprehensive UI/UX design guidelines for Sparkee Studios website and digital products  
**Audience**: Designers, developers, product managers  
**Scope**: Web applications, marketing website, client portals  
**Version**: 1.0

---

## Table of Contents

1. [Design Principles](#design-principles)
2. [Visual Design System](#visual-design-system)
3. [Component Library](#component-library)
4. [Layout & Grid](#layout--grid)
5. [Interaction Design](#interaction-design)
6. [User Experience Patterns](#user-experience-patterns)
7. [Responsive Design](#responsive-design)
8. [Accessibility](#accessibility)
9. [Performance](#performance)
10. [Implementation Guidelines](#implementation-guidelines)

---

## Design Principles

### 1. Clarity Over Cleverness
- **Prioritize understanding**: Users should immediately understand what they can do
- **Clear hierarchy**: Important information stands out
- **Simple language**: No jargon without explanation
- **Obvious actions**: CTAs are clear and actionable

### 2. Transparency & Trust
- **Show, don't hide**: Pricing, timelines, and processes are visible
- **Honest communication**: Set realistic expectations
- **Progress indicators**: Users always know where they are
- **Clear feedback**: System responds to every action

### 3. Efficiency & Speed
- **Fast load times**: < 2.5s LCP target
- **Minimal clicks**: Reduce steps to conversion
- **Smart defaults**: Pre-fill when possible
- **Keyboard shortcuts**: For power users

### 4. Professional Yet Approachable
- **Clean aesthetics**: Modern, uncluttered design
- **Warm interactions**: Friendly micro-interactions
- **Human touch**: Real photos, authentic testimonials
- **Austrian sensibility**: Local cultural awareness

### 5. Mobile-First Thinking
- **Touch-friendly**: 48px minimum touch targets
- **Thumb-zone optimization**: Key actions within reach
- **Progressive enhancement**: Core functionality works everywhere
- **Responsive by default**: Adapts to any screen size

---

## Visual Design System

### Color System

#### Primary Colors
```
Hot Pink:       #f4258c
├─ Hover:       #d91e7a
├─ Active:      #c01a6c
└─ Shadow:      rgba(244, 37, 140, 0.4)

Indigo:         #6366f1
├─ Hover:       #4f46e5
├─ Active:      #4338ca
└─ Light:       #818cf8

Pink Secondary: #f472b6
├─ Hover:       #ec4899
└─ Usage:       Gradient endpoints, soft accents
```

#### Neutral Scale
```
Dark Text:     #1c0d14  (Headings, primary text - warm dark)
Muted Pink:    #9c4973  (Body text, descriptions)
Nav Link:      #94a3b8  (Navbar links, muted text)
Gray 500:      #6B7280  (Placeholders, disabled)
Gray 300:      #D1D5DB  (Light borders)
Gray 200:      #E5E7EB  (Subtle borders)
Gray 100:      #F3F4F6  (Card backgrounds)
Bg Light:      #f8f5f7  (Page background - warm off-white)
Bg Dark:       #221019  (Dark mode background)
Footer:        #0f172a  (Footer background - slate 900)
White:         #FFFFFF  (Card backgrounds, navbar glass)
```

#### Semantic Colors
```
Success:   #10B981 (Green 500)
Warning:   #F59E0B (Amber 500)
Error:     #EF4444 (Red 500)
Info:      #3B82F6 (Blue 500)
```

#### Usage Guidelines
- **Hot Pink**: Main CTAs, logo background, hero buttons, key highlights
- **Indigo**: Navbar hover, gradient start, secondary CTAs, links
- **Pink Secondary**: Gradient endpoints, soft accents
- **Dark Text (#1c0d14)**: H1, H2 headings, important text
- **Muted Pink (#9c4973)**: Body text, paragraphs, descriptions
- **Nav Link (#94a3b8)**: Navbar links, muted interactive text
- **Semantic colors**: Status messages, alerts, validation feedback

### Typography

#### Font Stack
```css
/* Primary - Display & Body */
font-family: 'Plus Jakarta Sans', sans-serif;

/* Secondary - Navbar brand, special UI */
font-family: 'Outfit', 'Inter', sans-serif;

/* Fallback - Forms, system text */
font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 
             'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

#### Type Scale (Desktop ≥1024px)
```
H1:    48px / 56px (1.167)  font-weight: 700  letter-spacing: -0.02em
H2:    36px / 44px (1.222)  font-weight: 700  letter-spacing: -0.02em
H3:    30px / 38px (1.267)  font-weight: 600  letter-spacing: -0.01em
H4:    24px / 32px (1.333)  font-weight: 600  letter-spacing: -0.01em
H5:    20px / 28px (1.400)  font-weight: 500  letter-spacing: 0
H6:    18px / 26px (1.444)  font-weight: 500  letter-spacing: 0
Body:  16px / 24px (1.500)  font-weight: 400  letter-spacing: 0
Small: 14px / 20px (1.429)  font-weight: 400  letter-spacing: 0
Tiny:  12px / 16px (1.333)  font-weight: 400  letter-spacing: 0.01em
```

#### Type Scale (Mobile <640px)
```
H1:    36px / 44px  font-weight: 700
H2:    30px / 38px  font-weight: 700
H3:    24px / 32px  font-weight: 600
H4:    20px / 28px  font-weight: 600
Body:  16px / 24px  font-weight: 400
Small: 14px / 20px  font-weight: 400
```

#### Typography Best Practices
- **Line length**: 50-75 characters per line (optimal readability)
- **Paragraph spacing**: 1.5-2× line height between paragraphs
- **Heading spacing**: 1.5-2× above, 0.5-1× below
- **Text alignment**: Left-aligned for body text, centered for headlines
- **Emphasis**: Use semibold (600) for emphasis, avoid italic for long text

### Spacing System

#### Base Unit: 4px
```
space-0:   0px
space-1:   4px    (0.25rem)
space-2:   8px    (0.5rem)
space-3:   12px   (0.75rem)
space-4:   16px   (1rem)
space-5:   20px   (1.25rem)
space-6:   24px   (1.5rem)
space-8:   32px   (2rem)
space-10:  40px   (2.5rem)
space-12:  48px   (3rem)
space-16:  64px   (4rem)
space-20:  80px   (5rem)
space-24:  96px   (6rem)
space-32:  128px  (8rem)
```

#### Spacing Usage
- **Component padding**: 16px-24px (space-4 to space-6)
- **Section spacing**: 64px-96px (space-16 to space-24)
- **Element spacing**: 8px-16px (space-2 to space-4)
- **Tight spacing**: 4px-8px (space-1 to space-2)

### Elevation & Shadows

#### Shadow Scale
```css
/* Small - Subtle elevation */
shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);

/* Medium - Cards, dropdowns */
shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1),
           0 2px 4px -2px rgb(0 0 0 / 0.1);

/* Large - Modals, popovers */
shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1),
           0 4px 6px -4px rgb(0 0 0 / 0.1);

/* Extra Large - Overlays */
shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1),
           0 8px 10px -6px rgb(0 0 0 / 0.1);

/* Inner - Inset elements */
shadow-inner: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);
```

#### Usage Guidelines
- **Resting state**: shadow-sm or shadow-md
- **Hover state**: Increase shadow (sm → md, md → lg)
- **Active state**: Decrease shadow or use shadow-inner
- **Floating elements**: shadow-lg or shadow-xl
- **Avoid**: Multiple shadows on same element

### Border Radius

```
rounded-none: 0px
rounded-sm:   4px    (Small elements)
rounded-md:   6px    (Inputs, small buttons)
rounded-lg:   8px    (Cards, large buttons)
rounded-xl:   12px   (Hero cards, modals)
rounded-2xl:  16px   (Large feature cards)
rounded-full: 9999px (Pills, avatars, badges)
```

#### Usage Guidelines
- **Inputs**: 6px (rounded-md)
- **Buttons**: 8px (rounded-lg)
- **Cards**: 8px-12px (rounded-lg to rounded-xl)
- **Modals**: 12px (rounded-xl)
- **Avatars**: 9999px (rounded-full)

---

## Component Library

### Buttons

#### Primary Button (Hero CTA)
```
Background:     #f4258c (Hot Pink)
Text:           #FFFFFF (White)
Font Weight:    700 (Bold)
Padding:        20px 40px
Border Radius:  9999px (pill)
Shadow:         0 25px 50px rgba(244, 37, 140, 0.4)

States:
├─ Default:     bg-[#f4258c] text-white
├─ Hover:       scale(1.05)
├─ Active:      scale(1.0)
└─ Disabled:    bg-gray-300 text-gray-500 cursor-not-allowed
```

#### Gradient Button (Navbar CTA)
```
Background:     linear-gradient(90deg, #6366f1 0%, #f472b6 100%)
Text:           #FFFFFF (White)
Font Weight:    700 (Bold)
Padding:        10px 22px
Border Radius:  9999px (pill)
Shadow:         0 12px 24px rgba(99, 102, 241, 0.2)

States:
├─ Default:     gradient bg, white text
├─ Hover:       translateY(-1px), increased shadow
├─ Active:      translateY(0)
└─ Disabled:    bg-gray-300 text-gray-500 cursor-not-allowed
```

#### Secondary Button
```
Background:     Transparent
Border:         2px solid #2563EB
Text:           #2563EB (Primary Blue)
Font Weight:    600 (Semibold)
Padding:        10px 22px (md), 14px 30px (lg)
Border Radius:  8px (rounded-lg)

States:
├─ Default:     border-blue-600 text-blue-600
├─ Hover:       bg-blue-600 text-white border-blue-600
├─ Active:      bg-blue-700 text-white border-blue-700
├─ Focus:       ring-2 ring-blue-500 ring-offset-2
└─ Disabled:    border-gray-300 text-gray-400 cursor-not-allowed
```

#### Text Button
```
Background:     Transparent
Text:           #2563EB (Primary Blue)
Font Weight:    500 (Medium)
Padding:        8px 16px

States:
├─ Default:     text-blue-600
├─ Hover:       text-blue-700 underline
├─ Active:      text-blue-800
└─ Focus:       ring-2 ring-blue-500 ring-offset-2
```

#### Icon Button
```
Size:           40px × 40px (md), 48px × 48px (lg)
Icon Size:      20px (md), 24px (lg)
Border Radius:  8px (rounded-lg) or 9999px (rounded-full)
Background:     Transparent or Gray 100

States:
├─ Default:     text-gray-700
├─ Hover:       bg-gray-100 text-gray-900
├─ Active:      bg-gray-200 text-gray-900
└─ Focus:       ring-2 ring-blue-500 ring-offset-2
```

### Form Elements

#### Text Input
```
Height:         48px
Padding:        12px 16px
Border:         1px solid #D1D5DB (Gray 300)
Border Radius:  6px (rounded-md)
Font Size:      16px
Background:     #FFFFFF (White)

States:
├─ Default:     border-gray-300 bg-white
├─ Focus:       border-blue-500 ring-2 ring-blue-500 ring-opacity-50
├─ Error:       border-red-500 ring-2 ring-red-500 ring-opacity-50
├─ Success:     border-green-500 ring-2 ring-green-500 ring-opacity-50
└─ Disabled:    bg-gray-100 text-gray-500 cursor-not-allowed
```

#### Label
```
Font Size:      14px
Font Weight:    600 (Semibold)
Color:          #374151 (Gray 700)
Margin Bottom:  6px
```

#### Helper Text
```
Font Size:      14px
Font Weight:    400 (Regular)
Color:          #6B7280 (Gray 500)
Margin Top:     6px
```

#### Error Message
```
Font Size:      14px
Font Weight:    500 (Medium)
Color:          #EF4444 (Red 500)
Icon:           Alert Circle (16px)
Margin Top:     6px
```

#### Checkbox & Radio
```
Size:           20px × 20px
Border:         2px solid #D1D5DB (Gray 300)
Border Radius:  4px (checkbox), 9999px (radio)
Checked Color:  #2563EB (Primary Blue)
Focus:          ring-2 ring-blue-500 ring-offset-2
```

#### Select Dropdown
```
Height:         48px
Padding:        12px 40px 12px 16px (right padding for arrow)
Border:         1px solid #D1D5DB (Gray 300)
Border Radius:  6px (rounded-md)
Icon:           Chevron Down (20px, right-aligned)
```

### Cards

#### Standard Card
```
Background:     #FFFFFF (White)
Border:         1px solid #E5E7EB (Gray 200) [optional]
Border Radius:  8px (rounded-lg)
Padding:        24px (mobile), 32px (desktop)
Shadow:         shadow-md

States:
├─ Default:     shadow-md
└─ Hover:       shadow-lg scale-[1.02] (if interactive)
```

#### Feature Card
```
Background:     #FFFFFF (White)
Border Radius:  12px (rounded-xl)
Padding:        32px (mobile), 40px (desktop)
Shadow:         shadow-lg

Layout:
├─ Icon:        48px × 48px, Primary Blue background
├─ Title:       H3, Gray 900
├─ Description: Body text, Gray 700
└─ CTA:         Text button or arrow link
```

#### Pricing Card
```
Background:     #FFFFFF (White)
Border:         2px solid #E5E7EB (Gray 200)
Border Radius:  12px (rounded-xl)
Padding:        32px
Shadow:         shadow-md

Highlighted (Popular):
├─ Border:      2px solid #2563EB (Primary Blue)
├─ Badge:       "BELIEBT" badge at top
└─ Shadow:      shadow-lg

Layout:
├─ Badge:       [Optional] "BELIEBT"
├─ Title:       H3, Gray 900
├─ Price:       H2, Primary Blue
├─ Timeline:    Small text, Gray 600
├─ Features:    List with checkmarks
└─ CTA:         Primary button (full width)
```

### Navigation

#### Header (Desktop)
```
Height:         80px
Background:     #FFFFFF (White) with backdrop-blur
Border Bottom:  1px solid #E5E7EB (Gray 200)
Position:       Fixed, sticky on scroll
Shadow:         shadow-sm (on scroll)

Layout:
├─ Logo:        Left, 120px width
├─ Navigation:  Center, horizontal menu
├─ CTA:         Right, primary button
└─ Language:    Right, DE/EN toggle
```

#### Header (Mobile)
```
Height:         64px
Background:     #FFFFFF (White)
Border Bottom:  1px solid #E5E7EB (Gray 200)

Layout:
├─ Logo:        Left, 100px width
├─ Hamburger:   Right, 40px × 40px icon button
└─ Drawer:      Full-screen slide-in menu
```

#### Navigation Link
```
Font Size:      16px
Font Weight:    500 (Medium)
Color:          #374151 (Gray 700)
Padding:        8px 16px

States:
├─ Default:     text-gray-700
├─ Hover:       text-blue-600
├─ Active:      text-blue-600 font-semibold
└─ Focus:       ring-2 ring-blue-500 ring-offset-2
```

#### Dropdown Menu
```
Background:     #FFFFFF (White)
Border:         1px solid #E5E7EB (Gray 200)
Border Radius:  8px (rounded-lg)
Shadow:         shadow-lg
Padding:        8px
Min Width:      200px

Item:
├─ Padding:     12px 16px
├─ Hover:       bg-gray-100
└─ Active:      bg-blue-50 text-blue-600
```

### Modals & Overlays

#### Modal
```
Background:     #FFFFFF (White)
Border Radius:  12px (rounded-xl)
Shadow:         shadow-2xl
Max Width:      600px (md), 800px (lg)
Padding:        32px (mobile), 40px (desktop)

Backdrop:
├─ Background:  rgba(0, 0, 0, 0.5)
└─ Blur:        backdrop-blur-sm

Layout:
├─ Close:       Top-right, icon button
├─ Title:       H2, Gray 900
├─ Content:     Body text, Gray 700
└─ Actions:     Bottom, button group
```

#### Toast Notification
```
Background:     #FFFFFF (White)
Border:         1px solid #E5E7EB (Gray 200)
Border Radius:  8px (rounded-lg)
Shadow:         shadow-lg
Padding:        16px
Max Width:      400px
Position:       Top-right or bottom-right

Variants:
├─ Success:     Green 500 icon, green border-left
├─ Error:       Red 500 icon, red border-left
├─ Warning:     Amber 500 icon, amber border-left
└─ Info:        Blue 500 icon, blue border-left
```

### Loading States

#### Spinner
```
Size:           20px (sm), 32px (md), 48px (lg)
Color:          #2563EB (Primary Blue)
Animation:      Rotate 360deg, 1s linear infinite
```

#### Skeleton Screen
```
Background:     Linear gradient animation
Colors:         Gray 200 → Gray 100 → Gray 200
Animation:      Pulse, 2s ease-in-out infinite
Border Radius:  Match component (4px-8px)
```

#### Progress Bar
```
Height:         8px
Background:     #E5E7EB (Gray 200)
Fill:           #2563EB (Primary Blue)
Border Radius:  9999px (rounded-full)
Animation:      Smooth transition, 300ms
```

---

## Layout & Grid

### Container System
```
Max Width:      1280px (max-w-7xl)
Padding:        
├─ Mobile:      16px (px-4)
├─ Tablet:      24px (sm:px-6)
└─ Desktop:     32px (lg:px-8)

Centered:       margin: 0 auto
```

### Grid System
```
Columns:        12-column grid
Gap:            24px (desktop), 16px (mobile)

Common Layouts:
├─ 2-column:    grid-cols-1 md:grid-cols-2
├─ 3-column:    grid-cols-1 md:grid-cols-2 lg:grid-cols-3
├─ 4-column:    grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
└─ Sidebar:     grid-cols-1 lg:grid-cols-[300px_1fr]
```

### Section Spacing
```
Between Sections:
├─ Mobile:      64px (py-16)
└─ Desktop:     96px (md:py-24)

Within Sections:
├─ Mobile:      32px (py-8)
└─ Desktop:     48px (md:py-12)
```

### Breakpoints
```
sm:   640px   (Small tablets)
md:   768px   (Tablets)
lg:   1024px  (Small desktops)
xl:   1280px  (Desktops)
2xl:  1536px  (Large desktops)
```

---

## Interaction Design

### Hover Effects
```
Buttons:
├─ Transform:   translateY(-2px)
├─ Shadow:      Increase shadow
└─ Duration:    200ms ease-out

Cards:
├─ Transform:   scale(1.02)
├─ Shadow:      Increase shadow
└─ Duration:    200ms ease-out

Links:
├─ Color:       Darken by 100
├─ Underline:   Add or thicken
└─ Duration:    150ms ease-out
```

### Transitions
```
Fast:           150ms ease-out (color, opacity)
Standard:       200ms ease-out (transform, shadow)
Slow:           300ms ease-out (layout changes)
```

### Animations
```
Fade In:        opacity 0 → 1, 300ms
Slide In:       translateY(20px) → 0, 300ms
Scale In:       scale(0.95) → 1, 200ms
```

### Focus States
```
Ring:           2px solid Primary Blue
Offset:         2px
Opacity:        50%
Transition:     150ms ease-out
```

### Micro-interactions
- **Button click**: Scale down slightly (0.98) then return
- **Form submit**: Loading spinner replaces button text
- **Success**: Checkmark animation + green flash
- **Error shake**: Horizontal shake animation
- **Copy to clipboard**: Brief "Copied!" tooltip

---

## User Experience Patterns

### Progressive Disclosure
- Show essential information first
- Reveal details on demand (accordions, "Show more")
- Multi-step forms for complex inputs
- Tooltips for additional context

### Feedback & Confirmation
- **Immediate feedback**: Every action gets response
- **Success states**: Green checkmark + confirmation message
- **Error states**: Red icon + helpful error message
- **Loading states**: Spinner or skeleton screen
- **Destructive actions**: Confirmation dialog required

### Empty States
- **Friendly illustration**: Relevant to context
- **Clear message**: Explain why it's empty
- **Action prompt**: CTA to add first item
- **Example**: "No projects yet. Create your first app!"

### Error Handling
- **Inline validation**: Real-time field validation
- **Error summary**: List all errors at top of form
- **Helpful messages**: Explain what went wrong and how to fix
- **Recovery options**: Provide clear next steps

### Navigation Patterns
- **Breadcrumbs**: Show current location in hierarchy
- **Active states**: Highlight current page in navigation
- **Back button**: Always provide way to go back
- **Skip links**: "Skip to main content" for accessibility

---

## Responsive Design

### Mobile-First Approach
1. Design for mobile (320px-640px) first
2. Add tablet styles (640px-1024px)
3. Enhance for desktop (1024px+)

### Touch Targets
```
Minimum:        44px × 44px (WCAG AA)
Recommended:    48px × 48px
Spacing:        8px minimum between targets
```

### Mobile Optimizations
- **Hamburger menu**: Slide-in drawer navigation
- **Stack columns**: Vertical layout on mobile
- **Larger text**: Increase font sizes slightly
- **Simplified layouts**: Remove non-essential elements
- **Thumb-zone**: Place key actions within easy reach

### Tablet Considerations
- **2-column layouts**: Balance between mobile and desktop
- **Larger touch targets**: 48px minimum
- **Landscape mode**: Optimize for horizontal viewing
- **Navigation**: Consider both mobile and desktop patterns

### Desktop Enhancements
- **Multi-column layouts**: Utilize horizontal space
- **Hover states**: Rich hover interactions
- **Keyboard shortcuts**: Power user features
- **Larger imagery**: High-resolution graphics

---

## Accessibility

### WCAG 2.1 Level AA Compliance
- **Color contrast**: 4.5:1 for normal text, 3:1 for large text
- **Keyboard navigation**: All interactive elements accessible
- **Focus indicators**: Visible on all focusable elements
- **Alt text**: Descriptive for all images
- **Semantic HTML**: Proper heading hierarchy, landmarks

### Screen Reader Support
- **ARIA labels**: For custom components
- **Live regions**: Announce dynamic content
- **Skip links**: Jump to main content
- **Descriptive links**: "Read more about pricing" not "Click here"

### Keyboard Navigation
- **Tab order**: Logical left-to-right, top-to-bottom
- **Enter/Space**: Activate buttons and links
- **Escape**: Close modals and dropdowns
- **Arrow keys**: Navigate within components

---

## Performance

### Core Web Vitals
```
LCP (Largest Contentful Paint):  < 2.5s
FID (First Input Delay):         < 100ms
CLS (Cumulative Layout Shift):   < 0.1
```

### Optimization Strategies
- **Image optimization**: WebP format, lazy loading, responsive images
- **Font loading**: Preload critical fonts, font-display: swap
- **Code splitting**: Load only what's needed
- **Caching**: Aggressive caching for static assets
- **CDN**: Serve assets from edge locations

---

## Implementation Guidelines

### CSS Architecture
```
Utility-first:  TailwindCSS for rapid development
Components:     Reusable component classes
Custom:         Minimal custom CSS
BEM:            For complex custom components
```

### Component Structure
```jsx
// Example React component structure
<ComponentName
  variant="primary"
  size="lg"
  disabled={false}
  onClick={handleClick}
>
  Content
</ComponentName>
```

### Naming Conventions
- **Components**: PascalCase (Button, Card, Modal)
- **Props**: camelCase (onClick, isDisabled, userName)
- **CSS classes**: kebab-case (btn-primary, card-header)
- **Files**: kebab-case (button.tsx, card-component.tsx)

### Code Quality
- **TypeScript**: Type-safe components
- **Linting**: ESLint + Prettier
- **Testing**: Unit tests for components
- **Documentation**: Storybook for component library

---

## Acceptance Checklist

### Design
- [ ] Follows brand guidelines (colors, typography, spacing)
- [ ] Responsive across all breakpoints
- [ ] Consistent with existing components
- [ ] Accessible (WCAG 2.1 AA)

### Development
- [ ] Semantic HTML structure
- [ ] Keyboard accessible
- [ ] Focus states visible
- [ ] Loading and error states handled
- [ ] Performance optimized

### Testing
- [ ] Cross-browser tested (Chrome, Firefox, Safari, Edge)
- [ ] Mobile device tested (iOS, Android)
- [ ] Screen reader tested
- [ ] Lighthouse score 95+

---

**Document Version**: 2.0  
**Last Updated**: February 6, 2026  
**Status**: Updated to reflect current app design  
**Related Documents**: Brand Guidelines, Tone & Voice, Accessibility Standards
