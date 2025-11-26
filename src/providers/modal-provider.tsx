"use client";

import React, { useEffect, useState } from "react";

// Import các hooks quản lý modal
import { AlertModalProvider } from "@/hooks/use-alert-modal";
import { BulkBillboardModalProvider } from "@/hooks/use-bulk-billboard-modal";
import { BulkCategoryModalProvider } from "@/hooks/use-bulk-category-modal";
import { BulkSizeModalProvider } from "@/hooks/use-bulk-size-modal";
import { BulkColorModalProvider } from "@/hooks/use-bulk-color-modal";
import { BulkCouponModalProvider } from "@/hooks/use-bulk-coupon-modal";
import { BulkMaterialModalProvider } from "@/hooks/use-bulk-material-modal";

// Import các component modal
import { AlertModal } from "@/components/modals/alert-modal";
import { useAlertModal } from "@/hooks/use-alert-modal";
import { BulkCreateBillboardModal } from "@/components/modals/bulk-billboard-modal";
import { BulkCreateCategoryModal } from "@/components/modals/bulk-category-modal";
import { BulkCreateSizeModal } from "@/components/modals/bulk-size-modal";
import { BulkCreateColorModal } from "@/components/modals/bulk-color-modal";
import { BulkCreateCouponModal } from "@/components/modals/bulk-coupon-modal";
import { BulkCreateMaterialModal } from "@/components/modals/bulk-material-modal"; // MỚI
import { StoreModal } from "@/components/modals/store-modal";

const AlertModalWrapper: React.FC = () => {
  const { isOpen, onClose, onConfirm, loading } = useAlertModal();

  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
  };

  return (
    <AlertModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      loading={loading}
    />
  );
};

export const ModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <AlertModalProvider>
      <BulkCategoryModalProvider>
        <BulkSizeModalProvider>
          <BulkColorModalProvider>
            <BulkCouponModalProvider>
              <BulkBillboardModalProvider>
                <BulkMaterialModalProvider>
                  {children}

                  {isMounted && (
                    <>
                      <AlertModalWrapper />
                      <StoreModal />
                      <BulkCreateBillboardModal />
                      <BulkCreateCategoryModal />
                      <BulkCreateSizeModal />
                      <BulkCreateColorModal />
                      <BulkCreateCouponModal />
                      <BulkCreateMaterialModal />
                    </>
                  )}
                </BulkMaterialModalProvider>
              </BulkBillboardModalProvider>
            </BulkCouponModalProvider>
          </BulkColorModalProvider>
        </BulkSizeModalProvider>
      </BulkCategoryModalProvider>
    </AlertModalProvider>
  );
};
