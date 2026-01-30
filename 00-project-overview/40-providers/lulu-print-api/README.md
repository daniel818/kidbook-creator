# Lulu Print API - Pricing Documentation

> Comprehensive pricing data for Lulu print-on-demand books

## Overview

This directory contains pricing information for various book configurations available through Lulu's print-on-demand service. The data is extracted from Lulu's Pricing Calculator and organized for easy reference and integration.

---

## Directory Structure

```
lulu-print-api/
├── README.md                    # This file
├── pricing-data.csv             # CSV format pricing data
├── book-configurations.md       # Detailed configuration specs
└── product-ids-mapping.md       # Lulu product ID mappings
```

---

## Quick Reference - Pricing Summary

| Configuration | Size | Binding | Paper | Price (EUR) |
|--------------|------|---------|-------|-------------|
| **Config 1** | Novella (5x8") | Hardcover Case Wrap | 60# White Uncoated | €10.97 |
| **Config 2** | Novella (5x8") | Hardcover Case Wrap | 80# White Coated | €11.27 |
| **Config 3** | Novella (5x8") | Paperback Saddle Stitch | 80# White Coated | €5.79 |
| **Config 4** | Small Square (7.5x7.5") | Paperback Saddle Stitch | 80# White Coated | €8.10 |
| **Config 5** | Small Square (7.5x7.5") | Hardcover Case Wrap | 80# White Coated | €13.58 |
| **Config 6** | Comic Book (6.625x10.25") | Paperback Saddle Stitch | 70# White Coated | €8.40 |

*All prices are for 24-page books with Premium Color interior and Matte cover finish*

---

## Book Types Available

### 1. Novella (5 x 8 in / 127 x 203 mm)
- **Hardcover Options**: €10.97 - €11.27
- **Paperback Options**: €5.79
- **Page Range**: MIN 24, MAX 2,800

### 2. Small Square (7.5 x 7.5 in / 190 x 190 mm)
- **Hardcover Options**: €13.58
- **Paperback Options**: €8.10
- **Page Range**: MIN 24, MAX 2,800

### 3. Comic Book (6.625 x 10.25 in / 168 x 260 mm)
- **Hardcover Options**: N/A
- **Paperback Options**: €8.40
- **Page Range**: MIN 24, MAX 4,800

---

## Configuration Details

### Common Specifications (All 6 Configs)
- **Page Count**: 24 pages
- **Interior Color**: Premium Color
- **Cover Finish**: Matte
- **Distribution**: Retail Distribution available (Configs 1, 2, 5 only)
- **Minimum Quantity**: 1 book

### Binding Types

#### Hardcover Case Wrap
- Premium hardcover binding
- Durable case wrap construction
- Available in both Novella and Small Square sizes
- Price range: €10.97 - €13.58

#### Paperback Saddle Stitch
- Cost-effective binding option
- Suitable for lower page counts
- Available in both Novella and Small Square sizes
- Price range: €5.79 - €8.10

### Paper Types

#### 60# White - Uncoated
- Natural paper feel
- Good for text-heavy content
- Used in Config 1

#### 80# White - Coated
- Premium coated paper
- Better color reproduction
- Used in Configs 2-5

---

## Integration with Current System

### Current Product IDs (from codebase)

```typescript
const PRODUCT_IDS = {
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

### Size Mapping
- **Novella (5x8")** → Not currently in system (needs to be added)
- **Small Square (7.5x7.5")** → Maps to `'7.5x7.5'` in current system
- **8x8** → Currently supported
- **8x10** → Currently supported

---

## Pricing Calculator Notes

### From Lulu's Calculator Interface:
- **Sell on Retail Sites**: Product options marked with this icon enable distribution to Lulu's retail partners
- **Volume Discounts**: Available on bulk orders (Contact Lulu)
- **Revenue Estimates**: Available in calculator (expandable section)
- **Quantity & Shipping Estimates**: Available in calculator (expandable section)

### Additional Options Available:
- **Book Templates**: Downloadable templates for each configuration
- **Custom Cover Templates**: Downloadable for each size/binding combination

---

## Cost Calculation API

The project uses Lulu's Cost Calculation API to get real-time pricing:

```typescript
// From: lib/lulu/pricing.ts
const pricing = await calculateRetailPricing({
    format: 'hardcover',
    size: '7.5x7.5',
    pageCount: 24,
    quantity: 1,
});
```

**Returns:**
- `wholesale`: Lulu's base cost
- `subtotal`: Retail price (with markup)
- `shipping`: Shipping cost
- `total`: Final total
- `margin`: Profit margin multiplier

---

## Next Steps

1. **Add Novella (5x8") Support**
   - Determine Lulu product IDs for 5x8" format
   - Update `PRODUCT_IDS` mapping in `lib/lulu/fulfillment.ts`
   - Add size option to UI

2. **Add Comic Book (6.625x10.25") Support**
   - Determine Lulu product IDs for Comic Book format
   - Update `PRODUCT_IDS` mapping in `lib/lulu/fulfillment.ts`
   - Add size option to UI

3. **Validate Product IDs**
   - Confirm all product IDs match Lulu's current SKUs
   - Test with Lulu API sandbox

4. **Price Optimization**
   - Analyze profit margins for each configuration
   - Consider volume discounts
   - Review shipping cost impact

---

## References

- **Lulu API Documentation**: [api.lulu.com](https://api.lulu.com)
- **Pricing Calculator**: [Lulu Pricing Calculator](https://www.lulu.com/pricing)
- **Product Specifications**: See `book-configurations.md`
- **Integration Guide**: See `/00-project-overview/00-readmes/README-PRINT-ON-DEMAND.md`

---

## Data Sources

- **Pricing Data**: Extracted from Lulu Pricing Calculator (January 30, 2026)
- **Product IDs**: From codebase (`lib/lulu/fulfillment.ts`, `lib/lulu/client.ts`)
- **API Integration**: From `lib/lulu/pricing.ts` and `app/api/lulu/calculate-cost/route.ts`

---

## Contact

For questions about Lulu integration or pricing:
- Review existing documentation in `/00-project-overview/00-readmes/`
- Check API implementation in `/lib/lulu/`
- Consult Lulu's support for product-specific questions
