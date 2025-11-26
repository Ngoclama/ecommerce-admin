"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Color } from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, Trash } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { AlertModal } from "@/components/modals/alert-modal";
import { ColorViewModal } from "@/components/modals/color-view";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/use-translation";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  value: z
    .string()
    .min(1, "Value is required")
    .regex(/^#/, {
      message: "String must be a valid hex code (e.g., #FF0000)",
    })
    .transform((val) => val?.trim() || "#000000"), // Nếu rỗng thì mặc định màu đen
});

type ColorFormValues = z.infer<typeof formSchema>;

interface ColorFormProps {
  initialData: Color | null;
}

export const ColorForm: React.FC<ColorFormProps> = ({ initialData }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const title = initialData ? t("forms.color.title") : t("forms.color.titleCreate");
  const description = initialData ? t("forms.color.description") : t("forms.color.descriptionCreate");
  const action = initialData ? t("forms.saveChanges") : t("forms.create");

  const form = useForm<ColorFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          name: initialData.name || "",
          value: initialData.value || "#000000",
        }
      : {
          name: "",
          value: "#000000", // Mặc định màu đen nếu tạo mới
        },
  });

  const onSubmit = async (data: ColorFormValues) => {
    try {
      setIsLoading(true);
      const endpoint = initialData
        ? `/api/${params.storeId}/colors/${params.colorId}`
        : `/api/${params.storeId}/colors`;
      const method = initialData ? "PATCH" : "POST";

      // Đảm bảo value luôn có giá trị, mặc định là #000000
      const submitData = {
        ...data,
        value: data.value?.trim() || "#000000",
      };

      await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      toast.success(initialData ? t("forms.color.updated") : t("forms.color.created"));
      router.refresh();
      router.push(`/${params.storeId}/colors`);
    } catch (error) {
      toast.error(t("actions.somethingWentWrong"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      await fetch(`/api/${params.storeId}/colors/${params.colorId}`, {
        method: "DELETE",
      });
      toast.success(t("forms.color.deleted"));
      router.refresh();
      router.push(`/${params.storeId}/colors`);
    } catch (error) {
      toast.error(t("forms.color.errorDelete"));
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

      {/* View Modal - chỉ hiển thị khi có initialData và colorId hợp lệ */}
      {initialData && params.colorId && params.colorId !== "new" && (
        <ColorViewModal
          isOpen={isViewOpen}
          onClose={() => setIsViewOpen(false)}
          colorId={params.colorId as string}
          storeId={params.storeId as string}
        />
      )}

      <div className="flex items-center justify-between px-6 py-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-xl shadow-md hover:shadow-lg transition-all duration-300">
        <Heading title={title} description={description} />
        <div className="flex items-center gap-2">
          {initialData && (
            <Button
              disabled={isLoading}
              variant="outline"
              size="icon"
              onClick={() => setIsViewOpen(true)}
              className="rounded-xl hover:scale-105 transition-all"
            >
              <Eye className="h-5 w-5" />
            </Button>
          )}
          {initialData && (
            <Button
              disabled={isLoading}
              variant="destructive"
              size="icon"
              onClick={() => setIsOpen(true)}
              className="rounded-xl hover:scale-105 transition-all"
            >
              <Trash className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      <Separator className="my-5" />

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 w-full max-w-3xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col gap-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/60 dark:bg-neutral-900/60 shadow-md backdrop-blur-lg p-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("forms.color.name")}</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        placeholder={t("forms.color.namePlaceholder")}
                        {...field}
                        className="rounded-xl border-neutral-300 dark:border-neutral-700 focus-visible:ring-blue-500/50"
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
                    <FormLabel>{t("forms.color.value")}</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-4">
                        <div className="relative h-10 w-10 rounded-full overflow-hidden shadow-sm border cursor-pointer hover:scale-110 transition-transform">
                          <input
                            type="color"
                            disabled={isLoading}
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            className="absolute -top-2 -left-2 h-16 w-16 p-0 border-0 cursor-pointer opacity-0"
                            title={t("forms.color.chooseColor")}
                          />
                          <div
                            className="w-full h-full pointer-events-none"
                            style={{ backgroundColor: field.value }}
                          />
                        </div>

                        {/* Hex Code Input */}
                        <Input
                          disabled={isLoading}
                          placeholder={t("forms.color.valuePlaceholder")}
                          {...field}
                          className="rounded-xl border-neutral-300 dark:border-neutral-700 focus-visible:ring-blue-500/50 uppercase font-mono"
                          maxLength={7}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button
                disabled={isLoading}
                type="submit"
                className="rounded-xl px-8"
              >
                {isLoading ? t("forms.processing") : action}
              </Button>
            </div>
          </motion.div>
        </form>
      </Form>
    </>
  );
};
