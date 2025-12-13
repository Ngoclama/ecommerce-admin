# E-Commerce Admin Panel

Admin dashboard cho nền tảng thương mại điện tử đa cửa hàng (multi-tenant e-commerce platform) được xây dựng với Next.js 15, MongoDB, và Clerk Authentication.

## 📋 Mục lục

- [Tổng quan](#tổng-quan)
- [Kiến trúc hệ thống](#kiến-trúc-hệ-thống)
- [Tính năng chính](#tính-năng-chính)
- [Cài đặt](#cài-đặt)
- [Cấu hình](#cấu-hình)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Hướng dẫn sử dụng](#hướng-dẫn-sử-dụng)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Development](#development)

## 🎯 Tổng quan

Admin Panel là một ứng dụng quản lý toàn diện cho phép người dùng quản lý nhiều cửa hàng, sản phẩm, đơn hàng, và các tài nguyên khác trong hệ thống thương mại điện tử.

### Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: TailwindCSS 4
- **UI Components**: Radix UI, shadcn/ui
- **State Management**: Zustand, TanStack Query
- **Form Handling**: React Hook Form, Zod
- **Animations**: Framer Motion
- **Database**: MongoDB
- **ORM**: Prisma 5.19.1
- **Authentication**: Clerk
- **Payment Gateways**: VNPay, MoMo, Stripe
- **Real-time**: Pusher
- **File Storage**: UploadThing, Cloudinary

## 🏗️ Kiến trúc hệ thống

### Sơ đồ tổng quan

```
┌─────────────────────────────────────────────────────────────┐
│                    E-Commerce Platform                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │   Admin Panel    │         │   Storefront     │          │
│  │   (Port 3000)    │◄───────►│   (Port 3001)    │          │
│  └────────┬─────────┘         └────────┬─────────┘          │
│           │                            │                     │
│           │                            │                     │
│           ▼                            ▼                     │
│  ┌─────────────────────────────────────────────┐            │
│  │         Next.js API Routes                   │            │
│  │  /api/[storeId]/products                     │            │
│  │  /api/[storeId]/orders                       │            │
│  │  /api/[storeId]/categories                   │            │
│  │  ...                                         │            │
│  └──────────────────┬──────────────────────────┘            │
│                     │                                         │
│           ┌─────────┴─────────┐                              │
│           ▼                   ▼                              │
│  ┌──────────────┐    ┌──────────────┐                       │
│  │   MongoDB    │    │    Clerk     │                       │
│  │  (Prisma)    │    │  (Auth)      │                       │
│  └──────────────┘    └──────────────┘                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Multi-Tenant Architecture

Hệ thống hỗ trợ multi-tenant, cho phép mỗi user quản lý nhiều cửa hàng:

```
User (Clerk)
  ├── Store 1
  │   ├── Products
  │   ├── Orders
  │   ├── Categories
  │   └── ...
  ├── Store 2
  │   ├── Products
  │   ├── Orders
  │   └── ...
  └── Store N
```

**Đặc điểm:**
- Mỗi user có thể sở hữu nhiều stores
- Tất cả resources (products, orders, categories) được scope theo `storeId`
- URL pattern: `/{storeId}/products`, `/{storeId}/orders`, etc.
- Store switcher component để chuyển đổi giữa các stores

### Authentication & Authorization

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Clerk Auth     │
│  (Middleware)   │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Role Check     │
│  ADMIN/VENDOR   │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Store Access   │
│  Verification   │
└─────────────────┘
```

**Roles:**
- **ADMIN**: Full access to all stores
- **VENDOR**: Access to owned stores only
- **CUSTOMER**: Read-only access (via storefront)

## ✨ Tính năng chính

### 1. Quản lý Cửa hàng (Store Management)
- Tạo và quản lý nhiều cửa hàng
- Store switcher để chuyển đổi giữa các cửa hàng
- Cài đặt cửa hàng (thông tin, địa chỉ, liên hệ)

### 2. Quản lý Sản phẩm (Product Management)
- CRUD operations cho sản phẩm
- Hệ thống variants phức tạp: Size × Color × Material
- Quản lý inventory cho từng variant
- Upload nhiều hình ảnh
- Import/Export sản phẩm (CSV, Excel)
- Bulk operations

### 3. Quản lý Danh mục (Category Management)
- Category hierarchy (parent-child)
- Billboard assignment
- Bulk operations

### 4. Quản lý Đơn hàng (Order Management)
- Xem và quản lý đơn hàng
- Cập nhật trạng thái đơn hàng
- Xử lý returns và cancellations
- Order fulfillment workflow
- Real-time order updates (Pusher)

### 5. Quản lý Thuộc tính (Attributes Management)
- Sizes (Kích thước)
- Colors (Màu sắc)
- Materials (Chất liệu)
- Bulk operations

### 6. Quản lý Khuyến mãi
- Coupons (Mã giảm giá)
- Flash Sales (Khuyến mãi nhanh)

### 7. Quản lý Vận chuyển (Shipping Management)
- Tích hợp nhiều nhà vận chuyển (GHN, ViettelPost, Custom)
- Tracking orders
- Shipping rates calculation

### 8. Quản lý Nội dung
- Blog Posts
- Blog Categories
- Rich text editor

### 9. Quản lý Reviews
- Xem và phản hồi reviews
- Moderation tools

### 10. Báo cáo & Thống kê (Reports & Analytics)
- Dashboard với charts và graphs
- Revenue reports
- Category revenue
- Export reports (PDF, Excel)

### 11. Quản lý Người dùng (User Management)
- Xem danh sách users
- Quản lý roles
- User details

## 🚀 Cài đặt

### Yêu cầu

- Node.js 18+ 
- MongoDB database
- Clerk account (for authentication)
- npm hoặc yarn

### Bước 1: Clone repository

```bash
git clone https://github.com/Ngoclama/ecommerce-admin.git
cd ecommerce-admin
```

### Bước 2: Cài đặt dependencies

```bash
npm install
```

### Bước 3: Cấu hình environment variables

Tạo file `.env` trong thư mục root:

```env
# Database
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Admin Access Control
ADMIN_ALLOWED_EMAILS="admin@example.com,vendor@example.com"
# Hoặc "*" để cho phép tất cả users

# UploadThing
UPLOADTHING_SECRET=sk_live_...
UPLOADTHING_APP_ID=...

# Payment Gateways
STRIPE_SECRET_KEY=sk_test_...
VNPAY_TMN_CODE=...
VNPAY_HASH_SECRET=...
MOMO_PARTNER_CODE=...
MOMO_ACCESS_KEY=...
MOMO_SECRET_KEY=...

# Real-time (Pusher)
NEXT_PUBLIC_PUSHER_APP_ID=...
PUSHER_APP_KEY=...
PUSHER_APP_SECRET=...
PUSHER_APP_CLUSTER=...

# Frontend Store URL
FRONTEND_STORE_URL=http://localhost:3001

# Cloudinary (optional)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### Bước 4: Setup database

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) Open Prisma Studio to view database
npx prisma studio
```

### Bước 5: Chạy development server

```bash
npm run dev
# hoặc với Turbopack (nhanh hơn)
npm run dev:turbo
```

Ứng dụng sẽ chạy tại `http://localhost:3000`

## ⚙️ Cấu hình

### Database Schema

Xem file `prisma/schema.prisma` để biết chi tiết về database schema.

**Các models chính:**
- `User` - Người dùng
- `Store` - Cửa hàng
- `Product` - Sản phẩm
- `ProductVariant` - Biến thể sản phẩm (Size × Color × Material)
- `Category` - Danh mục
- `Order` - Đơn hàng
- `OrderItem` - Chi tiết đơn hàng
- `Coupon` - Mã giảm giá
- `FlashSale` - Khuyến mãi nhanh
- `Review` - Đánh giá
- `Shipping` - Vận chuyển
- `Return` - Đổi trả
- `BlogPost` - Bài viết blog
- Và nhiều models khác...

### Middleware Configuration

File `src/middleware.ts` xử lý:
- Authentication check
- Role-based access control
- Route protection

## 📁 Cấu trúc dự án

```
admin/
├── prisma/
│   └── schema.prisma          # Database schema
├── public/                     # Static files
├── scripts/                    # Utility scripts
│   ├── reset-db.ts
│   ├── set-admin.ts
│   └── ...
├── src/
│   ├── app/
│   │   ├── (auth)/            # Auth pages
│   │   ├── (dashboard)/       # Dashboard pages
│   │   │   └── [storeId]/
│   │   │       └── (routes)/
│   │   │           ├── products/
│   │   │           ├── orders/
│   │   │           ├── categories/
│   │   │           ├── ...
│   │   ├── api/               # API routes
│   │   │   ├── [storeId]/
│   │   │   │   ├── products/
│   │   │   │   ├── orders/
│   │   │   │   └── ...
│   │   │   ├── stores/
│   │   │   └── ...
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── modals/            # Modal components
│   │   ├── sidebar.tsx
│   │   ├── navbar.tsx
│   │   └── ...
│   ├── hooks/                 # Custom hooks
│   ├── lib/                   # Utilities & services
│   │   ├── prisma.ts
│   │   ├── constants.ts
│   │   ├── api-client.ts
│   │   ├── permissions.ts
│   │   └── ...
│   ├── providers/             # Context providers
│   └── action/                # Server actions
└── package.json
```

## 📖 Hướng dẫn sử dụng

### Tạo Store đầu tiên

1. Đăng nhập vào admin panel
2. Click vào "Create Store" hoặc "New Store"
3. Điền thông tin cửa hàng
4. Click "Create"

### Quản lý Sản phẩm

1. Chọn store từ store switcher
2. Navigate đến `/products`
3. Click "Add New" để tạo sản phẩm mới
4. Điền thông tin sản phẩm:
   - Tên, mô tả, giá
   - Chọn category
   - Upload hình ảnh
   - Tạo variants (Size × Color × Material)
   - Set inventory cho mỗi variant
5. Click "Save"

### Quản lý Đơn hàng

1. Navigate đến `/orders`
2. Xem danh sách đơn hàng
3. Click vào order để xem chi tiết
4. Cập nhật trạng thái:
   - Pending → Processing → Shipped → Delivered
   - Hoặc Cancel nếu cần

### Import/Export Sản phẩm

**Export:**
1. Navigate đến `/products`
2. Click "Export" để tải file CSV/Excel

**Import:**
1. Navigate đến `/products/import`
2. Upload file CSV/Excel
3. Preview và confirm import

## 🔌 API Documentation

### Base URL

```
/api/[storeId]/[resource]
```

### Authentication

Tất cả API requests cần authentication token từ Clerk:

```typescript
Headers: {
  'Authorization': 'Bearer <clerk_token>'
}
```

### Common Endpoints

#### Products

```
GET    /api/[storeId]/products          # List products
POST   /api/[storeId]/products          # Create product
GET    /api/[storeId]/products/[id]     # Get product
PATCH  /api/[storeId]/products/[id]     # Update product
DELETE /api/[storeId]/products/[id]     # Delete product
POST   /api/[storeId]/products/bulk-import  # Bulk import
```

#### Orders

```
GET    /api/[storeId]/orders            # List orders
GET    /api/[storeId]/orders/[id]       # Get order
PATCH  /api/[storeId]/orders/[id]       # Update order
POST   /api/orders/[id]/status          # Update order status
POST   /api/orders/[id]/cancel          # Cancel order
```

#### Categories

```
GET    /api/[storeId]/categories        # List categories
POST   /api/[storeId]/categories        # Create category
GET    /api/[storeId]/categories/[id]   # Get category
PATCH  /api/[storeId]/categories/[id]   # Update category
DELETE /api/[storeId]/categories/[id]   # Delete category
POST   /api/[storeId]/categories/bulk   # Bulk operations
```

### Response Format

**Success:**
```json
{
  "data": { ... },
  "message": "Success message"
}
```

**Error:**
```json
{
  "error": "Error message",
  "status": 400
}
```

### Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## 🗄️ Database Schema

### Key Models

#### User
```prisma
model User {
  id       String  @id @default(auto()) @map("_id") @db.ObjectId
  clerkId  String  @unique
  email    String  @unique
  name     String?
  role     Role    @default(CUSTOMER)
  stores   Store[]
  orders   Order[]
  ...
}
```

#### Store
```prisma
model Store {
  id        String     @id @default(auto()) @map("_id") @db.ObjectId
  name      String
  userId    String
  products  Product[]
  orders    Order[]
  categories Category[]
  ...
}
```

#### Product
```prisma
model Product {
  id          String          @id @default(auto()) @map("_id") @db.ObjectId
  name        String
  slug        String
  price       Float
  storeId     String
  categoryId  String
  variants    ProductVariant[]
  images      ProductImage[]
  ...
}
```

#### ProductVariant
```prisma
model ProductVariant {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  productId       String
  sizeId          String
  colorId         String
  materialId      String?
  inventory       Int
  lowStockThreshold Int
  sku             String?
  price           Float?
  ...
  @@unique([productId, sizeId, colorId, materialId])
}
```

Xem file `prisma/schema.prisma` để biết đầy đủ schema.

## 💻 Development

### Scripts

```bash
# Development
npm run dev              # Start dev server
npm run dev:turbo        # Start with Turbopack

# Build
npm run build            # Production build
npm run build:turbo      # Build with Turbopack
npm start                # Start production server

# Database
npx prisma generate      # Generate Prisma client
npx prisma db push       # Push schema changes
npx prisma studio        # Open Prisma Studio

# Custom scripts
npm run reset-db         # Reset database
npm run set-admin        # Set user as admin
```

### Development Patterns

#### API Route Structure

```typescript
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { API_MESSAGES, HTTP_STATUS } from "@/lib/constants";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await params; // IMPORTANT: params is Promise in Next.js 15
  const { userId } = await auth();

  // Validation
  if (!userId) {
    return new NextResponse(API_MESSAGES.UNAUTHENTICATED, {
      status: HTTP_STATUS.UNAUTHORIZED,
    });
  }

  // Verify store ownership
  const store = await prisma.store.findFirst({
    where: { id: storeId, userId },
  });

  if (!store) {
    return new NextResponse(API_MESSAGES.UNAUTHORIZED, {
      status: HTTP_STATUS.FORBIDDEN,
    });
  }

  // Your logic here...
}
```

#### Product Variants Pattern

```typescript
// Create product with variants
await prisma.product.create({
  data: {
    name,
    slug,
    price,
    categoryId,
    storeId,
    variants: {
      createMany: {
        data: variants.map((v) => ({
          sizeId: v.sizeId,
          colorId: v.colorId,
          materialId: v.materialId || null,
          inventory: Number(v.inventory),
          lowStockThreshold: Number(v.lowStockThreshold) || 10,
        })),
      },
    },
  },
});
```

### Common Pitfalls

1. **Next.js 15 params**: Route params are now Promises - always `await params`
2. **MongoDB ObjectId**: Use `@db.ObjectId` decorator on foreign key fields
3. **Store ownership**: Always verify `userId` matches store owner
4. **Variant validation**: Products must have at least one variant
5. **Cascade deletes**: OrderItems don't cascade - manually delete before removing products

## 📝 Notes

- File `.github/copilot-instructions.md` chứa hướng dẫn chi tiết cho AI coding assistants
- Sử dụng constants từ `@/lib/constants` thay vì hardcode strings
- Luôn validate store ownership trước khi thực hiện mutations
- Sử dụng Prisma Studio để inspect database: `npx prisma studio`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 🔗 Links

- **Repository**: https://github.com/Ngoclama/ecommerce-admin.git
- **Live Demo**: ecommerce-steel-sigma.vercel.app

---

**Made with ❤️ by Ngoclama**

