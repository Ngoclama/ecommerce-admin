/**
 * Constants - Các hằng số dùng chung trong ứng dụng
 * Thay thế magic strings và hardcoded values
 */

// ─── API RESPONSE MESSAGES ────────────────────────────────────────
export const API_MESSAGES = {
  // Authentication
  UNAUTHENTICATED: "Chưa xác thực",
  UNAUTHORIZED: "Không có quyền truy cập",
  
  // Validation
  STORE_ID_REQUIRED: "ID cửa hàng là bắt buộc",
  ID_REQUIRED: "ID là bắt buộc",
  NAME_REQUIRED: "Tên là bắt buộc",
  PRICE_REQUIRED: "Giá là bắt buộc",
  CATEGORY_ID_REQUIRED: "ID danh mục là bắt buộc",
  CODE_REQUIRED: "Mã là bắt buộc",
  INVALID_DATA: "Dữ liệu không hợp lệ",
  
  // Product
  VARIANTS_REQUIRED: "Cần ít nhất một biến thể",
  IMAGES_REQUIRED: "Cần ít nhất một hình ảnh",
  
  // Coupon
  DUPLICATE_CODE: "Mã đã tồn tại",
  EXPIRED_DATE_PAST: "Ngày hết hạn không thể là quá khứ",
  
  // Success
  CREATED: "Đã tạo thành công",
  UPDATED: "Đã cập nhật thành công",
  DELETED: "Đã xóa thành công",
  
  // Error
  NOT_FOUND: "Không tìm thấy",
  SERVER_ERROR: "Lỗi máy chủ",
  VALIDATION_ERROR: "Lỗi xác thực",
} as const;

// ─── HTTP STATUS CODES ────────────────────────────────────────────
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// ─── PRISMA ERROR CODES ───────────────────────────────────────────
export const PRISMA_ERROR_CODES = {
  UNIQUE_CONSTRAINT: "P2002",
  RECORD_NOT_FOUND: "P2025",
  REQUIRED_FIELD_MISSING: "P2011",
  INVALID_FIELD_VALUE: "P2003",
  NULL_CONSTRAINT: "P2032",
} as const;

// ─── ORDER STATUS ────────────────────────────────────────────────
export const ORDER_STATUS = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
} as const;

// ─── PAYMENT METHODS ─────────────────────────────────────────────
export const PAYMENT_METHODS = {
  COD: "COD",
  STRIPE: "STRIPE",
  MOMO: "MOMO",
  VNPAY: "VNPAY",
  QR: "QR",
} as const;

// ─── COUPON TYPES ────────────────────────────────────────────────
export const COUPON_TYPES = {
  PERCENT: "PERCENT",
  FIXED: "FIXED",
} as const;

// ─── USER ROLES ──────────────────────────────────────────────────
export const USER_ROLES = {
  ADMIN: "ADMIN",
  VENDOR: "VENDOR",
  CUSTOMER: "CUSTOMER",
} as const;

// ─── GENDER OPTIONS ───────────────────────────────────────────────
export const GENDER_OPTIONS = {
  MEN: "MEN",
  WOMEN: "WOMEN",
  KIDS: "KIDS",
  UNISEX: "UNISEX",
} as const;

// ─── SHIPPING PROVIDERS ──────────────────────────────────────────
export const SHIPPING_PROVIDERS = {
  GHN: "GHN",
  VIETTELPOST: "VIETTELPOST",
  GHTK: "GHTK",
  CUSTOM: "CUSTOM",
} as const;

// ─── SHIPPING STATUS ─────────────────────────────────────────────
export const SHIPPING_STATUS = {
  PENDING: "PENDING",
  CREATED: "CREATED",
  PICKED_UP: "PICKED_UP",
  IN_TRANSIT: "IN_TRANSIT",
  DELIVERED: "DELIVERED",
  RETURNED: "RETURNED",
  CANCELLED: "CANCELLED",
} as const;

// ─── RETURN STATUS ───────────────────────────────────────────────
export const RETURN_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

// ─── PAGINATION ──────────────────────────────────────────────────
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
} as const;

// ─── FILE UPLOAD ─────────────────────────────────────────────────
export const UPLOAD = {
  MAX_FILE_SIZE: 8 * 1024 * 1024, // 8MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
} as const;

// ─── CACHE ────────────────────────────────────────────────────────
export const CACHE = {
  REVALIDATE_TIME: 60, // seconds
  NO_STORE: "no-store",
} as const;

// ─── TIMEOUT ──────────────────────────────────────────────────────
export const TIMEOUT = {
  FETCH: 30000, // 30 seconds
  API: 30000,   // 30 seconds
} as const;

// ─── ENVIRONMENT ─────────────────────────────────────────────────
export const ENV = {
  DEVELOPMENT: "development",
  PRODUCTION: "production",
  TEST: "test",
} as const;

// ─── REGEX PATTERNS ──────────────────────────────────────────────
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[0-9]{10,11}$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
} as const;

// ─── DEFAULT VALUES ───────────────────────────────────────────────
export const DEFAULTS = {
  INVENTORY: 0,
  LOW_STOCK_THRESHOLD: 10,
  COUPON_VALUE: 1,
  COUPON_TYPE: COUPON_TYPES.PERCENT,
  GENDER: GENDER_OPTIONS.UNISEX,
  TRACK_QUANTITY: true,
  ALLOW_BACKORDER: false,
  IS_PUBLISHED: true,
  IS_FEATURED: false,
  IS_ARCHIVED: false,
} as const;

