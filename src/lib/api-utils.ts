// Các hàm tiện ích để tối ưu API responses

/**
 * Wrapper cho console.log chỉ chạy trong môi trường development
 * Giúp tránh log không cần thiết trong production
 */
export const devLog = (message: string, ...args: unknown[]): void => {
  if (process.env.NODE_ENV === "development") {
    console.log(message, ...args);
  }
};

/**
 * Wrapper cho console.error chỉ chạy trong môi trường development
 * Giúp tránh log lỗi không cần thiết trong production
 */
export const devError = (message: string, ...args: unknown[]): void => {
  if (process.env.NODE_ENV === "development") {
    console.error(message, ...args);
  }
};

/**
 * Tham số phân trang
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Lấy tham số phân trang từ URL search params
 * @param searchParams - URL search params
 * @returns Tham số phân trang (page, limit)
 */
export const getPaginationParams = (searchParams: URLSearchParams): PaginationParams => {
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100); // Tối đa 100 items
  
  return {
    page: Math.max(1, page),
    limit: Math.max(1, limit),
  };
};

/**
 * Tính toán số lượng bản ghi cần bỏ qua (skip) cho phân trang
 * @param page - Số trang (bắt đầu từ 1)
 * @param limit - Số lượng bản ghi mỗi trang
 * @returns Số lượng bản ghi cần bỏ qua
 */
export const getPaginationSkip = (page: number, limit: number): number => {
  return (page - 1) * limit;
};

