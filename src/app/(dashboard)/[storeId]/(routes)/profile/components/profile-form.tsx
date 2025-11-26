"use client";

import { UserProfile } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import { Heading } from "@/components/ui/heading";
import { useTranslation } from "@/hooks/use-translation";

interface ProfileFormProps {
  initialData?: any;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ initialData }) => {
  const { resolvedTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      <div>
        <Heading
          title={t("profile.title") || "User Profile"}
          description={t("profile.description") || "Manage your account settings and preferences"}
        />
      </div>

      <div className="w-full">
        <UserProfile
          appearance={{
            baseTheme: resolvedTheme === "dark" ? dark : undefined,
            elements: {
              rootBox: "w-full",
              card: "shadow-lg rounded-xl border border-white/20 dark:border-neutral-700/50",
              navbar: "bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl",
              navbarButton: "hover:bg-neutral-100 dark:hover:bg-neutral-800",
              page: "bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl",
              headerTitle: "text-2xl font-bold",
              headerSubtitle: "text-neutral-600 dark:text-neutral-400",
              profileSection: "bg-transparent",
              profileSectionTitle: "text-lg font-semibold",
              profileSectionContent: "bg-transparent",
              formButtonPrimary:
                "bg-primary hover:bg-primary/90 text-white",
              formFieldInput:
                "border-neutral-200 dark:border-neutral-700 focus:border-primary focus:ring-primary",
              formFieldLabel: "text-neutral-700 dark:text-neutral-300",
              avatarBox: "rounded-full",
              avatarImage: "rounded-full",
            },
            variables: {
              colorPrimary: "#0F172A",
              colorBackground: "#F8FAFC",
              colorText: "#0F172A",
              colorInputBackground: "#FFFFFF",
              colorInputText: "#0F172A",
            },
          }}
        />
      </div>
    </div>
  );
};

