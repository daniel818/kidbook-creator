# Sparkee Studios Accessibility Standards

**Compliance Target**: WCAG 2.1 Level AA  
**Scope**: All website pages, forms, interactive elements, and content  
**Testing**: Manual and automated testing required before launch  
**Maintenance**: Ongoing accessibility audits and updates

---

## Accessibility Targets

### WCAG 2.1 Level AA Compliance
- **Perceivable**: Information and UI components must be presentable to users in ways they can perceive
- **Operable**: UI components and navigation must be operable
- **Understandable**: Information and operation of UI must be understandable
- **Robust**: Content must be robust enough to be interpreted by assistive technologies

### Legal & Regulatory
- **EU Web Accessibility Directive**: Compliance for public sector websites
- **Austrian E-Government Act**: Accessibility requirements
- **GDPR**: Privacy and data protection considerations
- **Best practices**: Beyond minimum compliance for better user experience

---

## Color & Contrast

### Contrast Ratios (WCAG 2.1 AA)

#### Text Contrast
- **Normal text** (< 24px or < 19px bold): **4.5:1 minimum**
  - Gray 900 (#111827) on White (#FFFFFF): 16.9:1 
  - Gray 700 (#374151) on White: 10.7:1 
  - Gray 500 (#6B7280) on White: 4.6:1 

- **Large text** (≥ 24px or ≥ 19px bold): **3:1 minimum**
  - All heading colors meet this requirement

#### UI Component Contrast
- **Interactive elements**: **3:1 minimum** vs adjacent colors
  - Primary Blue (#2563EB) on White: 8.6:1 
  - Secondary Violet (#7C3AED) on White: 6.3:1 
  - Borders (Gray 300 #D1D5DB): 3.1:1 

#### Focus Indicators
- **Focus ring**: **3:1 minimum** vs adjacent colors
  - Primary Blue (#2563EB) 2px ring with 2px offset
  - Visible on all interactive elements
  - Never remove without providing alternative

### Color Usage Guidelines
- **Never rely on color alone**: Use icons, labels, or patterns in addition to color
- **Link identification**: Underline links or provide 3:1 contrast with surrounding text
- **Form validation**: Use icons + text, not just red/green colors
- **Charts/graphs**: Use patterns or labels in addition to colors

### Color Blindness Considerations
- **Test with simulators**: Deuteranopia, Protanopia, Tritanopia
- **Avoid problematic combinations**: Red/green, blue/yellow without additional indicators
- **Success/error states**: Use icons () in addition to colors

---

## Typography & Readability

### Font Sizes
- **Minimum body text**: 16px (1rem)
- **Small text**: 14px minimum, only for secondary information
- **Touch targets**: 48px minimum height for interactive elements
- **Line height**: 1.5 minimum for body text
- **Paragraph width**: Max 80 characters per line

### Font Weights
- **Minimum weight**: 400 (Regular) for body text
- **Avoid thin fonts**: No weights below 400
- **Sufficient contrast**: Between font weight and background

### Text Spacing
- **Line height**: 1.5× font size minimum
- **Paragraph spacing**: 2× font size minimum
- **Letter spacing**: 0.12× font size minimum
- **Word spacing**: 0.16× font size minimum
- **User override**: Allow users to adjust spacing without breaking layout

### Language & Clarity
- **Reading level**: Grade 10-12 for business content
- **Plain language**: Clear, concise, jargon-free
- **Sentence case**: Preferred over ALL CAPS
- **Abbreviations**: Expand on first use

---

## Keyboard Navigation & Focus

### Keyboard Access
- **All interactive elements**: Accessible via Tab/Shift+Tab
- **Logical tab order**: Left-to-right, top-to-bottom
- **No keyboard traps**: Users can always navigate away
- **Skip links**: "Skip to main content" link at top of page
- **Keyboard shortcuts**: Document any custom shortcuts

### Focus Indicators
- **Always visible**: Clear focus ring on all interactive elements
- **Sufficient contrast**: 3:1 minimum vs adjacent colors
- **Focus ring style**: 2px solid Primary Blue (#2563EB), 2px offset
- **Never remove**: Without providing equally visible alternative
- **Focus order**: Matches visual layout

### Interactive Elements
- **Buttons**: Accessible via Enter/Space
- **Links**: Accessible via Enter
- **Forms**: Tab through fields, submit with Enter
- **Dropdowns**: Arrow keys to navigate, Enter to select
- **Modals**: Focus trapped within modal, Escape to close
- **Carousels**: Keyboard controls provided

---

## Semantic HTML & Structure

### Semantic Elements
- **Landmarks**: `<header>`, `<nav>`, `<main>`, `<footer>`, `<aside>`
- **Headings**: Proper hierarchy (H1 → H2 → H3), no skipping levels
- **Lists**: Use `<ul>`, `<ol>`, `<dl>` for list content
- **Tables**: Use `<table>` with `<th>`, proper headers
- **Forms**: Use `<label>`, `<fieldset>`, `<legend>`

### Heading Structure
- **One H1 per page**: Page title/main heading
- **Logical hierarchy**: H2 for sections, H3 for subsections
- **No skipping levels**: H1 → H2 → H3 (not H1 → H3)
- **Descriptive text**: Headings describe content clearly

### ARIA Labels
- **Use sparingly**: Prefer semantic HTML first
- **When needed**: For custom widgets, dynamic content
- **Common attributes**: `aria-label`, `aria-labelledby`, `aria-describedby`
- **Live regions**: `aria-live` for dynamic updates
- **Hidden content**: `aria-hidden="true"` for decorative elements

---

## Forms & Input

### Form Labels
- **Every input has label**: Visible and programmatically associated
- **Label association**: Use `<label for="id">` or wrap input
- **Required fields**: Marked with asterisk (*) and `aria-required="true"`
- **Placeholder text**: Not a replacement for labels

### Form Validation
- **Clear error messages**: Specific, actionable guidance
- **Error identification**: Icon + text + color
- **Error location**: Near the problematic field
- **Error summary**: At top of form for multiple errors
- **Success confirmation**: Clear feedback on successful submission

### Input Types
- **Appropriate types**: `type="email"`, `type="tel"`, `type="number"`
- **Autocomplete**: Use `autocomplete` attribute for common fields
- **Touch targets**: Minimum 48px height
- **Focus states**: Clear visual indication

---

## Images & Media

### Alt Text
- **Informative images**: Describe content and function
- **Decorative images**: Empty alt (`alt=""`)
- **Complex images**: Longer description via `aria-describedby` or adjacent text
- **Functional images**: Describe action (e.g., "Search" not "Magnifying glass")
- **Text in images**: Avoid or provide full text in alt

### Alt Text Examples

**Hero Image (App Mockup)**
- "Restaurant booking app displayed on iPhone showing table reservation interface"
- "Phone" or "App screenshot"

**Icon Button**
- "Open menu" or "Close dialog"
- "Hamburger icon" or "X icon"

**Logo**
- "Sparkee Studios" or "Sparkee Studios home"
- "Logo"

**Decorative Illustration**
- `alt=""` (empty)
- "Illustration" or "Graphic"

### Video & Audio
- **Captions**: Synchronized captions for all video content
- **Transcripts**: Text transcripts for audio and video
- **Audio descriptions**: For important visual information
- **Controls**: Accessible play/pause/volume controls
- **Autoplay**: Avoid or provide easy pause mechanism

---

## Motion & Animation

### Reduced Motion
- **Respect preference**: Honor `prefers-reduced-motion` media query
- **Alternative animations**: Fade/dissolve instead of motion
- **User control**: Provide pause/stop for auto-playing content
- **No flashing**: Avoid content that flashes more than 3 times per second

### Animation Guidelines
- **Duration**: 150-300ms for UI transitions
- **Easing**: Smooth, natural easing functions
- **Purpose**: Animations should enhance, not distract
- **Parallax**: Disable for users with reduced motion preference
- **Auto-play**: Avoid auto-playing carousels; provide controls

### Implementation Example
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Responsive & Mobile Accessibility

### Touch Targets
- **Minimum size**: 48×48px (WCAG 2.1 Level AAA: 44×44px)
- **Spacing**: 8px minimum between targets
- **Buttons**: Large enough for finger taps
- **Links**: Adequate spacing in navigation

### Mobile Considerations
- **Zoom**: Allow pinch-to-zoom (no `user-scalable=no`)
- **Orientation**: Support both portrait and landscape
- **Text reflow**: Content reflows at 320px width
- **Touch gestures**: Provide alternatives to complex gestures

### Responsive Text
- **Scalable**: Text can be resized to 200% without loss of functionality
- **No horizontal scrolling**: At 200% zoom
- **Readable**: Maintains readability at all sizes

---

## Screen Reader Support

### Screen Reader Testing
- **Test with**: NVDA (Windows), JAWS (Windows), VoiceOver (Mac/iOS)
- **Navigation**: Ensure logical reading order
- **Announcements**: Dynamic content changes announced
- **Forms**: Labels and errors read correctly

### Best Practices
- **Descriptive links**: "Read more about pricing" not "Click here"
- **Page titles**: Unique, descriptive `<title>` for each page
- **Language**: Declare language with `lang` attribute
- **Skip links**: Allow skipping repetitive content
- **Landmarks**: Proper use of semantic landmarks

---

## Testing & Validation

### Automated Testing Tools
- **axe DevTools**: Browser extension for accessibility testing
- **Lighthouse**: Chrome DevTools accessibility audit
- **WAVE**: Web accessibility evaluation tool
- **Pa11y**: Command-line accessibility testing

### Manual Testing
- **Keyboard navigation**: Test all functionality with keyboard only
- **Screen reader**: Test with NVDA, JAWS, or VoiceOver
- **Zoom**: Test at 200% zoom level
- **Color contrast**: Verify with contrast checker tools
- **Mobile**: Test on actual mobile devices

### Testing Checklist
- [ ] All images have appropriate alt text
- [ ] Color contrast meets WCAG 2.1 AA standards
- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible on all elements
- [ ] Semantic HTML structure (headings, landmarks)
- [ ] Forms have proper labels and error handling
- [ ] No keyboard traps
- [ ] Reduced motion preference respected
- [ ] Screen reader announces content correctly
- [ ] Touch targets meet minimum size requirements
- [ ] Text can be resized to 200% without breaking
- [ ] Skip to main content link present

---

## GDPR & Privacy Accessibility

### Cookie Consent
- **Keyboard accessible**: Can accept/reject with keyboard
- **Screen reader friendly**: Clear announcement of purpose
- **Clear language**: Plain language explanations
- **Easy to find**: Privacy settings easily accessible

### Privacy Policy
- **Plain language**: Understandable by non-lawyers
- **Structured**: Clear headings and sections
- **Accessible format**: HTML, not just PDF
- **Easy navigation**: Table of contents for long policies

---

## Acceptance Checklist

### Color & Contrast
- [ ] Text contrast ratios meet WCAG 2.1 AA (4.5:1 normal, 3:1 large)
- [ ] UI component contrast meets 3:1 minimum
- [ ] Focus indicators have 3:1 contrast vs adjacent colors
- [ ] Color not used as only means of conveying information

### Keyboard & Focus
- [ ] All interactive elements keyboard accessible
- [ ] Logical tab order throughout site
- [ ] Visible focus indicators on all interactive elements
- [ ] No keyboard traps
- [ ] Skip to main content link provided

### Structure & Semantics
- [ ] Proper heading hierarchy (H1 → H2 → H3)
- [ ] Semantic HTML landmarks used
- [ ] Forms have proper labels and fieldsets
- [ ] ARIA attributes used appropriately

### Images & Media
- [ ] All images have appropriate alt text
- [ ] Decorative images have empty alt
- [ ] Videos have captions and transcripts
- [ ] Audio content has transcripts

### Motion & Animation
- [ ] Reduced motion preference respected
- [ ] No content flashes more than 3 times per second
- [ ] Auto-playing content can be paused
- [ ] Animations have appropriate duration

### Mobile & Responsive
- [ ] Touch targets minimum 48×48px
- [ ] Content reflows at 320px width
- [ ] Text can be resized to 200% without breaking
- [ ] Pinch-to-zoom enabled

### Testing
- [ ] Automated testing completed (axe, Lighthouse)
- [ ] Manual keyboard testing completed
- [ ] Screen reader testing completed
- [ ] Mobile device testing completed
- [ ] Color contrast verified with tools

---

**Document Version**: 1.0  
**Last Updated**: January 6, 2025  
**Status**: Ready for implementation  
**Next Review**: Before website launch and quarterly thereafter
