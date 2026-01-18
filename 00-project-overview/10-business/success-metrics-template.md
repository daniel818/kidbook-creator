# Success Metrics

## North Star

**Primary North Star Metric**: **Monthly Active Book Creators (MABC)**

**Definition**: Number of unique users who complete at least one story in a given month

**Formula**: `MABC = Count(Unique Users with ≥1 Completed Story in Month)`

**Why this metric**:
- Measures core product engagement (story creation is the key action)
- Leading indicator of revenue (completed stories → registrations → print orders)
- Captures product-market fit (users finding value in creating stories)
- Actionable: Can be influenced by UX, AI quality, marketing, and word-of-mouth
- Balances growth (new users) and retention (repeat creators)

**Targets**:
- Month 1-3: 100-300 MABC
- Month 4-6: 400-800 MABC
- Month 7-9: 900-1,500 MABC
- Month 10-12: 1,600-2,500 MABC
- **Year 1 Total**: 2,500 cumulative active book creators

**Segments**:
- By market: Germany, Austria, Israel
- By user type: New creators, returning creators
- By channel: Organic, influencer, paid, referral
- By book type: Board book (2-4), picture book (5-7), story book (8-10)

## Input Metrics

### Acquisition Funnel

**1. Website Visitors**
- **Definition**: Unique visitors to kidbookcreator.com per month
- **Formula**: Mixpanel unique visitors
- **Target**: 
  - Month 3: 1,000-2,000 visitors
  - Month 6: 3,000-6,000 visitors
  - Month 12: 8,000-15,000 visitors
- **Segments**: Organic, influencer, paid, referral, direct

**2. Free Book Creation Rate**
- **Definition**: Percentage of visitors who start creating a free book
- **Formula**: `Creation Rate = (Book Creators / Visitors) × 100`
- **Target**: 15-25% conversion rate
- **Benchmark**: Consumer product standard 10-20%
- **Drop-off analysis**: Track where users abandon (landing → start → complete)

**3. Story Completion Rate**
- **Definition**: Percentage of users who complete their story (all pages generated)
- **Formula**: `Completion Rate = (Completed Stories / Started Stories) × 100`
- **Target**: 60-70% completion rate
- **Note**: High completion = good UX and AI quality
- **Segments**: By age group, by story length, by device (mobile/desktop)

**4. Registration Rate (Registration Gate)**
- **Definition**: Percentage of completed stories that result in user registration
- **Formula**: `Registration Rate = (Registrations / Completed Stories) × 100`
- **Target**: 25-35% registration rate
- **Critical metric**: This is the monetization gate
- **A/B tests**: Gate placement, messaging, incentives

**5. Print Order Conversion**
- **Definition**: Percentage of registered users who order their first print book
- **Formula**: `Print Conversion = (First Print Orders / Registrations) × 100`
- **Target**: 20-30% conversion rate
- **Benchmark**: E-commerce standard 15-25%
- **Segments**: By price point, by book type, by market

**6. Subscription Conversion**
- **Definition**: Percentage of registered users who subscribe (monthly or annual)
- **Formula**: `Subscription Rate = (Subscribers / Registrations) × 100`
- **Target**: 10-15% conversion rate
- **Timing**: Track when users subscribe (immediately, after 1st book, after 2nd book)
- **Segments**: Monthly vs annual, by user type (parent vs grandparent)

### User Engagement

**8. Repeat Book Creation Rate**
- **Definition**: Percentage of users who create 2+ books within 12 months
- **Formula**: `Repeat Rate = (Users with ≥2 Books / Total Users) × 100`
- **Target**: 40% repeat rate by Month 12
- **Note**: Indicates product stickiness and LTV potential
- **Segments**: By market, by subscription status, by first book satisfaction

**9. Books Per User**
- **Definition**: Average number of books created per user (lifetime)
- **Formula**: `Books/User = Total Books Created / Total Users`
- **Target**: 
  - Month 6: 1.2 books/user
  - Month 12: 1.5 books/user
  - Month 24: 2.2 books/user
- **Segments**: Free users vs subscribers, parents vs grandparents

**10. Social Sharing Rate**
- **Definition**: Percentage of users who share their book on social media
- **Formula**: `Sharing Rate = (Users Who Shared / Total Users) × 100`
- **Target**: 20% sharing rate
- **Note**: Key driver of organic growth and word-of-mouth
- **Channels**: Instagram, Facebook, WhatsApp

### Retention & Monetization

**11. Subscription Retention (Churn)**
- **Definition**: Percentage of subscribers who cancel per month
- **Formula**: `Churn Rate = (Cancelled Subs / Active Subs at Start) × 100`
- **Target**: <5% monthly churn
- **Benchmark**: Consumer subscription standard 5-10% monthly
- **Cohort analysis**: Track churn by signup month, by plan type

**12. Customer Lifetime Value (LTV)**
- **Definition**: Total revenue from a user over their lifetime
- **Formula**: `LTV = (Print Revenue + Subscription Revenue) / Total Users`
- **Target**: €70-120 average LTV
- **Calculation**: 
  - Non-subscriber: 2 books × €35 = €70
  - Subscriber: €60/year + 3 books × €25 = €135
- **Segments**: By market, by user type, by acquisition channel

**13. Repeat Purchase Rate**
- **Definition**: Percentage of first-time print buyers who order 2nd book
- **Formula**: `Repeat Rate = (Users with 2+ Orders / First-Time Buyers) × 100`
- **Target**: 40% repeat purchase within 12 months
- **Note**: Key indicator of product satisfaction and LTV

## Quality Metrics

**14. Parent Satisfaction Score (CSAT)**
- **Definition**: Average satisfaction rating from post-delivery survey
- **Formula**: "How satisfied are you with your book?" (1-5 scale)
- **Target**: ≥4.7/5 average
- **Survey timing**: 1 week after book delivery
- **Segments**: By market, by book type, by print quality

**15. Net Promoter Score (NPS)**
- **Definition**: Likelihood to recommend (0-10 scale)
- **Formula**: `NPS = % Promoters (9-10) - % Detractors (0-6)`
- **Target**: ≥60 NPS
- **Benchmark**: Consumer products average 30-50, best-in-class 60+
- **Survey timing**: 2 weeks after book delivery (after child has read it)

**16. Print Quality Issues**
- **Definition**: Percentage of orders with print defects or damage
- **Formula**: `Defect Rate = (Defective Orders / Total Orders) × 100`
- **Target**: <2% defect rate
- **Tracking**: Customer complaints, replacement requests
- **Segments**: By print partner, by book type

## Financial Metrics

**17. Monthly Recurring Revenue (MRR)**
- **Definition**: Predictable monthly revenue from subscriptions
- **Formula**: `MRR = Σ(Active Subscription Values)`
- **Target**:
  - Month 6: €200-400 MRR
  - Month 12: €600-1,200 MRR
  - Month 24: €3,000-5,000 MRR
- **Growth rate**: 15-25% month-over-month
- **Segments**: Monthly vs annual plans, by market

**18. Gross Margin**
- **Definition**: Revenue minus direct costs (printing, AI, payment processing)
- **Formula**: `Gross Margin = (Revenue - COGS) / Revenue × 100`
- **Target**: 50-60% blended gross margin
- **COGS breakdown**:
  - Print books: €20-23 (printing + shipping) → 30-35% margin
  - Subscriptions: €5-10 (AI + hosting) → 90%+ margin
  - Payment processing: 2.9% + €0.30 per transaction

**19. Customer Acquisition Cost (CAC)**
- **Definition**: Total marketing spend per acquired customer (first order)
- **Formula**: `CAC = Marketing Costs / New Customers with First Order`
- **Target**: €15-45 per customer
- **Segments**: By channel (organic €0-5, influencer €10-20, paid €20-40)
- **Payback period**: 1-2 orders (2-6 months)

**20. LTV:CAC Ratio**
- **Definition**: Lifetime value divided by acquisition cost
- **Formula**: `LTV:CAC = LTV / CAC`
- **Target**: 7:1 - 15:1 ratio
- **Benchmark**: Consumer products 3:1+, great 5:1+, excellent 10:1+
- **Note**: High ratio due to low CAC (organic/influencer heavy) and repeat purchases
- **Target**: 20:1 to 30:1
- **Benchmark**: Healthy SaaS 3:1, services can be higher

**26. Cash Flow**
- **Definition**: Net cash in minus cash out per month
- **Formula**: `Cash Flow = Revenue Received - Expenses`
- **Target**: Positive cash flow by month 6
- **Reserve target**: 3-month operating expenses by month 12

**27. Utilization Rate**
- **Definition**: Percentage of available hours that are billable
- **Formula**: `Utilization = (Billable Hours / Available Hours) × 100`
- **Target**: 70-80% utilization
- **Note**: 100% is unsustainable; need time for sales, admin, learning

## Operational Metrics

**28. Lead Response Time**
- **Definition**: Average hours from lead submission to first response
- **Formula**: `Avg Response Time = Σ(Response Times) / Number of Leads`
- **Target**: <24 hours (ideally <4 hours during business hours)

**29. Proposal Turnaround Time**
- **Definition**: Average days from discovery call to proposal sent
- **Formula**: `Avg Turnaround = Σ(Days to Proposal) / Number of Proposals`
- **Target**: 2-3 business days

**30. Client Communication Score**
- **Definition**: Client rating of communication quality (from CSAT survey)
- **Scale**: 1-5
- **Target**: ≥4.5/5
- **Includes**: Responsiveness, clarity, proactiveness, transparency

## Targets & Review

### Quarterly Targets

**Q1 2025 (Months 1-3): Foundation**
- **Revenue**: €30k-€40k (2 projects)
- **MCR**: €60k-€80k contracted
- **Leads**: 15-30 qualified leads
- **Close rate**: 25-35%
- **Website visitors**: 300-600
- **MRR**: €0 (no completed projects yet)
- **Focus**: First clients, case studies, process refinement

**Q2 2025 (Months 4-6): Validation**
- **Revenue**: €40k-€60k (3 projects)
- **MCR**: €100k-€140k contracted
- **Leads**: 30-50 qualified leads
- **Close rate**: 30-40%
- **Website visitors**: 800-1,500
- **MRR**: €2k-€3k (first retainers)
- **Focus**: Channel testing, partnership development, retainer attachment

**Q3 2025 (Months 7-9): Scale**
- **Revenue**: €50k-€60k (3 projects)
- **MCR**: €120k-€180k contracted
- **Leads**: 40-70 qualified leads
- **Close rate**: 30-40%
- **Website visitors**: 1,200-2,000
- **MRR**: €4k-€6k
- **Focus**: Scale working channels, referral engine, operational efficiency

**Q4 2025 (Months 10-12): Optimize**
- **Revenue**: €40k-€40k (2 projects + holiday slowdown)
- **MCR**: €100k-€140k contracted
- **Leads**: 40-60 qualified leads
- **Close rate**: 35-45%
- **Website visitors**: 1,500-2,500
- **MRR**: €5k-€8k
- **Focus**: Year-end optimization, 2026 planning, team expansion prep

### Review Cadence

**Weekly Review** (Every Monday, 1 hour):
- Pipeline review: Active leads, proposals, negotiations
- Project status: On-time delivery, blockers, client satisfaction
- Metrics snapshot: Leads, MCR, cash flow
- Action items for the week

**Monthly Review** (First Monday of month, 2-3 hours):
- Full metrics dashboard review
- Channel performance analysis
- Financial review: Revenue, expenses, cash flow
- Client satisfaction scores
- Wins, losses, learnings
- Adjust tactics for next month

**Quarterly Review** (First week of quarter, half day):
- Quarterly targets vs actuals
- Strategic review: ICP, positioning, channels
- Competitive landscape update
- Financial deep dive: Margins, CAC, LTV
- Roadmap and priorities for next quarter
- Team and capacity planning

**Annual Review** (January, full day):
- Year in review: All metrics, wins, losses
- Strategic planning for next year
- Budget and financial projections
- Market and competitive analysis
- Major pivots or adjustments needed
- Team expansion and hiring plans

## Dashboard & Instrumentation

**Primary Dashboard** (Weekly review):
- North Star: MCR (current month, trailing 3 months)
- Funnel: Visitors → Leads → Calls → Proposals → Contracts
- Pipeline: Active opportunities by stage and value
- Projects: Active projects, delivery status, budget status
- Financial: Revenue, expenses, cash flow, MRR
- Quality: CSAT, NPS, on-time delivery %

**Tools**:
- **CRM**: HubSpot or Pipedrive (lead and deal tracking)
- **Analytics**: Google Analytics (website), Mixpanel (product)
- **Project Management**: Linear or Notion (project tracking)
- **Financial**: QuickBooks or Xero (accounting)
- **Surveys**: Typeform or Google Forms (CSAT, NPS)
- **Dashboard**: Google Data Studio or Metabase (unified view)

**Event Tracking**:
- `Lead_Captured` { source, vertical, quality_score }
- `Discovery_Call_Booked` { lead_id, vertical, timeline }
- `Proposal_Sent` { lead_id, value, tier }
- `Contract_Signed` { client_id, value, tier, source }
- `Project_Milestone_Completed` { project_id, milestone, on_time }
- `Project_Delivered` { project_id, duration, budget_variance }
- `Retainer_Signed` { client_id, tier, mrr }
- `Referral_Received` { source_client_id, new_lead_id }

**Alerts** (Automated notifications):
- New lead captured (Slack notification)
- Proposal sent (CRM reminder to follow up in 3 days)
- Contract signed (celebration + project kickoff checklist)
- Project >1 week overdue (escalation)
- Payment >15 days overdue (follow-up)
- CSAT score <4.0 (immediate founder review)
- MRR churn (client cancels retainer)

---

## Guidelines

### Metric Definition Best Practices
- Each metric must have: Name, Definition, Formula, Target, Segments
- Use consistent naming conventions
- Make metrics falsifiable and time-bound
- Segment by relevant dimensions (vertical, tier, channel, cohort)
- Track both leading (pipeline) and lagging (revenue) indicators

### Instrumentation Requirements
- Use CRM for sales funnel tracking
- Use project management tool for delivery metrics
- Use accounting software for financial metrics
- Use survey tools for quality metrics
- Centralize in dashboard for weekly review

### Review Discipline
- Weekly: Pipeline and project status
- Monthly: Full metrics review and tactical adjustments
- Quarterly: Strategic review and target setting
- Annual: Deep analysis and planning

### Success Criteria
- Year 1: ≥€160k revenue, ≥8 projects, ≥30% close rate, ≥80% on-time delivery
- Positive cash flow by month 6
- ≥4.5/5 client satisfaction
- ≥2 reliable lead generation channels
