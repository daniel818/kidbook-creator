# PRD: User Profile & Navigation System

## Introduction/Overview

This feature implements a comprehensive user profile and navigation system for KidBook Creator. Currently, the header displays the full email address (e.g., `danielercohen@gmail.com`) with a "Sign Out" button. This PRD outlines the redesign to use user initials (e.g., "DC" for Daniel Cohen) with a dropdown menu containing profile navigation options.

**Problem:** Users need easy access to their account information, created books, purchase history, and settings without cluttering the header.

**Goal:** Create an intuitive, professional user profile system with initials-based navigation and a comprehensive profile page.

---

## Goals

1. Replace email display in header with user initials (auto-generated from name)
2. Implement dropdown menu with navigation options (My Books, Purchases, Profile, Sign Out)
3. Create a comprehensive Profile page with all user account information
4. Connect "My Books" navigation to existing books page
5. Provide seamless user experience for account management

---

## User Stories

1. **As a logged-in user**, I want to see my initials in the header instead of my full email, so that the interface looks cleaner and more professional.

2. **As a user**, I want to click on my initials to see a dropdown menu with navigation options, so that I can quickly access my books, purchases, and profile.

3. **As a user**, I want to view and edit my profile information (name, email, child profiles), so that I can keep my account up to date.

4. **As a user**, I want to see all my created books in one place, so that I can easily find and manage my stories.

5. **As a user**, I want to view my purchase history and track orders, so that I know when my books will arrive.

6. **As a parent**, I want to manage multiple child profiles, so that I can create personalized stories for each of my children.

---

## Functional Requirements

### Header Navigation (FR-001 to FR-006)

**FR-001:** The header must display user initials instead of email address
- Extract first letter of first name and first letter of last name
- Display in uppercase (e.g., "Daniel Cohen" → "DC")
- If no last name, use first two letters of first name
- Style as circular avatar with background color

**FR-002:** The initials must be clickable and open a dropdown menu
- Dropdown appears below the initials
- Contains 4 menu items: "My Books", "Purchases", "Profile", "Sign Out"
- Dropdown closes when clicking outside or selecting an item

**FR-003:** The dropdown menu must navigate to correct pages
- "My Books" → `/books` (existing page)
- "Purchases" → `/purchases` (new page)
- "Profile" → `/profile` (new page)
- "Sign Out" → Logout and redirect to homepage

**FR-004:** The header must show active state for current page
- Highlight "My Books", "Purchases", or "Profile" in dropdown if on that page
- Visual indicator (background color or checkmark)

**FR-005:** The header must be responsive on mobile
- Initials remain visible on mobile
- Dropdown menu adapts to smaller screens
- Touch-friendly tap targets (minimum 44px)

**FR-006:** The header must maintain existing navigation items
- Keep "Create Story" button/link
- Maintain logo on the left
- Preserve existing styling and brand colors

### Profile Page (FR-007 to FR-020)

**FR-007:** The profile page must display general user information
- Full name (editable)
- Email address (editable with verification)
- Account created date (read-only)
- Language preference dropdown (DE/HE/EN)

**FR-008:** The profile page must allow editing general information
- Edit button for each field
- Save/Cancel buttons
- Form validation (email format, required fields)
- Success/error messages after save

**FR-009:** The profile page must display child profiles section
- List all child profiles
- Show name, age, gender for each child
- "Add Child" button to create new profile
- Edit/Delete buttons for each child

**FR-010:** The profile page must allow adding new child profiles
- Modal or form with fields: Name, Age, Gender, Interests
- Optional profile picture upload
- Save button creates new child profile in database
- Cancel button closes form without saving

**FR-011:** The profile page must allow editing child profiles
- Click edit button opens form with pre-filled data
- Update fields and save
- Validation: Name required, age 0-18

**FR-012:** The profile page must allow deleting child profiles
- Confirmation modal: "Are you sure you want to delete [child name]?"
- Delete button removes child from database
- Cannot delete if child has associated stories (show warning)

**FR-013:** The profile page must display books created section
- List of all user's stories
- Show: Title, child name, creation date, status (Draft/Completed/Ordered)
- Quick action buttons: Edit, Order, Share
- Filter by child or date
- Pagination if more than 10 books

**FR-014:** The profile page must display purchases/order history section
- List of all orders
- Show: Order number, date, book title, status, tracking number
- Click order to see details
- Download receipt button
- Reorder button for completed orders

**FR-015:** The profile page must display account settings section
- Change password button (opens modal)
- Payment methods (Stripe integration)
- Shipping addresses (add/edit/delete)
- Notification preferences (email/push toggles)

**FR-016:** The profile page must display subscription information
- Current plan (Free/Monthly/Annual)
- Renewal date
- Billing history
- Upgrade/Downgrade buttons
- Cancel subscription button

**FR-017:** The profile page must integrate with Supabase Auth
- Fetch user data from `users` table
- Update user profile via Supabase API
- Handle authentication errors gracefully

**FR-018:** The profile page must integrate with Supabase database
- Fetch child profiles from `child_profiles` table
- Fetch stories from `stories` table
- Fetch orders from `orders` table
- Real-time updates using Supabase Realtime (optional)

**FR-019:** The profile page must be responsive
- Mobile-first design
- Stack sections vertically on mobile
- Touch-friendly buttons and inputs
- Readable text sizes on all devices

**FR-020:** The profile page must have proper loading and error states
- Loading spinner while fetching data
- Error messages if data fetch fails
- Empty states for no books, no orders, no children
- Retry button on errors

### Data Requirements (FR-021 to FR-023)

**FR-021:** The system must store user profile data in Supabase
- Table: `users` (id, email, first_name, last_name, created_at, language_preference)
- Row-Level Security (RLS) enabled
- Users can only read/update their own data

**FR-022:** The system must store child profiles in Supabase
- Table: `child_profiles` (id, user_id, name, age, gender, interests, profile_picture_url, created_at)
- Foreign key to `users` table
- RLS: Users can only access their own children

**FR-023:** The system must generate initials from user name
- Extract from `first_name` and `last_name` fields
- Fallback to email if name not set
- Cache initials in component state

---

## Non-Goals (Out of Scope)

1. **Social features** - No friend lists, sharing profiles, or social connections
2. **Advanced analytics** - No detailed usage statistics on profile page (use Mixpanel separately)
3. **Two-factor authentication** - Not included in this PRD (future enhancement)
4. **Profile picture upload** - Use initials only for MVP (future enhancement)
5. **Email verification flow** - Assume Supabase Auth handles this
6. **Password reset** - Use Supabase Auth built-in flow
7. **Delete account** - Not included in this PRD (future enhancement)
8. **Export data** - GDPR data export not in scope for MVP

---

## Design Considerations

### UI Components
- Use existing **shadcn/ui** components:
  - `DropdownMenu` for initials dropdown
  - `Avatar` for initials display
  - `Card` for profile sections
  - `Button` for actions
  - `Input` and `Form` for editing
  - `Dialog` for modals (add/edit child, confirmations)

### Styling
- Follow existing **TailwindCSS** patterns
- Use brand colors from brand guidelines
- Maintain consistent spacing (4pt grid)
- Ensure WCAG 2.1 AA accessibility

### User Flow
```
Header: [Logo] Create Story    My Books    Purchases    Profile    [DC ▼]
                                                              ├─ My Books → /books
                                                              ├─ Purchases → /purchases
                                                              ├─ Profile → /profile
                                                              └─ Sign Out → Logout
```

### Profile Page Layout
```
Profile Page
├─ General Information (Name, Email, Language)
├─ Child Profiles (List with Add/Edit/Delete)
├─ Books Created (List with filters)
├─ Purchases/Order History (List with tracking)
├─ Account Settings (Password, Payment, Addresses)
└─ Subscription (Plan, Billing, Manage)
```

---

## Technical Considerations

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Components:** React Server Components where possible, Client Components for interactivity
- **State Management:** React Context or Zustand for user profile state
- **Forms:** React Hook Form + Zod validation
- **API Calls:** Supabase client (server-side and client-side)

### Backend
- **Database:** Supabase PostgreSQL
- **Tables:** `users`, `child_profiles`, `stories`, `orders`
- **Auth:** Supabase Auth (session management)
- **RLS:** Row-Level Security policies for data protection

### Security
- Validate all user inputs (XSS prevention)
- Use parameterized queries (SQL injection prevention)
- Implement rate limiting on profile updates
- Ensure RLS policies are correctly configured

### Performance
- Cache user profile data in component state
- Use React Server Components for static sections
- Lazy load child profiles and orders
- Optimize images (profile pictures, if added later)

---

## Success Metrics

1. **Adoption Rate:** 90%+ of logged-in users access the profile page within first week
2. **Engagement:** Average 2+ child profiles created per user
3. **Usability:** <5% support tickets related to profile navigation
4. **Performance:** Profile page loads in <2 seconds
5. **Conversion:** 15%+ of users who view profile upgrade to subscription

---

## Implementation Plan

### Phase 1: Header Navigation (Week 1)
1. Update header component to display initials
2. Implement dropdown menu with navigation
3. Connect "My Books" to existing `/books` page
4. Add "Sign Out" functionality
5. Test responsive behavior

### Phase 2: Profile Page Structure (Week 1-2)
1. Create `/profile` page route
2. Implement general information section
3. Add child profiles section (list view)
4. Add books created section (connect to existing data)
5. Add purchases section (placeholder for now)

### Phase 3: Edit Functionality (Week 2)
1. Implement edit forms for general information
2. Add/edit/delete child profiles
3. Form validation and error handling
4. Success/error messages

### Phase 4: Integration & Polish (Week 2-3)
1. Connect to Supabase database
2. Implement RLS policies
3. Add loading and error states
4. Responsive design testing
5. Accessibility audit
6. User testing and feedback

---

## Open Questions

1. **Should we allow users to change their email address?** If yes, do we need email verification?
   - *Recommendation:* Yes, with email verification via Supabase Auth

2. **What happens to stories if a child profile is deleted?**
   - *Recommendation:* Prevent deletion if child has stories, or reassign stories to "No Child" category

3. **Should we show subscription information on profile page or separate billing page?**
   - *Recommendation:* Show summary on profile, link to detailed billing page

4. **Do we need to support profile picture uploads in MVP?**
   - *Recommendation:* No, use initials only for MVP, add profile pictures in Phase 2

5. **Should purchases section show all orders or just recent ones?**
   - *Recommendation:* Show all with pagination, default to most recent 10

---

## Acceptance Criteria

### Header
- [ ] Initials display correctly for all users (first + last name)
- [ ] Dropdown menu opens on click and closes on outside click
- [ ] All navigation links work correctly
- [ ] Sign out logs user out and redirects to homepage
- [ ] Responsive on mobile (tested on 375px width)

### Profile Page
- [ ] General information displays correctly
- [ ] User can edit name, email, language preference
- [ ] Child profiles list displays all children
- [ ] User can add new child profile
- [ ] User can edit existing child profile
- [ ] User can delete child profile (with confirmation)
- [ ] Books created section shows all user stories
- [ ] Purchases section shows all orders with tracking
- [ ] Account settings section displays correctly
- [ ] Subscription information displays correctly
- [ ] All forms validate inputs properly
- [ ] Loading states show while fetching data
- [ ] Error states display helpful messages
- [ ] Page is fully responsive (mobile, tablet, desktop)
- [ ] Accessibility: Keyboard navigation works, screen reader friendly

---

## Database Schema

### Users Table (existing, add columns)
```sql
ALTER TABLE users
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT,
ADD COLUMN language_preference TEXT DEFAULT 'de';
```

### Child Profiles Table (new)
```sql
CREATE TABLE child_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER CHECK (age >= 0 AND age <= 18),
  gender TEXT,
  interests TEXT[],
  profile_picture_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE child_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own child profiles"
  ON child_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own child profiles"
  ON child_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own child profiles"
  ON child_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own child profiles"
  ON child_profiles FOR DELETE
  USING (auth.uid() = user_id);
```

---

**Status:** Ready for implementation
**Priority:** High
**Estimated Effort:** 2-3 weeks
**Dependencies:** Supabase Auth, existing books page
