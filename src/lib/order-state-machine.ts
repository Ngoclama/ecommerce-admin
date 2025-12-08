/**
 * Quản lý trạng thái đơn hàng một cách chuyên nghiệp
 * Đảm bảo chỉ cho phép các transitions hợp lệ
 */

import { ORDER_STATUS, PAYMENT_METHODS } from "@/lib/constants";

const ORDER_STATE_TRANSITIONS: Record<string, string[]> = {
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.SHIPPED]: [
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.RETURNED, // Khách từ chối nhận hàng
  ],
  [ORDER_STATUS.DELIVERED]: [
    ORDER_STATUS.RETURNED, // Khách trả hàng sau khi nhận
  ],
  [ORDER_STATUS.CANCELLED]: [],
  [ORDER_STATUS.RETURNED]: [],
};

/**
 * Kiểm tra xem có thể chuyển từ trạng thái này sang trạng thái khác không
 */
export function canTransitionOrderStatus(
  currentStatus: string,
  newStatus: string
): boolean {
  // Nếu status không đổi, luôn cho phép
  if (currentStatus === newStatus) return true;

  const allowedTransitions = ORDER_STATE_TRANSITIONS[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
}

/**
 * Lấy danh sách các trạng thái có thể chuyển đến
 */
export function getValidNextStatuses(currentStatus: string): string[] {
  return ORDER_STATE_TRANSITIONS[currentStatus] || [];
}

/**
 * Validate order status transition và trả về error message nếu invalid
 */
export function validateOrderStatusTransition(
  currentStatus: string,
  newStatus: string
): { valid: boolean; error?: string } {
  if (currentStatus === newStatus) {
    return { valid: true };
  }

  if (!canTransitionOrderStatus(currentStatus, newStatus)) {
    const validStatuses = getValidNextStatuses(currentStatus);

    return {
      valid: false,
      error: `Không thể chuyển từ trạng thái "${currentStatus}" sang "${newStatus}". Các trạng thái hợp lệ: ${
        validStatuses.join(", ") || "Không có (trạng thái cuối)"
      }`,
    };
  }

  return { valid: true };
}

/**
 * Kiểm tra xem đơn hàng có ở trạng thái cuối không (không thể thay đổi)
 */
export function isOrderFinalState(status: string): boolean {
  return (["CANCELLED", "RETURNED"] as string[]).includes(status);
}

/**
 * Kiểm tra xem đơn hàng có thể bị hủy không
 */
export function canCancelOrder(currentStatus: string): boolean {
  return (["PENDING", "PROCESSING"] as string[]).includes(currentStatus);
}

/**
 * Logic nghiệp vụ cho từng transition
 */
export interface OrderTransitionResult {
  success: boolean;
  message: string;
  updates?: Record<string, any>;
}

export async function handleOrderStatusTransition(
  orderId: string,
  currentStatus: string,
  newStatus: string,
  orderData: any
): Promise<OrderTransitionResult> {
  const validation = validateOrderStatusTransition(currentStatus, newStatus);
  if (!validation.valid) {
    return {
      success: false,
      message: validation.error!,
    };
  }

  const updates: Record<string, any> = {
    status: newStatus,
  };

  switch (newStatus) {
    case ORDER_STATUS.PROCESSING:
      // Khi chuyển sang PROCESSING, kiểm tra inventory
      updates.message = "Đơn hàng đang được xử lý";
      break;

    case ORDER_STATUS.SHIPPED:
      updates.message = "Đơn hàng đã được giao cho đơn vị vận chuyển";
      break;

    case ORDER_STATUS.DELIVERED:
      // Khi giao hàng thành công
      // Nếu là COD và chưa thanh toán -> đánh dấu đã thanh toán
      if (
        orderData.paymentMethod === PAYMENT_METHODS.COD &&
        !orderData.isPaid
      ) {
        updates.isPaid = true;
      }
      updates.message = "Đơn hàng đã được giao thành công";
      break;

    case ORDER_STATUS.CANCELLED:
      updates.message = "Đơn hàng đã bị hủy";

      // Nếu đã thanh toán online, cần hoàn tiền
      if (
        orderData.isPaid &&
        [PAYMENT_METHODS.STRIPE, PAYMENT_METHODS.MOMO].includes(
          orderData.paymentMethod
        )
      ) {
        updates.requiresRefund = true;
      }
      break;

    case ORDER_STATUS.RETURNED:
      updates.message = "Đơn hàng đã được trả lại";
      break;
  }

  return {
    success: true,
    message: updates.message || `Đơn hàng chuyển sang trạng thái ${newStatus}`,
    updates,
  };
}

export function getOrderStatusDisplayName(status: string): string {
  const statusNames: Record<string, string> = {
    [ORDER_STATUS.PENDING]: "Chờ xử lý",
    [ORDER_STATUS.PROCESSING]: "Đang xử lý",
    [ORDER_STATUS.SHIPPED]: "Đang giao hàng",
    [ORDER_STATUS.DELIVERED]: "Đã giao hàng",
    [ORDER_STATUS.CANCELLED]: "Đã hủy",
    [ORDER_STATUS.RETURNED]: "Đã trả hàng",
  };

  return statusNames[status] || status;
}
