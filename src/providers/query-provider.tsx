"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Cache dữ liệu trong 5 phút
            staleTime: 5 * 60 * 1000,
            // Giữ dữ liệu không dùng trong cache 10 phút
            gcTime: 10 * 60 * 1000,
            // Thử lại 1 lần nếu request thất bại
            retry: 1,
            // Không refetch khi focus vào window
            refetchOnWindowFocus: false,
            // Refetch khi kết nối lại
            refetchOnReconnect: true,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
