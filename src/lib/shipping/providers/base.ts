export interface ShippingProvider {
  name: string; // Tên của provider

  // Tạo đơn vận chuyển mới với provider
  createOrder(
    data: CreateShippingOrderData
  ): Promise<CreateShippingOrderResponse>;

  // Lấy thông tin tracking của đơn hàng
  getTracking(trackingNumber: string): Promise<TrackingResponse>;

  // Tính phí vận chuyển trước khi tạo đơn
  calculateFee(data: CalculateFeeData): Promise<CalculateFeeResponse>;

  // Hủy đơn vận chuyển
  cancelOrder(orderId: string): Promise<CancelOrderResponse>;
}

// Dữ liệu cần thiết để tạo đơn vận chuyển
export interface CreateShippingOrderData {
  orderId: string; // ID đơn hàng trong hệ thống
  fromAddress: string; // Địa chỉ người gửi
  fromPhone: string; // SĐT người gửi
  fromName: string; // Tên người gửi
  toAddress: string; // Địa chỉ người nhận
  toPhone: string; // SĐT người nhận
  toName: string; // Tên người nhận
  toCity?: string; // Thành phố người nhận (optional)
  toDistrict?: string; // Quận/huyện người nhận (optional)
  toWard?: string; // Phường/xã người nhận (optional)
  weight: number; // Trọng lượng hàng (đơn vị: gram)
  codAmount?: number; // Số tiền thu hộ (COD) - optional
  note?: string; // Ghi chú thêm - optional
}

// Response khi tạo đơn vận chuyển thành công
export interface CreateShippingOrderResponse {
  success: boolean; // Có thành công không
  trackingNumber: string; // Mã vận đơn để tracking
  providerOrderId: string; // ID đơn hàng từ phía provider
  estimatedDelivery?: string; // Ngày dự kiến giao hàng
  fee?: number; // Phí vận chuyển
  data?: any; // Dữ liệu thêm từ provider (tùy từng provider)
  error?: string; // Thông báo lỗi nếu có
}

// Response khi lấy thông tin tracking
export interface TrackingResponse {
  success: boolean; // Có lấy được thông tin không
  status: string; // Trạng thái hiện tại (PENDING, IN_TRANSIT, DELIVERED, etc.)
  currentLocation?: string; // Vị trí hiện tại của đơn hàng
  history?: TrackingHistory[]; // Lịch sử di chuyển của đơn hàng
  estimatedDelivery?: string; // Ngày dự kiến giao hàng
  error?: string; // Thông báo lỗi nếu có
}

// Một mốc trong lịch sử tracking
export interface TrackingHistory {
  time: string; // Thời gian
  location: string; // Địa điểm
  status: string; // Trạng thái tại thời điểm đó
  description: string; // Mô tả chi tiết
}

// Dữ liệu để tính phí vận chuyển
export interface CalculateFeeData {
  fromDistrict: string; // Quận/huyện người gửi
  fromWard: string; // Phường/xã người gửi
  toDistrict: string; // Quận/huyện người nhận
  toWard: string; // Phường/xã người nhận
  weight: number; // Trọng lượng (gram)
  codAmount?: number; // Số tiền thu hộ (nếu có)
}

// Response khi tính phí vận chuyển
export interface CalculateFeeResponse {
  success: boolean; // Có tính được phí không
  fee: number; // Phí vận chuyển
  estimatedDelivery?: string; // Ngày dự kiến giao hàng
  error?: string; // Thông báo lỗi nếu có
}

// Response khi hủy đơn vận chuyển
export interface CancelOrderResponse {
  success: boolean; // Có hủy được không
  message?: string; // Thông báo thành công
  error?: string; // Thông báo lỗi nếu có
}
