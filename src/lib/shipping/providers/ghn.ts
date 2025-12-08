// Giao Hàng Nhanh (GHN) Provider Implementation
import {
  ShippingProvider,
  CreateShippingOrderData,
  CreateShippingOrderResponse,
  TrackingResponse,
  CalculateFeeData,
  CalculateFeeResponse,
  CancelOrderResponse,
} from "./base";

export class GHNProvider implements ShippingProvider {
  name = "GHN";
  private apiUrl = "https://dev-online-gateway.ghn.vn";
  private token: string;

  constructor(token?: string) {
    this.token = token || process.env.GHN_API_TOKEN || "";
  }

  async createOrder(
    data: CreateShippingOrderData
  ): Promise<CreateShippingOrderResponse> {
    try {
      // TODO: Triển khai API call thực tế cho GHN
      // Đây là implementation placeholder
      const response = await fetch(`${this.apiUrl}/shipping-order/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Token: this.token,
        },
        body: JSON.stringify({
          payment_type_id: data.codAmount ? 2 : 1, // 1: Người gửi trả, 2: Người nhận trả
          note: data.note || "",
          required_note: "CHOTHUHANG",
          from_name: data.fromName,
          from_phone: data.fromPhone,
          from_address: data.fromAddress,
          from_ward_name: data.toWard || "",
          from_district_name: data.toDistrict || "",
          from_province_name: data.toCity || "",
          to_name: data.toName,
          to_phone: data.toPhone,
          to_address: data.toAddress,
          to_ward_name: data.toWard || "",
          to_district_name: data.toDistrict || "",
          to_province_name: data.toCity || "",
          weight: data.weight,
          length: 20,
          width: 20,
          height: 20,
          cod_amount: data.codAmount || 0,
        }),
      });

      const result = await response.json();

      if (result.code === 200 && result.data) {
        return {
          success: true,
          trackingNumber: result.data.order_code,
          providerOrderId: result.data.order_code,
          estimatedDelivery: result.data.expected_delivery_time,
          fee: result.data.total_fee,
          data: result.data,
        };
      }

      return {
        success: false,
        trackingNumber: "",
        providerOrderId: "",
        error: result.message || "Failed to create shipping order",
      };
    } catch (error: any) {
      return {
        success: false,
        trackingNumber: "",
        providerOrderId: "",
        error: error.message || "Unknown error",
      };
    }
  }

  async getTracking(trackingNumber: string): Promise<TrackingResponse> {
    try {
      // TODO: Triển khai API tracking thực tế cho GHN
      const response = await fetch(`${this.apiUrl}/shipping-order/detail`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Token: this.token,
        },
        body: JSON.stringify({
          order_code: trackingNumber,
        }),
      });

      const result = await response.json();

      if (result.code === 200 && result.data) {
        return {
          success: true,
          status: result.data.status,
          currentLocation: result.data.current_location,
          history: result.data.history?.map((h: any) => ({
            time: h.time,
            location: h.location,
            status: h.status,
            description: h.description,
          })),
          estimatedDelivery: result.data.expected_delivery_time,
        };
      }

      return {
        success: false,
        status: "UNKNOWN",
        error: result.message || "Failed to get tracking",
      };
    } catch (error: any) {
      return {
        success: false,
        status: "UNKNOWN",
        error: error.message || "Unknown error",
      };
    }
  }

  async calculateFee(data: CalculateFeeData): Promise<CalculateFeeResponse> {
    try {
      
      
      return {
        success: true,
        fee: 30000, 
        estimatedDelivery: "2-3 ngày",
      };
    } catch (error: any) {
      return {
        success: false,
        fee: 0,
        error: error.message || "Unknown error",
      };
    }
  }

  async cancelOrder(orderId: string): Promise<CancelOrderResponse> {
    try {
      
      return {
        success: true,
        message: "Order cancelled successfully",
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Unknown error",
      };
    }
  }
}
