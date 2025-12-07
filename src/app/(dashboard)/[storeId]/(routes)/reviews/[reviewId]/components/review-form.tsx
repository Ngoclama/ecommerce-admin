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
import { Billboard, Category } from "@/generated/prisma";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { handleError } from "@/lib/error-handler";
import { AlertModal } from "@/components/modals/alert-modal";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import slugify from "slugify";

const formSchema = z.object({
  name: z.string().min(1, "Category name is required"),
  slug: z.string().min(1, "Slug is required"),
  billboardId: z.string().min(1, "Billboard is required"),
});

type CategoryFormValues = z.infer<typeof formSchema>;

interface CategoryFormProps {
  initialData: Category | null;
  billboards: Billboard[];
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  initialData,
  billboards,
}) => {
  const router = useRouter();
  const params = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const title = initialData ? "Edit Category" : "Create Category";
  const description = initialData ? "Edit your category" : "Add a new category";
  const action = initialData ? "Save changes" : "Create";

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          slug: initialData.slug || "", // Load slug cũ nếu có
        }
      : {
          name: "",
          slug: "",
          billboardId: "",
        },
  });

  const onSubmit = async (data: CategoryFormValues) => {
    try {
      setIsLoading(true);

      const endpoint = initialData
        ? `/api/${params.storeId}/categories/${params.categoryId}`
        : `/api/${params.storeId}/categories`;

      const method = initialData ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(
          (errorBody as { message?: string })?.message ||
            (initialData
              ? "Failed to update review"
              : "Failed to create review")
        );
      }

      toast.success(initialData ? "Đã cập nhật đánh giá!" : "Đã tạo đánh giá!");
      router.refresh();
      router.push(`/${params.storeId}/reviews`);
    } catch (error) {
      handleError(error, "Có lỗi xảy ra khi cập nhật đánh giá.");
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
      toast.success("Đã xóa danh mục thành công");
      router.push(`/${params.storeId}/categories`);
      router.refresh();
    } catch (error) {
      handleError(error, "Không thể xóa đánh giá. Vui lòng thử lại.");
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

      <div
        className="flex items-center justify-between px-6 py-4 
                 rounded-2xl border border-neutral-200 dark:border-neutral-800 
                 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-xl 
                 shadow-md hover:shadow-lg transition-all duration-300"
      >
        <Heading title={title} description={description} />
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                      Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter category name..."
                        disabled={isLoading}
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          const generatedSlug = slugify(e.target.value, {
                            lower: true,
                            strict: true,
                          });
                          form.setValue("slug", generatedSlug);
                        }}
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

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                      Slug (SEO URL)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="category-slug-example"
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
            </div>

            <FormField
              control={form.control}
              name="billboardId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Billboard</FormLabel>
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
                          placeholder="Select a billboard"
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

            <div className="flex justify-end pt-4">
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button disabled={isLoading} type="submit" variant={"outline"}>
                  {isLoading ? "Processing..." : action}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </form>
      </Form>
    </>
  );
};
