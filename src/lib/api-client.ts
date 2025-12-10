"use client";

import { useLoading } from "@/hooks/use-loading";

// Wrapper for fetch that automatically shows loading
export const createApiClient = () => {
  // This will be used in components that have access to useLoading hook
  return {
    fetch: async (url: string, options?: RequestInit) => {
      // We'll handle loading in the component level
      return fetch(url, options);
    },
  };
};

// Global fetch interceptor - only on client side
if (typeof window !== "undefined") {
  // Only setup interceptor once
  if (!(window as any).__fetchInterceptorSetup) {
    const originalFetch = window.fetch;

    window.fetch = async function (...args) {
      // Only intercept API calls (not static assets)
      const url = args[0];
      if (
        typeof url === "string" &&
        (url.startsWith("/api/") || url.includes("/api/"))
      ) {
        // Dispatch custom event for loading
        window.dispatchEvent(new CustomEvent("api-loading-start"));

        try {
          const response = await originalFetch.apply(this, args);
          window.dispatchEvent(new CustomEvent("api-loading-end"));
          return response;
        } catch (error) {
          window.dispatchEvent(new CustomEvent("api-loading-end"));
          throw error;
        }
      }

      return originalFetch.apply(this, args);
    };

    (window as any).__fetchInterceptorSetup = true;
  }
}
