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
import { Color } from "@/generated/prisma";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { AlertModal } from "@/components/modals/alert-modal";
import { motion } from "framer-motion";

const formSchema = z.object({
  name: z.string().min(1, "Color name is required"),
  value: z.string().min(4).regex(/^#/, {
    message: "Color value must be a valid hex code",
  }),
});

type ColorFormValues = z.infer<typeof formSchema>;

interface ColorFormProps {
  initialData: Color | null;
}

export const ColorForm: React.FC<ColorFormProps> = ({ initialData }) => {
  const router = useRouter();
  const params = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const title = initialData ? "Edit Color" : "Create Color";
  const description = initialData ? "Edit your color" : "Add a new color";
  const action = initialData ? "Save changes" : "Create";

  const form = useForm<ColorFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: "",
      value: "",
    },
  });

  const onSubmit = async (data: ColorFormValues) => {
    try {
      setIsLoading(true);

      const endpoint = initialData
        ? `/api/${params.storeId}/colors/${params.colorId}`
        : `/api/${params.storeId}/colors`;

      const method = initialData ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok)
        throw new Error(
          initialData ? "Failed to update color" : "Failed to create color"
        );

      toast.success(initialData ? "Color updated!" : "Color created!");
      router.refresh();
      router.push(`/${params.storeId}/colors`);
    } catch (error) {
      toast.error("Something went wrong!");
      console.error("[onSubmit Color]", error);
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
      toast.success("Color deleted successfully");
      router.push(`/${params.storeId}/colors`);
      router.refresh();
    } catch (error) {
      toast.error("Make sure you removed all products using this color first.");
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
            className="grid grid-cols-1 md:grid-cols-2 gap-8 rounded-2xl border border-neutral-200 
                     dark:border-neutral-800 bg-white/60 dark:bg-neutral-900/60 
                     shadow-md backdrop-blur-lg p-8 transition-all hover:shadow-xl"
          >
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
                      placeholder="Enter color name..."
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
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                    Value
                  </FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-x-4">
                      <input
                        type="color"
                        disabled={isLoading}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="w-12 h-12 cursor-pointer rounded-md border border-neutral-300 
               dark:border-neutral-700 bg-transparent p-0"
                        title="Enter color name.."
                      />
                      <Input
                        placeholder="#FFFFFF"
                        disabled={isLoading}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="rounded-xl border border-neutral-300 dark:border-neutral-700 
             focus-visible:ring-2 focus-visible:ring-blue-500/50 
             focus-visible:border-blue-400 dark:focus-visible:ring-blue-400/50 
             transition-all bg-white/80 dark:bg-neutral-800/80 backdrop-blur-md w-32"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>
          <div className="flex justify-end pt-4">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Button disabled={isLoading} type="submit" variant={"outline"}>
                {isLoading ? "Processing..." : action}
              </Button>
            </motion.div>
          </div>
        </form>
      </Form>
    </>
  );
};
