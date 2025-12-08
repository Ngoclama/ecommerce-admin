/**
 * Xử lý lỗi một cách nhất quán và hiển thị toast thay vì error trực tiếp
 */

import { toast } from "sonner";
import { devError } from "./api-utils";

export interface ErrorResponse {
  message?: string;
  error?: string;
  errors?: Array<{ message: string; field?: string }>;
}

export const getErrorMessage = (error: unknown): string => {
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
      
      if (typeof data === "string") {
        return data;
      }
      
      if (typeof data === "object") {
        if (data.message) return data.message;
        if (data.error) return data.error;
        if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          return data.errors.map((e) => e.message || e.field || "").join(", ");
        }
      }
    }

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

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Đã xảy ra lỗi không xác định. Vui lòng thử lại";
};

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

export const getError = (
  error: unknown,
  defaultMessage: string = "Đã xảy ra lỗi. Vui lòng thử lại"
): string => {
  const errorMessage = getErrorMessage(error) || defaultMessage;
  devError("[ERROR_HANDLER]", error);
  return errorMessage;
};

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

