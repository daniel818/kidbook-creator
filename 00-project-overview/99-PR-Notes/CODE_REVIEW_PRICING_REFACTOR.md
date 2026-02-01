# Code Review - Pricing Refactor

**Date:** January 30, 2026  
**Branch:** `pricing-refactor`  
**Reviewer:** Cascade AI

---

## Files Changed Summary

### New Files
1. `lib/pricing/constants.ts` - Pricing configuration module
2. `00-project-overview/90-prds/2026-01-30-prd-pricing-refactor.md` - PRD

### Modified Files
1. `app/create/[bookId]/order/page.tsx` - Order page pricing logic
2. `app/[locale]/pricing/page.tsx` - Pricing page display
3. `locales/en.json` - Order translations
4. `locales/de.json` - Order translations
5. `locales/he.json` - Order translations
6. `locales/en/pricing.json` - Pricing page translations + FAQ
7. `locales/de/pricing.json` - Pricing page translations + FAQ
8. `locales/he/pricing.json` - Pricing page translations + FAQ

---

## Issues Found

### 1. ❌ Unused Import: `useCallback`
**File:** `app/create/[bookId]/order/page.tsx:3`  
**Issue:** `useCallback` is imported but never used after removing the `fetchPrice` function  
**Fix:** Remove from imports

### 2. ❌ Unused Function: `getPricingConfig`
**File:** `lib/pricing/constants.ts:72-74`  
**Issue:** `getPricingConfig` function is exported but never used anywhere  
**Fix:** Remove unused function or keep for future use (recommend remove)

### 3. ⚠️ Hardcoded Strings in Order Page
**File:** `app/create/[bookId]/order/page.tsx:937-938`  
**Issue:** Hardcoded English strings instead of translation keys:
```typescript
? 'Digital books are delivered instantly via email after purchase.'
: 'Shipping cost calculated based on your address and selected shipping method.'
```
**Fix:** These should use translation keys (already added to locales)

---

## Positive Findings

### ✅ Pricing Constants Module
- Clean, well-documented implementation
- Type-safe with proper TypeScript types
- Good separation of concerns
- Utility functions are focused and reusable

### ✅ Order Page Changes
- Successfully removed Lulu pricing API dependency
- Shipping calculation still works correctly
- State management simplified
- Digital vs Print logic is clear

### ✅ Pricing Page Updates
- Uses shared constants correctly
- Displays accurate pricing
- FAQ integration is clean

### ✅ Translation Coverage
- All three languages (EN, DE, HE) have complete translations
- FAQ content is comprehensive and professional
- Translation keys are consistently named

### ✅ Code Quality
- No duplicate code detected
- Proper error handling maintained
- Type safety preserved throughout
- Clean git history with descriptive commits

---

## Recommendations

### Critical (Must Fix Before PR)
1. **Remove unused `useCallback` import** from order page
2. **Replace hardcoded strings** with translation keys in order page
3. **Remove unused `getPricingConfig`** function from constants

### Optional (Nice to Have)
1. Consider adding JSDoc comments to order page pricing logic
2. Add unit tests for pricing utility functions
3. Consider extracting shipping calculation to separate hook

---

## Summary

**Overall Assessment:** ✅ **GOOD** - Minor cleanup needed

**Issues to Fix:** 3 (all minor)
- 1 unused import
- 1 unused function  
- 2 hardcoded strings (translations exist, just not used)

**Code Quality:** High - clean implementation, good separation of concerns

**Breaking Changes:** None

**Ready for PR:** After fixing the 3 issues above

---

## Action Items

1. ✅ Remove `useCallback` from imports
2. ✅ Remove `getPricingConfig` function
3. ✅ Replace hardcoded strings with translation keys
4. ✅ Commit fixes
5. ⏳ Create PR
