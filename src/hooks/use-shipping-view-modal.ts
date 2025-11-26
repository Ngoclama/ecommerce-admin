import { create } from "zustand";

interface ShippingViewModalStore {
  isOpen: boolean;
  shippingId: string | null;
  onOpen: (shippingId: string) => void;
  onClose: () => void;
}

export const useShippingViewModal = create<ShippingViewModalStore>((set) => ({
  isOpen: false,
  shippingId: null,
  onOpen: (shippingId: string) => set({ isOpen: true, shippingId }),
  onClose: () => set({ isOpen: false, shippingId: null }),
}));

