"use client";

import * as z from "zod";
import axios from "axios";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import { Trash, Loader2 } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
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
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
});

type CategoryFormValues = z.infer<typeof formSchema>;

interface CategoryFormProps {
  initialData: any;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({ initialData }) => {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const title = initialData
    ? t("forms.blogCategory.title")
    : t("forms.blogCategory.titleCreate");
  const description = initialData
    ? t("forms.blogCategory.description")
    : t("forms.blogCategory.descriptionCreate");
  const toastMessage = initialData
    ? t("forms.blogCategory.updated")
    : t("forms.blogCategory.created");
  const action = initialData ? t("forms.saveChanges") : t("forms.create");

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          description: initialData.description || "",
        }
      : {
          name: "",
          description: "",
        },
  });

  const onSubmit = async (data: CategoryFormValues) => {
    try {
      setLoading(true);
      if (initialData) {
        await axios.patch(
          `/api/${params.storeId}/blog/categories/${params.categoryId}`,
          data
        );
      } else {
        await axios.post(`/api/${params.storeId}/blog/categories`, data);
      }
      router.refresh();
      router.push(`/${params.storeId}/blog/categories`);
      toast.success(toastMessage);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || t("forms.blogCategory.error")
      );
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(
        `/api/${params.storeId}/blog/categories/${params.categoryId}`
      );
      router.refresh();
      router.push(`/${params.storeId}/blog/categories`);
      toast.success(t("forms.blogCategory.deleted"));
    } catch (error) {
      toast.error(t("forms.blogCategory.error"));
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("forms.blogCategory.name")}</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder={t("forms.blogCategory.namePlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="col-span-3">
                  <FormLabel>
                    {t("forms.blogCategory.descriptionLabel")}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      disabled={loading}
                      placeholder={t(
                        "forms.blogCategory.descriptionPlaceholder"
                      )}
                      {...field}
                      value={field.value || ""}
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("forms.blogCategory.descriptionInfo")}
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
