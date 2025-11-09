"use client";

import React from "react";
import { AlertModalProvider } from "@/hooks/use-alert-modal";
import { BulkCategoryModalProvider } from "@/hooks/use-bulk-category-modal";
import { AlertModal } from "@/components/modals/alert-modal";
import { BulkCreateCategoryModal } from "@/components/modals/bulk-category-modal";

export const ModalProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <AlertModalProvider>
      <BulkCategoryModalProvider>
        {children}
        {/* Global modals */}
        <AlertModal />
        <BulkCreateCategoryModal />
      </BulkCategoryModalProvider>
    </AlertModalProvider>
  );
};
