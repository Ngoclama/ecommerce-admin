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
import { Size } from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, Trash } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { AlertModal } from "@/components/modals/alert-modal";
import { SizeViewModal } from "@/components/modals/size-view";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/use-translation";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  value: z.string().min(1, "Value is required"),
});

type SizeFormValues = z.infer<typeof formSchema>;

interface SizeFormProps {
  initialData: Size | null;
}

export const SizeForm: React.FC<SizeFormProps> = ({ initialData }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const title = initialData
    ? t("forms.size.title")
    : t("forms.size.titleCreate");
  const description = initialData
    ? t("forms.size.description")
    : t("forms.size.descriptionCreate");
  const action = initialData ? t("forms.saveChanges") : t("forms.create");

  const form = useForm<SizeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: "",
      value: "",
    },
  });

  const onSubmit = async (data: SizeFormValues) => {
    try {
      setIsLoading(true);
      const endpoint = initialData
        ? `/api/${params.storeId}/sizes/${params.sizeId}`
        : `/api/${params.storeId}/sizes`;
      const method = initialData ? "PATCH" : "POST";

      await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      toast.success(
        initialData ? t("forms.size.updated") : t("forms.size.created")
      );
      router.refresh();
      router.push(`/${params.storeId}/sizes`);
    } catch (error) {
      toast.error(t("actions.somethingWentWrong"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      await fetch(`/api/${params.storeId}/sizes/${params.sizeId}`, {
        method: "DELETE",
      });
      toast.success(t("forms.size.deleted"));
      router.refresh();
      router.push(`/${params.storeId}/sizes`);
    } catch (error) {
      toast.error(t("forms.size.errorDelete"));
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

      {/* View Modal - chỉ hiển thị khi có initialData và sizeId hợp lệ */}
      {initialData && params.sizeId && params.sizeId !== "new" && (
        <SizeViewModal
          isOpen={isViewOpen}
          onClose={() => setIsViewOpen(false)}
          sizeId={params.sizeId as string}
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
              {/* Name Input */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("forms.size.name")}</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        placeholder={t("forms.size.namePlaceholder")}
                        {...field}
                        className="rounded-xl border-neutral-300 dark:border-neutral-700 focus-visible:ring-blue-500/50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Value Input */}
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("forms.size.value")}</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        placeholder={t("forms.size.valuePlaceholder")}
                        {...field}
                        className="rounded-xl border-neutral-300 dark:border-neutral-700 focus-visible:ring-blue-500/50"
                      />
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
