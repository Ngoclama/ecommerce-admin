"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

interface LoadingContextType {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  withLoading: <T>(fn: () => Promise<T>) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCount, setLoadingCount] = useState(0);

  const setLoading = useCallback((loading: boolean) => {
    setLoadingCount((prev) => (loading ? prev + 1 : Math.max(0, prev - 1)));
  }, []);

  useEffect(() => {
    setIsLoading(loadingCount > 0);
  }, [loadingCount]);

  // Listen to API loading events
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStart = () => setLoadingCount((prev) => prev + 1);
    const handleEnd = () => setLoadingCount((prev) => Math.max(0, prev - 1));

    window.addEventListener("api-loading-start", handleStart);
    window.addEventListener("api-loading-end", handleEnd);

    return () => {
      window.removeEventListener("api-loading-start", handleStart);
      window.removeEventListener("api-loading-end", handleEnd);
    };
  }, []);

  const withLoading = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      setLoadingCount((prev) => prev + 1);
      try {
        const result = await fn();
        return result;
      } finally {
        setLoadingCount((prev) => Math.max(0, prev - 1));
      }
    },
    []
  );

  return (
    <LoadingContext.Provider value={{ isLoading, setLoading, withLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within LoadingProvider");
  }
  return context;
};
