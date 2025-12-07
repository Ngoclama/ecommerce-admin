"use client";

import * as z from "zod";
import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { handleError } from "@/lib/error-handler";
import { Coupon } from "@prisma/client";
import { Trash, CalendarIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { AlertModal } from "@/components/modals/alert-modal";
import { format } from "date-fns";
import { useTranslation } from "@/hooks/use-translation";

import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Code can only contain letters, numbers, hyphens, and underscores"
    )
    .refine(
      (val) => /[a-zA-Z]/.test(val),
      "Code must contain at least one letter (not only numbers)"
    ),
  value: z.coerce.number().min(1, "Value must be greater than 0"),
  type: z.string().min(1, "Type is required"),
  expiresAt: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true; // Optional field
        const selectedDate = new Date(val);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selectedDate >= today;
      },
      {
        message: "Expiration date cannot be in the past",
      }
    ),
});

type CouponFormValues = z.infer<typeof formSchema>;

interface CouponFormProps {
  initialData: Coupon | null;
}

export const CouponForm: React.FC<CouponFormProps> = ({ initialData }) => {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const title = initialData
    ? t("forms.coupon.title")
    : t("forms.coupon.titleCreate");
  const description = initialData
    ? t("forms.coupon.description")
    : t("forms.coupon.descriptionCreate");
  const toastMessage = initialData
    ? t("forms.coupon.updated")
    : t("forms.coupon.created");
  const action = initialData ? t("forms.saveChanges") : t("forms.create");

  const form = useForm<CouponFormValues>({
    resolver: zodResolver(formSchema) as Resolver<CouponFormValues>,
    defaultValues: initialData
      ? {
          ...initialData,
          value: parseFloat(String(initialData?.value)),
          expiresAt: initialData.expiresAt
            ? format(new Date(initialData.expiresAt), "yyyy-MM-dd")
            : "",
        }
      : {
          code: "",
          value: 1, // Mặc định là 1 thay vì 0 để tránh lỗi validation
          type: "PERCENT",
          expiresAt: "",
        },
  });

  const onSubmit = async (data: CouponFormValues) => {
    try {
      setLoading(true);

      // Validate ngày quá khứ (double check)
      if (data.expiresAt) {
        const selectedDate = new Date(data.expiresAt);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) {
          toast.error(t("forms.coupon.expirationPastError"));
          setLoading(false);
          return;
        }
      }

      // Đảm bảo value luôn có giá trị hợp lệ (ít nhất là 1)
      const finalValue = data.value && data.value > 0 ? data.value : 1;

      const payload = {
        ...data,
        value: finalValue,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      };

      if (initialData) {
        await axios.patch(
          `/api/${params.storeId}/coupons/${params.couponId}`,
          payload
        );
      } else {
        await axios.post(`/api/${params.storeId}/coupons`, payload);
      }
      router.refresh();
      router.push(`/${params.storeId}/coupons`);
      toast.success(toastMessage);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      // Xử lý lỗi 409 (Conflict - trùng tên)
      if (error.response?.status === 409 || error.code === "ERR_BAD_REQUEST") {
        let errorMessage = t("forms.coupon.codeExists");

        try {
          const errorData = error.response?.data;

          // Kiểm tra nếu errorData tồn tại và không rỗng
          if (errorData) {
            // Nếu là string, dùng trực tiếp
            if (typeof errorData === "string" && errorData.trim()) {
              errorMessage = errorData;
            }
            // Nếu là object có field error
            else if (
              typeof errorData === "object" &&
              Object.keys(errorData).length > 0
            ) {
              if (errorData.error) {
                errorMessage = errorData.error;
              } else {
                // Nếu không có field error, thử stringify
                const stringified = JSON.stringify(errorData);
                if (stringified !== "{}") {
                  errorMessage = stringified;
                }
              }
            }
            // Nếu có data nhưng không phải string hoặc object
            else if (errorData !== null && errorData !== undefined) {
              errorMessage = String(errorData);
            }
          }
        } catch (parseError) {
          // Ignore parse errors, use default message
        }

        toast.error(errorMessage, {
          duration: 6000,
        });
      } else {
        handleError(error, t("actions.somethingWentWrong") || "Có lỗi xảy ra.");
      }
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(`/api/${params.storeId}/coupons/${params.couponId}`);
      router.refresh();
      router.push(`/${params.storeId}/coupons`);
      toast.success(t("forms.coupon.deleted"));
    } catch (error) {
      handleError(
        error,
        t("forms.coupon.errorDelete") || "Không thể xóa mã giảm giá."
      );
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

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
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("forms.coupon.code")}</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder={t("forms.coupon.codePlaceholder")}
                      {...field}
                      onChange={(e) => {
                        // Chỉ cho phép chữ cái, số, dấu gạch ngang và underscore
                        const sanitized = e.target.value.replace(
                          /[^a-zA-Z0-9_-]/g,
                          ""
                        );
                        field.onChange(sanitized);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("forms.coupon.value")}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        disabled={loading}
                        placeholder={t("forms.coupon.valuePlaceholder")}
                        {...field}
                        value={field.value ? String(field.value) : ""}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                      {/* Hiển thị format giá trị nếu là FIXED */}
                      {field.value && form.getValues("type") === "FIXED" && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary pointer-events-none">
                          {new Intl.NumberFormat("vi-VN").format(
                            Number(field.value)
                          )}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("forms.coupon.type")}</FormLabel>
                  <Select
                    disabled={loading}
                    onValueChange={field.onChange}
                    value={field.value as string}
                    defaultValue={field.value as string}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          defaultValue={field.value as string}
                          placeholder={t("forms.coupon.typePlaceholder")}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PERCENT">
                        {t("forms.coupon.percent")}
                      </SelectItem>
                      <SelectItem value="FIXED">
                        {t("forms.coupon.fixed")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expiresAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("forms.coupon.expiresAt")}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="date"
                        disabled={loading}
                        min={new Date().toISOString().split("T")[0]} // Chặn chọn ngày quá khứ
                        {...field}
                        onChange={(e) => {
                          const selectedDate = e.target.value;
                          if (selectedDate) {
                            const date = new Date(selectedDate);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            if (date < today) {
                              toast.error(
                                t("forms.coupon.expirationPastError")
                              );
                              return;
                            }
                          }
                          field.onChange(e);
                        }}
                      />
                      <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </FormControl>
                  <FormDescription>
                    {t("forms.coupon.expiresDescription")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button disabled={loading} className="ml-auto" type="submit">
            {action}
          </Button>
        </form>
      </Form>
    </>
  );
};
