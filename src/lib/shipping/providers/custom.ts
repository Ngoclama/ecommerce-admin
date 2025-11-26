// Custom Shipping Provider - dùng cho trường hợp nhập tay vận đơn
// Không tích hợp với API của nhà vận chuyển nào, chỉ tạo mã tracking số
// Dùng khi shop tự vận chuyển hoặc dùng dịch vụ khác không có trong hệ thống

import {
  ShippingProvider,
  CreateShippingOrderData,
  CreateShippingOrderResponse,
  TrackingResponse,
  CalculateFeeData,
  CalculateFeeResponse,
  CancelOrderResponse,
} from "./base";

export class CustomShippingProvider implements ShippingProvider {
  name = "Custom";

  /**
   * Tạo đơn vận chuyển custom
   * Chỉ tạo mã tracking số ngẫu nhiên, không gọi API nào cả
   * Format: CUSTOM-{timestamp}-{randomString}
   */
  async createOrder(
    data: CreateShippingOrderData
  ): Promise<CreateShippingOrderResponse> {
    // Tạo mã tracking số duy nhất bằng timestamp + random string
    // Ví dụ: CUSTOM-1703123456789-ABC123
    const trackingNumber = `CUSTOM-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    
    return {
      success: true,
      trackingNumber,
      providerOrderId: trackingNumber, // Dùng tracking number làm provider order ID luôn
      fee: 0, // Custom shipping không tính phí tự động
    };
  }

  /**
   * Lấy thông tin tracking
   * Vì là custom nên chỉ trả về status PENDING, không có thông tin thực tế
   */
  async getTracking(trackingNumber: string): Promise<TrackingResponse> {
    return {
      success: true,
      status: "PENDING", // Luôn trả về PENDING vì không có API để check
    };
  }

  /**
   * Tính phí vận chuyển
   * Custom shipping không tính phí tự động, trả về 0
   * Admin sẽ nhập phí thủ công
   */
  async calculateFee(
    data: CalculateFeeData
  ): Promise<CalculateFeeResponse> {
    return {
      success: true,
      fee: 0, // Không tính phí tự động
    };
  }

  /**
   * Hủy đơn vận chuyển
   * Vì không có API nên chỉ trả về success, không thực sự hủy ở phía provider
   */
  async cancelOrder(orderId: string): Promise<CancelOrderResponse> {
    return {
      success: true,
      message: "Order cancelled",
    };
  }
}

