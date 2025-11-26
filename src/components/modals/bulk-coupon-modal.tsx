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

type Row = {
  code: string;
  value: string;
  type: "PERCENT" | "FIXED";
  expiresAt: string;
};

export const BulkCreateCouponModal = () => {
  const { isOpen, onClose } = useBulkCouponModal();
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
      toast.error(
        `Duplicate codes found: ${[...new Set(duplicateCodes)].join(", ")}`
      );
      return false;
    }

    for (let i = 0; i < rows.length; i++) {
      if (!rows[i].code.trim()) {
        toast.error(`Row ${i + 1}: Code is required.`);
        return false;
      }

      // Kiểm tra code phải có ít nhất 1 chữ cái (không chỉ số)
      const codeValue = rows[i].code.trim();
      const hasLetter = /[a-zA-Z]/.test(codeValue);
      const hasNumber = /[0-9]/.test(codeValue);

      if (!hasLetter) {
        toast.error(
          `Row ${
            i + 1
          }: Code must contain at least one letter (not only numbers).`
        );
        return false;
      }

      // Code chỉ được chứa chữ cái, số, và có thể có dấu gạch ngang/underscore
      if (!/^[a-zA-Z0-9_-]+$/.test(codeValue)) {
        toast.error(
          `Row ${
            i + 1
          }: Code can only contain letters, numbers, hyphens, and underscores.`
        );
        return false;
      }

      if (!rows[i].value || isNaN(Number(rows[i].value))) {
        toast.error(`Row ${i + 1}: Valid value is required.`);
        return false;
      }
      // Kiểm tra ngày quá khứ
      if (rows[i].expiresAt) {
        const selectedDate = new Date(rows[i].expiresAt);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) {
          toast.error(`Row ${i + 1}: Expiration date cannot be in the past.`);
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
      toast.success(`Successfully created ${rows.length} coupons!`);
      router.refresh();
      onClose();
    } catch (error: any) {
      console.error("Bulk coupon creation error:", error);

      // Xử lý lỗi 409 (Conflict - trùng tên)
      if (error.response?.status === 409 || error.code === "ERR_BAD_REQUEST") {
        let errorMessage =
          "Coupon code already exists. Please change the code name and try again.";

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
        let errorMessage =
          "Failed to create coupons. Please check your input and try again.";

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
              Bulk Create Coupons
            </DialogTitle>
            <DialogDescription>
              Add multiple coupons at once. Define code, value, type, and
              optional expiration date.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-hidden bg-neutral-50/50 dark:bg-neutral-950/50 relative">
          <ScrollArea className="h-full w-full p-6">
            {/* Grid Layout Adjustment: Code(3) - Value(2) - Type(3) - Expires(3) - Action(1) */}
            <div className="hidden md:grid grid-cols-12 gap-4 mb-4 px-4 font-medium text-sm text-neutral-500 uppercase tracking-wider">
              <div className="col-span-3">Code</div>
              <div className="col-span-2">Value</div>
              <div className="col-span-3">Type</div>
              <div className="col-span-3">Expires At</div>
              <div className="col-span-1 text-center">Action</div>
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
                      {/* Code Input (3 cols) */}
                      <div className="col-span-1 md:col-span-3">
                        <label className="md:hidden text-sm font-medium text-muted-foreground mb-1 block">
                          Code
                        </label>
                        <div className="relative">
                          <Input
                            disabled={isLoading}
                            placeholder="e.g., SALE50"
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

                      {/* Value Input (2 cols) */}
                      <div className="col-span-1 md:col-span-2">
                        <label className="md:hidden text-sm font-medium text-muted-foreground mb-1 block">
                          Value
                        </label>
                        <Input
                          type="number"
                          disabled={isLoading}
                          placeholder="Amount"
                          value={row.value}
                          onChange={(e) =>
                            handleChange(index, "value", e.target.value)
                          }
                        />
                      </div>

                      {/* Type Select (3 cols - Increased from 2) */}
                      <div className="col-span-1 md:col-span-3">
                        <label className="md:hidden text-sm font-medium text-muted-foreground mb-1 block">
                          Type
                        </label>
                        <Select
                          disabled={isLoading}
                          value={row.type}
                          onValueChange={(value) =>
                            handleChange(index, "type", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PERCENT">
                              Percentage (%)
                            </SelectItem>
                            <SelectItem value="FIXED">
                              Fixed Amount ($)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Expires At Input (3 cols) */}
                      <div className="col-span-1 md:col-span-3">
                        <label className="md:hidden text-sm font-medium text-muted-foreground mb-1 block">
                          Expires At
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
                                  toast.error(
                                    `Row ${
                                      index + 1
                                    }: Expiration date cannot be in the past.`
                                  );
                                  return;
                                }
                              }
                              handleChange(index, "expiresAt", selectedDate);
                            }}
                            className="pl-9" // Padding left cho icon
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
            Add Another Row
          </Button>

          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
              className="h-11 px-5"
            >
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              disabled={isLoading}
              className="h-11 px-8 text-sm font-semibold min-w-[140px] gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Save ({rows.length})
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
