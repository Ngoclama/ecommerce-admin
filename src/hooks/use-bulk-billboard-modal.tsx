"use client";

import { createContext, useContext, useState } from "react";

type BulkBillboardModalContextType = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

const BulkBillboardModalContext =
  createContext<BulkBillboardModalContextType | null>(null);

export const BulkBillboardModalProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  return (
    <BulkBillboardModalContext.Provider value={{ isOpen, onOpen, onClose }}>
      {children}
    </BulkBillboardModalContext.Provider>
  );
};

export const useBulkBillboardModal = () => {
  const context = useContext(BulkBillboardModalContext);
  if (!context)
    throw new Error(
      "useBulkBillboardModal must be used within BulkBillboardModalProvider"
    );
  return context;
};
