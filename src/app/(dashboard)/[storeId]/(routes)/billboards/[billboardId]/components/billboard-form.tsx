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
import { Billboard } from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, Trash } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { handleError } from "@/lib/error-handler";
import { AlertModal } from "@/components/modals/alert-modal";
import { BillboardViewModal } from "@/components/modals/billboard-view";
import ImageUpload from "@/components/ui/image-upload";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/use-translation";

const formSchema = z.object({
  label: z.string().min(1, "Billboard label is required"),
  imageUrl: z.string().min(1, "Image URL must be valid"),
});

type BillboardFormValues = z.infer<typeof formSchema>;

interface BillboardFormProps {
  initialData: Billboard | null;
}

export const BillboardForm: React.FC<BillboardFormProps> = ({
  initialData,
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const title = initialData ? t("forms.billboard.title") : t("forms.billboard.titleCreate");
  const description = initialData
    ? t("forms.billboard.description")
    : t("forms.billboard.descriptionCreate");
  const action = initialData ? t("forms.saveChanges") : t("forms.create");

  const form = useForm<BillboardFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      label: "",
      imageUrl: "",
    },
  });

  const onSubmit = async (data: BillboardFormValues) => {
    try {
      setIsLoading(true);

      const endpoint = initialData
        ? `/api/${params.storeId}/billboards/${params.billboardId}`
        : `/api/${params.storeId}/billboards`;

      const method = initialData ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          (errorData as { message?: string })?.message ||
            (initialData
              ? t("forms.billboard.updated")
              : t("forms.billboard.created"))
        );
      }

      toast.success(initialData ? t("forms.billboard.updated") : t("forms.billboard.created"));
      router.refresh();
      router.push(`/${params.storeId}/billboards`);
    } catch (error) {
      handleError(error, t("actions.somethingWentWrong") || "Có lỗi xảy ra.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      await fetch(`/api/${params.storeId}/billboards/${params.billboardId}`, {
        method: "DELETE",
      });
      toast.success(t("forms.billboard.deleted"));
      router.push(`/${params.storeId}/billboards`);
      router.refresh();
    } catch (error) {
      toast.error(t("forms.billboard.errorDelete"));
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

      <BillboardViewModal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        billboardId={params.billboardId as string}
        storeId={params.storeId as string}
      />

      <div
        className="flex items-center justify-between px-6 py-4 
                 rounded-2xl border border-neutral-200 dark:border-neutral-800 
                 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-xl 
                 shadow-md hover:shadow-lg transition-all duration-300"
      >
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
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex flex-col gap-8 rounded-2xl border border-neutral-200 
                     dark:border-neutral-800 bg-white/60 dark:bg-neutral-900/60 
                     shadow-md backdrop-blur-lg p-8 transition-all hover:shadow-xl"
          >
            {/* Image Upload - ĐÃ SỬA LỖI Ở ĐÂY */}
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                    {t("forms.billboard.backgroundImage")}
                  </FormLabel>
                  <FormControl>
                    <ImageUpload
                      disabled={isLoading}
                      value={field.value ? [field.value] : []}
                      onChange={(urls) => {
                        if (Array.isArray(urls) && urls.length > 0 && urls[0]) {
                          field.onChange(urls[0]);
                        }
                      }}
                      onRemove={() => field.onChange("")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Label input */}
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                    {t("forms.billboard.label")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("forms.billboard.labelPlaceholder")}
                      disabled={isLoading}
                      {...field}
                      className="rounded-xl border border-neutral-300 dark:border-neutral-700 
                               focus-visible:ring-2 focus-visible:ring-blue-500/50 
                               focus-visible:border-blue-400 dark:focus-visible:ring-blue-400/50 
                               transition-all bg-white/80 dark:bg-neutral-800/80 backdrop-blur-md"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit button */}
            <div className="flex justify-end pt-4">
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  disabled={isLoading}
                  type="submit"
                  className="rounded-xl px-8"
                >
                  {isLoading ? t("forms.processing") : action}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </form>
      </Form>
    </>
  );
};
