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
import { Checkbox } from "@/components/ui/checkbox";
import { Editor } from "@/components/ui/editor";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/hooks/use-translation";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().optional().nullable(),
  featuredImage: z.string().optional().nullable(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  tags: z.array(z.string()),
  categoryId: z.string().min(1, "Category is required"),
  isPublished: z.boolean(),
});

type BlogFormValues = z.infer<typeof formSchema>;

interface BlogFormProps {
  initialData: any;
}

export const BlogForm: React.FC<BlogFormProps> = ({ initialData }) => {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const title = initialData
    ? t("forms.blog.title")
    : t("forms.blog.titleCreate");
  const description = initialData
    ? t("forms.blog.description")
    : t("forms.blog.descriptionCreate");
  const toastMessage = initialData
    ? t("forms.blog.updated")
    : t("forms.blog.created");
  const action = initialData ? t("forms.saveChanges") : t("forms.create");

  // Fetch categories thông thường
  const { data: categories } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ["categories", params.storeId],
    queryFn: async () => {
      const res = await axios.get<Array<{ id: string; name: string }> | { data: Array<{ id: string; name: string }> }>(`/api/${params.storeId}/categories`);
      return (res.data && 'data' in res.data ? res.data.data : res.data) || [];
    },
  });

  const form = useForm<BlogFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          title: initialData.title || "",
          content: initialData.content || "",
          excerpt: initialData.excerpt || "",
          featuredImage: initialData.featuredImage || "",
          metaTitle: initialData.metaTitle || "",
          metaDescription: initialData.metaDescription || "",
          tags: initialData.tags || [],
          categoryId: initialData.categoryId || "",
          isPublished: initialData.isPublished ?? false,
        }
      : {
          title: "",
          content: "",
          excerpt: "",
          featuredImage: "",
          metaTitle: "",
          metaDescription: "",
          tags: [],
          categoryId: "",
          isPublished: false,
        },
  });

  const onSubmit = async (data: BlogFormValues) => {
    try {
      setLoading(true);
      if (initialData) {
        await axios.patch(`/api/${params.storeId}/blog/${params.postId}`, data);
      } else {
        await axios.post(`/api/${params.storeId}/blog`, data);
      }
      router.refresh();
      router.push(`/${params.storeId}/blog`);
      toast.success(toastMessage);
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("forms.blog.error"));
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(`/api/${params.storeId}/blog/${params.postId}`);
      router.refresh();
      router.push(`/${params.storeId}/blog`);
      toast.success(t("forms.blog.deleted"));
    } catch (error) {
      toast.error(t("forms.blog.error"));
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const categoryOptions = Array.isArray(categories)
    ? categories.map((cat: any) => ({
        label: cat.name || "",
        value: cat.id || "",
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
              name="title"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>{t("forms.blog.titleField")}</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder={t("forms.blog.titlePlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPublished"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>{t("forms.blog.published")}</FormLabel>
                    <FormDescription>
                      {t("forms.blog.publishedDescription")}
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="excerpt"
              render={({ field }) => (
                <FormItem className="col-span-3">
                  <FormLabel>{t("forms.blog.excerpt")}</FormLabel>
                  <FormControl>
                    <Textarea
                      disabled={loading}
                      placeholder={t("forms.blog.excerptPlaceholder")}
                      {...field}
                      value={field.value || ""}
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("forms.blog.excerptDescription")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem className="col-span-3">
                  <FormLabel>{t("forms.blog.content")}</FormLabel>
                  <FormControl>
                    <Editor
                      value={field.value}
                      onChange={field.onChange}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="featuredImage"
              render={({ field }) => (
                <FormItem className="col-span-3">
                  <FormLabel>{t("forms.blog.featuredImage")}</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder={t("forms.blog.featuredImagePlaceholder")}
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
              name="categoryId"
              render={({ field }) => (
                <FormItem className="col-span-3">
                  <FormLabel>
                    {t("forms.blog.category") || "Category"}
                  </FormLabel>
                  <FormControl>
                    <Select
                      disabled={loading}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            t("forms.blog.categoryPlaceholder") ||
                            "Select a category"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>
                    {t("forms.blog.categoryDescription") ||
                      "Select a category for this blog post"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="metaTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("forms.blog.metaTitle")}</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder={t("forms.blog.metaTitlePlaceholder")}
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
              name="metaDescription"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>{t("forms.blog.metaDescription")}</FormLabel>
                  <FormControl>
                    <Textarea
                      disabled={loading}
                      placeholder={t("forms.blog.metaDescriptionPlaceholder")}
                      {...field}
                      value={field.value || ""}
                      rows={2}
                    />
                  </FormControl>
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
