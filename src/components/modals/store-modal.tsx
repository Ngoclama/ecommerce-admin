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
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

function GlassStoreModal({ form, onSubmit, storeModal, loading }: any) {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {storeModal.isOpen && (
        <motion.div
          className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={storeModal.onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 180, damping: 20 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative w-full max-w-md p-6 rounded-3xl overflow-hidden mx-auto",
              "backdrop-blur-2xl bg-white/20 dark:bg-neutral-800/30",
              "border border-white/20 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.2)]"
            )}
          >
            <div className="absolute inset-0 pointer-events-none bg-linear-to-tr from-white/10 via-white/5 to-transparent opacity-60" />

            <h2 className="text-xl font-semibold text-white dark:text-neutral-50 mb-1">
              {t("storeModal.title")}
            </h2>
            <p className="text-sm text-white/70 dark:text-neutral-300 mb-6">
              {t("storeModal.description")}
            </p>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80 dark:text-neutral-200">
                        {t("storeModal.storeName")}{" "}
                        <span className="text-red-400">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          disabled={loading}
                          placeholder={t("storeModal.storeNamePlaceholder")}
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

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80 dark:text-neutral-200">
                        {t("storeModal.address")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          disabled={loading}
                          placeholder={t("storeModal.addressPlaceholder")}
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

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80 dark:text-neutral-200">
                        {t("storeModal.phone")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          disabled={loading}
                          placeholder={t("storeModal.phonePlaceholder")}
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

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80 dark:text-neutral-200">
                        {t("storeModal.email")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          disabled={loading}
                          type="email"
                          placeholder={t("storeModal.emailPlaceholder")}
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
                      "hover:bg-white/30 transition-all shadow-sm"
                    )}
                  >
                    {t("storeModal.cancel")}
                  </Button>
                  <Button
                    disabled={loading}
                    type="submit"
                    // [ĐỒNG BỘ UI] Đặt màu nền solid cho nút Submit
                    className={cn(
                      "bg-primary/90 dark:bg-primary/80 border-none text-white font-semibold",
                      "hover:bg-primary transition-all shadow-lg shadow-primary/30"
                    )}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      t("storeModal.continue")
                    )}
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
  const { t } = useTranslation();

  // Tạo schema động với validation messages theo ngôn ngữ
  const createFormSchema = () =>
    z.object({
      name: z
        .string()
        .min(1, t("storeModal.nameRequired"))
        .min(3, t("storeModal.nameMinLength"))
        .max(255, t("storeModal.nameMaxLength")),
      address: z.string().optional().or(z.literal("")),
      phone: z.string().optional().or(z.literal("")),
      email: z
        .string()
        .optional()
        .refine(
          (val) => !val || val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
          {
            message: t("storeModal.emailInvalid"),
          }
        )
        .or(z.literal("")),
    });

  const form = useForm<z.infer<ReturnType<typeof createFormSchema>>>({
    resolver: zodResolver(createFormSchema()),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      email: "",
    },
  });

  const [loading, setLoading] = useState(false);

  const onSubmit = async (
    values: z.infer<ReturnType<typeof createFormSchema>>
  ) => {
    try {
      setLoading(true);

      // Chỉ gửi các trường có giá trị
      const payload: {
        name: string;
        address?: string | null;
        phone?: string | null;
        email?: string | null;
      } = {
        name: values.name.trim(),
      };

      // Thêm các trường tùy chọn nếu có giá trị
      if (values.address && values.address.trim()) {
        payload.address = values.address.trim();
      }
      if (values.phone && values.phone.trim()) {
        payload.phone = values.phone.trim();
      }
      if (values.email && values.email.trim()) {
        payload.email = values.email.trim();
      }

      const response = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        if (process.env.NODE_ENV === "development") {
          console.error("[STORE_CREATE] JSON parse error:", jsonError);
          const text = await response.text();
          console.error("[STORE_CREATE] Response text:", text);
        }
        toast.error(t("storeModal.invalidResponse"));
        return;
      }

      if (!response.ok) {
        const errorMessage =
          result?.message || result?.error || t("storeModal.createError");
        if (process.env.NODE_ENV === "development") {
          console.error("[STORE_CREATE] Error:", errorMessage);
        }
        toast.error(errorMessage);
        return;
      }

      // Kiểm tra response có thành công không
      if (result.success === false) {
        const errorMessage = result.message || t("storeModal.createError");
        if (process.env.NODE_ENV === "development") {
          console.error(
            "[STORE_CREATE] API returned success: false",
            errorMessage
          );
        }
        toast.error(errorMessage);
        return;
      }

      // Lấy store ID từ response (hỗ trợ nhiều format)
      const storeId = result.data?.id || result.id || result.data?._id;

      if (!storeId) {
        if (process.env.NODE_ENV === "development") {
          console.error("[STORE_CREATE] No store ID in response:", result);
        }
        toast.error(t("storeModal.missingId"));
        storeModal.onClose();
        form.reset();
        router.refresh();
        return;
      }

      toast.success(t("storeModal.createSuccess"));
      storeModal.onClose();
      form.reset();

      // Đợi một chút để modal đóng trước khi chuyển trang
      setTimeout(() => {
        router.push(`/${storeId}`);
        router.refresh();
      }, 100);
    } catch (error: any) {
      if (process.env.NODE_ENV === "development") {
        console.error("[STORE_CREATE_ERROR]", error);
      }
      const errorMessage = error?.message || t("storeModal.createError");
      toast.error(errorMessage);
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
