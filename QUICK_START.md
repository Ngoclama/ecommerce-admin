# 🚀 QUICK START GUIDE - Backend Improvements

## Bước 1: Understand What Was Created

### 📦 New Service Layer Files (Ready to Use)

1. **`admin/src/lib/order-state-machine.ts`**

   ```typescript
   import {
     validateOrderStatusTransition,
     handleOrderStatusTransition,
   } from "@/lib/order-state-machine";

   // Validate before updating order status
   const validation = validateOrderStatusTransition(currentStatus, newStatus);
   if (!validation.valid) {
     return NextResponse.json({ error: validation.error }, { status: 400 });
   }
   ```

2. **`admin/src/lib/inventory-service.ts`**

   ```typescript
   import {
     checkInventoryAvailability,
     reserveInventory,
     releaseInventory,
   } from "@/lib/inventory-service";

   // Check stock before checkout
   const availability = await checkInventoryAvailability(items, prisma);
   ```

3. **`admin/src/lib/error-messages.ts`** & **`admin/src/lib/api-error-handler.ts`**

   ```typescript
   import { handleApiError, throwError } from "@/lib/api-error-handler";

   try {
     if (!userId) throwError.unauthenticated();
   } catch (error) {
     return handleApiError(error);
   }
   ```

### 📄 Reference Implementation

- **`admin/src/app/api/[storeId]/products/route.IMPROVED.ts`** - Copy this pattern to other routes

---

## Bước 2: Priority Tasks (Do First)

### Task 1: Fix Checkout API ⚠️ CRITICAL

**File**: `admin/src/app/api/checkout/route.ts` (920 lines - complex)

**What to do**:

1. Add imports:

   ```typescript
   import {
     checkInventoryAvailability,
     reserveInventory,
   } from "@/lib/inventory-service";
   ```

2. Replace inventory check (around line 206-228):

   ```typescript
   // OLD: Just checking
   if (variant.inventory < checkoutItem.quantity) { ... }

   // NEW: Check with service
   const inventoryCheck = await checkInventoryAvailability(
     items.map(item => ({
       variantId: item.variantId!,
       quantity: item.quantity,
     })),
     prisma
   );

   if (!inventoryCheck.available) {
     return NextResponse.json({
       message: "Không đủ hàng trong kho",
       unavailableItems: inventoryCheck.unavailableItems,
     }, { status: 400, headers: corsHeaders });
   }
   ```

3. Wrap order creation in transaction (around line 433):

   ```typescript
   // OLD: No transaction
   const order = await prisma.order.create({...});

   // NEW: Transaction + Reserve
   const order = await prisma.$transaction(async (tx) => {
     const newOrder = await tx.order.create({...});

     await reserveInventory(
       items.map(item => ({
         variantId: item.variantId!,
         quantity: item.quantity,
       })),
       tx
     );

     return newOrder;
   });
   ```

**Expected Impact**: Prevents overselling, ensures data consistency

---

### Task 2: Add Inventory Release on Order Cancellation

**File**: `admin/src/app/api/[storeId]/orders/[orderId]/route.ts`

Already has state machine validation ✅. Just need to add inventory release:

```typescript
import { releaseInventory } from "@/lib/inventory-service";

// In PATCH handler, after status validation:
if (status === "CANCELLED" && existingOrder.status !== "CANCELLED") {
  // Fetch order items
  const orderItems = await prisma.orderItem.findMany({
    where: { orderId: orderId },
    include: {
      product: {
        include: {
          variants: {
            where: {
              sizeId: { equals: orderItem.sizeId },
              colorId: { equals: orderItem.colorId },
              materialId: { equals: orderItem.materialId },
            },
            take: 1,
          },
        },
      },
    },
  });

  // Release inventory
  await releaseInventory(
    orderItems.map((item) => ({
      variantId: item.product.variants[0].id,
      quantity: item.quantity,
    })),
    prisma
  );
}
```

---

### Task 3: Apply Transaction Pattern to Product Routes

**Files**:

- `admin/src/app/api/[storeId]/products/route.ts` (POST)
- `admin/src/app/api/[storeId]/products/[productId]/route.ts` (PATCH, DELETE)

**Pattern** (from `route.IMPROVED.ts`):

```typescript
// POST - Create Product
const product = await prisma.$transaction(async (tx) => {
  const newProduct = await tx.product.create({...});
  await tx.image.createMany({...});
  await tx.productVariant.createMany({...});
  return tx.product.findUnique({...});
});

// PATCH - Update Product
const product = await prisma.$transaction(async (tx) => {
  await tx.image.deleteMany({ where: { productId } });
  await tx.productVariant.deleteMany({ where: { productId } });

  const updated = await tx.product.update({...});
  await tx.image.createMany({...});
  await tx.productVariant.createMany({...});

  return tx.product.findUnique({...});
});

// DELETE - Check OrderItems first
const orderItemsCount = await prisma.orderItem.count({
  where: { productId },
});

if (orderItemsCount > 0) {
  return NextResponse.json({
    error: "Không thể xóa sản phẩm đang có trong đơn hàng",
    suggestion: "Hãy ẩn sản phẩm thay vì xóa",
  }, { status: 400 });
}
```

---

## Bước 3: Testing

### Test 1: Race Condition (Inventory)

**Scenario**: 2 users checkout cùng 1 product có inventory = 1

**Expected**:

- User 1: Success (inventory: 1 → 0)
- User 2: Error 409 "Không đủ hàng trong kho"

**How to test**:

```bash
# Terminal 1
curl -X POST http://localhost:3000/api/checkout \
  -H "Content-Type: application/json" \
  -d '{"items": [{"variantId": "XXX", "quantity": 1}]}'

# Terminal 2 (immediately after)
curl -X POST http://localhost:3000/api/checkout \
  -H "Content-Type: application/json" \
  -d '{"items": [{"variantId": "XXX", "quantity": 1}]}'
```

### Test 2: Order State Transition

**Scenario**: Try invalid transition (DELIVERED → PENDING)

**Expected**: Error 400 "Không thể chuyển từ trạng thái DELIVERED sang PENDING"

**How to test**: In admin dashboard, create order → Mark as DELIVERED → Try to change back to PENDING

### Test 3: Transaction Rollback

**Scenario**: Create product with invalid variant (e.g., non-existent sizeId)

**Expected**: Entire transaction rolls back, no orphaned Product record

---

## Bước 4: Gradual Rollout

### Week 1: Critical Paths

- [ ] Checkout API (inventory + transaction)
- [ ] Order cancellation (inventory release)
- [ ] Order state validation (already done ✅)

### Week 2: Product Management

- [ ] Product POST (transaction)
- [ ] Product PATCH (transaction)
- [ ] Product DELETE (check OrderItems)

### Week 3: Remaining Routes

- [ ] Categories CRUD
- [ ] Coupons CRUD
- [ ] Returns CRUD
- [ ] Convert remaining English toasts

### Week 4: Production Prep

- [ ] Full integration testing
- [ ] Performance testing (transaction overhead)
- [ ] Documentation update
- [ ] Deploy to staging

---

## 🔍 Common Patterns Reference

### Pattern 1: Transaction Wrapper

```typescript
const result = await prisma.$transaction(async (tx) => {
  // All operations use tx instead of prisma
  const created = await tx.model.create({...});
  await tx.relatedModel.createMany({...});
  return created;
});
```

### Pattern 2: Error Handling

```typescript
import { handleApiError, throwError } from "@/lib/api-error-handler";

export async function POST(req: Request) {
  try {
    if (!userId) throwError.unauthenticated();
    if (!storeId) throwError.badRequest("Store ID là bắt buộc");

    // Business logic...
  } catch (error) {
    return handleApiError(error); // Auto converts to NextResponse
  }
}
```

### Pattern 3: State Validation

```typescript
import { validateOrderStatusTransition } from "@/lib/order-state-machine";

const validation = validateOrderStatusTransition(oldStatus, newStatus);
if (!validation.valid) {
  return NextResponse.json({ error: validation.error }, { status: 400 });
}
```

### Pattern 4: Inventory Management

```typescript
import {
  checkInventoryAvailability,
  reserveInventory,
} from "@/lib/inventory-service";

// Before checkout
const check = await checkInventoryAvailability(items, prisma);
if (!check.available) {
  return NextResponse.json({ error: "Không đủ hàng" }, { status: 400 });
}

// In transaction
await reserveInventory(items, tx); // Use tx for atomicity
```

---

## 📚 Documentation Files

1. **BACKEND_IMPROVEMENTS_SUMMARY.md** - Complete overview
2. **IMPLEMENTATION_CHECKLIST.md** - Detailed checklist for each API route
3. **INVENTORY_INTEGRATION.md** - Step-by-step inventory service integration
4. **BACKEND_IMPROVEMENTS.md** - Original audit report

---

## ⚠️ Important Notes

### Transaction Performance

- Transactions có overhead ~10-20ms
- Đáng giá cho data integrity
- Test performance trên staging trước khi deploy

### Inventory Locking

- Optimistic locking: Không block reads
- Chỉ fails nếu inventory changed giữa check và reserve
- Retry logic: Frontend nên retry 1 lần nếu gặp 409

### State Machine

- KHÔNG cho phép transitions ngược (DELIVERED → PENDING)
- Final states: CANCELLED, RETURNED
- COD orders: Auto mark isPaid=true khi DELIVERED

---

## 🎯 Success Criteria

After implementation, you should have:

✅ **Data Integrity**

- No orphaned records (Product without Variants)
- No overselling (inventory consistency)
- No invalid order states

✅ **Better UX**

- All errors in Vietnamese
- Clear error messages
- Proper HTTP status codes (400, 401, 403, 409, 500)

✅ **Professional Architecture**

- Service layer separation
- Reusable business logic
- Standardized error handling
- Transaction support for critical operations

---

## 🆘 Need Help?

### If You See Errors:

1. **Prisma Error P2025**: Record not found → Use `findUnique` with null check
2. **Transaction Timeout**: Reduce operations inside transaction
3. **Type Errors**: Check imports from `@/lib/constants` (ORDER_STATUS now has RETURNED)

### Common Mistakes:

❌ Calling `prisma.model` inside transaction (should use `tx.model`)
❌ Forgetting to `await params` in Next.js 15+ routes
❌ Not wrapping related creates in transaction
❌ Hardcoding error messages (use `ERROR_MESSAGES`)

---

**Start with Checkout API - it's the most critical!** 🚀
