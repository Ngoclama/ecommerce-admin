"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { toast } from "sonner";
import { handleError } from "@/lib/error-handler";
import { Trash, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { AlertModal } from "@/components/modals/alert-modal";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/hooks/use-translation";

const formSchema = z.object({
  status: z.enum([
    "PENDING",
    "APPROVED",
    "REJECTED",
    "PROCESSING",
    "COMPLETED",
    "CANCELLED",
  ]),
  refundAmount: z.number().min(0).optional().nullable(),
  refundMethod: z.string().optional().nullable(),
});

type ReturnFormValues = z.infer<typeof formSchema>;

interface ReturnFormProps {
  initialData: any;
}

export const ReturnForm: React.FC<ReturnFormProps> = ({ initialData }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const title = t("forms.return.title");
  const description = t("forms.return.description");
  const action = t("forms.saveChanges");

  const form = useForm<ReturnFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: initialData?.status || "PENDING",
      refundAmount: initialData?.refundAmount || 0,
      refundMethod: initialData?.refundMethod || null,
    },
  });

  const onSubmit = async (data: ReturnFormValues) => {
    try {
      setIsLoading(true);
      await axios.patch(
        `/api/${params.storeId}/returns/${params.returnId}`,
        data
      );
      toast.success(t("forms.return.updated"));
      router.refresh();
      router.push(`/${params.storeId}/returns`);
    } catch (error) {
      handleError(error, t("forms.return.error") || "Có lỗi xảy ra khi cập nhật đơn trả hàng.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      await axios.delete(`/api/${params.storeId}/returns/${params.returnId}`);
      toast.success(t("forms.return.deleted"));
      router.push(`/${params.storeId}/returns`);
      router.refresh();
    } catch (error) {
      handleError(error, t("forms.return.errorDelete") || "Không thể xóa đơn trả hàng.");
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleDelete}
        loading={isLoading}
      />
      <div className="flex items-center justify-between">
        <Heading title={title} description={description} />
        {initialData && (
          <Button
            disabled={isLoading}
            variant="destructive"
            size="icon"
            onClick={() => setIsOpen(true)}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("forms.return.status")}</FormLabel>
                  <Select
                    disabled={isLoading}
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          defaultValue={field.value}
                          placeholder={t("forms.return.statusPlaceholder")}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PENDING">PENDING</SelectItem>
                      <SelectItem value="APPROVED">APPROVED</SelectItem>
                      <SelectItem value="REJECTED">REJECTED</SelectItem>
                      <SelectItem value="PROCESSING">PROCESSING</SelectItem>
                      <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                      <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="refundAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("forms.return.refundAmount")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      disabled={isLoading}
                      placeholder={t("forms.return.refundAmountPlaceholder")}
                      {...field}
                      value={field.value || ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? parseFloat(e.target.value) : 0
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="refundMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("forms.return.refundMethod")}</FormLabel>
                  <Select
                    disabled={isLoading}
                    onValueChange={field.onChange}
                    value={field.value || ""}
                    defaultValue={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t(
                            "forms.return.refundMethodPlaceholder"
                          )}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ORIGINAL">
                        {t("forms.return.originalPayment")}
                      </SelectItem>
                      <SelectItem value="STORE_CREDIT">
                        {t("forms.return.storeCredit")}
                      </SelectItem>
                      <SelectItem value="BANK_TRANSFER">
                        {t("forms.return.bankTransfer")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button disabled={isLoading} className="ml-auto" type="submit">
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? t("forms.return.saving") : action}
          </Button>
        </form>
      </Form>
    </>
  );
};
