"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface CopperLoadingProps {
  color?: string;
  size?: number;
  className?: string;
}

export const CopperLoading: React.FC<CopperLoadingProps> = ({
  color = "#111111",
  size = 40,
  className,
}) => {
  return (
    <div
      className={cn("flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-spin"
      >
        <circle
          cx="20"
          cy="20"
          r="18"
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="28 100"
          opacity="0.3"
        />
        <circle
          cx="20"
          cy="20"
          r="18"
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="28 100"
          strokeDashoffset="14"
        >
          <animate
            attributeName="stroke-dasharray"
            values="28 100;85 100;28 100"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </div>
  );
};
