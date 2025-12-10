"use client";

import React from "react";
import { CopperLoading } from "@/components/ui/copper-loading";
import { useLoading } from "@/hooks/use-loading";

export const LoadingOverlay: React.FC = () => {
  const { isLoading } = useLoading();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl p-6">
        <CopperLoading color="#111111" size={40} />
      </div>
    </div>
  );
};
