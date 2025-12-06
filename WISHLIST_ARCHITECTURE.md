# Wishlist Architecture - Professional Backend Implementation

## Tổng quan

Hệ thống wishlist đã được refactor theo chuẩn chuyên nghiệp với các nguyên tắc:
- **Separation of Concerns**: Tách biệt business logic khỏi route handlers
- **SOLID Principles**: Single Responsibility, Open/Closed, Dependency Inversion
- **Error Handling**: Xử lý lỗi đầy đủ và có cấu trúc
- **Type Safety**: TypeScript types đầy đủ
- **Performance**: Tối ưu database queries, batch operations
- **Security**: Authentication, authorization, input validation

## Kiến trúc

### 1. Service Layer (`lib/services/wishlist.service.ts`)

Service layer chứa toàn bộ business logic, tách biệt khỏi HTTP handling:

```typescript
class WishlistService {
  // Core operations
  getUserWishlistProductIds(userId: string): Promise<string[]>
  getUserWishlist(userId: string, options?): Promise<WishlistItem[]>
  isProductInWishlist(userId: string, productId: string): Promise<boolean>
  
  // CRUD operations
  addToWishlist(userId: string, productId: string): Promise<WishlistOperationResult>
  removeFromWishlist(userId: string, productId: string): Promise<WishlistOperationResult>
  toggleWishlist(userId: string, productId: string): Promise<WishlistOperationResult>
  
  // Batch operations
  batchAddToWishlist(userId: string, productIds: string[]): Promise<{added: number, skipped: number}>
  clearWishlist(userId: string): Promise<{deleted: number}>
  
  // Utility
  getWishlistCount(userId: string): Promise<number>
  cleanupOrphanedItems(userId?: string): Promise<{deleted: number}>
}
```

**Đặc điểm:**
- Sử dụng `upsert` để xử lý race conditions
- Batch operations để tối ưu performance
- Validation sản phẩm tồn tại trước khi thêm
- Cleanup orphaned items (sản phẩm đã bị xóa)

### 2. Authentication Middleware (`lib/middleware/auth.middleware.ts`)

Centralized authentication logic:

```typescript
// Authenticate request
authenticateRequest(req: NextRequest): Promise<AuthResult>

// Get or create user from Clerk
getOrCreateUser(clerkUserId: string, isStoreUser: boolean)
```

**Đặc điểm:**
- Hỗ trợ cả Admin và Store Clerk instances
- Tự động tạo user nếu chưa tồn tại
- Sync email từ Clerk nếu user có temp email
- Error handling đầy đủ

### 3. API Routes

#### `POST /api/wishlist`
Thêm, xóa, hoặc toggle sản phẩm trong wishlist.

**Request:**
```json
{
  "productId": "string (required)",
  "action": "add" | "remove" | "toggle" (default: "toggle")
}
```

**Response:**
```json
{
  "success": true,
  "isLiked": boolean,
  "message": "string"
}
```

#### `GET /api/wishlist`
Lấy danh sách wishlist của user.

**Query params:**
- `includeDetails?: boolean` - Include full product details
- `limit?: number` - Limit results (1-100)
- `offset?: number` - Pagination offset

**Response:**
```json
{
  "success": true,
  "data": string[] | WishlistItem[],
  "count": number
}
```

#### `PUT /api/wishlist/sync`
Đồng bộ wishlist từ localStorage lên server (khi user đăng nhập).

**Request:**
```json
{
  "productIds": string[],
  "mergeStrategy": "local" | "server" | "merge" (default: "merge")
}
```

**Merge Strategies:**
- `local`: Thay thế server wishlist bằng local
- `server`: Giữ nguyên server wishlist, bỏ qua local
- `merge`: Kết hợp cả hai (union)

**Response:**
```json
{
  "success": true,
  "data": string[],
  "count": number,
  "added": number
}
```

#### `DELETE /api/wishlist`
Xóa sản phẩm hoặc xóa toàn bộ wishlist.

**Request:**
```json
{
  "productIds": string[], // Optional: Xóa các sản phẩm cụ thể
  "clearAll": boolean      // Optional: Xóa toàn bộ
}
```

### 4. CORS Utility (`lib/utils/cors.ts`)

Centralized CORS header management:
- Hỗ trợ multiple allowed origins
- Proper credentials handling
- Preflight request handling

## Database Optimization

### Indexes
```prisma
model Wishlist {
  @@unique([userId, productId])  // Composite unique constraint
  @@index([userId])              // Fast user lookup
  @@index([productId])            // Fast product lookup
}
```

### Query Optimization
- Sử dụng `select` để chỉ lấy fields cần thiết
- Batch operations với `createMany`
- Count queries thay vì fetch all
- Proper use of `distinct` và `orderBy`

## Error Handling

### Service Layer
- Throws descriptive errors
- Handles Prisma errors (P2002 for unique constraint)
- Validates product existence

### API Layer
- Consistent error response format
- Proper HTTP status codes
- Detailed error logging
- User-friendly error messages

## Security

1. **Authentication**: Required for all operations
2. **Authorization**: User can only access their own wishlist
3. **Input Validation**: 
   - ProductId must be non-empty string
   - Action must be valid enum
   - Pagination params validated
4. **SQL Injection**: Prevented by Prisma ORM
5. **Race Conditions**: Handled by `upsert` operations

## Performance

1. **Batch Operations**: `batchAddToWishlist` for syncing
2. **Efficient Queries**: Only select needed fields
3. **Indexes**: Proper database indexes
4. **Pagination**: Support for limit/offset
5. **Caching**: Can be added at service layer if needed

## Testing Recommendations

1. **Unit Tests**: Test service layer methods
2. **Integration Tests**: Test API endpoints
3. **Edge Cases**:
   - Duplicate adds
   - Non-existent products
   - Race conditions
   - Large batch operations
4. **Performance Tests**: Batch operations với 1000+ items

## Migration từ Code Cũ

Code cũ có các vấn đề:
- Business logic trộn lẫn với HTTP handling
- Không có service layer
- Error handling không nhất quán
- Không có batch operations
- Validation không đầy đủ

Code mới:
- ✅ Service layer riêng biệt
- ✅ Centralized authentication
- ✅ Consistent error handling
- ✅ Batch operations
- ✅ Full validation
- ✅ Type safety
- ✅ Better performance

## Usage Examples

### Frontend: Toggle Wishlist
```typescript
const response = await fetch('/api/wishlist', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    productId: 'product-id',
    action: 'toggle'
  })
});
```

### Frontend: Sync Wishlist on Login
```typescript
const localWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
const response = await fetch('/api/wishlist/sync', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    productIds: localWishlist,
    mergeStrategy: 'merge'
  })
});
```

## Future Enhancements

1. **Caching**: Redis cache cho wishlist counts
2. **Analytics**: Track wishlist-to-cart conversion
3. **Notifications**: Notify when wishlist items go on sale
4. **Sharing**: Share wishlist with others
5. **Collections**: Group wishlist items into collections

