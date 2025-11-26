"use client";

import * as z from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";

import { Order, OrderStatus } from "@prisma/client";

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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/hooks/use-translation";

const formSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  shippingMethod: z.string().nullable().optional(),
  shippingCost: z.union([z.number().min(0), z.null()]).optional(),
  trackingNumber: z.string().nullable().optional(),
  paymentMethod: z.string().nullable().optional(),
  transactionId: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  city: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  customerNote: z.string().nullable().optional(),
  adminNote: z.string().nullable().optional(),
});

type OrderFormValues = z.infer<typeof formSchema>;

interface OrderFormProps {
  initialData: Order;
}

export const OrderForm: React.FC<OrderFormProps> = ({ initialData }) => {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const title = t("forms.order.title");
  const description = t("forms.order.description");
  const toastMessage = t("forms.order.updated");
  const action = t("forms.saveChanges");

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      status: initialData.status,
      shippingMethod: initialData.shippingMethod ?? null,
      shippingCost: initialData.shippingCost
        ? Number(initialData.shippingCost)
        : null,
      trackingNumber: initialData.trackingNumber ?? null,
      paymentMethod: initialData.paymentMethod ?? null,
      transactionId: initialData.transactionId ?? null,
      email: initialData.email ?? null,
      city: initialData.city ?? null,
      postalCode: initialData.postalCode ?? null,
      country: initialData.country ?? null,
      customerNote: initialData.customerNote ?? null,
      adminNote: initialData.adminNote ?? null,
    },
  });

  const onSubmit = async (data: OrderFormValues) => {
    try {
      setLoading(true);
      await axios.patch(
        `/api/${params.storeId}/orders/${params.orderId}`,
        data
      );
      router.refresh();
      router.push(`/${params.storeId}/orders`);
      toast.success(toastMessage);
    } catch (error: any) {
      toast.error(t("forms.order.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading title={title} description={description} />
      </div>
      <Separator className="my-4" />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 w-full"
        >
          <div className="space-y-6">
            {/* Order Status */}
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("forms.order.status")}</FormLabel>
                    <Select
                      disabled={loading}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("forms.order.statusPlaceholder")}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(OrderStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("forms.order.paymentMethod")}</FormLabel>
                    <FormControl>
                      <Input
                        disabled={loading}
                        placeholder={t("forms.order.paymentMethodPlaceholder")}
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Shipping Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                {t("forms.order.shippingInformation")}
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="shippingMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("forms.order.shippingMethod")}</FormLabel>
                      <FormControl>
                        <Input
                          disabled={loading}
                          placeholder={t(
                            "forms.order.shippingMethodPlaceholder"
                          )}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="trackingNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("forms.order.trackingNumber")}</FormLabel>
                      <FormControl>
                        <Input
                          disabled={loading}
                          placeholder={t(
                            "forms.order.trackingNumberPlaceholder"
                          )}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shippingCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("forms.order.shippingCost")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          disabled={loading}
                          placeholder={t("forms.order.shippingCostPlaceholder")}
                          {...field}
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseFloat(e.target.value) : null
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Customer Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                {t("forms.order.customerInformation")}
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("forms.order.email")}</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          disabled={loading}
                          placeholder={t("forms.order.emailPlaceholder")}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("forms.order.city")}</FormLabel>
                      <FormControl>
                        <Input
                          disabled={loading}
                          placeholder={t("forms.order.cityPlaceholder")}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("forms.order.postalCode")}</FormLabel>
                      <FormControl>
                        <Input
                          disabled={loading}
                          placeholder={t("forms.order.postalCodePlaceholder")}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("forms.order.country")}</FormLabel>
                      <FormControl>
                        <Input
                          disabled={loading}
                          placeholder={t("forms.order.countryPlaceholder")}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Notes */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                {t("forms.order.notes")}
              </h3>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="customerNote"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("forms.order.customerNote")}</FormLabel>
                      <FormControl>
                        <Textarea
                          disabled={loading}
                          placeholder={t("forms.order.customerNotePlaceholder")}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="adminNote"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("forms.order.adminNote")}</FormLabel>
                      <FormControl>
                        <Textarea
                          disabled={loading}
                          placeholder={t("forms.order.adminNotePlaceholder")}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          <Button disabled={loading} className="ml-auto" type="submit">
            {action}
          </Button>
        </form>
      </Form>
    </>
  );
};
