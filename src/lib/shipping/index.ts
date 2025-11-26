// Factory pattern để tạo shipping provider theo loại
// Mỗi provider (GHN, ViettelPost, GHTK, Custom) có cách xử lý riêng

import { ShippingProvider } from "./providers/base";
import { GHNProvider } from "./providers/ghn";
import { ViettelPostProvider } from "./providers/viettelpost";
import { CustomShippingProvider } from "./providers/custom";

// Các loại nhà vận chuyển được hỗ trợ
export type ProviderType = "GHN" | "VIETTELPOST" | "GHTK" | "CUSTOM";

/**
 * Hàm factory để tạo instance của shipping provider
 * Dựa vào provider type để trả về đúng class tương ứng
 * Nếu không tìm thấy hoặc không hỗ trợ thì dùng CustomShippingProvider
 */
export function getShippingProvider(provider: ProviderType): ShippingProvider {
  switch (provider) {
    case "GHN":
      return new GHNProvider();
    case "VIETTELPOST":
      return new ViettelPostProvider();
    case "CUSTOM":
      return new CustomShippingProvider();
    default:
      // Fallback về Custom nếu provider không được hỗ trợ
      return new CustomShippingProvider();
  }
}

// Export các interface và type từ base để dùng ở nơi khác
export * from "./providers/base";
