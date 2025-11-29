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
import { Category, Billboard } from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, Trash } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { AlertModal } from "@/components/modals/alert-modal";
import { CategoryViewModal } from "@/components/modals/category-view";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/use-translation";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  billboardId: z.string().min(1, "Billboard is required"),
  parentId: z.string().nullable().optional(),
});

type CategoryFormValues = z.infer<typeof formSchema>;

interface CategoryFormProps {
  initialData: Category | null;
  billboards: Billboard[];
  categories: Array<{ id: string; name: string; parentId: string | null }>;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  initialData,
  billboards,
  categories,
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const title = initialData
    ? t("forms.category.title")
    : t("forms.category.titleCreate");
  const description = initialData
    ? t("forms.category.description")
    : t("forms.category.descriptionCreate");
  const action = initialData ? t("forms.saveChanges") : t("forms.create");

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          name: initialData.name || "",
          billboardId: initialData.billboardId || "",
          parentId: initialData.parentId || null,
        }
      : {
          name: "",
          billboardId: "",
          parentId: null,
        },
  });

  const onSubmit = async (data: CategoryFormValues) => {
    try {
      setIsLoading(true);
      const endpoint = initialData
        ? `/api/${params.storeId}/categories/${params.categoryId}`
        : `/api/${params.storeId}/categories`;
      const method = initialData ? "PATCH" : "POST";

      await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      toast.success(
        initialData ? t("forms.category.updated") : t("forms.category.created")
      );
      router.refresh();
      router.push(`/${params.storeId}/categories`);
    } catch (error) {
      toast.error(t("actions.somethingWentWrong"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      await fetch(`/api/${params.storeId}/categories/${params.categoryId}`, {
        method: "DELETE",
      });
      toast.success(t("forms.category.deleted"));
      router.refresh();
      router.push(`/${params.storeId}/categories`);
    } catch (error) {
      toast.error(t("forms.category.errorDelete"));
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

      {/* View Modal - chỉ hiển thị khi có initialData và categoryId hợp lệ */}
      {initialData && params.categoryId && params.categoryId !== "new" && (
        <CategoryViewModal
          isOpen={isViewOpen}
          onClose={() => setIsViewOpen(false)}
          categoryId={params.categoryId as string}
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
            <div className="grid grid-cols-1 gap-8">
              {/* Name Input */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("forms.category.name")}</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isLoading}
                        placeholder={t("forms.category.namePlaceholder")}
                        {...field}
                        className="rounded-xl border-neutral-300 dark:border-neutral-700 focus-visible:ring-blue-500/50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Billboard Select */}
              <FormField
                control={form.control}
                name="billboardId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("forms.category.billboard")}</FormLabel>
                    <Select
                      disabled={isLoading}
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="rounded-xl border-neutral-300 dark:border-neutral-700">
                          <SelectValue
                            defaultValue={field.value}
                            placeholder={t(
                              "forms.category.billboardPlaceholder"
                            )}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {billboards.map((billboard) => (
                          <SelectItem key={billboard.id} value={billboard.id}>
                            {billboard.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Parent Category Select */}
              <FormField
                control={form.control}
                name="parentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("forms.category.parentCategory") || "Parent Category"}</FormLabel>
                    <Select
                      disabled={isLoading}
                      onValueChange={(value) => field.onChange(value === "__none__" ? null : value)}
                      value={field.value || "__none__"}
                      defaultValue={field.value || "__none__"}
                    >
                      <FormControl>
                        <SelectTrigger className="rounded-xl border-neutral-300 dark:border-neutral-700">
                          <SelectValue
                            defaultValue={field.value || "__none__"}
                            placeholder={t("forms.category.parentCategoryPlaceholder") || "Select parent category (optional)"}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">
                          {t("forms.category.noParent") || "No Parent (Top Level)"}
                        </SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
