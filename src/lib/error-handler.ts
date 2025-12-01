/**
 * Error Handler Utility
 * Xử lý lỗi một cách nhất quán và hiển thị toast thay vì error trực tiếp
 */

import { toast } from "sonner";
import { devError } from "./api-utils";

export interface ErrorResponse {
  message?: string;
  error?: string;
  errors?: Array<{ message: string; field?: string }>;
}

/**
 * Extract error message from various error types
 */
export const getErrorMessage = (error: unknown): string => {
  // Axios error
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as {
      response?: {
        data?: ErrorResponse | string;
        status?: number;
        statusText?: string;
      };
      message?: string;
    };

    if (axiosError.response?.data) {
      const data = axiosError.response.data;
      
      // String response
      if (typeof data === "string") {
        return data;
      }
      
      // Object response
      if (typeof data === "object") {
        if (data.message) return data.message;
        if (data.error) return data.error;
        if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          return data.errors.map((e) => e.message || e.field || "").join(", ");
        }
      }
    }

    // HTTP status error
    if (axiosError.response?.status) {
      const status = axiosError.response.status;
      if (status === 401) return "Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn";
      if (status === 403) return "Bạn không có quyền thực hiện hành động này";
      if (status === 404) return "Không tìm thấy tài nguyên";
      if (status === 500) return "Lỗi server. Vui lòng thử lại sau";
      if (status >= 500) return "Lỗi server. Vui lòng liên hệ hỗ trợ";
    }

    if (axiosError.message) return axiosError.message;
  }

  // Standard Error object
  if (error instanceof Error) {
    return error.message;
  }

  // String error
  if (typeof error === "string") {
    return error;
  }

  // Unknown error
  return "Đã xảy ra lỗi không xác định. Vui lòng thử lại";
};

/**
 * Handle error and show toast notification
 * @param error - Error object
 * @param defaultMessage - Default message if error message cannot be extracted
 * @param logError - Whether to log error to console (default: true)
 */
export const handleError = (
  error: unknown,
  defaultMessage: string = "Đã xảy ra lỗi. Vui lòng thử lại",
  logError: boolean = true
): void => {
  const errorMessage = getErrorMessage(error) || defaultMessage;

  if (logError) {
    devError("[ERROR_HANDLER]", error);
  }

  toast.error(errorMessage);
};

/**
 * Handle error and return error message (without showing toast)
 * Useful for cases where you want to handle the error message yourself
 */
export const getError = (
  error: unknown,
  defaultMessage: string = "Đã xảy ra lỗi. Vui lòng thử lại"
): string => {
  const errorMessage = getErrorMessage(error) || defaultMessage;
  devError("[ERROR_HANDLER]", error);
  return errorMessage;
};

/**
 * Wrapper for async functions to automatically handle errors
 */
export const withErrorHandling = async <T>(
  fn: () => Promise<T>,
  errorMessage?: string,
  onError?: (error: unknown) => void
): Promise<T | null> => {
  try {
    return await fn();
  } catch (error) {
    handleError(error, errorMessage);
    if (onError) {
      onError(error);
    }
    return null;
  }
};

