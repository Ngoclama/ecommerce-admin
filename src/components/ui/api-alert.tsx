"use client";

import { Copy, Server } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ApiAlertProps {
  title: string;
  description: string;
  variant: "public" | "admin" | "user";
}

const textMap: Record<ApiAlertProps["variant"], string> = {
  public: "Public API",
  admin: "Admin API",
  user: "User API",
};

const variantMap: Record<ApiAlertProps["variant"], string> = {
  public: "secondary",
  admin: "destructive",
  user: "default",
};

export const ApiAlert: React.FC<ApiAlertProps> = ({
  title,
  description,
  variant,
}) => {
  const onCopy = () => {
    navigator.clipboard.writeText(description);
    toast.success("API key copied to clipboard");
  };

  return (
    <div className="pt-6">
      <Alert>
        <Server className="h-4 w-4" />
        <AlertTitle className="flex items-center gap-2">
          {title}
          <Badge>{textMap[variant]}</Badge>
        </AlertTitle>
        <AlertDescription className="mt-4 justify-between flex items-center">
          <code className="relative rounded bg-muted px[0.3rem] py[0.2 rem] font-mono text-sm font-semibold">
            {description}
          </code>
          <Button size="sm" variant="outline" onClick={onCopy}>
            <Copy className="h-4 w-4" />
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
};
