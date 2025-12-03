🛍️ Ecommerce Admin – Tài liệu Hướng Dẫn

Dự án Ecommerce Admin được xây dựng bằng Next.js (App Router), sử dụng các công nghệ:
Prisma – TailwindCSS – Shadcn/UI – Clerk Auth – Vercel – PlanetScale/NeonDB – UploadThing/Cloudinary.

🚀 Khởi động dự án

1. Cài đặt package
   npm install

# hoặc

yarn install

# hoặc

pnpm install

# hoặc

bun install

2. Chạy server phát triển
   npm run dev

Sau đó mở trình duyệt tại:
👉 http://localhost:3000

⚙️ Cấu hình biến môi trường

Tạo file .env tại thư mục gốc và thêm đầy đủ các key cần thiết:

# --- Clerk Authentication ---

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# --- Database (Prisma) ---

DATABASE_URL="mysql://..."

# hoặc postgres

# DATABASE_URL="postgres://..."

# --- UploadThing / Cloudinary ---

UPLOADTHING_SECRET=
UPLOADTHING_APP_ID=

# hoặc Cloudinary:

# CLOUDINARY_URL=

# --- Stripe (nếu dùng) ---

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# --- MoMo Payment Gateway ---

MOMO_PARTNER_CODE=MOMO
MOMO_ACCESS_KEY=F8BBA842ECF85
MOMO_SECRET_KEY=K951B6PE1waDMi640xX08PD3vg6EkVlz
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create

# Sử dụng môi trường test cho development

# Production: https://payment.momo.vn/v2/gateway/api/create

# --- Next.js ---

NEXT_PUBLIC_APP_URL=http://localhost:3000

🗃️ Database & Prisma

1. Tạo schema

Sau khi chỉnh sửa prisma/schema.prisma, chạy:

npx prisma generate

2. Push database (dev)
   npx prisma db push

3. Mở Prisma Studio
   npx prisma studio

ecommerce-admin/
│
├── app/ # App Router của Next.js
│ ├── (routes)/ # Các route chính của Admin Panel
│ │ ├── dashboard/ # Trang dashboard thống kê
│ │ ├── products/ # CRUD sản phẩm
│ │ ├── categories/ # CRUD danh mục
│ │ ├── orders/ # Quản lý đơn hàng
│ │ └── ... # Các route khác
│ │
│ ├── api/ # Next.js API Route Handlers
│ │ ├── products/ # API sản phẩm
│ │ ├── upload/ # API upload ảnh (UploadThing/Cloudinary)
│ │ └── ... # Các API khác
│ │
│ ├── layout.tsx # Layout gốc của App Router
│ └── page.tsx # Trang mặc định
│
├── components/ # UI components dùng trong dự án
│ ├── ui/ # Component từ shadcn/ui
│ ├── forms/ # Component form, input
│ ├── layout/ # Layout components
│ └── ... # Các component khác
│
├── lib/ # Thư mục chứa helper, config
│ ├── prisma.ts # Kết nối Prisma
│ ├── auth.ts # Xử lý Clerk Auth
│ ├── utils.ts # Hàm tiện ích
│ └── validation.ts # Zod schemas (nếu có)
│
├── prisma/ # Prisma ORM
│ ├── schema.prisma # Định nghĩa mô hình database
│ └── migrations/ # Lưu trữ lịch sử migration DB
│
├── public/ # File tĩnh (ảnh/logo/icon)
│ ├── images/  
│ └── favicon.ico
│
├── styles/ # Global CSS / Tailwind
│ └── globals.css
│
├── .env # Biến môi trường (KHÔNG commit lên git)
├── package.json
├── tsconfig.json
└── README.md

🔐 Authentication (Clerk)

Dự án dùng Clerk để đăng nhập:

📦 Build dự án
Build production:
npm run build

📚 Công nghệ sử dụng
Công nghệ Chức năng
Next.js App Router Xây dựng UI/SSR/API
Prisma ORM Làm việc với Database
PlanetScale / Neon Database MySQL/PostgreSQL
TailwindCSS Style nhanh, tối ưu
Shadcn/UI Component UI đẹp, tùy chỉnh
Clerk Authentication + User Management
UploadThing / Cloudinary Upload ảnh sản phẩm
Vercel Hosting Next.js
TypeScript Tăng độ an toàn code
🧪 Kiểm tra lỗi & debug

🧩 Tính năng chính của hệ thống Admin
Đăng nhập/Admin Authentication
Quản lý sản phẩm
Quản lý danh mục
Quản lý thuộc tính (size/color)
Quản lý hình ảnh sản phẩm
Quản lý đơn hàng
Dashboard thống kê
Quản lý mã giảm giá
Quản lý người dùng
