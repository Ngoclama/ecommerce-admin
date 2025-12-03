# MoMo Payment Integration

Hệ thống đã được tích hợp phương thức thanh toán **MoMo Wallet** (Ví điện tử MoMo).

## 📋 Tổng quan

MoMo là ví điện tử phổ biến nhất tại Việt Nam, cho phép khách hàng thanh toán trực tuyến một cách nhanh chóng và an toàn.

### Luồng thanh toán

1. Khách hàng chọn sản phẩm và thanh toán bằng MoMo
2. Hệ thống tạo đơn hàng và gửi request đến MoMo API
3. MoMo trả về `payUrl` (hoặc deeplink/QR code)
4. Khách hàng được redirect đến trang thanh toán MoMo
5. Khách hàng xác nhận thanh toán trong ứng dụng MoMo
6. MoMo gọi IPN callback để thông báo kết quả
7. Hệ thống cập nhật trạng thái đơn hàng và giảm inventory

## 🔧 Cấu hình

### Biến môi trường (.env)

```env
# MoMo Payment Gateway Configuration
MOMO_PARTNER_CODE=MOMO
MOMO_ACCESS_KEY=F8BBA842ECF85
MOMO_SECRET_KEY=K951B6PE1waDMi640xX08PD3vg6EkVlz
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create

# Production endpoint (khi deploy lên production)
# MOMO_ENDPOINT=https://payment.momo.vn/v2/gateway/api/create
```

**Lưu ý:**

- Các thông tin trên là **test credentials** từ MoMo sandbox
- Khi deploy production, cần đăng ký với MoMo để lấy credentials thực tế
- Đăng ký tại: https://business.momo.vn/

## 📂 Cấu trúc code

### 1. MoMo Utilities (`src/lib/momo.ts`)

File này chứa các hàm tiện ích để tương tác với MoMo API:

```typescript
// Types
export interface MoMoPaymentRequest { ... }
export interface MoMoPaymentResponse { ... }
export interface MoMoIPNRequest { ... }

// Functions
getMoMoConfig()                    // Lấy cấu hình từ env
generateMoMoSignature(...)        // Tạo chữ ký HMAC SHA256
verifyMoMoIPNSignature(...)       // Xác thực chữ ký IPN
createMoMoPayment(...)            // Tạo payment request
isMoMoConfigured()                // Kiểm tra đã config chưa
```

### 2. Payment API (`src/app/api/momo/payment/route.ts`)

Endpoint để tạo MoMo payment:

**Request:**

```json
POST /api/momo/payment
{
  "orderId": "order_id_here"
}
```

**Response (Success):**

```json
{
  "success": true,
  "payUrl": "https://test-payment.momo.vn/...",
  "deeplink": "momo://...",
  "qrCodeUrl": "https://...",
  "orderId": "order_id_here"
}
```

### 3. IPN Callback Handler (`src/app/api/momo/ipn/route.ts`)

Endpoint để nhận thông báo từ MoMo về kết quả thanh toán:

**MoMo gửi POST request:**

```json
POST /api/momo/ipn
{
  "partnerCode": "MOMO",
  "orderId": "order_id",
  "requestId": "request_id",
  "amount": 100000,
  "resultCode": 0,
  "message": "Successful",
  "transId": "123456789",
  "signature": "..."
}
```

**Response:**

```json
{
  "success": true,
  "message": "IPN received successfully"
}
```

**Xử lý:**

- Verify signature để đảm bảo request từ MoMo
- `resultCode === 0`: Thanh toán thành công
  - Cập nhật `isPaid = true`, `status = PROCESSING`
  - Giảm inventory cho các sản phẩm
- `resultCode !== 0`: Thanh toán thất bại
  - Cập nhật `status = CANCELLED`

### 4. Checkout Integration (`src/app/api/checkout/route.ts`)

Đã được cập nhật để hỗ trợ MoMo:

```typescript
// Trong POST handler
if (paymentMethod === "MOMO") {
  const momoResponse = await createMoMoPayment(
    order.id,
    Math.round(total),
    orderInfo
  );

  return NextResponse.json({
    success: true,
    payUrl: momoResponse.payUrl,
    // ...
  });
}
```

## 🧪 Testing

### Test credentials (Sandbox)

```
Partner Code: MOMO
Access Key: F8BBA842ECF85
Secret Key: K951B6PE1waDMi640xX08PD3vg6EkVlz
Endpoint: https://test-payment.momo.vn/v2/gateway/api/create
```

### Test trong môi trường development

1. Đảm bảo đã cấu hình biến môi trường
2. Tạo đơn hàng với `paymentMethod: "MOMO"`
3. Nhận được `payUrl` và redirect khách hàng
4. Sử dụng app MoMo (hoặc test tool) để thanh toán
5. MoMo sẽ gọi IPN callback về server

### Kiểm tra IPN endpoint

```bash
# Health check
curl http://localhost:3000/api/momo/ipn
```

**Response:**

```json
{
  "success": true,
  "message": "MoMo IPN endpoint is ready"
}
```

## 🔒 Bảo mật

### Signature verification

Mọi request đều được verify bằng HMAC SHA256 signature:

```typescript
// Request signature
const rawSignature =
  `accessKey=${accessKey}` +
  `&amount=${amount}` +
  `&extraData=${extraData}` +
  `&ipnUrl=${ipnUrl}` +
  `&orderId=${orderId}` +
  `&orderInfo=${orderInfo}` +
  `&partnerCode=${partnerCode}` +
  `&redirectUrl=${redirectUrl}` +
  `&requestId=${requestId}` +
  `&requestType=${requestType}`;

const signature = crypto
  .createHmac("sha256", secretKey)
  .update(rawSignature)
  .digest("hex");
```

### IPN verification

```typescript
// Verify IPN signature trước khi xử lý
const isValid = verifyMoMoIPNSignature(ipnData, secretKey);
if (!isValid) {
  return error response;
}
```

## 📊 Luồng dữ liệu

```
Customer                    Frontend Store              Admin API                 MoMo API
   |                             |                          |                          |
   |---(1) Select products------>|                          |                          |
   |                             |                          |                          |
   |                             |---(2) POST /checkout---->|                          |
   |                             |    (paymentMethod=MOMO)  |                          |
   |                             |                          |                          |
   |                             |                          |---(3) Create payment---->|
   |                             |                          |                          |
   |                             |                          |<---(4) payUrl------------|
   |                             |                          |                          |
   |                             |<---(5) Return payUrl-----|                          |
   |                             |                          |                          |
   |<---(6) Redirect to MoMo-----|                          |                          |
   |                             |                          |                          |
   |---(7) Confirm payment------>|                          |                          |
   |         in MoMo app         |                          |                          |
   |                             |                          |                          |
   |                             |                          |<---(8) IPN callback------|
   |                             |                          |                          |
   |                             |                          |---(9) Update order------>|
   |                             |                          |     Decrease inventory   |
   |                             |                          |                          |
   |                             |                          |---(10) Return 200 OK---->|
   |                             |                          |                          |
   |<---(11) Redirect to success-|                          |                          |
```

## 🚀 Production Deployment

Khi deploy lên production:

1. **Đăng ký merchant với MoMo**

   - Truy cập: https://business.momo.vn/
   - Điền thông tin doanh nghiệp
   - Chờ phê duyệt

2. **Nhận production credentials**

   - Partner Code
   - Access Key
   - Secret Key

3. **Cập nhật environment variables**

   ```env
   MOMO_PARTNER_CODE=<your_partner_code>
   MOMO_ACCESS_KEY=<your_access_key>
   MOMO_SECRET_KEY=<your_secret_key>
   MOMO_ENDPOINT=https://payment.momo.vn/v2/gateway/api/create
   ```

4. **Cấu hình IPN URL**

   - Đăng nhập MoMo Business Portal
   - Cấu hình IPN URL: `https://yourdomain.com/api/momo/ipn`
   - Cấu hình Return URL: `https://yourdomain.com/checkout?momo=success`

5. **Testing trên production**
   - Thực hiện giao dịch thử với số tiền nhỏ
   - Kiểm tra IPN callback hoạt động
   - Verify order status updates correctly

## ⚠️ Lưu ý quan trọng

1. **IPN endpoint phải public**

   - MoMo cần gọi được đến `/api/momo/ipn`
   - Không được bảo vệ bởi authentication
   - Verify signature để đảm bảo an toàn

2. **Xử lý idempotent**

   - MoMo có thể gửi IPN nhiều lần
   - Kiểm tra order status trước khi update
   - Tránh giảm inventory nhiều lần

3. **Timeout và retry**

   - MoMo API có thể timeout
   - Implement retry logic nếu cần
   - Log errors để debug

4. **Amount format**

   - MoMo chỉ nhận số nguyên (VND)
   - Sử dụng `Math.round()` để làm tròn

5. **Testing IPN locally**
   - Sử dụng ngrok hoặc localtunnel để expose local server
   - Cấu hình IPN URL: `https://your-ngrok-url.ngrok.io/api/momo/ipn`

## 📚 Tài liệu tham khảo

- [MoMo Developer Documentation](https://developers.momo.vn/)
- [MoMo Business Portal](https://business.momo.vn/)
- [GitHub Examples](https://github.com/momo-wallet/payment)

## 🐛 Troubleshooting

### Lỗi: "Invalid signature"

- Kiểm tra SECRET_KEY đúng chưa
- Verify rawSignature format (thứ tự fields phải đúng)
- Check encoding (UTF-8)

### Lỗi: "MoMo configuration is missing"

- Kiểm tra `.env` file có đầy đủ variables chưa
- Restart server sau khi update `.env`

### IPN không được gọi

- Kiểm tra IPN URL có public không
- Check firewall/security group
- Xem logs trên MoMo Business Portal

### Order không được update

- Check IPN signature verification
- Xem console logs trong IPN handler
- Verify database connection

## 💡 Future Enhancements

- [ ] Thêm refund functionality
- [ ] Query transaction status API
- [ ] Webhook retry mechanism
- [ ] Transaction logs và audit trail
- [ ] Admin panel để xem MoMo transactions
