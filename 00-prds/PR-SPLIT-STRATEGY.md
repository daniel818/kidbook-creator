# PR Split Strategy - Legal Policies Pricing Branch

## Current State
- **Branch:** `legal-policies-pricing`
- **Commits:** 29 commits ahead of main
- **Files Changed:** 95 files
- **Status:** ✅ All changes committed and pushed

---

## Strategy: Sequential PR Approach

Since all changes are in one branch, we'll create **sequential PRs** where each PR builds on the previous one:

1. **PR #1** merges into `main`
2. **PR #2** is created from updated `main` (includes PR #1)
3. **PR #3** is created from updated `main` (includes PR #1 + #2)
4. And so on...

**Alternative:** Create separate feature branches from `main` and cherry-pick specific commits.

---

## Recommended Approach: Create 6 Feature Branches

### **Step 1: Create PR #1 - i18n Infrastructure**

```bash
# Create branch from main
git checkout main
git pull origin main
git checkout -b pr/01-i18n-infrastructure

# Cherry-pick i18n commits
git cherry-pick <commit-hash-for-i18n-setup>

# Files to include:
# - lib/i18n/config.ts
# - middleware.ts
# - app/layout.tsx (i18n setup only)

# Push and create PR
git push origin pr/01-i18n-infrastructure
```

**PR Title:** `feat: Add i18n infrastructure with middleware and language routing`

**Description:**
- Sets up i18next configuration
- Adds middleware for language detection
- Configures routing for multilingual support
- Foundation for all other PRs

**Files:** 3-4 files, ~200 lines

---

### **Step 2: Create PR #2 - Legal Pages** (depends on PR #1)

```bash
# Create branch from main (after PR #1 merges)
git checkout main
git pull origin main
git checkout -b pr/02-legal-pages

# Cherry-pick legal page commits
git cherry-pick <legal-commits>

# Files to include:
# - app/[locale]/terms/page.tsx + .module.css
# - app/[locale]/privacy/page.tsx + .module.css
# - locales/{en,he,de}/terms.json
# - locales/{en,he,de}/privacy.json
# - 00-prds/LEGAL-PAGES-SIMPLIFICATION-PLAN.md

# Push and create PR
git push origin pr/02-legal-pages
```

**PR Title:** `feat: Add simplified Terms and Privacy pages with i18n`

**Description:**
- Simple, formatted legal pages
- Flattened translation structure
- All content preserved (46 Terms + 25 Privacy sections)
- Print-friendly design

**Files:** 10 files, ~2,100 lines

---

### **Step 3: Create PR #3 - Pricing Page** (depends on PR #1)

```bash
# Create branch from main (after PR #1 merges)
git checkout main
git pull origin main
git checkout -b pr/03-pricing-page

# Cherry-pick pricing commits
git cherry-pick <pricing-commits>

# Files to include:
# - app/[locale]/pricing/page.tsx + .module.css
# - components/PricingMatrix/*
# - components/PricingCard/*
# - components/PricingFAQ/*
# - locales/{en,he,de}/pricing.json

# Push and create PR
git push origin pr/03-pricing-page
```

**PR Title:** `feat: Add pricing page with currency switcher and FAQ`

**Description:**
- Pricing matrix with 6 options
- Currency switcher (USD, EUR, ILS)
- Pricing-specific FAQ
- Responsive design

**Files:** 14 files, ~2,200 lines

---

### **Step 4: Create PR #4 - FAQ System** (depends on PR #1)

```bash
# Create branch from main (after PR #1 merges)
git checkout main
git pull origin main
git checkout -b pr/04-faq-system

# Cherry-pick FAQ commits
git cherry-pick <faq-commits>

# Files to include:
# - app/[locale]/faq/page.tsx
# - components/FAQ/*
# - lib/faq/types.ts
# - lib/faq/utils.ts
# - locales/{en,he,de}/faq.json

# Push and create PR
git push origin pr/04-faq-system
```

**PR Title:** `feat: Add FAQ system with search and categories`

**Description:**
- Searchable FAQ with categories
- Expand/collapse functionality
- Contact section
- Fully translated

**Files:** 10 files, ~2,800 lines

---

### **Step 5: Create PR #5 - About & Footer** (depends on PR #1)

```bash
# Create branch from main (after PR #1 merges)
git checkout main
git pull origin main
git checkout -b pr/05-about-footer

# Cherry-pick about and footer commits
git cherry-pick <about-footer-commits>

# Files to include:
# - app/[locale]/about/page.tsx + .module.css
# - components/Footer/Footer.tsx + .module.css
# - locales/{en,he,de}/about.json
# - locales/{en,he,de}/footer.json
# - 00-prds/COMPONENT-CONSOLIDATION-PLAN.md

# Push and create PR
git push origin pr/05-about-footer
```

**PR Title:** `feat: Add About page and Footer with component consolidation`

**Description:**
- Consolidated About page (hero, story, CTA, contact)
- Consolidated Footer component
- Contact section with email button
- Fully translated

**Files:** 11 files, ~1,600 lines

---

### **Step 6: Create PR #6 - Navbar Updates** (depends on PR #1)

```bash
# Create branch from main (after PR #1 merges)
git checkout main
git pull origin main
git checkout -b pr/06-navbar-updates

# Cherry-pick navbar commits
git cherry-pick <navbar-commits>

# Files to include:
# - components/Navbar/Navbar.tsx + .module.css
# - components/LanguageSwitcher/LanguageSwitcher.tsx + .module.css
# - locales/{en,he,de}/navbar.json

# Push and create PR
git push origin pr/06-navbar-updates
```

**PR Title:** `feat: Update Navbar with new page links and language switcher`

**Description:**
- Updated links to new pages
- Improved language switcher with currency
- Responsive design

**Files:** 8 files, ~400 lines

---

## Simplified Approach: Manual PR Creation

Since cherry-picking 29 commits is complex, here's a **simpler approach**:

### **Option A: Create PRs Sequentially**

1. **Merge current branch to main** (all changes at once)
2. Then create **documentation/cleanup PRs** if needed

**Pros:** Simple, fast
**Cons:** Large single PR, harder to review

### **Option B: Create Feature Branches Manually**

1. For each PR, create a new branch from `main`
2. Manually copy files for that feature
3. Commit and push
4. Create PR

**Pros:** Clean separation, easy to review
**Cons:** More manual work

---

## Recommended: Option B (Manual Feature Branches)

This is the cleanest approach for your situation:

### **PR #1: i18n Infrastructure**
```bash
git checkout main
git checkout -b pr/01-i18n-infrastructure

# Copy files:
cp legal-policies-pricing:lib/i18n/config.ts lib/i18n/config.ts
cp legal-policies-pricing:middleware.ts middleware.ts
# Update app/layout.tsx with i18n setup

git add lib/i18n/config.ts middleware.ts app/layout.tsx
git commit -m "feat: Add i18n infrastructure"
git push origin pr/01-i18n-infrastructure
```

Then create PR on GitHub.

### **Repeat for each PR** with their respective files.

---

## Next Steps

1. **Choose approach:** Sequential merge OR Manual feature branches
2. **Create first PR** (i18n infrastructure)
3. **Wait for review and merge**
4. **Create subsequent PRs** one by one

Would you like me to:
- A) Help create the manual feature branches with file copying?
- B) Provide detailed git commands for cherry-picking?
- C) Create a single large PR and document the changes?
