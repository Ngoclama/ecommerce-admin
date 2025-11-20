"use client";

import React from "react";
import { AlertModalProvider } from "@/hooks/use-alert-modal";
import { AlertModal } from "@/components/modals/alert-modal";

// Category
import { BulkCategoryModalProvider } from "@/hooks/use-bulk-category-modal";
import { BulkCreateCategoryModal } from "@/components/modals/bulk-category-modal";

// Size
import { BulkSizeModalProvider } from "@/hooks/use-bulk-size-modal";
import { BulkCreateSizeModal } from "@/components/modals/bulk-size-modal";

// Color
import { BulkColorModalProvider } from "@/hooks/use-bulk-color-modal";
import { BulkCreateColorModal } from "@/components/modals/bulk-color-modal";

// Coupon (Mới thêm)
import { BulkCouponModalProvider } from "@/hooks/use-bulk-coupon-modal";
import { BulkCreateCouponModal } from "@/components/modals/bulk-coupon-modal";

export const ModalProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <AlertModalProvider>
      <BulkCategoryModalProvider>
        <BulkSizeModalProvider>
          <BulkColorModalProvider>
            <BulkCouponModalProvider>
              {" "}
              {/* <--- 1. Thêm Provider này */}
              {children}
              {/* Global modals */}
              <AlertModal />
              <BulkCreateCategoryModal />
              <BulkCreateSizeModal />
              <BulkCreateColorModal />
              <BulkCreateCouponModal /> {/* <--- 2. Thêm Modal này */}
            </BulkCouponModalProvider>
          </BulkColorModalProvider>
        </BulkSizeModalProvider>
      </BulkCategoryModalProvider>
    </AlertModalProvider>
  );
};
