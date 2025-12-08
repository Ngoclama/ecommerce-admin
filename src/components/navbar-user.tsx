"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { useRouter, useParams } from "next/navigation";
import { useLanguageStore } from "@/lib/store/language-store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Languages,
  Moon,
  Sun,
  Monitor,
  User,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface NavbarUserProps {
  items: any[];
}

const NavbarUser: React.FC<NavbarUserProps> = ({ items }) => {
  const { setTheme, theme } = useTheme();
  const { language, setLanguage } = useLanguageStore();
  const router = useRouter();
  const params = useParams();
  const { user } = useUser();
  const { signOut } = useClerk();

  const handleLanguageChange = (lang: "en" | "vi") => {
    setLanguage(lang);
    router.refresh();
  };

  const languages = [
    { code: "en" as const, label: "English", flag: "🇺🇸" },
    { code: "vi" as const, label: "Tiếng Việt", flag: "🇻🇳" },
  ];

  const currentLanguage = languages.find((lang) => lang.code === language);

  const glassEffect =
    "bg-white/70 dark:bg-black/70 backdrop-blur-md backdrop-saturate-150 border border-white/30 dark:border-white/10 shadow-lg";

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="ml-auto">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "flex items-center gap-2 rounded-xl h-10 px-2 transition-all duration-300",
              glassEffect,
              "hover:bg-white/90 dark:hover:bg-black/90"
            )}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={user?.imageUrl}
                alt={user?.fullName || "User"}
              />
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {getInitials(user?.fullName)}
              </AvatarFallback>
            </Avatar>
            <ChevronDown className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className={cn(
            "rounded-xl p-1 mt-2 w-56 z-50",
            "bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl",
            "border border-white/20 dark:border-neutral-700/50 shadow-2xl"
          )}
        >
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="font-semibold">{user?.fullName || "User"}</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {user?.emailAddresses[0]?.emailAddress}
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Language Submenu */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="rounded-lg">
              <Languages className="mr-2 h-4 w-4" />
              <span>Language</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent
              sideOffset={4}
              alignOffset={-5}
              className={cn(
                "rounded-xl !z-[100]",
                "bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl",
                "border border-white/20 dark:border-neutral-700/50 shadow-lg"
              )}
            >
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={cn(
                    "rounded-lg cursor-pointer",
                    language === lang.code &&
                      "bg-primary/10 text-primary font-semibold"
                  )}
                >
                  <span className="mr-2">{lang.flag}</span>
                  <span>{lang.label}</span>
                  {language === lang.code && (
                    <span className="ml-auto text-xs">✓</span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {/* Theme Submenu */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="rounded-lg">
              {theme === "dark" ? (
                <Moon className="mr-2 h-4 w-4" />
              ) : theme === "light" ? (
                <Sun className="mr-2 h-4 w-4" />
              ) : (
                <Monitor className="mr-2 h-4 w-4" />
              )}
              <span>Theme</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent
              sideOffset={4}
              alignOffset={-5}
              className={cn(
                "rounded-xl !z-[100]",
                "bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl",
                "border border-white/20 dark:border-neutral-700/50 shadow-lg"
              )}
            >
              <DropdownMenuItem
                onClick={() => setTheme("light")}
                className={cn(
                  "rounded-lg cursor-pointer",
                  theme === "light" &&
                    "bg-primary/10 text-primary font-semibold"
                )}
              >
                <Sun className="mr-2 h-4 w-4" />
                <span>Light</span>
                {theme === "light" && (
                  <span className="ml-auto text-xs">✓</span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme("dark")}
                className={cn(
                  "rounded-lg cursor-pointer",
                  theme === "dark" && "bg-primary/10 text-primary font-semibold"
                )}
              >
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark</span>
                {theme === "dark" && <span className="ml-auto text-xs">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme("system")}
                className={cn(
                  "rounded-lg cursor-pointer",
                  theme === "system" &&
                    "bg-primary/10 text-primary font-semibold"
                )}
              >
                <Monitor className="mr-2 h-4 w-4" />
                <span>System</span>
                {theme === "system" && (
                  <span className="ml-auto text-xs">✓</span>
                )}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          {}
          <DropdownMenuItem asChild>
            <Link
              href={`/${params.storeId}/profile`}
              className="rounded-lg cursor-pointer"
            >
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>

          {/* Sign Out */}
          <DropdownMenuItem
            onClick={() => signOut({ redirectUrl: window.location.origin + "/sign-in" })}
            className="rounded-lg cursor-pointer text-red-600 dark:text-red-400"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default NavbarUser;
