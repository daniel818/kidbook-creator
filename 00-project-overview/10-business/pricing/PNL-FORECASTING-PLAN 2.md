# P&L Forecasting Planning Document
## KidBook Creator - Financial Model Structure

**Document Purpose**: Define the cost structure and key assumptions for building a comprehensive P&L forecasting Excel sheet.

---

## 1. FIXED MONTHLY COSTS

### Infrastructure Costs (Monthly)
- **Supabase Pro**: $25/month
- **Netlify**: $9/month  
- **Buffer for Additional Services**: $100/month
  - Domain renewals (amortized)
  - Email services
  - Analytics/monitoring tools
  - Other SaaS tools

**Total Fixed Monthly**: $134/month

---

## 2. ONE-TIME SETUP COSTS

### Initial Investment
- **Gemini API Credits**: $150
- **Domain Registration**: $100
- **Example Books Creation**: $50-100
  - Sample books for marketing
  - Portfolio/showcase materials
- **Friends & Family Testing Budget**: $350
  - Free book generation credits
  - Subsidized printing for beta testers
  - Marketing materials

**Total Setup Costs**: $650-700

---

## 3. VARIABLE COSTS PER BOOK CREATION

### AI Generation Costs (Per Book)
Based on current implementation in `@/app/api/ai/generate-book/route.ts`:

**Text Generation** (Story Script):
- Model: `gemini-3-flash-preview`
- Input tokens: ~$0.10 per 1M tokens
- Output tokens: ~$0.40 per 1M tokens
- Estimated per book: ~$0.05-0.10

**Image Generation** (Illustrations):
- Model: `gemini-3-pro-image-preview`
- Cost per image: ~$0.04
- Default book: 10 pages + 1 back cover = 11 images
- **Total per book**: ~$0.44

**Total AI Generation Cost**: ~$0.50/book ✓

### Storage Costs (Supabase)

**Temporary Storage** (7 days):
- Base64 images stored during generation
- Bucket: `book-images`
- Average per book: ~12 images × ~500KB = ~6MB
- Supabase free tier: 1GB storage included
- **Cost**: Negligible within free tier initially

**Permanent Storage** (High Quality):
- 12 images per book (10 pages + cover + back)
- Average size: ~500KB per image = 6MB/book
- Long-term storage for completed books
- At scale: 1,000 books = 6GB
- Supabase pricing: $0.021/GB/month beyond free tier
- **Estimated**: $0.01-0.02/book/month at scale

---

## 4. PRINTING & FULFILLMENT COSTS (LULU)

### Print Costs (Per Book)
Based on actual Lulu pricing (from screenshots, 24 pages):

**Softcover - Saddle Stitch (Paperback)**:
- Small Square (7.5×7.5"): €7.80 (~$8.50)
- Comic Book: €5.06 (~$5.50)

**Hardcover - Case Wrap**:
- Novella (5×8"): €10.97 (~$12.00)
- Small Square (7.5×7.5"): €13.28 (~$14.50)
- Novella (larger format): €11.27 (~$12.30)

**Typical Book** (24 pages, Premium Color):
- **Softcover Small Square**: ~$8.50
- **Hardcover Small Square**: ~$14.50
- **Hardcover Novella**: ~$12.00

*Note: Prices shown are for 24-page books with Premium Color interior, 80# Coated paper, Matte cover finish*

### Shipping Costs (EU Average)
- **Standard Shipping to EU**: $8-15 per book
- **Expedited Shipping**: $20-30 per book
- **Bulk Orders**: Reduced per-unit shipping
- **Customs/VAT**: Included in EU pricing

**Average Shipping Cost**: ~$12/book to EU

*Note: Lulu has EU printing facilities which may reduce shipping costs for EU customers*

---

## 5. TOTAL COST PER BOOK SOLD

### Cost Breakdown Examples:

**Example 1: Hardcover Small Square (24 pages, EU delivery)**
1. **AI Generation**: $0.50
2. **Storage (permanent)**: $0.02/month
3. **Printing (Lulu)**: $14.50
4. **Shipping (EU avg)**: $12.00
5. **Payment Processing** (Stripe): 2.9% + $0.30

**Total Variable Cost**: ~$27.00 + 2.9% of sale price

**Example 2: Softcover Small Square (24 pages, EU delivery)**
1. **AI Generation**: $0.50
2. **Storage (permanent)**: $0.02/month
3. **Printing (Lulu)**: $8.50
4. **Shipping (EU avg)**: $12.00
5. **Payment Processing** (Stripe): 2.9% + $0.30

**Total Variable Cost**: ~$21.00 + 2.9% of sale price

---

## 6. ADDITIONAL COST CONSIDERATIONS

### Costs Not Yet Accounted For:
1. **Payment Gateway Fees**: Stripe 2.9% + $0.30 per transaction ✓ (included above)
2. **Refunds & Returns**: Estimated 2-5% of orders
3. **Failed Print Jobs**: Quality issues, reprints (~1-2%)
4. **Currency Conversion Fees**: For international payments
5. **Customer Support Tools**: Not relevant at launch
6. **Marketing & Advertising**: WOM + Instagram (no budget initially)
7. **Legal & Compliance**: Not relevant at launch
8. **Accounting Software**: Not relevant at launch

---

## 7. REVENUE MODEL & CONVERSION FUNNEL

### Pricing Strategy (Under Consideration):
1. **Digital Book (PDF)**: $15
   - Almost pure gross profit
   - No printing/shipping costs
   - Instant delivery

2. **Printed Book (Hardcover)**: $45
   - Target profit: ~$30 per book
   - After costs: ~$27 + 2.9% = ~$28.30
   - **Net profit**: ~$15.40 per book (34% margin)

### Conversion Funnel:
**Stage 1: Preview Generation** (Free)
- User creates 1 sample image + story preview
- Cost to business: ~$0.09 (1 image + text generation)

**Stage 2: Conversion to Purchase**
- **Estimated conversion rate**: 3-4%
- **Digital conversion**: ~1.5-2%
- **Printed conversion**: ~1.5-2%

**Funnel Economics**:
- 100 preview generations = $9 cost
- 3-4 conversions expected
- 2 digital ($15 × 2 = $30) + 2 printed ($45 × 2 = $90)
- **Revenue**: $120
- **Costs**: $9 (previews) + $0 (digital) + $56.60 (2 printed books)
- **Net profit**: ~$54.40 per 100 previews
- **Profit per preview**: ~$0.54

---

## 8. BUSINESS MODEL PARAMETERS (DEFINED)

### Confirmed Assumptions:

1. **Monthly Volume**: Variable/editable in Excel (unknown at launch)

2. **Target Market Mix**:
   - **Geography**: 100% EU initially
   - **Format Mix**: 75% Hardcover, 25% Digital
   - **Average page count**: 24 pages

3. **Customer Acquisition**:
   - **Strategy**: Word of mouth + Instagram
   - **Marketing budget**: $0 initially
   - **CAC**: $0 (organic growth)

4. **Pricing Strategy**:
   - **Digital**: $15 (to be validated by P&L)
   - **Printed Hardcover**: $45 (to be validated by P&L)
   - **Model**: One-time purchase, no subscription

5. **Growth Assumptions**: To be determined based on initial traction

6. **Refund/Return Policy** (per competitor analysis):
   - **Cancellation window**: 48 hours before printing (free)
   - **Digital books**: No refunds after generation
   - **Printed books**: No returns (personalized product exception)
   - **Defects only**: 14-day window with photos
   - **Expected refund rate**: 2-5%

7. **Volume Discounts**: Not applicable at launch

8. **International Expansion**: Not relevant initially

9. **Team/Labor Costs**: Not relevant initially (founder-operated)

10. **Sensitivity Analysis**: Focus on conversion rate and monthly volume

---

## 9. EXCEL SHEET STRUCTURE

### Tabs to Include:
1. **Assumptions**: All input variables and constants
   - Fixed costs
   - Variable costs per book type
   - Pricing
   - Conversion rates
   - Refund/return rates

2. **Conversion Funnel**: Preview → Purchase economics
   - Preview generation costs
   - Conversion rates (editable)
   - Revenue per 100 previews

3. **Monthly P&L**: 12-month projection
   - Editable monthly preview volume
   - Auto-calculated conversions
   - Revenue breakdown (Digital vs Printed)
   - Cost breakdown
   - Gross profit
   - Net profit

4. **Break-Even Analysis**: 
   - Previews needed to break even
   - Conversions needed to cover fixed costs

5. **Sensitivity Analysis**:
   - Conversion rate impact (2%, 3%, 4%, 5%)
   - Pricing impact ($40, $45, $50 for printed)
   - Volume scenarios (low, medium, high)

---

## 10. KEY COST SUMMARY

### Per Preview (Free to User):
- AI Generation: $0.09
- Storage: Negligible
- **Total**: $0.09

### Per Digital Book:
- AI Generation: $0.50
- Storage: $0.02/month
- Payment Processing: 2.9% of $15 + $0.30 = $0.74
- **Total Cost**: $1.26
- **Revenue**: $15.00
- **Gross Profit**: $13.74 (92% margin)

### Per Printed Hardcover Book:
- AI Generation: $0.50
- Storage: $0.02/month
- Printing: $14.50
- Shipping: $12.00
- Payment Processing: 2.9% of $45 + $0.30 = $1.61
- **Total Cost**: $28.63
- **Revenue**: $45.00
- **Gross Profit**: $16.37 (36% margin)

### Monthly Fixed Costs:
- $134/month
- **Break-even**: ~9 printed books OR ~10 digital books per month

---

**Document Version**: 2.0  
**Last Updated**: January 29, 2026  
**Status**: Ready for Excel Model Creation
