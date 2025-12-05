# Hướng dẫn cấu hình VNPAY trên Vercel

## Vấn đề thường gặp

Khi deploy lên Vercel, thanh toán VNPAY có thể bị lỗi do:
1. **Return URL không đúng**: VNPAY cần URL công khai để redirect về sau khi thanh toán
2. **Environment variables chưa được cấu hình**: Các biến môi trường cần được set trên Vercel
3. **VNPAY Host**: Cần đảm bảo dùng production host khi deploy

## Cấu hình Environment Variables trên Vercel

### 1. Truy cập Vercel Dashboard
- Vào https://vercel.com/dashboard
- Chọn project **admin** (ecommerce-admin)
- Vào **Settings** → **Environment Variables**

### 2. Thêm các biến môi trường sau:

#### **Bắt buộc cho VNPAY:**
```
VNPAY_TMN_CODE=your_tmn_code
VNPAY_SECURE_SECRET=your_secure_secret
VNPAY_HOST=https://www.vnpayment.vn  (Cho production)
```

**⚠️ LƯU Ý QUAN TRỌNG:**
- **Production**: `VNPAY_HOST=https://www.vnpayment.vn` (khuyến nghị cho production)
- **Sandbox (Test)**: `VNPAY_HOST=https://sandbox.vnpayment.vn` (chỉ dùng để test)
- Nếu không set `VNPAY_HOST`, hệ thống sẽ tự động detect:
  - Production trên Vercel → dùng `https://www.vnpayment.vn`
  - Localhost/Development → dùng `https://sandbox.vnpayment.vn`
- **Lưu ý về Sandbox**: Sandbox có thể có lỗi JavaScript (như `timer is not defined`) nhưng vẫn có thể test được. Nếu gặp lỗi, thử refresh lại trang hoặc dùng production.

#### **Quan trọng - Return URL:**
```
FRONTEND_STORE_URL=https://ecommerce-store-henna-nine.vercel.app
```

**Lưu ý:** 
- `FRONTEND_STORE_URL` phải là URL công khai của store frontend
- Không có trailing slash (`/`)
- Phải là HTTPS

#### **Tùy chọn - Debug:**
```
VNPAY_DEBUG=true  (chỉ bật khi cần debug, tắt trong production)
```

### 3. Cấu hình cho cả 3 môi trường:

#### **Production Environment:**
```
VNPAY_TMN_CODE=your_production_tmn_code
VNPAY_SECURE_SECRET=your_production_secure_secret
VNPAY_HOST=https://www.vnpayment.vn
FRONTEND_STORE_URL=https://ecommerce-store-henna-nine.vercel.app
```

#### **Preview/Development (nếu muốn test với sandbox):**
```
VNPAY_TMN_CODE=your_sandbox_tmn_code
VNPAY_SECURE_SECRET=your_sandbox_secure_secret
VNPAY_HOST=https://sandbox.vnpayment.vn  (Tùy chọn - để test)
FRONTEND_STORE_URL=https://your-preview-url.vercel.app
```

**Lưu ý:**
- Sandbox và Production có credentials khác nhau
- Sandbox có thể có lỗi JavaScript nhưng vẫn test được
- Khuyến nghị: Dùng production cho production environment

### 4. Sau khi thêm biến môi trường:
- **Redeploy** project để áp dụng thay đổi
- Vào **Deployments** → Click **"..."** → **Redeploy**

## Kiểm tra cấu hình

### 1. Kiểm tra Return URL
Sau khi deploy, check logs trong Vercel:
- Vào **Deployments** → Click vào deployment mới nhất → **Functions** → Tìm function `/api/[storeId]/checkout/vnpay`
- Nếu có log `[VNPAY] Return URL:`, kiểm tra xem URL có đúng không

### 2. Test thanh toán
1. Tạo đơn hàng test trên store
2. Chọn thanh toán VNPAY
3. Kiểm tra xem có redirect đến VNPAY không
4. Sau khi thanh toán, kiểm tra xem có redirect về `/payment/success` không

## Troubleshooting

### Lỗi: "An error occurred during the processing"
**Nguyên nhân có thể:**
1. Return URL không đúng hoặc không accessible
2. VNPAY_TMN_CODE hoặc VNPAY_SECURE_SECRET sai
3. VNPAY Host không đúng (đang dùng sandbox thay vì production) ⚠️ **QUAN TRỌNG**
4. JavaScript errors từ VNPAY sandbox (như `timer is not defined`)

**Cách fix:**
1. **QUAN TRỌNG**: Đảm bảo `VNPAY_HOST=https://www.vnpayment.vn` được set trên Vercel
   - Vào Vercel Dashboard → Project → Settings → Environment Variables
   - Thêm: `VNPAY_HOST=https://www.vnpayment.vn` (cho Production environment)
   - **Redeploy** sau khi thêm
2. Kiểm tra `FRONTEND_STORE_URL` có đúng không
3. Kiểm tra VNPAY credentials trong Vercel environment variables
4. Check logs trong Vercel để xem `vnpayHost` có đúng không:
   - Vào Deployments → Click vào deployment → Functions → Tìm function checkout/vnpay
   - Tìm log `[VNPAY] Configuration:` và kiểm tra `vnpayHost` phải là `https://www.vnpayment.vn`
5. Nếu vẫn dùng sandbox, có thể do `VERCEL_ENV` không được set. Thêm `VNPAY_HOST` để force production

### Lỗi: Invalid signature
**Nguyên nhân:**
- `VNPAY_SECURE_SECRET` không khớp với VNPAY dashboard

**Cách fix:**
- Kiểm tra lại `VNPAY_SECURE_SECRET` trong Vercel
- Đảm bảo không có khoảng trắng thừa
- Redeploy sau khi sửa

### Return URL không hoạt động
**Nguyên nhân:**
- URL không công khai hoặc không accessible từ VNPAY servers

**Cách fix:**
1. Đảm bảo `FRONTEND_STORE_URL` là URL công khai (không phải localhost)
2. Test URL: `https://ecommerce-store-henna-nine.vercel.app/payment/success` có accessible không
3. Kiểm tra CORS settings nếu có

## Checklist trước khi deploy

- [ ] `VNPAY_TMN_CODE` đã được set trên Vercel
- [ ] `VNPAY_SECURE_SECRET` đã được set trên Vercel
- [ ] `FRONTEND_STORE_URL` đã được set với URL production đúng
- [ ] `VNPAY_HOST` đã được set cho production (nếu cần)
- [ ] Đã redeploy sau khi thêm environment variables
- [ ] Đã test thanh toán trên production

## Liên hệ VNPAY Support

Nếu vẫn gặp lỗi, liên hệ VNPAY với:
- **Mã tra cứu** (từ error page)
- **Thời gian giao dịch**
- **Order ID**
- **Return URL** đang sử dụng

Hotline: **1900 55 55 77**
Email: **hotrovnpay@vnpay.vn**
