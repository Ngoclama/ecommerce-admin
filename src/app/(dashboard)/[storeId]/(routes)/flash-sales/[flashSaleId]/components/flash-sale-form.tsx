"use client";

import * as z from "zod";
import axios from "axios";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import { Trash, Loader2 } from "lucide-react";
import { format } from "date-fns";

import { Separator } from "@/components/ui/separator";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AlertModal } from "@/components/modals/alert-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery } from "@tanstack/react-query";
import { MultiSelect, Option } from "@/components/ui/multi-select";
import { useTranslation } from "@/hooks/use-translation";

const formSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional().nullable(),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    discountType: z.enum(["PERCENT", "FIXED"]),
    discountValue: z.number().min(0, "Discount value must be positive"),
    productIds: z.array(z.string()).min(1, "At least one product is required"),
    isActive: z.boolean(),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end > start;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  )
  .refine(
    (data) => {
      if (data.discountType === "PERCENT") {
        return data.discountValue <= 100;
      }
      return true;
    },
    {
      message: "Percentage discount cannot exceed 100%",
      path: ["discountValue"],
    }
  );

type FlashSaleFormValues = z.infer<typeof formSchema>;

interface FlashSaleFormProps {
  initialData: any;
}

export const FlashSaleForm: React.FC<FlashSaleFormProps> = ({
  initialData,
}) => {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const title = initialData
    ? t("forms.flashSale.title")
    : t("forms.flashSale.titleCreate");
  const description = initialData
    ? t("forms.flashSale.description")
    : t("forms.flashSale.descriptionCreate");
  const toastMessage = initialData
    ? t("forms.flashSale.updated")
    : t("forms.flashSale.created");
  const action = initialData ? t("forms.saveChanges") : t("forms.create");

  // Fetch products for multi-select
  const { data: products } = useQuery({
    queryKey: ["products", params.storeId],
    queryFn: async () => {
      const res = await axios.get(`/api/${params.storeId}/products`);
      return res.data;
    },
  });

  const form = useForm<FlashSaleFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          description: initialData.description || "",
          startDate: format(
            new Date(initialData.startDate),
            "yyyy-MM-dd'T'HH:mm"
          ),
          endDate: format(new Date(initialData.endDate), "yyyy-MM-dd'T'HH:mm"),
          discountType: initialData.discountType,
          discountValue: initialData.discountValue,
          productIds:
            initialData.flashSaleProducts?.map((fp: any) => fp.productId) || [],
          isActive: initialData.isActive,
        }
      : {
          name: "",
          description: "",
          startDate: "",
          endDate: "",
          discountType: "PERCENT",
          discountValue: 0,
          productIds: [],
          isActive: true,
        },
  });

  const onSubmit = async (data: FlashSaleFormValues) => {
    try {
      setLoading(true);
      if (initialData) {
        await axios.patch(
          `/api/${params.storeId}/flash-sales/${params.flashSaleId}`,
          data
        );
      } else {
        await axios.post(`/api/${params.storeId}/flash-sales`, data);
      }
      router.refresh();
      router.push(`/${params.storeId}/flash-sales`);
      toast.success(toastMessage);
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("forms.flashSale.error"));
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(
        `/api/${params.storeId}/flash-sales/${params.flashSaleId}`
      );
      router.refresh();
      router.push(`/${params.storeId}/flash-sales`);
      toast.success(t("forms.flashSale.deleted"));
    } catch (error) {
      toast.error(t("forms.flashSale.error"));
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const productOptions: Option[] = Array.isArray(products)
    ? products.map((product: any) => ({
        label: product.name || "",
        value: product.id || "",
      }))
    : [];

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onDelete}
        loading={loading}
      />
      <div className="flex items-center justify-between">
        <Heading title={title} description={description} />
        {initialData && (
          <Button
            disabled={loading}
            variant="destructive"
            size="sm"
            onClick={() => setOpen(true)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Separator />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 w-full"
        >
          <div className="grid grid-cols-3 gap-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("forms.flashSale.name")}</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder={t("forms.flashSale.namePlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="discountType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("forms.flashSale.discountType")}</FormLabel>
                  <Select
                    disabled={loading}
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          defaultValue={field.value}
                          placeholder={t(
                            "forms.flashSale.discountTypePlaceholder"
                          )}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PERCENT">
                        {t("forms.flashSale.percentage")}
                      </SelectItem>
                      <SelectItem value="FIXED">
                        {t("forms.flashSale.fixed")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="discountValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("forms.flashSale.discountValue")}{" "}
                    {form.watch("discountType") === "PERCENT" ? "(%)" : "($)"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      disabled={loading}
                      placeholder={t(
                        "forms.flashSale.discountValuePlaceholder"
                      )}
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                      value={field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("forms.flashSale.startDate")}</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      disabled={loading}
                      {...field}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("forms.flashSale.endDate")}</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      disabled={loading}
                      {...field}
                      min={
                        form.watch("startDate") ||
                        new Date().toISOString().slice(0, 16)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>{t("forms.flashSale.active")}</FormLabel>
                    <FormDescription>
                      {t("forms.flashSale.activeDescription")}
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="col-span-3">
                  <FormLabel>{t("forms.flashSale.descriptionField")}</FormLabel>
                  <FormControl>
                    <Textarea
                      disabled={loading}
                      placeholder={t("forms.flashSale.descriptionPlaceholder")}
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
              name="productIds"
              render={({ field }) => (
                <FormItem className="col-span-3">
                  <FormLabel>{t("forms.flashSale.products")}</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={productOptions}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      placeholder={t("forms.flashSale.productsPlaceholder")}
                      variant="inverted"
                      maxCount={5}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("forms.flashSale.productsDescription")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button disabled={loading} className="ml-auto" type="submit">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {action}
          </Button>
        </form>
      </Form>
    </>
  );
};
