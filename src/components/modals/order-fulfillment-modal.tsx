"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import { Truck, Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  status: z.enum([
    "PENDING",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ]),
  shippingMethod: z.string().optional().nullable(),
  trackingNumber: z.string().optional().nullable(),
});

interface OrderFulfillmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  currentStatus: string;
  initialData?: {
    shippingMethod: string | null;
    trackingNumber: string | null;
  };
}

export const OrderFulfillmentModal: React.FC<OrderFulfillmentModalProps> = ({
  isOpen,
  onClose,
  orderId,
  currentStatus,
  initialData,
}) => {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: currentStatus as any,
      shippingMethod: initialData?.shippingMethod || null,
      trackingNumber: initialData?.trackingNumber || null,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      await axios.patch(`/api/${params.storeId}/orders/${orderId}`, values);
      toast.success(t("actions.orderStatusUpdated"));
      router.refresh();
      onClose();
    } catch (error) {
      toast.error(t("actions.failedToUpdateOrder"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            {t("actions.updateOrderStatus")}
          </DialogTitle>
          <DialogDescription>
            {t("actions.updateOrderStatusDescription")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("actions.orderStatus")}</FormLabel>
                  <Select
                    disabled={isLoading}
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("actions.selectStatus")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PENDING">
                        {t("actions.pending")}
                      </SelectItem>
                      <SelectItem value="PROCESSING">
                        {t("actions.processingStatus")}
                      </SelectItem>
                      <SelectItem value="SHIPPED">
                        {t("actions.shipped")}
                      </SelectItem>
                      <SelectItem value="DELIVERED">
                        {t("actions.delivered")}
                      </SelectItem>
                      <SelectItem value="CANCELLED">
                        {t("actions.cancelled")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Shipping Method */}
            <FormField
              control={form.control}
              name="shippingMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("actions.shippingMethod")}</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isLoading}
                      placeholder={t("actions.shippingMethodPlaceholder")}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tracking Number */}
            <FormField
              control={form.control}
              name="trackingNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("actions.trackingNumber")}</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isLoading}
                      placeholder={t("actions.trackingNumberPlaceholder")}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                disabled={isLoading}
                variant="outline"
                onClick={onClose}
                type="button"
              >
                {t("actions.cancel")}
              </Button>
              <Button disabled={isLoading} type="submit">
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t("actions.save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
