# INVENTORY SERVICE INTEGRATION GUIDE

## Overview

Hướng dẫn tích hợp `inventory-service.ts` vào checkout flow để đảm bảo:

- Kiểm tra tồn kho chính xác trước khi thanh toán
- Đặt trước hàng (reserve) ngay khi tạo order
- Hoàn trả hàng (release) khi hủy order
- Ngăn chặn race conditions với optimistic locking

## Current Implementation Issues

### File: `admin/src/app/api/checkout/route.ts`

**Problems**:

1. ❌ Chỉ **CHECK** inventory, không **RESERVE**
2. ❌ Không có transaction wrapping
3. ❌ Race condition: Giữa lúc check và create order, inventory có thể bị giảm
4. ❌ Khi order bị hủy, inventory không tự động hoàn trả

**Current Code (Lines 206-228)**:

```typescript
// ❌ CHỈ CHECK, KHÔNG RESERVE
if (variant) {
  if (variant.inventory < checkoutItem.quantity) {
    return NextResponse.json(
      {
        message: `Sản phẩm '${product.name}' chỉ còn ${variant.inventory} cái.`,
      },
      { status: 400 }
    );
  }
}
```

## Improved Implementation

### Step 1: Replace Inventory Check

**Before** (Lines 180-228):

```typescript
// Kiểm tra tồn kho từ variant hoặc product
if (variant) {
  if (variant.inventory < checkoutItem.quantity) {
    return NextResponse.json(...);
  }
}
```

**After** - Sử dụng `checkInventoryAvailability()`:

```typescript
import { checkInventoryAvailability } from "@/lib/inventory-service";

// Kiểm tra tồn kho cho tất cả items
const inventoryCheck = await checkInventoryAvailability(
  items.map((item) => ({
    variantId: item.variantId!,
    quantity: item.quantity,
  })),
  prisma
);

if (!inventoryCheck.available) {
  const unavailableProducts = inventoryCheck.unavailableItems
    .map((item) => `${item.productName} (còn ${item.currentStock})`)
    .join(", ");

  return NextResponse.json(
    {
      message: `Không đủ hàng: ${unavailableProducts}`,
      unavailableItems: inventoryCheck.unavailableItems,
    },
    { status: 400, headers: corsHeaders }
  );
}
```

### Step 2: Wrap Order Creation in Transaction with Inventory Reserve

**Before** (Line 433):

```typescript
// ❌ NO TRANSACTION
const order = await prisma.order.create({
  data: { ...orderData, orderItems: { create: [...] } },
});
```

**After** - Transaction + Reserve:

```typescript
import { reserveInventory } from "@/lib/inventory-service";

// Wrap in transaction
const order = await prisma.$transaction(async (tx) => {
  // 1. Create Order
  const newOrder = await tx.order.create({
    data: {
      ...orderData,
      orderItems: {
        create: items.map((checkoutItem) => {
          const product = products.find((p) => p.id === checkoutItem.productId);
          const variant = product?.variants.find(
            (v) => v.id === checkoutItem.variantId
          );
          const itemPrice = variant?.price
            ? Number(variant.price)
            : Number(product!.price);

          return {
            product: { connect: { id: checkoutItem.productId } },
            sizeId: variant?.sizeId || null,
            colorId: variant?.colorId || null,
            materialId: variant?.materialId || null,
            sizeName: variant?.size.name || null,
            colorName: variant?.color.name || null,
            materialName: variant?.material?.name || null,
            productPrice: itemPrice,
            price: itemPrice,
            productName: product!.name,
            quantity: checkoutItem.quantity,
            imageUrl: product!.images?.[0]?.url || null,
          };
        }),
      },
    },
    include: { orderItems: true },
  });

  // 2. Reserve Inventory (atomic decrement)
  const reserveResult = await reserveInventory(
    items.map((item) => ({
      variantId: item.variantId!,
      quantity: item.quantity,
    })),
    tx // Pass transaction context
  );

  if (!reserveResult.success) {
    throw new Error(`Không thể đặt trước hàng: ${reserveResult.message}`);
  }

  return newOrder;
});
```

### Step 3: Release Inventory on Order Cancellation

**File**: `admin/src/app/api/[storeId]/orders/[orderId]/route.ts`

**Add to PATCH handler when status → CANCELLED**:

```typescript
import { releaseInventory } from "@/lib/inventory-service";
import { handleOrderStatusTransition } from "@/lib/order-state-machine";

// Inside PATCH handler after status validation:
if (
  status === ORDER_STATUS.CANCELLED &&
  existingOrder.status !== ORDER_STATUS.CANCELLED
) {
  // Fetch OrderItems to restore inventory
  const orderItems = await prisma.orderItem.findMany({
    where: { orderId: orderId },
    select: {
      product: {
        select: {
          variants: {
            where: {
              // Match variant by combination
              sizeId: orderItem.sizeId,
              colorId: orderItem.colorId,
              materialId: orderItem.materialId,
            },
            select: { id: true },
            take: 1,
          },
        },
      },
      quantity: true,
    },
  });

  const releaseResult = await releaseInventory(
    orderItems.map((item) => ({
      variantId: item.product.variants[0].id,
      quantity: item.quantity,
    })),
    prisma
  );

  if (!releaseResult.success) {
    console.error(
      "[ORDER_CANCEL] Failed to release inventory:",
      releaseResult.message
    );
    // Log error but don't block cancellation
  }
}
```

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      CHECKOUT FLOW                          │
└─────────────────────────────────────────────────────────────┘

1. User submits checkout
   ↓
2. checkInventoryAvailability([...items])
   ├─ ✅ Available → Continue
   └─ ❌ Unavailable → Return 400 với chi tiết sản phẩm thiếu
   ↓
3. Begin Transaction (prisma.$transaction)
   ↓
4. Create Order + OrderItems
   ↓
5. reserveInventory([...items]) - Atomic decrement
   ├─ ✅ Success → Commit transaction
   └─ ❌ Race condition (inventory changed) → Rollback entire order
   ↓
6. Return order to payment gateway (Stripe/MoMo/VNPay)

┌─────────────────────────────────────────────────────────────┐
│                   ORDER CANCELLATION                        │
└─────────────────────────────────────────────────────────────┘

1. PATCH /orders/[orderId] with status=CANCELLED
   ↓
2. validateOrderStatusTransition(currentStatus, CANCELLED)
   ├─ ✅ Valid → Continue
   └─ ❌ Invalid (e.g., DELIVERED → CANCELLED) → Return 400
   ↓
3. releaseInventory([...orderItems]) - Atomic increment
   ↓
4. Update order status=CANCELLED
```

## Error Handling

### Race Condition Example

```typescript
// Transaction ensures atomicity
try {
  const order = await prisma.$transaction(async (tx) => {
    // ... create order ...

    // This will FAIL if inventory changed between check and reserve
    await reserveInventory([...], tx);

    return newOrder;
  });
} catch (error) {
  if (error.message.includes("Không đủ hàng")) {
    return NextResponse.json(
      {
        message: "Sản phẩm vừa hết hàng. Vui lòng chọn lại.",
      },
      { status: 409 } // Conflict
    );
  }
  throw error;
}
```

## Migration Checklist

- [ ] Import `checkInventoryAvailability`, `reserveInventory`, `releaseInventory`
- [ ] Replace inventory check logic với `checkInventoryAvailability()`
- [ ] Wrap order creation in `prisma.$transaction()`
- [ ] Call `reserveInventory()` inside transaction
- [ ] Add `releaseInventory()` to order PATCH when status → CANCELLED
- [ ] Add `releaseInventory()` to order PATCH when status → RETURNED
- [ ] Test race condition scenario (2 users checkout cùng lúc)
- [ ] Test cancellation flow (inventory restored correctly)

## Testing Scenarios

### Scenario 1: Race Condition

```bash
# Terminal 1
curl -X POST /api/checkout \
  -d '{"items": [{"variantId": "...", "quantity": 10}]}'

# Terminal 2 (immediately after)
curl -X POST /api/checkout \
  -d '{"items": [{"variantId": "...", "quantity": 10}]}'

# Expected: Nếu chỉ còn 10 trong kho, 1 request thành công, 1 request lỗi 409
```

### Scenario 2: Order Cancellation

```bash
# 1. Tạo order (inventory giảm)
POST /api/checkout → Order created, inventory: 100 → 90

# 2. Hủy order (inventory tăng lại)
PATCH /api/orders/[orderId] -d '{"status": "CANCELLED"}' → inventory: 90 → 100
```

## Notes

- **Optimistic Locking**: `reserveInventory()` sử dụng `where: { inventory: { gte: quantity } }` để đảm bảo không oversell
- **Transaction Rollback**: Nếu reserve fails, toàn bộ order creation sẽ rollback
- **Idempotency**: Không gọi `reserveInventory()` 2 lần cho cùng 1 order (check order status)
- **Performance**: Transaction có thể chậm hơn, nhưng đảm bảo data integrity
