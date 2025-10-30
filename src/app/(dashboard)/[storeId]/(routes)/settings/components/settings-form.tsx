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
import { Store } from "@/generated/prisma";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash, Pencil } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { AlertModal } from "@/components/modals/alert-modal";
import { ApiAlert } from "@/components/ui/api-alert";
import { useOrigin } from "@/hooks/use-origin";
import { motion } from "framer-motion";

interface SettingsFormProps {
  initialData: Store;
}

const formSchema = z.object({
  name: z.string().min(1, "Store name is required"),
});

type SettingsFormValues = z.infer<typeof formSchema>;

export const SettingsForm: React.FC<SettingsFormProps> = ({ initialData }) => {
  const router = useRouter();
  const params = useParams();
  const origin = useOrigin();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });

  const onSubmit = async (data: SettingsFormValues) => {
    try {
      setIsLoading(true);
      await fetch(`/api/stores/${initialData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      toast.success("Store updated successfully");
      router.refresh();
      console.log(data);
    } catch (error) {
      toast.error("Something went wrong!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      await fetch(`/api/stores/${initialData.id}`, {
        method: "DELETE",
      });
      toast.success("Store deleted successfully");
      router.push("/");
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
      <div className="flex items-center justify-between px-6 py-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-xl shadow-sm mt-4">
        <Heading
          title="Store Settings"
          description="Manage your store settings"
        />
        <Button
          disabled={isLoading}
          variant="destructive"
          size="icon"
          onClick={() => setIsOpen(true)}
          type="button"
        >
          <Trash className="h-5 w-5" />
        </Button>
      </div>

      {/* Form */}
      <Form {...form}>
        <motion.form
          onSubmit={form.handleSubmit(onSubmit)}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mx-auto w-full space-y-10 mt-5"
        >
          <div className="flex flex-col gap-8 bg-white/50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm backdrop-blur-md p-6">
            {/* Store Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold">
                    Store Name
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="My Store"
                        disabled={isLoading}
                        {...field}
                        className="pr-10 rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500/70 transition-all"
                      />
                      <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Save Button */}
            <div className="flex justify-end">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 300 }}
                disabled={isLoading}
                type="submit"
                className="px-6 py-2 text-black  rounded-xl shadow-md bg-gradient-to-r hover:opacity-90 border-1"
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </motion.button>
            </div>
          </div>
        </motion.form>
      </Form>
      {/* API Section */}
      <div className="mt-auto">
        <ApiAlert
          title="API Endpoint"
          description={`${origin}/api/${initialData.id}`}
          variant="public"
        />
      </div>
    </>
  );
};
