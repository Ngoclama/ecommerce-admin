# Order Payment Logic - Professional Implementation

## Logic Thanh Toán

### Quy tắc:
1. **Thanh toán trực tuyến (STRIPE, MOMO, VNPAY)**: 
   - `isPaid = true` ngay khi tạo order (vì user sẽ thanh toán ngay)
   - Status = `PROCESSING` (đã thanh toán, đang xử lý)
   - Inventory được trừ ngay

2. **COD (Cash on Delivery)**:
   - `isPaid = false` khi tạo order
   - Status = `PENDING` (chờ thanh toán khi nhận hàng)
   - Inventory KHÔNG trừ (chỉ trừ khi đã thanh toán)

### Flow:

#### Online Payment Flow:
```
1. User chọn STRIPE/MOMO/VNPAY
2. Tạo order với isPaid = true, status = PROCESSING
3. Trừ inventory ngay
4. Redirect đến payment gateway
5. Webhook/IPN xác nhận payment thành công
6. Order giữ nguyên isPaid = true (đã set từ đầu)
```

#### COD Flow:
```
1. User chọn COD
2. Tạo order với isPaid = false, status = PENDING
3. KHÔNG trừ inventory
4. Khi shipper xác nhận đã nhận tiền:
   - Update isPaid = true
   - Update status = PROCESSING
   - Trừ inventory
```

## Service Layer

OrderService đã được tạo với các method:
- `createOrder()`: Tự động set isPaid dựa trên paymentMethod
- `updatePaymentStatus()`: Update payment status và trừ inventory
- `decrementInventory()`: Trừ inventory sau khi thanh toán thành công

## Webhook/IPN Handlers

Các webhook handlers (Stripe, MoMo, VNPay) sẽ:
- Verify payment thành công
- Nếu order.isPaid = false, update thành true và trừ inventory
- Nếu order.isPaid = true (đã set từ đầu), chỉ verify và log

