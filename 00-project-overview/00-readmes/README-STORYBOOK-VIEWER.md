# StoryBook Viewer Component

> Interactive book viewer with page-flip animation

## Overview

The StoryBookViewer component provides an immersive reading experience with realistic page-flip animations using `react-pageflip`.

---

## Features

- **Page-flip animation** - Realistic book turning effect
- **Keyboard navigation** - Arrow keys, spacebar, F for fullscreen
- **Touch support** - Swipe gestures on mobile
- **Fullscreen mode** - Immersive reading experience
- **PDF download** - Export book as PDF
- **Progress indicator** - Visual reading progress

---

## Usage

```tsx
import StoryBookViewer from '@/components/StoryBookViewer';

<StoryBookViewer
  book={book}
  onClose={() => setShowViewer(false)}
  isFullScreen={false}
/>
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `book` | `Book` | Book data with pages |
| `onClose` | `() => void` | Close handler |
| `isFullScreen` | `boolean` | Start in fullscreen |

---

## Book Structure

### Page Types

| Type | Position | Description |
|------|----------|-------------|
| `cover` | First | Front cover with title |
| `inside` | Middle | Content pages (illustration + text) |
| `back` | Last | Back cover |

### Spread Layout

Each inside page creates a two-page spread:
- **Left page** - Full-bleed illustration
- **Right page** - Story text

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←` | Previous page |
| `→` / `Space` | Next page |
| `F` | Toggle fullscreen |
| `Esc` | Exit fullscreen or close |

---

## Components

### Page Wrappers

```tsx
// Generic page with ref forwarding
const Page = forwardRef((props, ref) => (
  <div className={styles.page} ref={ref}>
    {props.children}
  </div>
));

// Hard cover page
const Cover = forwardRef((props, ref) => (
  <div className={styles.cover} ref={ref} data-density="hard">
    {props.children}
  </div>
));
```

### IllustrationPage

Full-bleed image display for left side of spread.

### TextPage

Story text with elegant typography for right side.

---

## HTMLFlipBook Configuration

```tsx
<HTMLFlipBook
  width={550}
  height={733}
  size="fixed"
  maxShadowOpacity={0.5}
  showCover={true}
  mobileScrollSupport={true}
  flippingTime={600}
  drawShadow={true}
  showPageCorners={true}
/>
```

---

## Auto-Open Animation

Book automatically opens after mounting:

```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    if (currentPageIndex === 0 && bookRef.current) {
      bookRef.current.pageFlip().flipNext();
    }
  }, 1200);
  return () => clearTimeout(timer);
}, []);
```

---

## Files

| File | Purpose |
|------|---------|
| `components/StoryBookViewer.tsx` | Main component |
| `components/StoryBookViewer.module.css` | Styles |
| `components/StoryBookViewer3D.tsx` | 3D variant |

---

## Dependencies

```json
{
  "react-pageflip": "^2.0.3"
}
```
