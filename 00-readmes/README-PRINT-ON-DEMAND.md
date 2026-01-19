# Print-on-Demand Integration

> Lulu API for book printing and fulfillment

## Overview

KidBook Creator integrates with Lulu's print-on-demand service to produce physical books. After payment, PDFs are uploaded to Lulu and print jobs are created automatically.

---

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Webhook    │────▶│  Lulu Client │────▶│  Lulu API   │
│  (paid)     │     │  lib/lulu/   │     │             │
└─────────────┘     └──────────────┘     └─────────────┘
```

---

## Lulu Client (`lib/lulu/client.ts`)

### Initialization

```typescript
import { createLuluClient } from '@/lib/lulu/client';

const lulu = createLuluClient();
```

### Product IDs

| Format | 6x6 | 8x8 | 8x10 |
|--------|-----|-----|------|
| Softcover | 0600X0600SCPERFCOLSTD | 0800X0800SCPERFCOLSTD | 0800X1000SCPERFCOLSTD |
| Hardcover | 0600X0600HCPERFCOLSTD | 0800X0800HCPERFCOLSTD | 0800X1000HCPERFCOLSTD |

---

## API Methods

### uploadPrintFile(file, filename)

Upload print-ready PDF to Lulu.

```typescript
const printableId = await lulu.uploadPrintFile(pdfBlob, 'book.pdf');
```

### createPrintJob(job)

Create a print order.

```typescript
const order = await lulu.createPrintJob({
  lineItems: [{
    printableId: 'file-id',
    quantity: 1,
    productSpec: { podPackageId: '0800X0800HCPERFCOLSTD' }
  }],
  shippingAddress: {
    name: 'John Doe',
    streetAddress: '123 Main St',
    city: 'New York',
    stateCode: 'NY',
    postalCode: '10001',
    countryCode: 'US',
    phoneNumber: '+1234567890'
  },
  contactEmail: 'customer@example.com',
  externalId: 'order-123'
});
```

### getPrintJob(printJobId)

Get order status and tracking.

```typescript
const status = await lulu.getPrintJob('lulu-order-id');
// status.lineItems[0].trackingId
```

### cancelPrintJob(printJobId)

Cancel an order before printing.

---

## Environment Variables

```env
LULU_API_KEY=your-api-key
LULU_API_SECRET=your-api-secret
LULU_SANDBOX=true  # Use sandbox for testing
```

---

## Order Flow

1. **Payment Received** → Stripe webhook triggers
2. **Generate PDF** → Create print-ready PDF
3. **Upload to Lulu** → Get printable ID
4. **Create Print Job** → Submit order
5. **Track Status** → Poll for updates
6. **Notify Customer** → Send tracking info

---

## Files

| File | Purpose |
|------|---------|
| `lib/lulu/client.ts` | Lulu API client |
