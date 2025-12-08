"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

// Cấu hình axios để gửi credentials (cookies) với mỗi request
// Điều này cần thiết để Clerk authentication hoạt động
// Trong Next.js, cookies sẽ tự động được gửi nếu cùng domain,
// nhưng vớiCredentials đảm bảo cookies được gửi trong mọi trường hợp
if (typeof window !== "undefined") {
  axios.defaults.withCredentials = true;
}


export const queryKeys = {
  products: (storeId: string) => ["products", storeId],
  product: (storeId: string, productId: string) => [
    "product",
    storeId,
    productId,
  ],
  orders: (storeId: string) => ["orders", storeId],
  order: (storeId: string, orderId: string) => ["order", storeId, orderId],
  categories: (storeId: string) => ["categories", storeId],
  category: (storeId: string, categoryId: string) => [
    "category",
    storeId,
    categoryId,
  ],
  sizes: (storeId: string) => ["sizes", storeId],
  colors: (storeId: string) => ["colors", storeId],
  materials: (storeId: string) => ["materials", storeId],
  coupons: (storeId: string) => ["coupons", storeId],
  billboards: (storeId: string) => ["billboards", storeId],
  users: (storeId: string) => ["users", storeId],
  user: (storeId: string, userId: string) => ["user", storeId, userId],
  reviews: (storeId: string) => ["reviews", storeId],
};


export function useUser(storeId: string, userId: string | null) {
  return useQuery({
    queryKey: userId
      ? queryKeys.user(storeId, userId)
      : ["user", storeId, "null"],
    queryFn: async () => {
      if (!userId) return null;
      try {
        const response = await axios.get(`/api/${storeId}/users/${userId}`, {
          withCredentials: true, // Đảm bảo gửi cookies
        });
        return response.data;
      } catch (error: any) {
        // Log lỗi để debug
        if (process.env.NODE_ENV === "development") {
          console.error("[useUser] Error fetching user:", {
            storeId,
            userId,
            status: error?.response?.status,
            message: error?.response?.data || error?.message,
          });
        }
        // Nếu là lỗi 401, có thể do session hết hạn hoặc chưa đăng nhập
        if (error?.response?.status === 401) {
          console.warn("[useUser] Unauthorized - User may need to re-authenticate");
        }
        throw error; // Re-throw để React Query xử lý
      }
    },
    enabled: !!userId && !!storeId,
    staleTime: 0, // Always refetch to get latest data
    refetchOnWindowFocus: true,
    retry: (failureCount, error: any) => {
      // Không retry nếu là lỗi 401 (Unauthorized) hoặc 403 (Forbidden)
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      // Retry tối đa 2 lần cho các lỗi khác
      return failureCount < 2;
    },
  });
}


export function useProduct(storeId: string, productId: string | null) {
  return useQuery<any>({
    queryKey: productId
      ? queryKeys.product(storeId, productId)
      : ["product", storeId, "null"],
    queryFn: async () => {
      if (!productId) return null;
      const response = await axios.get(`/api/${storeId}/products/${productId}`);
      return response.data;
    },
    enabled: !!productId && !!storeId,
    staleTime: 5 * 60 * 1000, 
  });
}


export function useOrder(storeId: string, orderId: string | null) {
  return useQuery({
    queryKey: orderId
      ? queryKeys.order(storeId, orderId)
      : ["order", storeId, "null"],
    queryFn: async () => {
      if (!orderId) return null;
      const [orderResponse, storeResponse] = await Promise.all([
        axios.get(`/api/${storeId}/orders/${orderId}`),
        axios.get(`/api/stores/${storeId}`),
      ]);
      return {
        order: orderResponse.data,
        store: storeResponse.data,
      };
    },
    enabled: !!orderId && !!storeId,
    staleTime: 5 * 60 * 1000,
  });
}


export function useMaterial(storeId: string, materialId: string | null) {
  return useQuery<{
    id: string;
    name: string;
    value: string;
    createdAt: string;
  } | null>({
    queryKey: materialId
      ? ["material", storeId, materialId]
      : ["material", storeId, "null"],
    queryFn: async (): Promise<{
      id: string;
      name: string;
      value: string;
      createdAt: string;
    } | null> => {
      if (!materialId) return null;
      const response = await axios.get<{
        id: string;
        name: string;
        value: string;
        createdAt: string;
      }>(`/api/${storeId}/materials/${materialId}`);
      return response.data;
    },
    enabled: !!materialId && !!storeId,
    staleTime: 5 * 60 * 1000,
  });
}


export function useColor(storeId: string, colorId: string | null) {
  return useQuery<{
    id: string;
    name: string;
    value: string;
    createdAt: string;
  } | null>({
    queryKey: colorId
      ? ["color", storeId, colorId]
      : ["color", storeId, "null"],
    queryFn: async (): Promise<{
      id: string;
      name: string;
      value: string;
      createdAt: string;
    } | null> => {
      if (!colorId) return null;
      const response = await axios.get<{
        id: string;
        name: string;
        value: string;
        createdAt: string;
      }>(`/api/${storeId}/colors/${colorId}`);
      return response.data;
    },
    enabled: !!colorId && !!storeId,
    staleTime: 5 * 60 * 1000,
  });
}


export function useCategory(storeId: string, categoryId: string | null) {
  return useQuery<{
    id: string;
    name: string;
    slug: string;
    imageUrl?: string | null;
    billboardId: string;
    parentId?: string | null;
    billboard?: {
      label: string;
    };
    parent?: {
      id: string;
      name: string;
      slug: string;
    } | null;
    createdAt: string;
    updatedAt: string;
  } | null>({
    queryKey: categoryId
      ? queryKeys.category(storeId, categoryId)
      : ["category", storeId, "null"],
    queryFn: async (): Promise<{
      id: string;
      name: string;
      slug: string;
      imageUrl?: string | null;
      billboardId: string;
      parentId?: string | null;
      billboard?: {
        label: string;
      };
      parent?: {
        id: string;
        name: string;
        slug: string;
      } | null;
      createdAt: string;
      updatedAt: string;
    } | null> => {
      if (!categoryId) return null;
      const response = await axios.get<{
        id: string;
        name: string;
        slug: string;
        imageUrl?: string | null;
        billboardId: string;
        parentId?: string | null;
        billboard?: {
          label: string;
        };
        parent?: {
          id: string;
          name: string;
          slug: string;
        } | null;
        createdAt: string;
        updatedAt: string;
      }>(`/api/${storeId}/categories/${categoryId}`);
      return response.data;
    },
    enabled: !!categoryId && !!storeId,
    staleTime: 5 * 60 * 1000,
  });
}


interface ReturnDetails {
  id: string;
  orderId: string;
  userId: string;
  status: string;
  reason: string;
  description: string | null;
  refundAmount: number;
  refundMethod: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
  };
  order?: {
    id: string;
    orderItems: any[];
  };
  returnItems?: any[];
}

export function useReturn(storeId: string, returnId: string | null) {
  return useQuery<ReturnDetails | null>({
    queryKey: returnId
      ? ["return", storeId, returnId]
      : ["return", storeId, "null"],
    queryFn: async (): Promise<ReturnDetails | null> => {
      if (!returnId) return null;
      const response = await axios.get<ReturnDetails>(
        `/api/${storeId}/returns/${returnId}`
      );
      return response.data;
    },
    enabled: !!returnId && !!storeId,
    staleTime: 5 * 60 * 1000,
  });
}


export function usePrefetch() {
  const queryClient = useQueryClient();

  const prefetchProduct = (storeId: string, productId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.product(storeId, productId),
      queryFn: async () => {
        const response = await axios.get(
          `/api/${storeId}/products/${productId}`
        );
        return response.data;
      },
      staleTime: 5 * 60 * 1000,
    });
  };

  const prefetchOrder = (storeId: string, orderId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.order(storeId, orderId),
      queryFn: async () => {
        const [orderResponse, storeResponse] = await Promise.all([
          axios.get(`/api/${storeId}/orders/${orderId}`),
          axios.get(`/api/stores/${storeId}`),
        ]);
        return {
          order: orderResponse.data,
          store: storeResponse.data,
        };
      },
      staleTime: 5 * 60 * 1000,
    });
  };

  const prefetchMaterial = (storeId: string, materialId: string) => {
    queryClient.prefetchQuery({
      queryKey: ["material", storeId, materialId],
      queryFn: async () => {
        const response = await axios.get(
          `/api/${storeId}/materials/${materialId}`
        );
        return response.data;
      },
      staleTime: 5 * 60 * 1000,
    });
  };

  const prefetchColor = (storeId: string, colorId: string) => {
    queryClient.prefetchQuery({
      queryKey: ["color", storeId, colorId],
      queryFn: async () => {
        const response = await axios.get(`/api/${storeId}/colors/${colorId}`);
        return response.data;
      },
      staleTime: 5 * 60 * 1000,
    });
  };

  const prefetchCategory = (storeId: string, categoryId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.category(storeId, categoryId),
      queryFn: async () => {
        const response = await axios.get(
          `/api/${storeId}/categories/${categoryId}`
        );
        return response.data;
      },
      staleTime: 5 * 60 * 1000,
    });
  };

  return {
    prefetchProduct,
    prefetchOrder,
    prefetchMaterial,
    prefetchColor,
    prefetchCategory,
  };
}
