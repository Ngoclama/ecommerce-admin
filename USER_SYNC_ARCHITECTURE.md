# User Synchronization Architecture - Professional Backend Implementation

## Tổng quan

Hệ thống đồng bộ user giữa Clerk và database đã được refactor theo chuẩn chuyên nghiệp với:
- **Centralized Service Layer**: Tất cả logic user được tập trung trong `UserService`
- **Automatic Sync**: Tự động đồng bộ email, name, imageUrl từ Clerk
- **Order Linking**: Tự động link orders với user dựa trên email
- **Race Condition Handling**: Xử lý đúng các trường hợp user được tạo đồng thời

## Kiến trúc

### 1. User Service Layer (`lib/services/user.service.ts`)

Service layer chứa toàn bộ business logic cho user operations:

```typescript
class UserService {
  // Core queries
  getUserByClerkId(clerkUserId: string): Promise<UserData | null>
  getUserByEmail(email: string): Promise<UserData | null>
  
  // Clerk integration
  fetchClerkUser(clerkUserId: string, isStoreUser: boolean): Promise<ClerkUserData | null>
  
  // CRUD operations
  createUser(clerkUserId: string, clerkData?: ClerkUserData, isStoreUser: boolean): Promise<UserData | null>
  syncUserFromClerk(clerkUserId: string, isStoreUser: boolean): Promise<UserData | null>
  getOrCreateUser(clerkUserId: string, isStoreUser: boolean, autoSync: boolean): Promise<UserData | null>
  
  // Order linking
  linkOrdersByEmail(userId: string, email: string): Promise<{ linked: number }>
  
  // User management
  updateUserRole(userId: string, role: UserRole): Promise<UserData | null>
  setUserBannedStatus(userId: string, isBanned: boolean): Promise<UserData | null>
  
  // Batch operations
  batchSyncUsers(clerkUserIds: string[], isStoreUser: boolean): Promise<{ synced: number; failed: number }>
  
  // Email-based lookup
  findOrCreateByEmail(email: string, clerkUserId?: string, isStoreUser: boolean): Promise<UserData | null>
}
```

### 2. Authentication Middleware (`lib/middleware/auth.middleware.ts`)

Đã được cập nhật để sử dụng `UserService`:

- `authenticateRequest()`: Tự động tạo user nếu chưa có
- `getOrCreateUser()`: Wrapper cho `userService.getOrCreateUser()`

### 3. Permissions (`lib/permissions.ts`)

Đã được cập nhật để sử dụng `UserService`:

- `getUserFromDb()`: Sử dụng `userService.getUserByClerkId()`

## Đồng bộ Logic

### Auto-Sync Rules:

1. **Email Sync**:
   - Tự động sync email từ Clerk nếu user có temp email (`@temp.com`)
   - Normalize email (lowercase, trim) để đảm bảo matching chính xác

2. **Name & Image Sync**:
   - Tự động sync name và imageUrl từ Clerk
   - Chỉ update nếu có thay đổi

3. **Order Linking**:
   - Tự động link orders với user dựa trên email
   - Chạy khi user được tạo hoặc sync

### Flow:

```
1. User đăng nhập Clerk
2. API route gọi authenticateRequest() hoặc getOrCreateUser()
3. UserService kiểm tra user có tồn tại không
4. Nếu không tồn tại:
   - Fetch data từ Clerk
   - Tạo user trong database
   - Link orders by email
5. Nếu tồn tại:
   - Sync data từ Clerk (nếu cần)
   - Link orders by email (nếu có orders chưa link)
```

## Các API Routes Đã Cập Nhật

1. **`/api/orders/user`**: Sử dụng `userService.getOrCreateUser()`
2. **`/api/orders/user/[orderId]`**: Sử dụng `userService.getOrCreateUser()`
3. **`/api/wishlist`**: Sử dụng `getOrCreateUser()` từ middleware
4. **`/api/checkout`**: Sử dụng `getOrCreateUser()` từ middleware

## Lợi ích

1. **Consistency**: Tất cả user operations đều qua service layer
2. **Auto-Sync**: Tự động đồng bộ giữa Clerk và database
3. **Order Linking**: Tự động link orders với user
4. **Error Handling**: Xử lý race conditions và errors đúng cách
5. **Maintainability**: Dễ bảo trì và mở rộng

## Migration Notes

Các API routes cũ vẫn hoạt động nhưng nên migrate sang sử dụng `UserService`:

**Before:**
```typescript
let user = await getUserFromDb(clerkUserId);
if (!user) {
  // Manual creation logic...
}
```

**After:**
```typescript
const user = await userService.getOrCreateUser(clerkUserId, isStoreUser, true);
```

## Future Enhancements

1. **Clerk Webhooks**: Tự động sync khi user update trong Clerk
2. **Batch Sync Job**: Cron job để sync tất cả users định kỳ
3. **Email Change Handling**: Xử lý khi user đổi email trong Clerk
4. **User Merge**: Merge duplicate users (same email, different clerkId)

