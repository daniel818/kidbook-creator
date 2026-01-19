# Admin API

> Administrative endpoints for order and stats management

## Overview

The Admin API provides endpoints for managing orders, viewing statistics, and administrative operations. Access is restricted to admin users.

---

## Endpoints

### GET `/api/admin/orders`

List all orders with filtering and pagination.

**Query Parameters:**
- `status` - Filter by order status
- `page` - Page number
- `limit` - Items per page

**Response:**
```typescript
{
  orders: Order[];
  total: number;
  page: number;
  totalPages: number;
}
```

### PATCH `/api/admin/orders/[orderId]`

Update order status, tracking number, etc.

**Request Body:**
```typescript
{
  status?: string;
  tracking_number?: string;
  lulu_order_id?: string;
}
```

### GET `/api/admin/stats`

Get dashboard statistics.

**Response:**
```typescript
{
  totalOrders: number;
  totalRevenue: number;
  totalBooks: number;
  totalUsers: number;
  recentOrders: Order[];
  ordersByStatus: Record<string, number>;
}
```

---

## Admin Dashboard

**Route:** `/admin`

Features:
- Order management table
- Status updates
- Revenue statistics
- User metrics

---

## Authorization

Admin endpoints check for admin role:

```typescript
// Check if user is admin
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single();

if (profile?.role !== 'admin') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

---

## Files

| File | Purpose |
|------|---------|
| `app/api/admin/orders/route.ts` | Order list endpoint |
| `app/api/admin/orders/[orderId]/route.ts` | Single order operations |
| `app/api/admin/stats/route.ts` | Statistics endpoint |
| `app/admin/page.tsx` | Admin dashboard page |
