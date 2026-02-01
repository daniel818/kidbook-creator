# PRD: Book Viewer UI Reorganization

**Date:** 2026-01-30  
**Status:** Planning  
**Priority:** Medium  
**Estimated Effort:** 2-3 days

---

## 1. Overview

Reorganize the book viewer interface to improve user experience and create a clearer visual hierarchy. The main changes involve reordering buttons, updating labels, adding a new "Download Digital" option, and repositioning the "Order Print" button to a floating bottom-right position.

---

## 2. Current State

### Current Button Order (Left to Right):
1. Edit
2. Back
3. Price indicator ($0.921)
4. Page management (back arrow, page number, forward arrow)
5. Order Print
6. Fullscreen
7. Download PDF

### Issues:
- Button order doesn't follow logical user flow
- "Order Print" is in the main toolbar competing for attention
- No clear separation between navigation, testing tools, and actions
- Missing "Download Digital" option for digital purchases

---

## 3. Proposed Changes

### 3.1 New Layout Structure

#### **Left Side:**
1. **Back Button** → Update text to "My Books" with back arrow icon
2. **Testing Area** (for development/testing):
   - Pricing indicator
   - Download PDF (same button, combined)

#### **Center:**
3. **Page Management** (no change)
   - Previous page arrow
   - Page number indicator
   - Next page arrow

#### **Right Side:**
4. **Edit Story** button
5. **Download Digital** button (NEW)
   - For production: leads to payment page with digital option selected
   - For testing: direct download

#### **Bottom-Right (Floating):**
6. **Order Print** button
   - Hovering/floating position
   - Positioned to the right of "Use arrow keys..." instructions
   - Below the book viewer itself

---

## 4. Detailed Requirements

### 4.1 Back Button
- **Current:** "← Back"
- **New:** "← My Books"
- **Behavior:** Navigate back to books library
- **Position:** Far left of toolbar

### 4.2 Testing Area
- **Components:**
  - Pricing indicator (e.g., "💰 $0.921")
  - Download PDF button
- **Visibility:** Show in development/testing mode only
- **Position:** Left side, after Back button

### 4.3 Page Management
- **No changes to functionality**
- **Position:** Center of toolbar
- **Components:** Previous | Page X/Y | Next

### 4.4 Edit Story Button
- **Current:** "Edit"
- **New:** "Edit Story"
- **Position:** Right side of toolbar
- **Behavior:** Navigate to story editor

### 4.5 Download Digital Button (NEW)
- **Label:** "Download Digital"
- **Position:** Right side, after Edit Story
- **Behavior:**
  - **Production/Real Users:** Navigate to payment/checkout page with digital option pre-selected
  - **Testing/Dev:** Direct download of digital version
- **Icon:** Download icon
- **Style:** Secondary button style

### 4.6 Order Print Button (RELOCATED)
- **Current Position:** Main toolbar
- **New Position:** Bottom-right, floating/hovering
- **Layout:**
  ```
  [Book Viewer Area]
  
  "Use arrow keys..." instructions    [Order Print Button]
  ```
- **Behavior:** Navigate to payment/checkout page with print option
- **Style:** 
  - Prominent button (purple/primary color)
  - Slightly elevated/shadowed to indicate floating
  - Fixed position relative to viewport

### 4.7 Removed from Main Toolbar
- **Fullscreen button:** Remove or relocate (TBD)
- **Download PDF:** Move to testing area

---

## 5. Technical Implementation

### 5.1 Files to Modify
- `components/StoryBookViewer.tsx` - Main component logic
- `components/StoryBookViewer.module.css` - Styling updates
- Related translation files for new button labels

### 5.2 Key Changes

#### Component Structure:
```tsx
<div className={styles.toolbar}>
  {/* Left Section */}
  <div className={styles.leftSection}>
    <BackButton label="My Books" />
    {isTestingMode && <TestingArea />}
  </div>
  
  {/* Center Section */}
  <div className={styles.centerSection}>
    <PageManagement />
  </div>
  
  {/* Right Section */}
  <div className={styles.rightSection}>
    <EditStoryButton />
    <DownloadDigitalButton />
  </div>
</div>

{/* Floating Bottom-Right */}
<div className={styles.floatingPrintButton}>
  <OrderPrintButton />
</div>
```

#### CSS Updates:
- Flexbox layout for toolbar sections
- Fixed positioning for floating print button
- Responsive behavior for mobile/tablet
- Z-index management for floating elements

### 5.3 Payment Flow Integration
- Download Digital button should integrate with existing checkout API
- Pre-select digital option when navigating to payment page
- Pass book ID and format preference as URL parameters

---

## 6. User Experience Considerations

### 6.1 Visual Hierarchy
- **Primary Actions:** Edit Story, Download Digital, Order Print
- **Navigation:** My Books (back)
- **Utility:** Page management
- **Testing:** Price/PDF download (dev only)

### 6.2 Mobile Responsiveness
- Toolbar should stack or compress on smaller screens
- Floating print button should remain accessible
- Consider hamburger menu for mobile if needed

### 6.3 Accessibility
- All buttons must have proper ARIA labels
- Keyboard navigation support
- Focus management for floating elements

---

## 7. Testing Requirements

### 7.1 Functional Testing
- [ ] Back button navigates to books library
- [ ] Edit Story button opens editor
- [ ] Download Digital button leads to payment (production) or downloads (dev)
- [ ] Order Print button leads to payment with print option
- [ ] Page management works correctly
- [ ] Testing area only visible in dev mode

### 7.2 Visual Testing
- [ ] Button layout matches specification
- [ ] Floating print button positioned correctly
- [ ] Responsive behavior on mobile/tablet/desktop
- [ ] Hover states and interactions work properly

### 7.3 Integration Testing
- [ ] Payment flow integration for Download Digital
- [ ] Payment flow integration for Order Print
- [ ] Proper book ID and format passing

---

## 8. Success Metrics

- Clearer visual hierarchy in book viewer
- Improved user flow for purchasing options
- Reduced toolbar clutter
- Better separation of testing vs. production features

---

## 9. Future Considerations

- Analytics tracking for button usage
- A/B testing for button placement
- Additional download formats
- Print preview functionality

---

## 10. Open Questions

1. Should fullscreen button be removed entirely or relocated?
2. What should happen if user clicks Download Digital without being logged in?
3. Should there be a tooltip or help text for the floating Order Print button?
4. Mobile behavior for floating button - same position or different?

---

## 11. Dependencies

- Existing checkout/payment API
- Translation system for new button labels
- Testing mode detection logic

---

## 12. Timeline

- **Day 1:** Component restructuring and layout changes
- **Day 2:** Download Digital integration and payment flow
- **Day 3:** Styling, responsive behavior, and testing
