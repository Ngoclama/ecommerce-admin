"use client";

import { createContext, useContext, useState } from "react";

type BulkCategoryModalContextType = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

const BulkCategoryModalContext =
  createContext<BulkCategoryModalContextType | null>(null);

export const BulkCategoryModalProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  return (
    <BulkCategoryModalContext.Provider value={{ isOpen, onOpen, onClose }}>
      {children}
    </BulkCategoryModalContext.Provider>
  );
};

export const useBulkCategoryModal = () => {
  const context = useContext(BulkCategoryModalContext);
  if (!context)
    throw new Error(
      "useBulkCategoryModal must be used within BulkCategoryModalProvider"
    );
  return context;
};
