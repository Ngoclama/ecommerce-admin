# E-Commerce Admin Panel - AI Coding Assistant Guide

## Architecture Overview

This is a **Next.js 15 App Router** admin dashboard for a multi-tenant e-commerce platform. The system uses:

- **MongoDB with Prisma ORM** - Document-based data model with ObjectId references
- **Clerk Authentication** - User authentication with role-based access control (ADMIN/VENDOR/CUSTOMER)
- **Next.js API Routes** - Server-side API handlers in `src/app/api/[storeId]/`
- **Product Variant System** - Complex inventory management with Size × Color × Material variants

### Multi-Tenant Architecture

- Each user can manage multiple stores via `Store` model
- All resources (products, orders, categories) are scoped to `storeId`
- URL pattern: `/{storeId}/products`, `/{storeId}/orders`, etc.
- Store switcher component handles navigation between stores

### Database Schema (MongoDB)

- **Primary key format**: `@id @default(auto()) @map("_id") @db.ObjectId` (MongoDB ObjectId)
- **Foreign keys**: String fields with `@db.ObjectId` decorator
- **Variants**: Products use `ProductVariant` model for Size/Color/Material combinations with individual inventory tracking
- **Category hierarchy**: Self-referential parent-child using `parentId` (use `CategoryParent` relation name to avoid cycles)
- **No cascade on OrderItem**: Must manually delete before removing products to preserve order history

## Critical Development Patterns

### 1. API Route Structure

All API routes follow this pattern in `src/app/api/[storeId]/[resource]/route.ts`:

```typescript
// Always use these utilities
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { API_MESSAGES, HTTP_STATUS } from "@/lib/constants";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const { storeId } = await params; // IMPORTANT: params is a Promise in Next.js 15
  const { userId } = await auth();

  // Standard validation order:
  if (!userId)
    return new NextResponse(API_MESSAGES.UNAUTHENTICATED, {
      status: HTTP_STATUS.UNAUTHORIZED,
    });
  if (!storeId)
    return new NextResponse(API_MESSAGES.STORE_ID_REQUIRED, {
      status: HTTP_STATUS.BAD_REQUEST,
    });

  // Always verify store ownership for mutations
  const storeByUserId = await prisma.store.findFirst({
    where: { id: storeId, userId },
  });
  if (!storeByUserId)
    return new NextResponse(API_MESSAGES.UNAUTHORIZED, {
      status: HTTP_STATUS.FORBIDDEN,
    });
}
```

**Never** hardcode strings - use `API_MESSAGES` and `HTTP_STATUS` constants from `@/lib/constants`.

### 2. Product Variants Pattern

Products require **at least one variant** with Size + Color + Material:

```typescript
// Creating a product with variants
await prisma.product.create({
  data: {
    name,
    slug,
    price,
    categoryId,
    storeId,
    images: { createMany: { data: images } },
    variants: {
      createMany: {
        data: variants.map((v) => ({
          sizeId: v.sizeId,
          colorId: v.colorId,
          materialId: v.materialId || null,
          inventory: Number(v.inventory),
          lowStockThreshold:
            Number(v.lowStockThreshold) || DEFAULTS.LOW_STOCK_THRESHOLD,
          sku: v.sku || null,
          price: v.price ? Number(v.price) : null,
        })),
      },
    },
  },
});
```

Variants have unique constraint: `[productId, sizeId, colorId, materialId]`

### 3. Slug Generation Pattern

**Always** auto-generate slugs from names with uniqueness checks:

```typescript
import slugify from "slugify";

let slug = slugify(name, { lower: true, strict: true });

const existingProduct = await prisma.product.findUnique({
  where: { storeId_slug: { storeId, slug } },
});

if (existingProduct) {
  slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
}
```

### 4. Authentication & Authorization Flow

**Two-stage check** - Middleware + Route Handler:

**Middleware** (`src/middleware.ts`):

- Blocks unauthorized access based on email whitelist (`ADMIN_ALLOWED_EMAILS` env var)
- Admin routes: `/(dashboard)`, `/(root)`, `/api/stores`, `/api/[storeId]`
- Public API routes: `/api/wishlist`, `/api/products` (read-only)
- Uses `createRouteMatcher` for pattern matching

**Route Handlers**:

- Use `@/lib/permissions` helpers: `isAdmin()`, `isVendor()`, `isManager()`
- Always verify store ownership: `prisma.store.findFirst({ where: { id: storeId, userId } })`

### 5. State Management

- **Zustand** for modals: `use-store-modal.tsx`, `use-alert-modal.tsx`, etc.
- Pattern: `create<ModalStore>((set) => ({ isOpen: false, onOpen: () => set({ isOpen: true }), onClose: () => set({ isOpen: false }) }))`
- **TanStack Query** for server state (configured in `providers/query-provider.tsx`)

### 6. Translations System

Use `@/hooks/use-translation` hook for i18n:

```typescript
const { t } = useTranslation();
// Access nested keys: t("storeModal.title"), t("storeModal.createSuccess")
```

Translation files in `@/lib/translations.ts` with Vietnamese (vi) and English (en).

## Development Workflows

### Running the App

```bash
npm run dev          # Standard dev server
npm run dev:turbo    # Turbopack dev server (faster)
npm run build        # Production build
```

### Database Operations

```bash
npx prisma generate  # Generate Prisma client (run after schema changes)
npx prisma db push   # Push schema changes to MongoDB
npx prisma studio    # Visual database browser
npm run reset-db     # Custom script to reset database
```

**IMPORTANT**: Always run `npx prisma generate` after modifying `prisma/schema.prisma`.

### Scripts Directory

Custom TypeScript scripts in `scripts/` for data migrations:

- `fix-order-dates.ts`, `fix-orders.ts` - Order data repairs
- `fix-slugs-v2.ts` - Regenerate product slugs
- `reset-db.ts` - Database reset
- `sync-user-emails.ts` - Clerk-to-Prisma user sync

Run with: `ts-node scripts/<script-name>.ts`

## UI Conventions

### Component Structure

- **shadcn/ui** components in `src/components/ui/`
- **Modal components** in `src/components/modals/` with Zustand hooks
- **Layout components**: `navbar.tsx`, `sidebar.tsx`, `header.tsx`
- Use `cn()` utility from `@/lib/utils` for conditional Tailwind classes

### Styling Patterns

```typescript
// Standard glassmorphism pattern for modals
className={cn(
  "backdrop-blur-2xl bg-white/20 dark:bg-neutral-800/30",
  "border border-white/20 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.2)]"
)}

// Currency formatting
import { formatter } from "@/lib/utils";
formatter.format(100000) // "100.000 ₫" (Vietnamese dong)
```

### Form Handling

Use `react-hook-form` + `zod` + shadcn Form components:

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const form = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
  defaultValues: { ... }
});
```

## Image Handling

- **UploadThing** integration in `@/lib/uploadthing.ts`
- Cloudinary support via `next-cloudinary`
- Next.js Image config allows multiple remote patterns (see `next.config.ts`)
- Use `<CldUploadWidget>` or UploadThing components for uploads

## Common Pitfalls

1. **Next.js 15 params**: Route params are now Promises - always `await params` before destructuring
2. **MongoDB ObjectId**: Use `@db.ObjectId` decorator on foreign key fields
3. **Store ownership**: Always verify `userId` matches store owner before mutations
4. **Variant validation**: Products must have at least one variant - validate in API routes
5. **Cascade deletes**: OrderItems don't cascade - manually delete before removing products
6. **Edge Runtime**: Middleware runs on Edge - don't use Prisma in middleware, only in route handlers

## Testing & Debugging

- Check build errors: `npm run build` (ESLint errors ignored via `eslint.ignoreDuringBuilds: true`)
- TypeScript strict mode enabled
- Use `devLog()` and `devError()` from `@/lib/api-utils` for development logging
- Prisma Studio for database inspection: `npx prisma studio`

## Environment Variables

Required in `.env`:

```
DATABASE_URL="mongodb+srv://..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
ADMIN_ALLOWED_EMAILS="admin@example.com,vendor@example.com" # Or "*" for all
UPLOADTHING_SECRET=
UPLOADTHING_APP_ID=
STRIPE_SECRET_KEY=
FRONTEND_STORE_URL=http://localhost:3001
```
