// Hook để sử dụng translations trong components
// Tự động lấy ngôn ngữ từ store và trả về translation tương ứng

import { useLanguageStore } from "@/lib/store/language-store";
import { getTranslation } from "@/lib/translations";

export function useTranslation() {
  const { language } = useLanguageStore();

  const t = (key: string): string => {
    return getTranslation(language, key);
  };

  return { t, language };
}
