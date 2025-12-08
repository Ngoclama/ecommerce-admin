"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { useBulkCouponModal } from "@/hooks/use-bulk-coupon-modal";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  Ticket,
  AlertCircle,
  CalendarIcon,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "@/hooks/use-translation";

type Row = {
  code: string;
  value: string;
  type: "PERCENT" | "FIXED";
  expiresAt: string;
};

export const BulkCreateCouponModal = () => {
  const { isOpen, onClose } = useBulkCouponModal();
  const { t } = useTranslation();
  const [rows, setRows] = useState<Row[]>([
    { code: "", value: "", type: "PERCENT", expiresAt: "" },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setRows([{ code: "", value: "", type: "PERCENT", expiresAt: "" }]);
      }, 300);
    }
  }, [isOpen]);

  const handleAddRow = () => {
    setRows([...rows, { code: "", value: "", type: "PERCENT", expiresAt: "" }]);
  };

  const handleRemoveRow = (index: number) => {
    if (rows.length === 1) return;
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof Row, value: string) => {
    const newRows = [...rows];
    // @ts-ignore
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  };

  const validateForm = () => {
    // Kiểm tra duplicate codes trong rows
    const codes = rows.map((r) => r.code.trim().toUpperCase());
    const duplicateCodes = codes.filter(
      (code, index) => code && codes.indexOf(code) !== index
    );
    if (duplicateCodes.length > 0) {
      const errorMessage = t("bulk.coupon.duplicateCodes").replace(
        "{codes}",
        [...new Set(duplicateCodes)].join(", ")
      );
      toast.error(errorMessage);
      return false;
    }

    for (let i = 0; i < rows.length; i++) {
      if (!rows[i].code.trim()) {
        const errorMessage = t("bulk.coupon.rowError")
          .replace("{row}", (i + 1).toString())
          .replace("{field}", t("bulk.coupon.code"));
        toast.error(errorMessage);
        return false;
      }

      // Kiểm tra code phải có ít nhất 1 chữ cái (không chỉ số)
      const codeValue = rows[i].code.trim();
      const hasLetter = /[a-zA-Z]/.test(codeValue);
      const hasNumber = /[0-9]/.test(codeValue);

      if (!hasLetter) {
        const errorMessage = t("bulk.coupon.invalidCode").replace(
          "{row}",
          (i + 1).toString()
        );
        toast.error(errorMessage);
        return false;
      }

      // Code chỉ được chứa chữ cái, số, và có thể có dấu gạch ngang/underscore
      if (!/^[a-zA-Z0-9_-]+$/.test(codeValue)) {
        const errorMessage = t("bulk.coupon.rowError")
          .replace("{row}", (i + 1).toString())
          .replace("{field}", t("bulk.coupon.code"));
        toast.error(errorMessage);
        return false;
      }

      if (!rows[i].value || isNaN(Number(rows[i].value))) {
        const errorMessage = t("bulk.coupon.invalidValue").replace(
          "{row}",
          (i + 1).toString()
        );
        toast.error(errorMessage);
        return false;
      }
      // Kiểm tra ngày quá khứ
      if (rows[i].expiresAt) {
        const selectedDate = new Date(rows[i].expiresAt);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) {
          const errorMessage = t("bulk.coupon.invalidDate").replace(
            "{row}",
            (i + 1).toString()
          );
          toast.error(errorMessage);
          return false;
        }
      }
    }
    return true;
  };

  const onSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      await axios.post(`/api/${params.storeId}/coupons/bulk`, { rows });
      const successMessage = t("bulk.coupon.createSuccess").replace(
        "{count}",
        rows.length.toString()
      );
      toast.success(successMessage);
      router.refresh();
      onClose();
    } catch (error: any) {
      console.error("Bulk coupon creation error:", error);

      // Xử lý lỗi 409 (Conflict - trùng tên)
      if (error.response?.status === 409 || error.code === "ERR_BAD_REQUEST") {
        let errorMessage = t("forms.coupon.codeExists");

        try {
          const errorData = error.response?.data;

          // Kiểm tra nếu errorData tồn tại và không rỗng
          if (errorData) {
            // Nếu là string, dùng trực tiếp
            if (typeof errorData === "string" && errorData.trim()) {
              errorMessage = errorData;
            }
            // Nếu là object có field error
            else if (
              typeof errorData === "object" &&
              Object.keys(errorData).length > 0
            ) {
              if (errorData.error) {
                errorMessage = errorData.error;
              } else {
                // Nếu không có field error, thử stringify
                const stringified = JSON.stringify(errorData);
                if (stringified !== "{}") {
                  errorMessage = stringified;
                }
              }
            }
            // Nếu có data nhưng không phải string hoặc object
            else if (errorData !== null && errorData !== undefined) {
              errorMessage = String(errorData);
            }
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
        }

        toast.error(errorMessage, {
          duration: 6000,
        });
      } else {
        let errorMessage = t("bulk.coupon.createError");

        try {
          const errorData = error.response?.data;

          if (errorData) {
            if (typeof errorData === "string" && errorData.trim()) {
              errorMessage = errorData;
            } else if (
              typeof errorData === "object" &&
              Object.keys(errorData).length > 0
            ) {
              if (errorData.error) {
                errorMessage = errorData.error;
              } else {
                const stringified = JSON.stringify(errorData);
                if (stringified !== "{}") {
                  errorMessage = stringified;
                }
              }
            } else if (errorData !== null && errorData !== undefined) {
              errorMessage = String(errorData);
            }
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
        }

        toast.error(errorMessage, {
          duration: 5000,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* THAY ĐỔI Ở ĐÂY: Tăng chiều rộng lên max-w-[95vw] để hiển thị thoáng hơn */}
      <DialogContent className="max-w-[95vw] w-full lg:max-w-7xl max-h-[90vh] flex flex-col p-0 gap-0 bg-white dark:bg-neutral-900 overflow-hidden">
        <div className="p-6 pb-4 border-b dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Ticket className="w-6 h-6 text-primary" />
              {t("bulk.coupon.title")}
            </DialogTitle>
            <DialogDescription>
              {t("bulk.coupon.description")}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-hidden bg-neutral-50/50 dark:bg-neutral-950/50 relative">
          <ScrollArea className="h-full w-full p-6">
            {}
            <div className="hidden md:grid grid-cols-12 gap-4 mb-4 px-4 font-medium text-sm text-neutral-500 uppercase tracking-wider">
              <div className="col-span-3">{t("bulk.coupon.code")}</div>
              <div className="col-span-2">{t("bulk.coupon.value")}</div>
              <div className="col-span-3">{t("bulk.coupon.type")}</div>
              <div className="col-span-3">{t("bulk.coupon.expiresAt")}</div>
              <div className="col-span-1 text-center">
                {t("columns.actions")}
              </div>
            </div>

            <div className="space-y-3 pb-4">
              <AnimatePresence mode="popLayout" initial={false}>
                {rows.map((row, index) => (
                  <motion.div
                    key={index}
                    layout
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="group relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start md:items-center">
                      {}
                      <div className="col-span-1 md:col-span-3">
                        <label className="md:hidden text-sm font-medium text-muted-foreground mb-1 block">
                          {t("bulk.coupon.code")}
                        </label>
                        <div className="relative">
                          <Input
                            disabled={isLoading}
                            placeholder={t("bulk.coupon.codePlaceholder")}
                            value={row.code}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Chỉ cho phép chữ cái, số, dấu gạch ngang và underscore
                              const sanitized = value.replace(
                                /[^a-zA-Z0-9_-]/g,
                                ""
                              );
                              handleChange(index, "code", sanitized);
                            }}
                            className={`uppercase font-mono ${
                              !row.code && rows.length > 1
                                ? "border-amber-500/50 bg-amber-50/10"
                                : ""
                            }`}
                          />
                          {!row.code && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500 animate-pulse">
                              <AlertCircle className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      </div>

                      {}
                      <div className="col-span-1 md:col-span-2">
                        <label className="md:hidden text-sm font-medium text-muted-foreground mb-1 block">
                          {t("bulk.coupon.value")}
                        </label>
                        <div className="relative">
                          <Input
                            type="number"
                            disabled={isLoading}
                            placeholder={t("bulk.coupon.valuePlaceholder")}
                            value={row.value}
                            onChange={(e) =>
                              handleChange(index, "value", e.target.value)
                            }
                          />
                          {/* Hiển thị format giá trị nếu là FIXED */}
                          {row.value && row.type === "FIXED" && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary pointer-events-none">
                              {new Intl.NumberFormat("vi-VN").format(
                                Number(row.value)
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {}
                      <div className="col-span-1 md:col-span-3">
                        <label className="md:hidden text-sm font-medium text-muted-foreground mb-1 block">
                          {t("bulk.coupon.type")}
                        </label>
                        <Select
                          disabled={isLoading}
                          value={row.type}
                          onValueChange={(value) =>
                            handleChange(index, "type", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t("bulk.coupon.typePlaceholder")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PERCENT">
                              {t("bulk.coupon.typePercent")}
                            </SelectItem>
                            <SelectItem value="FIXED">
                              {t("bulk.coupon.typeFixed")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {}
                      <div className="col-span-1 md:col-span-3">
                        <label className="md:hidden text-sm font-medium text-muted-foreground mb-1 block">
                          {t("bulk.coupon.expiresAt")}
                        </label>
                        <div className="relative">
                          <Input
                            type="date"
                            disabled={isLoading}
                            value={row.expiresAt}
                            min={new Date().toISOString().split("T")[0]} // Chặn chọn ngày quá khứ
                            onChange={(e) => {
                              const selectedDate = e.target.value;
                              if (selectedDate) {
                                const date = new Date(selectedDate);
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                if (date < today) {
                                  const errorMessage = t(
                                    "bulk.coupon.invalidDate"
                                  ).replace("{row}", (index + 1).toString());
                                  toast.error(errorMessage);
                                  return;
                                }
                              }
                              handleChange(index, "expiresAt", selectedDate);
                            }}
                            className="pl-9" 
                          />
                          <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>

                      {/* Action (1 col) */}
                      <div className="col-span-1 md:col-span-1 flex justify-center mt-2 md:mt-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveRow(index)}
                          disabled={rows.length === 1 || isLoading}
                          className="text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors h-10 w-10 rounded-full"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>

                    <div className="absolute -left-2 -top-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-neutral-200 dark:border-neutral-700 z-10 shadow-sm">
                      {index + 1}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </div>

        <div className="p-6 pt-4 border-t dark:border-neutral-800 bg-white dark:bg-neutral-900 flex justify-between items-center gap-4 z-20">
          <Button
            variant="outline"
            onClick={handleAddRow}
            disabled={isLoading}
            className="gap-2 h-11 px-5 text-sm"
          >
            <Plus className="w-4 h-4" />
            {t("bulk.coupon.addRow")}
          </Button>

          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
              className="h-11 px-5"
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={onSubmit}
              disabled={isLoading}
              className="h-11 px-8 text-sm font-semibold min-w-[140px] gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("common.loading")}
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  {t("bulk.coupon.createSuccess").replace(
                    "{count}",
                    rows.length.toString()
                  )}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
