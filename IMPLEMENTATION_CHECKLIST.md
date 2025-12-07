# 📋 BACKEND IMPROVEMENTS - IMPLEMENTATION CHECKLIST

## Overview

Checklist chi tiết để apply backend improvements vào toàn bộ admin API routes.

---

## ✅ Phase 1: Critical Services (COMPLETED)

- [x] Create `order-state-machine.ts`
- [x] Create `inventory-service.ts`
- [x] Create `error-messages.ts`
- [x] Create `api-error-handler.ts`
- [x] Create reference implementation (`route.IMPROVED.ts`)
- [x] Integrate state machine into Order PATCH API
- [x] Create integration documentation

---

## 🔄 Phase 2: Apply to All Routes (IN PROGRESS)

### Products API

#### **`/api/[storeId]/products/route.ts`**

- [ ] Import error handler và messages
- [ ] Replace error messages với Vietnamese constants
- [ ] Wrap POST in `prisma.$transaction()`
  ```typescript
  await prisma.$transaction(async (tx) => {
    const product = await tx.product.create({...});
    await tx.image.createMany({...});
    await tx.productVariant.createMany({...});
  });
  ```
- [ ] Add comprehensive validation:
  - [ ] validateRequired(['name', 'price', 'categoryId', ...])
  - [ ] Check variants.length >= 1
  - [ ] Check images.length >= 1
  - [ ] Validate comparePrice > price (if exists)
- [ ] Add slug uniqueness check + auto-generation
- [ ] Replace try-catch với `handleApiError(error)`

#### **`/api/[storeId]/products/[productId]/route.ts`**

- [ ] PATCH: Wrap in transaction
- [ ] PATCH: Validate variant updates
- [ ] PATCH: Handle image updates atomically
- [ ] DELETE: Check OrderItem count
- [ ] DELETE: Suggest archive instead of delete if has orders
- [ ] Vietnamese error messages

### Orders API

#### **`/api/[storeId]/orders/route.ts`** (Bulk Operations)

- [ ] GET: Add pagination support
- [ ] DELETE: Already improved ✅ (status validation)
- [ ] Consider adding filters (status, date range, payment method)

#### **`/api/checkout/route.ts`** (Critical - Main Checkout)

- [ ] Replace inventory check với `checkInventoryAvailability()`
- [ ] Wrap order creation in `prisma.$transaction()`
- [ ] Call `reserveInventory()` inside transaction
- [ ] Add error handling for race conditions (409 Conflict)
- [ ] Convert all error messages to Vietnamese:
  - [ ] "Product not found" → "Không tìm thấy sản phẩm"
  - [ ] "Insufficient stock" → "Không đủ hàng trong kho"
  - [ ] "Invalid payment method" → "Phương thức thanh toán không hợp lệ"

### Categories API

#### **`/api/[storeId]/categories/route.ts`**

- [ ] POST: Wrap in transaction
- [ ] POST: Check circular reference for parent categories
- [ ] POST: Validate parent exists if parentId provided
- [ ] Vietnamese errors

#### **`/api/[storeId]/categories/[categoryId]/route.ts`**

- [ ] PATCH: Wrap in transaction
- [ ] PATCH: Validate circular reference on parent change
- [ ] DELETE: Check if has products
- [ ] DELETE: Check if has child categories
- [ ] Vietnamese errors

### Sizes/Colors/Materials API

#### **`/api/[storeId]/sizes/route.ts`**

- [ ] DELETE: Check ProductVariant usage before delete
- [ ] Vietnamese errors

#### **`/api/[storeId]/colors/route.ts`**

- [ ] DELETE: Check ProductVariant usage before delete
- [ ] Vietnamese errors

#### **`/api/[storeId]/materials/route.ts`**

- [ ] DELETE: Check ProductVariant usage before delete
- [ ] Vietnamese errors

### Coupons API

#### **`/api/[storeId]/coupons/route.ts`**

- [ ] POST: Wrap in transaction
- [ ] POST: Validate dates (startDate < endDate)
- [ ] POST: Validate value (0-100 for PERCENT, >0 for FIXED)
- [ ] POST: Check unique code
- [ ] Vietnamese errors

#### **`/api/[storeId]/coupons/[couponId]/route.ts`**

- [ ] PATCH: Wrap in transaction
- [ ] PATCH: Validate date changes
- [ ] DELETE: Check if used in orders (consider soft delete)
- [ ] Vietnamese errors

### Returns API

#### **`/api/[storeId]/returns/route.ts`**

- [ ] POST: Wrap in transaction
- [ ] POST: Validate order exists and is eligible for return
- [ ] POST: Call `releaseInventory()` for returned items
- [ ] Vietnamese errors

#### **`/api/[storeId]/returns/[returnId]/route.ts`**

- [ ] PATCH: Wrap status update in transaction
- [ ] PATCH: Add state machine for return status
- [ ] Vietnamese errors

### Shipping API

#### **`/api/[storeId]/shipping/route.ts`**

- [ ] POST: Validate shipping provider
- [ ] POST: Validate tracking number format
- [ ] Vietnamese errors

### Billboards API

#### **`/api/[storeId]/billboards/route.ts`**

- [ ] POST: Validate image URL
- [ ] DELETE: Check if used in categories
- [ ] Vietnamese errors

---

## 🔧 Phase 3: Enhanced Features

### Payment Reconciliation Service

**File**: `admin/src/lib/payment-reconciliation.ts`

- [ ] Create service with functions:

  - [ ] `validateStripeWebhook(payload, signature)`
  - [ ] `validateMoMoIPN(payload, signature)`
  - [ ] `checkDuplicateTransaction(transactionId, paymentMethod)`
  - [ ] `handlePaymentSuccess(orderId, transactionId, amount)`
  - [ ] `handlePaymentFailure(orderId, reason)`

- [ ] Apply to webhooks:
  - [ ] `/api/webhooks/stripe/route.ts`
  - [ ] MoMo IPN handler

### Inventory Integration

- [ ] Checkout: `checkInventoryAvailability()` before order create
- [ ] Checkout: `reserveInventory()` in transaction
- [ ] Order Cancel: `releaseInventory()` when status → CANCELLED
- [ ] Order Return: `releaseInventory()` when status → RETURNED

### Audit Logs

**Prisma Schema**: Add AuditLog model

```prisma
model AuditLog {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  userId    String
  action    String   // CREATE, UPDATE, DELETE
  entity    String   // Product, Order, Category, etc.
  entityId  String
  changes   Json?    // Old vs New values
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([entity, entityId])
}
```

- [ ] Create `audit-log.service.ts`:

  - [ ] `logCreate(userId, entity, entityId, data)`
  - [ ] `logUpdate(userId, entity, entityId, oldData, newData)`
  - [ ] `logDelete(userId, entity, entityId, data)`

- [ ] Apply to all POST/PATCH/DELETE handlers

---

## 🌐 Phase 4: Toast Messages Conversion

### Admin App

**Search Pattern**: `toast({ title: "Success"` and similar English patterns

- [ ] Search all files for hardcoded English toast messages
- [ ] Replace với Vietnamese từ `translations.ts` hoặc `error-messages.ts`
- [ ] Ensure consistency: "Đã xóa thành công", not "Xóa thành công"

**Files to Check**:

- [ ] `admin/src/components/modals/*.tsx`
- [ ] `admin/src/app/(dashboard)/[storeId]/**/components/cell-action.tsx`
- [ ] `admin/src/app/(dashboard)/[storeId]/**/components/*-form.tsx`

### Store App

- [ ] `store/src/components/ui/*.tsx`
- [ ] `store/src/app/**/page.tsx`
- [ ] Cart/Checkout components

---

## 🧪 Phase 5: Testing

### Unit Tests

- [ ] Order state machine transitions
- [ ] Inventory reserve/release logic
- [ ] Error message formatting

### Integration Tests

**Scenario 1: Checkout Race Condition**

```bash
# Terminal 1
curl -X POST http://localhost:3000/api/checkout \
  -H "Content-Type: application/json" \
  -d '{"items": [{"variantId": "VARIANT_ID", "quantity": 10}]}'

# Terminal 2 (immediately)
curl -X POST http://localhost:3000/api/checkout \
  -H "Content-Type: application/json" \
  -d '{"items": [{"variantId": "VARIANT_ID", "quantity": 10}]}'

# Expected if stock = 10:
# - Terminal 1: 200 OK, order created
# - Terminal 2: 409 Conflict, "Không đủ hàng"
```

**Scenario 2: Invalid Order Status Transition**

```bash
# Create order with status DELIVERED
# Try to update to PENDING
curl -X PATCH http://localhost:3000/api/[storeId]/orders/[orderId] \
  -d '{"status": "PENDING"}'

# Expected: 400 Bad Request
# Message: "Không thể chuyển đơn hàng từ 'Đã giao' sang 'Chờ xử lý'"
```

**Scenario 3: Order Cancellation Inventory Restore**

```bash
# 1. Create order (inventory: 100 → 90)
POST /api/checkout → { variantId: X, quantity: 10 }

# 2. Check inventory
GET /api/[storeId]/products/[productId] → variant.inventory = 90

# 3. Cancel order
PATCH /api/[storeId]/orders/[orderId] → { status: "CANCELLED" }

# 4. Check inventory again
GET /api/[storeId]/products/[productId] → variant.inventory = 100 ✅
```

**Scenario 4: Product Delete with OrderItems**

```bash
# 1. Product exists in completed order
# 2. Try to delete product
DELETE /api/[storeId]/products/[productId]

# Expected: 400 Bad Request
# Message: "Không thể xóa sản phẩm đang có trong đơn hàng. Bạn có thể ẩn sản phẩm thay vì xóa."
# Response: { suggestArchive: true, orderCount: 5 }
```

---

## 📊 Progress Tracking

**Overall Progress**: 15% Complete

| Category       | Progress | Status         |
| -------------- | -------- | -------------- |
| Core Services  | 100%     | ✅ Done        |
| Orders API     | 70%      | 🔄 In Progress |
| Products API   | 0%       | ⏳ Todo        |
| Categories API | 0%       | ⏳ Todo        |
| Checkout API   | 0%       | ⏳ Todo        |
| Coupons API    | 0%       | ⏳ Todo        |
| Returns API    | 0%       | ⏳ Todo        |
| Toast Messages | 95%      | 🔄 In Progress |
| Testing        | 0%       | ⏳ Todo        |

---

## 🎯 Priority Order

1. **CRITICAL** - Checkout API (`/api/checkout/route.ts`)

   - Integrate inventory service
   - Add transaction wrapping
   - Race condition handling

2. **HIGH** - Products API

   - Transaction support
   - Comprehensive validation
   - OrderItem check on delete

3. **HIGH** - Orders API

   - Already partially done (state machine integrated ✅)
   - Need inventory integration on cancel/return

4. **MEDIUM** - Categories, Coupons APIs

   - Transaction support
   - Business rule validation

5. **LOW** - Billboards, Sizes, Colors, Materials
   - Usage check on delete
   - Vietnamese messages

---

## 📝 Notes

- Always test locally before deploying
- Keep backup of original files (`.original.ts`)
- Update Prisma schema if adding audit logs
- Run `npx prisma generate` after schema changes
- Check for breaking changes in frontend

---

**Last Updated**: ${new Date().toLocaleDateString('vi-VN', {
year: 'numeric',
month: 'long',
day: 'numeric'
})}
