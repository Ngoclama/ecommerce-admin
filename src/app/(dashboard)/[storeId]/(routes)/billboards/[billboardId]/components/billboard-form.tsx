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
import { Billboard } from "@/generated/prisma";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { AlertModal } from "@/components/modals/alert-modal";
import ImageUpload from "@/components/ui/image-upload";
import { motion } from "framer-motion";

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
  const router = useRouter();
  const params = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const title = initialData ? "Edit Billboard" : "Create Billboard";
  const description = initialData
    ? "Edit your billboard"
    : "Add a new billboard";
  const action = initialData ? "Save changes" : "Create";

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

      if (!res.ok)
        throw new Error(
          initialData
            ? "Failed to update billboard"
            : "Failed to create billboard"
        );

      toast.success(initialData ? "Billboard updated!" : "Billboard created!");
      router.refresh();
      router.push(`/${params.storeId}/billboards`);
    } catch (error) {
      toast.error("Something went wrong!");
      console.error("[onSubmit Billboard]", error);
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
      toast.success("Billboard deleted successfully");
      router.push(`/${params.storeId}/billboards`);
      router.refresh();
    } catch (error) {
      toast.error("Make sure you removed all products and categories first.");
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Modal xác nhận xóa */}
      <AlertModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Are you sure?"
        description="This action cannot be undone."
        onConfirm={handleDelete}
        loading={isLoading}
      />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 backdrop-blur-xl bg-white/50 dark:bg-neutral-900/50 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <Heading title={title} description={description} />
        {initialData && (
          <Button
            disabled={isLoading}
            variant="destructive"
            size="icon"
            onClick={() => setIsOpen(true)}
          >
            <Trash className="h-5 w-5" />
          </Button>
        )}
      </div>

      <Separator className="my-4" />

      {/* Form */}
      <Form {...form}>
        <motion.form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-10 w-full mt-4 px-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Hình ảnh */}
          <div className="flex flex-col gap-8 max-w-3xl mx-auto">
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold">
                    Background Image
                  </FormLabel>
                  <FormControl>
                    <ImageUpload
                      value={field.value ? [field.value] : []}
                      disabled={isLoading}
                      onChange={(url) => field.onChange(url)}
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
                  <FormLabel className="text-sm font-semibold">Label</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter billboard label..."
                      disabled={isLoading}
                      {...field}
                      className="focus-visible:ring-2 focus-visible:ring-blue-500/60 rounded-xl transition-all"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit button */}
            <div className="flex justify-end pt-4">
              <Button
                disabled={isLoading}
                type="submit"
                className="px-6 py-2 font-semibold text-white hover:opacity-90 rounded-xl transition-all shadow-md"
              >
                {isLoading ? "Processing..." : action}
              </Button>
            </div>
          </div>
        </motion.form>
      </Form>
    </>
  );
};
