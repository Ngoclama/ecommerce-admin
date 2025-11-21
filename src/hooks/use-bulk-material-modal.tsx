"use client";

import { createContext, useContext, useState } from "react";

type BulkMaterialModalContextType = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

const BulkMaterialModalContext =
  createContext<BulkMaterialModalContextType | null>(null);

export const BulkMaterialModalProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  return (
    <BulkMaterialModalContext.Provider value={{ isOpen, onOpen, onClose }}>
      {children}
    </BulkMaterialModalContext.Provider>
  );
};

export const useBulkMaterialModal = () => {
  const context = useContext(BulkMaterialModalContext);
  if (!context)
    throw new Error(
      "useBulkMaterialModal must be used within BulkMaterialModalProvider"
    );
  return context;
};
