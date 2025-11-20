"use client";

import { createContext, useContext, useState } from "react";

type BulkSizeModalContextType = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

const BulkSizeModalContext = createContext<BulkSizeModalContextType | null>(
  null
);

export const BulkSizeModalProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  return (
    <BulkSizeModalContext.Provider value={{ isOpen, onOpen, onClose }}>
      {children}
    </BulkSizeModalContext.Provider>
  );
};

export const useBulkSizeModal = () => {
  const context = useContext(BulkSizeModalContext);
  if (!context)
    throw new Error(
      "useBulkSizeModal must be used within BulkSizeModalContextProvider"
    );
  return context;
};
