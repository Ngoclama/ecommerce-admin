// Store quản lý ngôn ngữ của ứng dụng
// Sử dụng Zustand để quản lý state và localStorage để lưu preference

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Language = "en" | "vi";

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: "vi", // Mặc định là Tiếng Việt
      setLanguage: (lang: Language) => set({ language: lang }),
    }),
    {
      name: "language-storage", // Tên key trong localStorage
      storage: createJSONStorage(() => localStorage), // Sử dụng localStorage
    }
  )
);
