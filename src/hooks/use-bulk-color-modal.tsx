"use client";

import { createContext, useContext, useState } from "react";

type BulkColorModalContextType = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

const BulkColorModalContext = createContext<BulkColorModalContextType | null>(
  null
);

export const BulkColorModalProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  return (
    <BulkColorModalContext.Provider value={{ isOpen, onOpen, onClose }}>
      {children}
    </BulkColorModalContext.Provider>
  );
};

export const useBulkColorModal = () => {
  const context = useContext(BulkColorModalContext);
  if (!context)
    throw new Error(
      "useBulkColorModal must be used within BulkColorModalProvider"
    );
  return context;
};
