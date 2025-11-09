"use client";

import React, { createContext, useContext, useState } from "react";

type AlertModalState = {
  isOpen: boolean;
  title?: string;
  description?: string;
  onConfirm?: () => Promise<void> | void;
  loading?: boolean;
};

type AlertModalContextValue = {
  isOpen: boolean;
  title?: string;
  description?: string;
  onConfirm?: () => Promise<void> | void;
  loading: boolean;
  setLoading: (v: boolean) => void;
  onOpen: (opts: {
    title?: string;
    description?: string;
    onConfirm?: () => Promise<void> | void;
  }) => void;
  onClose: () => void;
};

const AlertModalContext = createContext<AlertModalContextValue | undefined>(
  undefined
);

export const AlertModalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<AlertModalState>({
    isOpen: false,
    title: undefined,
    description: undefined,
    onConfirm: undefined,
    loading: false,
  });

  const [loading, setLoading] = useState(false);

  const onOpen = (opts: {
    title?: string;
    description?: string;
    onConfirm?: () => Promise<void> | void;
  }) => {
    setState({
      isOpen: true,
      title: opts.title,
      description: opts.description,
      onConfirm: opts.onConfirm,
      loading: false,
    });
    setLoading(false);
  };

  const onClose = () => {
    setState((s) => ({ ...s, isOpen: false }));
    setLoading(false);
  };

  return (
    <AlertModalContext.Provider
      value={{
        isOpen: state.isOpen,
        title: state.title,
        description: state.description,
        onConfirm: state.onConfirm,
        loading,
        setLoading,
        onOpen,
        onClose,
      }}
    >
      {children}
    </AlertModalContext.Provider>
  );
};

export const useAlertModal = (): AlertModalContextValue => {
  const ctx = useContext(AlertModalContext);
  if (!ctx)
    throw new Error("useAlertModal must be used within AlertModalProvider");
  return ctx;
};
