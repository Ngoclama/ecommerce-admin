/**
 * ═══════════════════════════════════════════════════════════════
 * STANDARDIZED ERROR MESSAGES - VIETNAMESE
 * ═══════════════════════════════════════════════════════════════
 */

export const ERROR_MESSAGES = {
  // Authentication & Authorization
  AUTH: {
    UNAUTHENTICATED: "Vui lòng đăng nhập để tiếp tục",
    UNAUTHORIZED: "Bạn không có quyền thực hiện thao tác này",
    INVALID_TOKEN: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại",
    FORBIDDEN: "Truy cập bị từ chối",
  },

  // Validation
  VALIDATION: {
    REQUIRED_FIELD: (field: string) => `${field} là bắt buộc`,
    INVALID_FORMAT: (field: string) => `${field} không đúng định dạng`,
    MIN_LENGTH: (field: string, min: number) =>
      `${field} phải có ít nhất ${min} ký tự`,
    MAX_LENGTH: (field: string, max: number) =>
      `${field} không được vượt quá ${max} ký tự`,
    MIN_VALUE: (field: string, min: number) =>
      `${field} phải lớn hơn hoặc bằng ${min}`,
    MAX_VALUE: (field: string, max: number) =>
      `${field} không được vượt quá ${max}`,
    INVALID_EMAIL: "Email không hợp lệ",
    INVALID_PHONE: "Số điện thoại không hợp lệ",
  },

  // Products
  PRODUCT: {
    NOT_FOUND: "Không tìm thấy sản phẩm",
    CREATE_FAILED: "Không thể tạo sản phẩm. Vui lòng thử lại",
    UPDATE_FAILED: "Không thể cập nhật sản phẩm. Vui lòng thử lại",
    DELETE_FAILED: "Không thể xóa sản phẩm",
    DELETE_HAS_ORDERS: "Không thể xóa sản phẩm đang có trong đơn hàng",
    DUPLICATE_SLUG: "Sản phẩm với tên này đã tồn tại",
    NO_VARIANTS: "Sản phẩm cần ít nhất 1 biến thể",
    NO_IMAGES: "Sản phẩm cần ít nhất 1 hình ảnh",
    INVALID_PRICE: "Giá sản phẩm không hợp lệ",
    COMPARE_PRICE_LOWER: "Giá so sánh phải lớn hơn giá bán",
  },

  // Orders
  ORDER: {
    NOT_FOUND: "Không tìm thấy đơn hàng",
    CREATE_FAILED: "Không thể tạo đơn hàng. Vui lòng thử lại",
    UPDATE_FAILED: "Không thể cập nhật đơn hàng",
    DELETE_FAILED: "Không thể xóa đơn hàng",
    DELETE_NOT_ALLOWED: "Chỉ có thể xóa đơn hàng đã giao hoặc đã hủy",
    INVALID_STATUS_TRANSITION: (from: string, to: string) =>
      `Không thể chuyển đơn hàng từ "${from}" sang "${to}"`,
    EMPTY_CART: "Giỏ hàng trống",
    INSUFFICIENT_STOCK: (product: string, available: number) =>
      `${product}: Chỉ còn ${available} sản phẩm trong kho`,
    MISSING_ADDRESS: "Vui lòng nhập địa chỉ giao hàng",
    MISSING_PAYMENT_METHOD: "Vui lòng chọn phương thức thanh toán",
  },

  // Inventory
  INVENTORY: {
    OUT_OF_STOCK: "Sản phẩm đã hết hàng",
    INSUFFICIENT_STOCK: "Không đủ hàng trong kho",
    LOW_STOCK: (current: number) => `Sắp hết hàng (còn ${current} sản phẩm)`,
    RESERVE_FAILED: "Không thể đặt trước hàng. Vui lòng thử lại",
    RELEASE_FAILED: "Không thể hoàn trả tồn kho",
  },

  // Payment
  PAYMENT: {
    FAILED: "Thanh toán thất bại",
    CANCELLED: "Thanh toán đã bị hủy",
    PENDING: "Thanh toán đang chờ xử lý",
    REFUND_FAILED: "Không thể hoàn tiền. Vui lòng liên hệ hỗ trợ",
    INVALID_AMOUNT: "Số tiền thanh toán không hợp lệ",
    DUPLICATE_TRANSACTION: "Giao dịch đã được xử lý trước đó",
  },

  // Categories
  CATEGORY: {
    NOT_FOUND: "Không tìm thấy danh mục",
    CREATE_FAILED: "Không thể tạo danh mục",
    UPDATE_FAILED: "Không thể cập nhật danh mục",
    DELETE_FAILED: "Không thể xóa danh mục",
    DELETE_HAS_PRODUCTS: "Không thể xóa danh mục đang có sản phẩm",
    CIRCULAR_REFERENCE: "Không thể tạo danh mục cha con vòng tròn",
  },

  // Users
  USER: {
    NOT_FOUND: "Không tìm thấy người dùng",
    ALREADY_EXISTS: "Người dùng đã tồn tại",
    UPDATE_FAILED: "Không thể cập nhật thông tin người dùng",
    BANNED: "Tài khoản đã bị khóa",
  },

  // Generic
  GENERIC: {
    SERVER_ERROR: "Đã xảy ra lỗi. Vui lòng thử lại sau",
    NOT_FOUND: "Không tìm thấy dữ liệu",
    BAD_REQUEST: "Yêu cầu không hợp lệ",
    CONFLICT: "Dữ liệu bị trùng lặp",
    NETWORK_ERROR: "Lỗi kết nối. Vui lòng kiểm tra internet",
    TIMEOUT: "Yêu cầu quá lâu. Vui lòng thử lại",
  },
};

/**
 * SUCCESS MESSAGES
 */
export const SUCCESS_MESSAGES = {
  PRODUCT: {
    CREATED: "Tạo sản phẩm thành công",
    UPDATED: "Cập nhật sản phẩm thành công",
    DELETED: "Xóa sản phẩm thành công",
    ARCHIVED: "Đã lưu trữ sản phẩm",
    PUBLISHED: "Đã xuất bản sản phẩm",
  },

  ORDER: {
    CREATED: "Đặt hàng thành công",
    UPDATED: "Cập nhật đơn hàng thành công",
    CANCELLED: "Đã hủy đơn hàng",
    DELETED: "Xóa đơn hàng thành công",
    STATUS_UPDATED: "Cập nhật trạng thái thành công",
  },

  CATEGORY: {
    CREATED: "Tạo danh mục thành công",
    UPDATED: "Cập nhật danh mục thành công",
    DELETED: "Xóa danh mục thành công",
  },

  USER: {
    UPDATED: "Cập nhật thông tin thành công",
    VIP_SET: "Đã thiết lập VIP",
    VIP_REMOVED: "Đã gỡ VIP",
    BANNED: "Đã chặn người dùng",
    UNBANNED: "Đã bỏ chặn người dùng",
  },

  GENERIC: {
    COPIED: "Đã sao chép",
    SAVED: "Đã lưu thành công",
    DELETED: "Đã xóa thành công",
  },
};

/**
 * Format Prisma errors to user-friendly Vietnamese messages
 */
export function formatPrismaError(error: any): string {
  if (!error.code) {
    return ERROR_MESSAGES.GENERIC.SERVER_ERROR;
  }

  switch (error.code) {
    case "P2002": // Unique constraint
      return "Dữ liệu bị trùng lặp. Vui lòng kiểm tra lại";

    case "P2003": // Foreign key constraint
      return "Dữ liệu tham chiếu không hợp lệ";

    case "P2025": // Record not found
      return "Không tìm thấy dữ liệu";

    case "P2014": // Relation violation
      return "Không thể xóa do có dữ liệu liên quan";

    case "P2000": // Value out of range
      return "Giá trị vượt quá giới hạn cho phép";

    default:
      return ERROR_MESSAGES.GENERIC.SERVER_ERROR;
  }
}
