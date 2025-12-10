"use client";

import { useRouter as useNextRouter } from "next/navigation";
import { useLoading } from "./use-loading";
import { useCallback } from "react";

export const useRouterWithLoading = () => {
  const router = useNextRouter();
  const { withLoading } = useLoading();

  const push = useCallback(
    async (href: string) => {
      await withLoading(async () => {
        router.push(href);
        // Small delay to ensure navigation starts
        await new Promise((resolve) => setTimeout(resolve, 100));
      });
    },
    [router, withLoading]
  );

  const refresh = useCallback(async () => {
    await withLoading(async () => {
      router.refresh();
      // Small delay to ensure refresh starts
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
  }, [router, withLoading]);

  const replace = useCallback(
    async (href: string) => {
      await withLoading(async () => {
        router.replace(href);
        await new Promise((resolve) => setTimeout(resolve, 100));
      });
    },
    [router, withLoading]
  );

  return {
    ...router,
    push,
    refresh,
    replace,
  };
};
