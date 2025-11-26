import { create } from "zustand";

interface ReturnViewModalStore {
  isOpen: boolean;
  returnId: string | null;
  onOpen: (returnId: string) => void;
  onClose: () => void;
}

export const useReturnViewModal = create<ReturnViewModalStore>((set) => ({
  isOpen: false,
  returnId: null,
  onOpen: (returnId: string) => set({ isOpen: true, returnId }),
  onClose: () => set({ isOpen: false, returnId: null }),
}));
