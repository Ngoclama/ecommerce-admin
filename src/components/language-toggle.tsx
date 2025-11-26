// Component để chuyển đổi ngôn ngữ Anh - Việt
// Hiển thị button với dropdown để chọn ngôn ngữ

"use client";

import { Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguageStore } from "@/lib/store/language-store";
import { cn } from "@/lib/utils";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguageStore();
  const router = useRouter();

  const handleLanguageChange = (lang: "en" | "vi") => {
    setLanguage(lang);
    // Zustand store sẽ tự động trigger re-render cho tất cả components đang subscribe
    // router.refresh() chỉ cần cho server components
    router.refresh();
  };

  const languages = [
    { code: "en" as const, label: "English", flag: "🇺🇸" },
    { code: "vi" as const, label: "Tiếng Việt", flag: "🇻🇳" },
  ];

  const currentLanguage = languages.find((lang) => lang.code === language);

  const glassEffect =
    "bg-white/70 dark:bg-black/70 backdrop-blur-md backdrop-saturate-150 border border-white/30 dark:border-white/10 shadow-lg";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "rounded-xl h-10 w-10 transition-all duration-300",
            glassEffect,
            "hover:bg-white/90 dark:hover:bg-black/90"
          )}
        >
          <Languages className="h-5 w-5 text-primary" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={cn(
          "rounded-xl p-1 mt-2 w-40",
          "bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl",
          "border border-white/20 dark:border-neutral-700/50 shadow-2xl"
        )}
      >
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={cn(
              "flex items-center gap-2 rounded-lg py-2 cursor-pointer transition-colors",
              "hover:bg-neutral-100 dark:hover:bg-neutral-700",
              language === lang.code &&
                "bg-primary/10 text-primary font-semibold"
            )}
          >
            <span className="text-lg">{lang.flag}</span>
            <span>{lang.label}</span>
            {language === lang.code && (
              <span className="ml-auto text-xs">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
