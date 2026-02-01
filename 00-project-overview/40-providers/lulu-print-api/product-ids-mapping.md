# Lulu Product ID Mapping

> Product ID reference for Lulu print-on-demand integration

---

## Current Product IDs (In Codebase)

### From `lib/lulu/fulfillment.ts` and `lib/lulu/client.ts`

```typescript
const PRODUCT_IDS: Record<string, Record<string, string>> = {
    softcover: {
        '7.5x7.5': '0750X0750FCPREPB080CW444GXX',
        '8x8': '0850X0850FCPREPB080CW444GXX',
        '8x10': '0850X1100FCPREPB080CW444GXX',
    },
    hardcover: {
        '7.5x7.5': '0750X0750FCPRECW080CW444GXX',
        '8x8': '0850X0850FCPRECW080CW444GXX',
        '8x10': '0850X1100FCPRECW080CW444GXX',
    },
};
```

### Saddle Stitch Support (Partial)

```typescript
// From lib/lulu/fulfillment.ts - Special case for low page counts
if (pageCount < 32 && format === 'softcover') {
    if (size === '8x8') {
        return '0850X0850FCPRESS080CW444GXX'; // Saddle Stitch
    }
}
```

---

## Product ID Breakdown

### Naming Convention Analysis

Lulu product IDs follow this pattern:
```
[WIDTH]X[HEIGHT][FORMAT][BINDING][PAPER][COLOR][FINISH][EXTRA]
```

**Example**: `0750X0750FCPREPB080CW444GXX`
- `0750X0750` = 7.5" x 7.5" (in hundredths of an inch)
- `FC` = Full Color
- `PRE` = Premium
- `PB` = Perfect Bound (softcover)
- `080` = 80# paper weight
- `CW` = Coated White
- `444` = Unknown (possibly color space or quality)
- `GXX` = Unknown suffix

---

## Current Size Support

### ✅ Supported Sizes

| Size | Dimensions | Softcover ID | Hardcover ID |
|------|-----------|--------------|--------------|
| 7.5x7.5" | 190 x 190 mm | 0750X0750FCPREPB080CW444GXX | 0750X0750FCPRECW080CW444GXX |
| 8x8" | 203 x 203 mm | 0850X0850FCPREPB080CW444GXX | 0850X0850FCPRECW080CW444GXX |
| 8x10" | 203 x 254 mm | 0850X1100FCPREPB080CW444GXX | 0850X1100FCPRECW080CW444GXX |

### ❌ Missing Sizes (From Pricing Data)

| Size | Dimensions | Status | Notes |
|------|-----------|--------|-------|
| 5x8" (Novella) | 127 x 203 mm | **NOT SUPPORTED** | Need product IDs from Lulu |
| 6.625x10.25" (Comic Book) | 168 x 260 mm | **NOT SUPPORTED** | Need product IDs from Lulu |

---

## Binding Type Codes

Based on current product IDs:

| Binding Type | Code | Description | Example |
|--------------|------|-------------|---------|
| Perfect Bound (Softcover) | `PB` | Glued spine, softcover | 0850X0850FCPRE**PB**080CW444GXX |
| Case Wrap (Hardcover) | `CW` | Hardcover with case wrap | 0750X0750FCPRE**CW**080CW444GXX |
| Saddle Stitch | `SS` | Stapled spine | 0850X0850FCPRE**SS**080CW444GXX |

---

## Paper Type Codes

| Paper Type | Weight | Code | Description |
|------------|--------|------|-------------|
| 60# White Uncoated | 60 lb | `060UW` | Natural finish, text-friendly |
| 80# White Coated | 80 lb | `080CW` | Premium coated, color-friendly |

*Note: Current system only uses 80# Coated White (080CW)*

---

## Required Product IDs (To Be Obtained)

### Novella (5x8" / 127 x 203 mm)

Based on naming convention, expected IDs:

| Configuration | Expected ID Pattern | Notes |
|---------------|---------------------|-------|
| Softcover Perfect Bound (80# Coated) | `0500X0800FCPREPB080CW444GXX` | Config 3 equivalent |
| Hardcover Case Wrap (60# Uncoated) | `0500X0800FCPRECW060UW444GXX` | Config 1 |
| Hardcover Case Wrap (80# Coated) | `0500X0800FCPRECW080CW444GXX` | Config 2 |
| Softcover Saddle Stitch (80# Coated) | `0500X0800FCPRESS080CW444GXX` | Config 3 (if SS available) |

### Comic Book (6.625x10.25" / 168 x 260 mm)

Based on naming convention, expected IDs:

| Configuration | Expected ID Pattern | Notes |
|---------------|---------------------|-------|
| Softcover Saddle Stitch (70# Coated) | `0662X1025FCPRESS070CW444GXX` | Config 6 |

**⚠️ IMPORTANT**: These are **predicted** IDs based on pattern analysis. Must be verified with Lulu API or documentation.

---

## Verification Process

### How to Obtain Correct Product IDs

1. **Lulu API Product Catalog**
   ```bash
   GET https://api.lulu.com/pod-packages/
   ```

2. **Filter by Specifications**
   - Size: 5x8" (0500X0800)
   - Interior: Premium Color (FCPRE)
   - Paper: 60# Uncoated or 80# Coated
   - Binding: Perfect Bound (PB), Case Wrap (CW), or Saddle Stitch (SS)

3. **Test in Sandbox**
   ```typescript
   const lulu = createLuluClient({ sandbox: true });
   await lulu.calculateCost({
       podPackageId: 'CANDIDATE_ID',
       pageCount: 24,
       quantity: 1,
   });
   ```

---

## Configuration to Product ID Mapping

### Config 1: Novella Hardcover (60# Uncoated)
```typescript
{
    size: '5x8',
    format: 'hardcover',
    paper: '60# Uncoated',
    productId: 'TBD - 0500X0800FCPRECW060UW444GXX (predicted)'
}
```

### Config 2: Novella Hardcover (80# Coated)
```typescript
{
    size: '5x8',
    format: 'hardcover',
    paper: '80# Coated',
    productId: 'TBD - 0500X0800FCPRECW080CW444GXX (predicted)'
}
```

### Config 3: Novella Paperback Saddle Stitch
```typescript
{
    size: '5x8',
    format: 'softcover',
    binding: 'saddle-stitch',
    paper: '80# Coated',
    productId: 'TBD - 0500X0800FCPRESS080CW444GXX (predicted)'
}
```

### Config 4: Small Square Paperback Saddle Stitch
```typescript
{
    size: '7.5x7.5',
    format: 'softcover',
    binding: 'saddle-stitch',
    paper: '80# Coated',
    productId: '0750X0750FCPRESS080CW444GXX (predicted)'
}
```
*Note: May already exist in system, check if different from perfect bound*

### Config 5: Small Square Hardcover Case Wrap
```typescript
{
    size: '7.5x7.5',
    format: 'hardcover',
    paper: '80# Coated',
    productId: '0750X0750FCPRECW080CW444GXX' // ✅ Already in system
}
```

### Config 6: Comic Book Paperback Saddle Stitch
```typescript
{
    size: '6.625x10.25',
    format: 'softcover',
    binding: 'saddle-stitch',
    paper: '70# Coated',
    productId: 'TBD - 0662X1025FCPRESS070CW444GXX (predicted)'
}
```

---

## Integration Checklist

### Phase 1: Verification
- [ ] Query Lulu API for 5x8" product IDs
- [ ] Verify saddle stitch IDs for existing sizes
- [ ] Confirm 60# uncoated paper product IDs
- [ ] Test all IDs in sandbox environment

### Phase 2: Code Updates
- [ ] Update `PRODUCT_IDS` in `lib/lulu/client.ts`
- [ ] Update `PRODUCT_IDS` in `lib/lulu/fulfillment.ts`
- [ ] Add 5x8" size option to type definitions
- [ ] Update `getLuluProductId()` function logic

### Phase 3: UI Updates
- [ ] Add "Novella (5x8")" to size selector
- [ ] Add binding type selector (Perfect Bound vs Saddle Stitch)
- [ ] Add paper type selector (60# Uncoated vs 80# Coated)
- [ ] Update pricing display

### Phase 4: Testing
- [ ] Test cost calculation for all 5 configurations
- [ ] Verify pricing matches Lulu calculator
- [ ] Test print job creation (sandbox)
- [ ] Validate PDF requirements for each binding type

---

## API Endpoints for Product Discovery

### Get All Available Products
```bash
GET https://api.lulu.com/pod-packages/
Authorization: Bearer {access_token}
```

### Filter by Size
```bash
GET https://api.lulu.com/pod-packages/?size=0500X0800
```

### Get Product Details
```bash
GET https://api.lulu.com/pod-packages/{pod_package_id}/
```

---

## Notes

1. **Product ID Stability**: Lulu product IDs may change over time. Always verify with API.

2. **Sandbox vs Production**: Product IDs should be the same in sandbox and production environments.

3. **Page Count Constraints**: Different bindings have different page count requirements:
   - Saddle Stitch: MIN 4, MAX ~48-80 (varies by paper)
   - Perfect Bound: MIN 32, MAX 2,800
   - Case Wrap: MIN 32, MAX 2,800

4. **Paper Weight Impact**: Heavier paper (80# vs 60#) affects:
   - Book thickness
   - Maximum page count for saddle stitch
   - Pricing

5. **Binding Selection Logic**: Current system auto-selects saddle stitch for <32 pages (8x8" only). May need to expand this logic.

---

## References

- **Lulu API Docs**: https://developers.lulu.com/
- **Product Catalog API**: https://api.lulu.com/pod-packages/
- **Current Implementation**: `lib/lulu/client.ts`, `lib/lulu/fulfillment.ts`
- **Pricing Calculator**: https://www.lulu.com/pricing

---

## Last Updated
**Date**: January 30, 2026  
**Status**: Product IDs for 5x8" Novella size pending verification  
**Action Required**: Query Lulu API for missing product IDs
