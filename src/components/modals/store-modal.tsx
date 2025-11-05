"use client";
import * as z from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useStoreModal } from "@/hooks/use-store-modal";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(3, "Tên cửa hàng phải có ít nhất 3 ký tự.").max(255),
});

function GlassStoreModal({ form, onSubmit, storeModal, loading }: any) {
  return (
    <AnimatePresence>
      {storeModal.isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 20 }}
            className={cn(
              "relative w-full max-w-md p-6 rounded-3xl overflow-hidden",
              "backdrop-blur-2xl bg-white/20 dark:bg-neutral-800/30",
              "border border-white/20 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.2)]"
            )}
          >
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/10 via-white/5 to-transparent opacity-60" />

            <h2 className="text-xl font-semibold text-white dark:text-neutral-50 mb-1">
              Create Store
            </h2>
            <p className="text-sm text-white/70 dark:text-neutral-300 mb-6">
              Add a new store to manage products and categories.
            </p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80 dark:text-neutral-200">
                        Store Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          disabled={loading}
                          placeholder="E-Commerce"
                          className={cn(
                            "bg-white/20 dark:bg-neutral-900/40 border-white/30",
                            "text-white placeholder:text-white/60",
                            "focus:ring-2 focus:ring-white/40 focus:border-white/40"
                          )}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="pt-8 flex items-center justify-end gap-3">
                  <Button
                    disabled={loading}
                    variant="outline"
                    onClick={storeModal.onClose}
                    type="button"
                    className={cn(
                      "bg-white/20 dark:bg-neutral-800/30 border-white/30 text-white",
                      "hover:bg-white/30 transition-all"
                    )}
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={loading}
                    type="submit"
                    className={cn(
                      "bg-white/30 dark:bg-neutral-700/50 border border-white/20 text-white",
                      "hover:bg-white/40 backdrop-blur-lg"
                    )}
                  >
                    Continue
                  </Button>
                </div>
              </form>
            </Form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const StoreModal = () => {
  const router = useRouter();
  const storeModal = useStoreModal();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  const [loading, setLoading] = useState(false);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);

      const response = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Something went wrong." }));
        toast.error(errorData.message || "Something went wrong.");
        return; // Dừng thực thi nếu có lỗi
      }

      // Chỉ chạy khi response.ok là true
      const store = await response.json();

      toast.success("Store created successfully.");
      storeModal.onClose();
      router.push(`/${store.id}`);
    } catch (error) {
      console.error("[STORE_CREATE_ERROR]", error);
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassStoreModal
      form={form}
      onSubmit={onSubmit}
      storeModal={storeModal}
      loading={loading}
    />
  );
};
