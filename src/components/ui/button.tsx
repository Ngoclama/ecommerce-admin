import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-300 ease-in-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:scale-[1.02] active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gray-400 text-white hover:bg-gray-900 hover:shadow-lg hover:shadow-gray-400/30 transition-all duration-300 ease-in-out",
        destructive:
          "bg-red-500 text-white hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300 ease-in-out focus-visible:ring-red-500/20 dark:focus-visible:ring-red-500/40 dark:bg-red-600 dark:hover:bg-red-700",
        outline:
          "border border-gray-400 bg-transparent text-gray-600 hover:bg-gray-900 hover:text-white hover:border-gray-900 shadow-xs hover:shadow-md hover:shadow-gray-400/20 transition-all duration-300 ease-in-out dark:border-gray-500 dark:text-gray-300 dark:hover:bg-gray-900 dark:hover:text-white dark:hover:border-gray-900",
        secondary:
          "bg-gray-300 text-gray-700 hover:bg-gray-900 hover:text-white hover:shadow-md hover:shadow-gray-400/20 transition-all duration-300 ease-in-out dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-900",
        ghost:
          "hover:bg-gray-200 hover:text-gray-800 text-gray-600 transition-all duration-300 ease-in-out dark:hover:bg-gray-700 dark:hover:text-gray-100 dark:text-gray-300",
        link: "text-gray-600 underline-offset-4 hover:underline hover:text-gray-800 transition-colors duration-300 ease-in-out dark:text-gray-300 dark:hover:text-gray-100",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
