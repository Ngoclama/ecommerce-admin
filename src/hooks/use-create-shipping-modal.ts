import { create } from "zustand";

interface CreateShippingModalStore {
  isOpen: boolean;
  orderId: string | null;
  orderData: any | null;
  onOpen: (orderId: string, orderData?: any) => void;
  onClose: () => void;
}

export const useCreateShippingModal = create<CreateShippingModalStore>(
  (set) => ({
    isOpen: false,
    orderId: null,
    orderData: null,
    onOpen: (orderId: string, orderData?: any) =>
      set({ isOpen: true, orderId, orderData }),
    onClose: () => set({ isOpen: false, orderId: null, orderData: null }),
  })
);
