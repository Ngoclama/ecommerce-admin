"use client";
import { BillboardViewModal } from "@/components/modals/billboard-view";
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
import { ImagePlus, Trash } from "lucide-react";
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

      {/* Form */}
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
            {/* Label input */}
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                    Label
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter billboard label..."
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

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Background Image</FormLabel>
                  <FormControl>
                    <ImageUpload
                      disabled={isLoading}
                      value={field.value ? [field.value] : []}
                      onChange={(url) => field.onChange(url)}
                      onRemove={() => field.onChange("")}
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
