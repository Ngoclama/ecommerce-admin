"use client";

import React from "react";
import { AlertModalProvider } from "@/hooks/use-alert-modal";
import { AlertModal } from "@/components/modals/alert-modal";

// Billboard
import { BulkBillboardModalProvider } from "@/hooks/use-bulk-billboard-modal";
import { BulkCreateBillboardModal } from "@/components/modals/bulk-billboard-modal";

// Category
import { BulkCategoryModalProvider } from "@/hooks/use-bulk-category-modal";
import { BulkCreateCategoryModal } from "@/components/modals/bulk-category-modal";

// Size
import { BulkSizeModalProvider } from "@/hooks/use-bulk-size-modal";
import { BulkCreateSizeModal } from "@/components/modals/bulk-size-modal";

// Color
import { BulkColorModalProvider } from "@/hooks/use-bulk-color-modal";
import { BulkCreateColorModal } from "@/components/modals/bulk-color-modal";

// Coupon
import { BulkCouponModalProvider } from "@/hooks/use-bulk-coupon-modal";
import { BulkCreateCouponModal } from "@/components/modals/bulk-coupon-modal";

export const ModalProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <AlertModalProvider>
      <BulkCategoryModalProvider>
        <BulkSizeModalProvider>
          <BulkColorModalProvider>
            <BulkCouponModalProvider>
              <BulkBillboardModalProvider>
                {children}
                <AlertModal />

                <BulkCreateBillboardModal />
                <BulkCreateCategoryModal />
                <BulkCreateSizeModal />
                <BulkCreateColorModal />
                <BulkCreateCouponModal />
              </BulkBillboardModalProvider>
            </BulkCouponModalProvider>
          </BulkColorModalProvider>
        </BulkSizeModalProvider>
      </BulkCategoryModalProvider>
    </AlertModalProvider>
  );
};
