
import {
  ShippingProvider,
  CreateShippingOrderData,
  CreateShippingOrderResponse,
  TrackingResponse,
  CalculateFeeData,
  CalculateFeeResponse,
  CancelOrderResponse,
} from "./base";

export class ViettelPostProvider implements ShippingProvider {
  name = "ViettelPost";
  private apiUrl = "https://partner.viettelpost.vn/v2";
  private username: string;
  private password: string;

  constructor(username?: string, password?: string) {
    this.username = username || process.env.VIETTELPOST_USERNAME || "";
    this.password = password || process.env.VIETTELPOST_PASSWORD || "";
  }

  async createOrder(
    data: CreateShippingOrderData
  ): Promise<CreateShippingOrderResponse> {
    try {
      
      
      return {
        success: false,
        trackingNumber: "",
        providerOrderId: "",
        error: "ViettelPost integration not yet implemented",
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
      
      return {
        success: false,
        status: "UNKNOWN",
        error: "ViettelPost integration not yet implemented",
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
        fee: 25000, 
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
