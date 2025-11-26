// File utility chứa các hàm helper dùng chung trong dự án

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Hàm merge className cho Tailwind CSS
 * Dùng để kết hợp nhiều className và xử lý conflict giữa các class
 * Ví dụ: cn("px-2", "px-4") sẽ trả về "px-4" (class sau ghi đè class trước)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatter để format số tiền theo định dạng VNĐ
 * Dùng để hiển thị giá tiền trong toàn bộ ứng dụng
 * Ví dụ: formatter.format(100000) => "100.000 ₫"
 */
export const formatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});
