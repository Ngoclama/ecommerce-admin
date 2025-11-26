// Utility functions để tối ưu API responses

/**
 * Wrapper cho console.log chỉ chạy trong development
 */
export const devLog = (message: string, ...args: any[]) => {
  if (process.env.NODE_ENV === "development") {
    console.log(message, ...args);
  }
};

/**
 * Wrapper cho console.error chỉ chạy trong development
 */
export const devError = (message: string, ...args: any[]) => {
  if (process.env.NODE_ENV === "development") {
    console.error(message, ...args);
  }
};

/**
 * Pagination helper
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export const getPaginationParams = (searchParams: URLSearchParams): PaginationParams => {
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100); // Max 100 items
  
  return {
    page: Math.max(1, page),
    limit: Math.max(1, limit),
  };
};

export const getPaginationSkip = (page: number, limit: number): number => {
  return (page - 1) * limit;
};

