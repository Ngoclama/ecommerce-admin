"use client";

import dynamic from "next/dynamic";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Dynamic import với ssr: false để tránh hydration mismatch
const SignIn = dynamic(
  () => import("@clerk/nextjs").then((mod) => mod.SignIn),
  {
    ssr: false,
    loading: () => <div className="w-full">Loading...</div>,
  }
);

export default function Page() {
  const { resolvedTheme } = useTheme();
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Chỉ redirect khi đã load xong và đã đăng nhập
    if (isLoaded && isSignedIn) {
      router.replace("/");
    }
  }, [isSignedIn, isLoaded]); // Loại bỏ router khỏi dependency

  // Không render SignIn nếu đã đăng nhập (tránh warning)
  if (isLoaded && isSignedIn) {
    return <div className="w-full">Redirecting...</div>;
  }

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
      fallbackRedirectUrl="/"
    />
  );
}
