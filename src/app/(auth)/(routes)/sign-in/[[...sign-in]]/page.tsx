"use client";

import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";

export default function Page() {
  const { resolvedTheme } = useTheme();

  return (
    <SignIn
      routing="hash"
      appearance={{
        baseTheme: resolvedTheme === "dark" ? dark : undefined,
        elements: {
          rootBox: "w-full",
          card: "shadow-lg rounded-xl",
          headerTitle: "hidden",
          headerSubtitle: "hidden",
          socialButtonsBlockButton: "w-full",
          formButtonPrimary: "bg-primary hover:bg-primary/90 text-white",
          formFieldInput:
            "border-neutral-200 dark:border-neutral-700 focus:border-primary focus:ring-primary",
          formFieldLabel: "text-neutral-700 dark:text-neutral-300",
          footerActionLink: "text-primary hover:text-primary/80",
          identityPreviewEditButton: "text-primary",
          formResendCodeLink: "text-primary",
          navbar: "hidden",
          navbarButton: "hidden",
          navbarButtons: "hidden",
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
  );
}
