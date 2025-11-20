"use client";

import { createContext, useContext, useState } from "react";

type BulkCouponModalContextType = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

const BulkCouponModalContext = createContext<BulkCouponModalContextType | null>(
  null
);

export const BulkCouponModalProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  return (
    <BulkCouponModalContext.Provider value={{ isOpen, onOpen, onClose }}>
      {children}
    </BulkCouponModalContext.Provider>
  );
};

export const useBulkCouponModal = () => {
  const context = useContext(BulkCouponModalContext);
  if (!context)
    throw new Error(
      "useBulkCouponModal must be used within BulkCouponModalProvider"
    );
  return context;
};