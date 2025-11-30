/**
 * API Types - Các types dùng chung cho API responses
 */

// ─── API RESPONSE TYPES ───────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

// ─── PAGINATION TYPES ────────────────────────────────────────────
export interface PaginationParams {
  page?: number;
  limit?: number;
  skip?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// ─── VALIDATION TYPES ────────────────────────────────────────────
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResponse {
  errors: ValidationError[];
}

// ─── BULK OPERATION TYPES ────────────────────────────────────────
export interface BulkOperationRequest<T> {
  rows: T[];
}

export interface BulkOperationResponse {
  success: number;
  failed: number;
  errors?: Array<{
    row: number;
    error: string;
  }>;
}

