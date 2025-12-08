// Các hàm tiện ích để tối ưu API responses

export const devLog = (message: string, ...args: unknown[]): void => {
  if (process.env.NODE_ENV === "development") {
    console.log(message, ...args);
  }
};

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

export const getPaginationParams = (searchParams: URLSearchParams): PaginationParams => {
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100); // Tối đa 100 items
  
  return {
    page: Math.max(1, page),
    limit: Math.max(1, limit),
  };
};

export const getPaginationSkip = (page: number, limit: number): number => {
  return (page - 1) * limit;
};

